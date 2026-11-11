import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, PieChart, Pie,
} from 'recharts';
import { formatShortDate, parseISODate } from '../utils/date.js';

export const SERIES_COLORS = { revenue: 'var(--chart-1)', expenses: 'var(--chart-2)', outstanding: 'var(--chart-3)' };
const LABELS = { revenue: 'Revenue', expenses: 'Expenses', outstanding: 'Outstanding' };

function periodLabel(key, byMonth) {
  if (byMonth) return parseISODate(`${key}-01`).toLocaleDateString(undefined, { month: 'short' });
  return formatShortDate(key);
}

function MoneyTooltip({ active, payload, label, money, byMonth }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="t">{byMonth ? parseISODate(`${label}-01`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : formatShortDate(label)}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="r">
          <span><i style={{ background: p.color }} />{LABELS[p.dataKey] ?? p.name}</span>
          <strong>{money(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

export function Legend({ keys }) {
  return (
    <div className="legend">
      {keys.map((k) => (
        <span key={k}><i style={{ background: SERIES_COLORS[k] }} />{LABELS[k]}</span>
      ))}
    </div>
  );
}

/** Grouped bar chart of money series over time. points: [{ key, revenue, expenses }] */
export function MoneyBarChart({ points, byMonth, keys, money, height = 280 }) {
  const dense = points.length > 16;
  return (
    <div className="chart-box" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="key"
            tickFormatter={(k) => periodLabel(k, byMonth)}
            tickLine={false}
            axisLine={false}
            interval={dense ? Math.ceil(points.length / 8) - 1 : 0}
            minTickGap={8}
          />
          <YAxis
            tickFormatter={(v) => money(v, { compact: true })}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip cursor={{ fill: 'var(--neutral-bg)' }} content={<MoneyTooltip money={money} byMonth={byMonth} />} />
          {keys.map((k) => (
            <Bar key={k} dataKey={k} fill={SERIES_COLORS[k]} radius={[3, 3, 0, 0]} maxBarSize={dense ? 14 : 28} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const PIE_COLORS = ['#24635f', '#4f8a84', '#7fb0aa', '#b3d1cd', '#c4782f', '#e0a96d', '#667085', '#98a2b3', '#d0d5dd', '#344054'];

/** Horizontal breakdown bars — easier to read than a pie for category comparisons. */
export function BreakdownBars({ rows, money, total }) {
  return (
    <div className="stack" style={{ '--gap': '12px' }}>
      {rows.map((r, i) => (
        <div key={r.label}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="row" style={{ gap: 8 }}>
              <i style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length], display: 'inline-block' }} />
              {r.label}
            </span>
            <span className="row" style={{ gap: 10 }}>
              <span className="muted small">{total ? Math.round((r.value / total) * 100) : 0}%</span>
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{money(r.value)}</strong>
            </span>
          </div>
          <div className="progress">
            <span style={{ width: `${total ? (r.value / total) * 100 : 0}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ rows, money, height = 200 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="label" innerRadius="60%" outerRadius="90%" paddingAngle={2} stroke="none">
            {rows.map((r, i) => <Cell key={r.label} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="chart-tooltip">
                  <div className="t">{payload[0].name}</div>
                  <div>{money(payload[0].value)}</div>
                </div>
              ) : null
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
