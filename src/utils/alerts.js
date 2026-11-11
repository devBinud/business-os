import { diffDays, todayISO } from './date.js';
import { invoiceStatus, invoiceTotals, isLowStock } from './calc.js';

/**
 * Derives notifications/alerts from current data, scoped to what the viewer may see.
 * Each alert: { id, tone: 'danger'|'warning'|'info', category, title, detail, to }
 */
export function buildAlerts({ data, access, money }) {
  const today = todayISO();
  const prefs = data.business.notificationPrefs;
  const alerts = [];
  const customerName = (id) => data.customers.find((c) => c.id === id)?.name ?? 'Unknown customer';

  if (prefs.overdueInvoices && access.canView('invoices')) {
    const overdue = data.invoices.filter((i) => invoiceStatus(i, today) === 'overdue');
    overdue
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .forEach((inv) =>
        alerts.push({
          id: `overdue-${inv.id}`,
          tone: 'danger',
          category: 'Overdue payment',
          title: `${inv.number} · ${customerName(inv.customerId)}`,
          detail: `${money(invoiceTotals(inv).balance)} overdue by ${diffDays(today, inv.dueDate)} days`,
          to: `/invoices/${inv.id}`,
        }),
      );
  }

  if (prefs.lowStock && access.canView('inventory')) {
    data.products.filter(isLowStock).forEach((p) =>
      alerts.push({
        id: `stock-${p.id}`,
        tone: 'warning',
        category: 'Low stock',
        title: p.name,
        detail: `${p.stock} left · reorder level ${p.reorderLevel}`,
        to: '/inventory?filter=low',
      }),
    );
  }

  if (prefs.pendingApprovals && access.approveExpenses && access.canView('expenses')) {
    const pending = data.expenses.filter((x) => x.status === 'pending');
    if (pending.length)
      alerts.push({
        id: 'approvals',
        tone: 'warning',
        category: 'Pending approval',
        title: `${pending.length} expense${pending.length === 1 ? '' : 's'} awaiting approval`,
        detail: money(pending.reduce((s, x) => s + Number(x.amount), 0)) + ' in total',
        to: '/expenses?status=pending',
      });
  }

  if (prefs.newBookings && access.canView('bookings')) {
    const pendingBookings = data.bookings.filter((b) => b.status === 'pending');
    if (pendingBookings.length)
      alerts.push({
        id: 'pending-bookings',
        tone: 'info',
        category: 'Bookings',
        title: `${pendingBookings.length} booking${pendingBookings.length === 1 ? '' : 's'} waiting for confirmation`,
        detail: pendingBookings.map((b) => customerName(b.customerId)).slice(0, 3).join(', '),
        to: '/bookings?status=pending',
      });
  }

  if (prefs.taskDeadlines && access.canView('tasks')) {
    const mine = data.tasks.filter(
      (t) => t.status !== 'done' && (!access.ownTasksOnly || t.assigneeId === access.userId),
    );
    const overdueTasks = mine.filter((t) => t.dueDate < today);
    const dueToday = mine.filter((t) => t.dueDate === today);
    if (overdueTasks.length)
      alerts.push({
        id: 'tasks-overdue',
        tone: 'danger',
        category: 'Tasks',
        title: `${overdueTasks.length} task${overdueTasks.length === 1 ? ' is' : 's are'} past due`,
        detail: overdueTasks.map((t) => t.title).slice(0, 2).join(' · '),
        to: '/tasks?due=overdue',
      });
    if (dueToday.length)
      alerts.push({
        id: 'tasks-today',
        tone: 'info',
        category: 'Tasks',
        title: `${dueToday.length} task${dueToday.length === 1 ? '' : 's'} due today`,
        detail: dueToday.map((t) => t.title).slice(0, 2).join(' · '),
        to: '/tasks?due=today',
      });
  }

  return alerts;
}
