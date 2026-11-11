import { todayISO, inRange, diffDays } from './date.js';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export function lineTotal(item) {
  return round2((Number(item.qty) || 0) * (Number(item.price) || 0));
}

export function itemsSubtotal(items = []) {
  return round2(items.reduce((sum, item) => sum + lineTotal(item), 0));
}

export function invoiceTotals(invoice) {
  const subtotal = itemsSubtotal(invoice.items);
  const tax = round2(subtotal * ((Number(invoice.taxRate) || 0) / 100));
  const total = round2(subtotal + tax);
  const paid = round2((invoice.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0));
  const balance = round2(Math.max(total - paid, 0));
  return { subtotal, tax, total, paid, balance };
}

/** paid | partial | overdue | unpaid — derived, never stored. */
export function invoiceStatus(invoice, today = todayISO()) {
  const { balance, paid } = invoiceTotals(invoice);
  if (balance <= 0) return 'paid';
  if (invoice.dueDate < today) return 'overdue';
  if (paid > 0) return 'partial';
  return 'unpaid';
}

export function daysOverdue(invoice, today = todayISO()) {
  return Math.max(diffDays(today, invoice.dueDate), 0);
}

export function orderTotal(order) {
  return itemsSubtotal(order.items);
}

/** Every payment across all invoices, flattened with the invoice reference. */
export function allPayments(invoices) {
  return invoices.flatMap((inv) =>
    (inv.payments || []).map((p) => ({ ...p, invoiceId: inv.id, customerId: inv.customerId })),
  );
}

export function revenueInRange(invoices, range) {
  return round2(
    allPayments(invoices)
      .filter((p) => inRange(p.date, range))
      .reduce((s, p) => s + Number(p.amount), 0),
  );
}

export function outstandingTotal(invoices) {
  return round2(invoices.reduce((s, inv) => s + invoiceTotals(inv).balance, 0));
}

export function overdueInvoices(invoices, today = todayISO()) {
  return invoices.filter((inv) => invoiceStatus(inv, today) === 'overdue');
}

export function expensesInRange(expenses, range) {
  return round2(
    expenses.filter((e) => inRange(e.date, range)).reduce((s, e) => s + Number(e.amount), 0),
  );
}

export function isLowStock(product) {
  return Number(product.stock) <= Number(product.reorderLevel);
}

export function percentChange(current, previous) {
  if (!previous) return current ? null : 0;
  return (current - previous) / previous;
}

export function customerBalance(invoices, customerId) {
  return round2(
    invoices
      .filter((inv) => inv.customerId === customerId)
      .reduce((s, inv) => s + invoiceTotals(inv).balance, 0),
  );
}

export function customerLifetimeValue(invoices, customerId) {
  return round2(
    allPayments(invoices)
      .filter((p) => p.customerId === customerId)
      .reduce((s, p) => s + Number(p.amount), 0),
  );
}

export function nextNumber(records, prefix, start) {
  const max = records.reduce((m, r) => {
    const n = Number(String(r.number || '').replace(/\D/g, ''));
    return Number.isFinite(n) && n > m ? n : m;
  }, start - 1);
  return `${prefix}-${max + 1}`;
}

/** Buckets daily amounts between two dates; groups by month when the span is long. */
export function seriesByPeriod(entries, range) {
  const span = diffDays(range.to, range.from) + 1;
  const byMonth = span > 62;
  const buckets = new Map();

  const keyFor = (iso) => (byMonth ? iso.slice(0, 7) : iso);
  const cursor = new Date(range.from + 'T00:00:00');
  const end = new Date(range.to + 'T00:00:00');
  while (cursor <= end) {
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(
      cursor.getDate(),
    ).padStart(2, '0')}`;
    const key = keyFor(iso);
    if (!buckets.has(key)) buckets.set(key, { key, values: {} });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const { date, amount, series } of entries) {
    if (!inRange(date, range)) continue;
    const bucket = buckets.get(keyFor(date));
    if (bucket) bucket.values[series] = round2((bucket.values[series] || 0) + Number(amount));
  }

  return {
    byMonth,
    points: [...buckets.values()].map(({ key, values }) => ({ key, ...values })),
  };
}
