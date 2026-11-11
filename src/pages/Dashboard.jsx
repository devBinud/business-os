import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CircleDollarSign, Wallet, Receipt, Users, CheckSquare, TriangleAlert, Info, CircleCheck,
  UserPlus, FilePlus2, CalendarPlus, ListPlus, ReceiptText, CalendarDays, Clock, ArrowRight,
  FileText, IdCard, Package, Settings, ShoppingCart,
} from 'lucide-react';
import { useStore, useLookups } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { PageHeader, Card, StatCard, Segmented, StatusBadge, EmptyState } from '../components/ui.jsx';
import { MoneyBarChart, Legend } from '../components/Charts.jsx';
import {
  DATE_RANGES, rangeBounds, previousRangeBounds, inRange, todayISO, addDays, relativeDay, timeAgo, formatShortDate,
} from '../utils/date.js';
import {
  revenueInRange, outstandingTotal, overdueInvoices, invoiceTotals, percentChange, allPayments, seriesByPeriod,
} from '../utils/calc.js';
import { buildAlerts } from '../utils/alerts.js';
import { formatNumber } from '../utils/format.js';

const FEED_ICONS = {
  payment: CircleDollarSign, invoice: FileText, expense: Receipt, customer: Users, task: CheckSquare,
  booking: CalendarDays, employee: IdCard, inventory: Package, settings: Settings, sale: ShoppingCart,
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const store = useStore();
  const { invoices, expenses, customers, tasks, bookings, activity, currentUser, money } = store;
  const { customerById, employeeById } = useLookups();
  const access = useAccess();
  const navigate = useNavigate();
  const [rangeId, setRangeId] = useState('month');

  const today = todayISO();
  const range = rangeBounds(rangeId);
  const prev = previousRangeBounds(rangeId);
  const approved = useMemo(() => expenses.filter((x) => x.status === 'approved'), [expenses]);

  const stats = useMemo(() => {
    const sumExp = (r) => approved.filter((x) => inRange(x.date, r)).reduce((s, x) => s + Number(x.amount), 0);
    const revenue = revenueInRange(invoices, range);
    const revenuePrev = revenueInRange(invoices, prev);
    const exp = sumExp(range);
    const expPrev = sumExp(prev);
    const overdue = overdueInvoices(invoices, today);
    const openInvoices = invoices.filter((i) => invoiceTotals(i).balance > 0);
    const newCustomers = customers.filter((c) => inRange(c.createdAt, range)).length;
    const activeTasks = tasks.filter((t) => t.status !== 'done');
    return {
      revenue, revenueChange: percentChange(revenue, revenuePrev),
      expenses: exp, expensesChange: percentChange(exp, expPrev),
      outstanding: outstandingTotal(invoices), openCount: openInvoices.length,
      overdueAmount: overdue.reduce((s, i) => s + invoiceTotals(i).balance, 0), overdueCount: overdue.length,
      customers: customers.filter((c) => c.status !== 'inactive').length, newCustomers,
      activeTasks: activeTasks.length, overdueTasks: activeTasks.filter((t) => t.dueDate < today).length,
    };
  }, [invoices, approved, customers, tasks, range.from, range.to, prev.from, prev.to, today]);

  // For "Today", a single bar isn't useful — show the last 14 days instead.
  const chartRange = rangeId === 'today' ? { from: addDays(today, -13), to: today } : range;
  const chart = useMemo(
    () =>
      seriesByPeriod(
        [
          ...allPayments(invoices).map((p) => ({ date: p.date, amount: p.amount, series: 'revenue' })),
          ...approved.map((x) => ({ date: x.date, amount: x.amount, series: 'expenses' })),
        ],
        chartRange,
      ),
    [invoices, approved, chartRange.from, chartRange.to],
  );
  const chartPoints = chart.points.map((p) => ({ revenue: 0, expenses: 0, ...p }));

  const alerts = useMemo(() => buildAlerts({ data: store.data, access, money }), [store.data, access, money]);

  const myTasks = tasks
    .filter((t) => t.status !== 'done' && (!access.ownTasksOnly || t.assigneeId === access.userId))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const upcoming = [
    ...(access.canView('bookings')
      ? bookings
          .filter((b) => b.start >= today && b.start <= addDays(today, 14) && b.status !== 'cancelled')
          .map((b) => ({
            id: b.id, date: b.start, kind: 'booking', title: `${customerById[b.customerId]?.name ?? 'Guest'} · ${b.resource}`,
            badge: <StatusBadge kind="booking" status={b.status} />, to: `/bookings?open=${b.id}`,
          }))
      : []),
    ...(access.canView('tasks')
      ? myTasks
          .filter((t) => t.dueDate <= addDays(today, 7))
          .map((t) => ({
            id: t.id, date: t.dueDate, kind: 'task', title: t.title,
            badge: <StatusBadge kind="priority" status={t.priority} />, to: `/tasks?open=${t.id}`,
          }))
      : []),
    ...(access.canView('invoices')
      ? invoices
          .filter((i) => invoiceTotals(i).balance > 0 && i.dueDate >= today && i.dueDate <= addDays(today, 14))
          .map((i) => ({
            id: i.id, date: i.dueDate, kind: 'invoice', title: `${i.number} due · ${customerById[i.customerId]?.name}`,
            badge: <span className="small strong">{money(invoiceTotals(i).balance)}</span>, to: `/invoices/${i.id}`,
          }))
      : []),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);

  // Staff should only see activity relevant to their work, not financial events.
  const feed = activity
    .filter((a) => access.financials || ['task', 'booking', 'customer', 'inventory'].includes(a.type))
    .slice(0, 8);

  const quickActions = [
    access.canEdit('customers') && { label: 'Add customer', icon: UserPlus, to: '/customers?new=1' },
    access.canEdit('invoices') && { label: 'Create invoice', icon: FilePlus2, to: '/invoices/new' },
    access.canEdit('expenses') && { label: 'Add expense', icon: ReceiptText, to: '/expenses?new=1' },
    access.canEdit('tasks') && { label: 'New task', icon: ListPlus, to: '/tasks?new=1' },
    access.canEdit('bookings') && { label: 'New booking', icon: CalendarPlus, to: '/bookings?new=1' },
  ].filter(Boolean);

  const rangeLabel = DATE_RANGES.find((r) => r.id === rangeId).label.toLowerCase();
  const prevLabel = { today: 'vs yesterday', week: 'vs last week', month: 'vs last month', year: 'vs last year' }[rangeId];

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${currentUser?.name.split(' ')[0]}`}
        description={
          access.financials
            ? `Here's how ${store.business.name} is doing ${rangeId === 'today' ? 'today' : rangeLabel}.`
            : 'Your tasks, upcoming bookings and recent updates.'
        }
        actions={access.financials && <Segmented label="Date range" options={DATE_RANGES} value={rangeId} onChange={setRangeId} />}
      />

      <div className="stack" style={{ '--gap': '16px' }}>
        {access.financials ? (
          <div className="grid grid-5">
            <StatCard icon={CircleDollarSign} label="Revenue" value={money(stats.revenue)} change={stats.revenueChange} changeLabel={prevLabel} meta={stats.revenueChange === null && <span>No revenue in previous period</span>} />
            <StatCard icon={Wallet} label="Outstanding payments" value={money(stats.outstanding)} meta={<span>{stats.openCount} open invoices{stats.overdueCount > 0 && <> · <span className="text-danger">{money(stats.overdueAmount)} overdue</span></>}</span>} />
            <StatCard icon={Receipt} label="Expenses" value={money(stats.expenses)} change={stats.expensesChange} changeLabel={prevLabel} invertTrend />
            <StatCard icon={Users} label="Customers" value={formatNumber(stats.customers)} meta={<span>{stats.newCustomers} new {rangeId === 'today' ? 'today' : rangeLabel}</span>} />
            <StatCard icon={CheckSquare} label="Active tasks" value={formatNumber(stats.activeTasks)} meta={stats.overdueTasks > 0 ? <span className="text-danger">{stats.overdueTasks} past due</span> : <span>None past due</span>} />
          </div>
        ) : (
          <div className="grid grid-4">
            <StatCard icon={CheckSquare} label="My open tasks" value={myTasks.length} meta={<span>{myTasks.filter((t) => t.status === 'in_progress').length} in progress</span>} />
            <StatCard icon={Clock} label="Due today" value={myTasks.filter((t) => t.dueDate === today).length} meta={<span className="text-danger">{myTasks.filter((t) => t.dueDate < today).length} past due</span>} />
            <StatCard icon={CalendarDays} label="Arrivals today" value={bookings.filter((b) => b.start === today && b.status !== 'cancelled').length} meta={<span>{bookings.filter((b) => b.end === today && b.status !== 'cancelled').length} departures</span>} />
            <StatCard icon={CalendarDays} label="Pending bookings" value={bookings.filter((b) => b.status === 'pending').length} meta={<span>Awaiting confirmation</span>} />
          </div>
        )}

        <div className="grid grid-main-side">
          {access.financials ? (
            <Card
              title="Revenue and expenses"
              subtitle={rangeId === 'today' ? 'Last 14 days' : `${formatShortDate(range.from)} – ${formatShortDate(range.to)}${chart.byMonth ? ' · by month' : ''}`}
              actions={<Legend keys={['revenue', 'expenses']} />}
            >
              <MoneyBarChart points={chartPoints} byMonth={chart.byMonth} keys={['revenue', 'expenses']} money={money} />
            </Card>
          ) : (
            <Card title="My tasks" actions={<Link to="/tasks" className="btn sm">Open task board</Link>} flush>
              {myTasks.length === 0 ? (
                <EmptyState icon={CircleCheck} title="Nothing assigned">You're all caught up.</EmptyState>
              ) : (
                <ul className="list">
                  {myTasks.slice(0, 6).map((t) => (
                    <li key={t.id} className="list-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/tasks?open=${t.id}`)}>
                      <span className="grow">
                        <div className="title">{t.title}</div>
                        <div className={`sub ${t.dueDate < today ? 'text-danger' : ''}`}>Due {relativeDay(t.dueDate).toLowerCase()}</div>
                      </span>
                      <StatusBadge kind="task" status={t.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Card title="Needs attention" subtitle={`${alerts.length} item${alerts.length === 1 ? '' : 's'}`} flush>
            {alerts.length === 0 ? (
              <EmptyState icon={CircleCheck} title="All clear">No overdue payments, low stock or pending approvals.</EmptyState>
            ) : (
              <div className="stack" style={{ '--gap': '8px', padding: '0 16px 16px', maxHeight: 340, overflowY: 'auto' }}>
                {alerts.slice(0, 7).map((a) => (
                  <Link key={a.id} to={a.to} className={`alert ${a.tone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {a.tone === 'info' ? <Info size={16} /> : <TriangleAlert size={16} />}
                    <span className="grow">
                      <div className="small muted">{a.category}</div>
                      <div className="strong truncate">{a.title}</div>
                      <div className="small muted">{a.detail}</div>
                    </span>
                  </Link>
                ))}
                {alerts.length > 7 && <div className="small muted" style={{ textAlign: 'center' }}>+{alerts.length - 7} more in notifications</div>}
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-3">
          <Card title="Upcoming" subtitle="Bookings, deadlines and due payments" flush>
            {upcoming.length === 0 ? (
              <EmptyState icon={CalendarDays} title="Nothing coming up">No bookings or deadlines in the next two weeks.</EmptyState>
            ) : (
              <ul className="list">
                {upcoming.map((u) => (
                  <li key={`${u.kind}-${u.id}`} className="list-item" style={{ cursor: 'pointer' }} onClick={() => navigate(u.to)}>
                    <span style={{ width: 64, flexShrink: 0 }} className={`small strong ${u.date < today ? 'text-danger' : ''}`}>{relativeDay(u.date)}</span>
                    <span className="grow truncate">{u.title}</span>
                    {u.badge}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Recent activity" flush>
            {feed.length === 0 ? (
              <EmptyState title="No activity yet" />
            ) : (
              <ul className="list">
                {feed.map((a) => {
                  const Icon = FEED_ICONS[a.type] ?? Info;
                  return (
                    <li key={a.id} className="list-item">
                      <span className="feed-icon"><Icon size={15} /></span>
                      <span className="grow">
                        <div>{a.text}</div>
                        <div className="sub">{employeeById[a.actorId]?.name ?? 'System'} · {timeAgo(a.at)}</div>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Quick actions" subtitle="Try a connected workflow">
            <div className="stack" style={{ '--gap': '8px' }}>
              {quickActions.map((q) => (
                <Link key={q.label} to={q.to} className="btn" style={{ justifyContent: 'flex-start', height: 40 }}>
                  <q.icon size={16} /> {q.label}
                  <ArrowRight size={14} style={{ marginLeft: 'auto' }} className="faint" />
                </Link>
              ))}
              {access.canEdit('invoices') && (
                <div className="alert info small" style={{ marginTop: 6 }}>
                  <Info size={16} />
                  <span className="grow">
                    Add a customer, create an invoice for them, record a payment — then come back here to see
                    revenue and outstanding payments update.
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
