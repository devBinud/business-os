import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleDollarSign, Receipt, TrendingUp, Wallet, Download } from 'lucide-react';
import { useStore, useLookups } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { PageHeader, Card, StatCard, Segmented, ProgressBar } from '../components/ui.jsx';
import { MoneyBarChart, Legend, DonutChart, BreakdownBars } from '../components/Charts.jsx';
import { allPayments, invoiceTotals, lineTotal, percentChange, seriesByPeriod } from '../utils/calc.js';
import { DATE_RANGES, diffDays, formatShortDate, inRange, previousRangeBounds, rangeBounds, todayISO } from '../utils/date.js';
import { formatPercent } from '../utils/format.js';

const RANGES = DATE_RANGES.filter((r) => r.id !== 'today');

export default function Reports() {
  const { invoices, expenses, tasks, bookings, money } = useStore();
  const { customerById, employeeById } = useLookups();
  const access = useAccess();
  const [rangeId, setRangeId] = useState('year');
  const range = rangeBounds(rangeId);
  const prev = previousRangeBounds(rangeId);
  const today = todayISO();

  const report = useMemo(() => {
    const payments = allPayments(invoices);
    const approved = expenses.filter((x) => x.status === 'approved');
    const sum = (list, r) => list.filter((x) => inRange(x.date, r)).reduce((s, x) => s + Number(x.amount), 0);

    const income = sum(payments, range);
    const spend = sum(approved, range);
    const net = income - spend;
    const prevNet = sum(payments, prev) - sum(approved, prev);

    const series = seriesByPeriod(
      [
        ...payments.map((p) => ({ date: p.date, amount: p.amount, series: 'revenue' })),
        ...approved.map((x) => ({ date: x.date, amount: x.amount, series: 'expenses' })),
      ],
      range,
    );

    const byCategory = Object.entries(
      approved.filter((x) => inRange(x.date, range)).reduce((a, x) => ({ ...a, [x.category]: (a[x.category] || 0) + Number(x.amount) }), {}),
    ).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

    // Receivables aging based on days past due date (all open invoices, independent of range).
    const buckets = [
      { label: 'Not yet due', test: (d) => d <= 0 },
      { label: '1–30 days overdue', test: (d) => d > 0 && d <= 30 },
      { label: '31–60 days overdue', test: (d) => d > 30 && d <= 60 },
      { label: 'Over 60 days overdue', test: (d) => d > 60 },
    ].map((b) => ({ ...b, value: 0, count: 0 }));
    invoices.forEach((inv) => {
      const { balance } = invoiceTotals(inv);
      if (balance <= 0) return;
      const days = diffDays(today, inv.dueDate);
      const bucket = buckets.find((b) => b.test(days));
      bucket.value += balance;
      bucket.count += 1;
    });
    const receivables = buckets.reduce((s, b) => s + b.value, 0);

    const byCustomer = Object.entries(
      payments.filter((p) => inRange(p.date, range)).reduce((a, p) => ({ ...a, [p.customerId]: (a[p.customerId] || 0) + Number(p.amount) }), {}),
    ).map(([id, value]) => ({ id, name: customerById[id]?.name ?? 'Unknown', value })).sort((a, b) => b.value - a.value).slice(0, 6);

    const byItem = {};
    invoices.filter((i) => inRange(i.issueDate, range)).forEach((inv) =>
      inv.items.forEach((it) => {
        const key = it.description.split(' (')[0];
        byItem[key] = byItem[key] || { label: key, value: 0, qty: 0 };
        byItem[key].value += lineTotal(it);
        byItem[key].qty += Number(it.qty);
      }),
    );
    const items = Object.values(byItem).sort((a, b) => b.value - a.value).slice(0, 6);

    return { income, spend, net, netChange: percentChange(net, prevNet), margin: income ? net / income : NaN, series, byCategory, buckets, receivables, byCustomer, items };
  }, [invoices, expenses, range.from, range.to, prev.from, prev.to, today, customerById]);

  const operations = useMemo(() => {
    const byPerson = {};
    tasks.forEach((t) => {
      const p = (byPerson[t.assigneeId] = byPerson[t.assigneeId] || { id: t.assigneeId, open: 0, done: 0, overdue: 0 });
      if (t.status === 'done') p.done += 1;
      else {
        p.open += 1;
        if (t.dueDate < today) p.overdue += 1;
      }
    });
    const people = Object.values(byPerson).sort((a, b) => b.open + b.done - (a.open + a.done));
    const inPeriod = bookings.filter((b) => inRange(b.start, range));
    const bookingStatus = ['pending', 'confirmed', 'completed', 'cancelled'].map((s) => ({ s, n: inPeriod.filter((b) => b.status === s).length }));
    return { people, bookingStatus, bookingCount: inPeriod.length };
  }, [tasks, bookings, range.from, range.to, today]);

  const exportCsv = () => {
    const rows = [['Period', 'Revenue', 'Expenses', 'Net']];
    report.series.points.forEach((p) => {
      const r = p.revenue || 0;
      const e = p.expenses || 0;
      rows.push([p.key, r.toFixed(2), e.toFixed(2), (r - e).toFixed(2)]);
    });
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income-expenses-${range.from}-to-${range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const points = report.series.points.map((p) => ({ revenue: 0, expenses: 0, ...p }));

  return (
    <>
      <PageHeader
        title="Reports"
        description={`${formatShortDate(range.from)} – ${formatShortDate(range.to)} · Income is based on payments received; expenses include approved records only.`}
        actions={
          <>
            <Segmented label="Report period" options={RANGES} value={rangeId} onChange={setRangeId} />
            <button className="btn" onClick={exportCsv}><Download size={16} /> Export CSV</button>
          </>
        }
      />

      <div className="stack">
        <div className="grid grid-4">
          <StatCard icon={CircleDollarSign} label="Income" value={money(report.income)} />
          <StatCard icon={Receipt} label="Expenses" value={money(report.spend)} />
          <StatCard
            icon={TrendingUp}
            label="Net result"
            value={<span className={report.net < 0 ? 'text-danger' : ''}>{money(report.net)}</span>}
            change={report.netChange}
            changeLabel="vs previous period"
            meta={Number.isFinite(report.margin) && <span>· {formatPercent(report.margin)} margin</span>}
          />
          <StatCard icon={Wallet} label="Receivables" value={money(report.receivables)} meta={<span>Unpaid invoice balances</span>} />
        </div>

        <Card title="Income and expenses" subtitle={report.series.byMonth ? 'By month' : 'By day'} actions={<Legend keys={['revenue', 'expenses']} />}>
          <MoneyBarChart points={points} byMonth={report.series.byMonth} keys={['revenue', 'expenses']} money={money} height={300} />
        </Card>

        <div className="grid grid-2">
          <Card title="Expenses by category">
            {report.byCategory.length === 0 ? (
              <div className="muted small">No approved expenses in this period.</div>
            ) : (
              <div className="row wrap" style={{ gap: 20, alignItems: 'center' }}>
                <div style={{ width: 180, flexShrink: 0 }}><DonutChart rows={report.byCategory} money={money} height={180} /></div>
                <div style={{ flex: 1, minWidth: 220 }}><BreakdownBars rows={report.byCategory.slice(0, 6)} money={money} total={report.spend} /></div>
              </div>
            )}
          </Card>

          <Card title="Receivables aging" subtitle="Outstanding balances by days past due" actions={access.canView('invoices') && <Link to="/invoices" className="btn sm">View invoices</Link>} flush>
            <table className="table">
              <thead><tr><th>Age</th><th className="num">Invoices</th><th className="num">Balance</th><th style={{ width: '30%' }}>Share</th></tr></thead>
              <tbody>
                {report.buckets.map((b, i) => (
                  <tr key={b.label}>
                    <td className={i >= 2 && b.value > 0 ? 'text-danger' : ''}>{b.label}</td>
                    <td className="num">{b.count}</td>
                    <td className="num">{money(b.value)}</td>
                    <td><ProgressBar value={report.receivables ? b.value / report.receivables : 0} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td>Total</td><td className="num">{report.buckets.reduce((s, b) => s + b.count, 0)}</td><td className="num">{money(report.receivables)}</td><td /></tr></tfoot>
            </table>
          </Card>
        </div>

        <div className="grid grid-2">
          <Card title="Top customers" subtitle="By payments received" flush>
            {report.byCustomer.length === 0 ? <div className="muted small" style={{ padding: '0 20px 20px' }}>No payments in this period.</div> : (
              <table className="table">
                <tbody>
                  {report.byCustomer.map((c, i) => (
                    <tr key={c.id}>
                      <td style={{ width: 28 }} className="muted">{i + 1}</td>
                      <td>{access.canView('customers') ? <Link to={`/customers/${c.id}`}>{c.name}</Link> : c.name}</td>
                      <td className="num strong">{money(c.value)}</td>
                      <td className="num muted small" style={{ width: 60 }}>{formatPercent(c.value / report.income)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Top items & services" subtitle="By invoiced amount" flush>
            {report.items.length === 0 ? <div className="muted small" style={{ padding: '0 20px 20px' }}>No invoices issued in this period.</div> : (
              <table className="table">
                <thead><tr><th>Item</th><th className="num">Qty</th><th className="num">Amount</th></tr></thead>
                <tbody>
                  {report.items.map((it) => (
                    <tr key={it.label}><td>{it.label}</td><td className="num">{it.qty}</td><td className="num">{money(it.value)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <div className="grid grid-2">
          {access.enabled('tasks') && (
            <Card title="Team workload" subtitle="Tasks by assignee (all time)" flush>
              <table className="table">
                <thead><tr><th>Employee</th><th className="num">Open</th><th className="num">Overdue</th><th className="num">Done</th><th style={{ width: '25%' }}>Completion</th></tr></thead>
                <tbody>
                  {operations.people.slice(0, 8).map((p) => (
                    <tr key={p.id}>
                      <td>{employeeById[p.id]?.name ?? 'Unknown'}</td>
                      <td className="num">{p.open}</td>
                      <td className={`num ${p.overdue ? 'text-danger' : ''}`}>{p.overdue}</td>
                      <td className="num">{p.done}</td>
                      <td><ProgressBar value={p.done / (p.open + p.done)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
          {access.enabled('bookings') && (
            <Card title="Bookings" subtitle={`${operations.bookingCount} starting in this period`}>
              <div className="grid grid-2" style={{ gap: 12 }}>
                {operations.bookingStatus.map(({ s, n }) => (
                  <div key={s} className="card stat-card" style={{ boxShadow: 'none' }}>
                    <div className="label" style={{ textTransform: 'capitalize' }}>{s}</div>
                    <div className="value">{n}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
