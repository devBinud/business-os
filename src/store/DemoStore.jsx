import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { createSampleState, DEMO_USERS } from '../data/sampleData.js';
import { addDays, todayISO } from '../utils/date.js';
import { formatMoney, uid } from '../utils/format.js';
import { invoiceTotals, nextNumber, orderTotal } from '../utils/calc.js';

const DATA_KEY = 'business-os-demo:data:v1';
const SESSION_KEY = 'business-os-demo:session:v1';

// localStorage is only a convenience for demo persistence (see product doc, section 11).
function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode etc.) — the demo still works in memory */
  }
}

const StoreContext = createContext(null);

const reducer = (state, fn) => fn(state);

export function DemoStoreProvider({ children }) {
  const [data, apply] = useReducer(reducer, null, () => {
    const stored = load(DATA_KEY);
    return stored?.version === 1 ? stored : createSampleState();
  });
  const [session, setSession] = useState(() => load(SESSION_KEY));

  useEffect(() => save(DATA_KEY, data), [data]);
  useEffect(() => save(SESSION_KEY, session), [session]);

  const role = session?.role ?? null;
  const currentUser = useMemo(
    () => data.employees.find((e) => e.id === session?.userId) ?? null,
    [data.employees, session?.userId],
  );

  const money = useCallback((n, opts) => formatMoney(n, data.business.currency, opts), [data.business.currency]);

  const actions = useMemo(() => {
    const actorId = session?.userId;

    /** Apply a state change and optionally append an activity entry. */
    const commit = (fn, activity) =>
      apply((s) => {
        const next = fn(s);
        if (!activity) return next;
        const entry = typeof activity === 'function' ? activity(next) : activity;
        return {
          ...next,
          activity: [{ id: uid('a'), at: Date.now(), actorId, ...entry }, ...next.activity].slice(0, 80),
        };
      });

    const upsert = (list, record) =>
      list.some((r) => r.id === record.id) ? list.map((r) => (r.id === record.id ? record : r)) : [record, ...list];

    const fmt = (n) => formatMoney(n, data.business.currency);

    return {
      // ----- session -----
      signIn(roleId, userId = DEMO_USERS[roleId]) {
        setSession({ role: roleId, userId, signedInAt: Date.now() });
      },
      signOut() {
        setSession(null);
      },
      switchRole(roleId) {
        setSession((s) => ({ ...s, role: roleId, userId: DEMO_USERS[roleId] }));
      },
      resetDemo() {
        apply(() => createSampleState());
      },

      // ----- business -----
      completeSetup(patch) {
        commit((s) => ({ ...s, setupComplete: true, business: { ...s.business, ...patch } }), {
          type: 'settings',
          text: `Business profile set up for ${patch.name}`,
        });
      },
      updateBusiness(patch, note = 'Business settings updated') {
        commit((s) => ({ ...s, business: { ...s.business, ...patch } }), { type: 'settings', text: note });
      },

      // ----- customers -----
      saveCustomer(customer) {
        const isNew = !customer.id;
        const record = isNew
          ? { notes: [], tags: [], createdAt: todayISO(), ...customer, id: uid('c') }
          : customer;
        commit((s) => ({ ...s, customers: upsert(s.customers, record) }), {
          type: 'customer',
          text: isNew ? `New customer added: ${record.name}` : `Customer updated: ${record.name}`,
        });
        return record.id;
      },
      deleteCustomer(id) {
        commit(
          (s) => ({ ...s, customers: s.customers.filter((c) => c.id !== id) }),
          (s) => ({ type: 'customer', text: 'A customer record was deleted' }),
        );
      },
      addCustomerNote(customerId, text) {
        const note = { id: uid('n'), date: todayISO(), text, authorId: actorId };
        commit(
          (s) => ({
            ...s,
            customers: s.customers.map((c) => (c.id === customerId ? { ...c, notes: [note, ...c.notes] } : c)),
          }),
          (s) => ({ type: 'customer', text: `Note added to ${s.customers.find((c) => c.id === customerId)?.name}` }),
        );
      },

      // ----- sales orders -----
      saveOrder(order) {
        const isNew = !order.id;
        let record = order;
        commit(
          (s) => {
            record = isNew
              ? { status: 'quotation', ...order, id: uid('o'), number: nextNumber(s.orders, 'SO', 2001) }
              : order;
            return { ...s, orders: upsert(s.orders, record) };
          },
          (s) => ({
            type: 'sale',
            text: `${isNew ? 'Order created' : 'Order updated'}: ${record.number} for ${
              s.customers.find((c) => c.id === record.customerId)?.name
            } (${fmt(orderTotal(record))})`,
          }),
        );
      },
      setOrderStatus(id, status) {
        commit(
          (s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) }),
          (s) => ({ type: 'sale', text: `Order ${s.orders.find((o) => o.id === id)?.number} marked ${status}` }),
        );
      },
      deleteOrder(id) {
        commit((s) => ({ ...s, orders: s.orders.filter((o) => o.id !== id) }));
      },
      /** Creates an invoice from an order's line items and links the two. Returns the invoice id. */
      createInvoiceFromOrder(orderId) {
        const invoiceId = uid('inv');
        commit(
          (s) => {
            const order = s.orders.find((o) => o.id === orderId);
            const invoice = {
              id: invoiceId,
              number: nextNumber(s.invoices, 'INV', 1001),
              customerId: order.customerId,
              orderId,
              issueDate: todayISO(),
              dueDate: addDays(todayISO(), 14),
              taxRate: s.business.taxRate,
              items: order.items.map((i) => ({ ...i, id: uid('li') })),
              payments: [],
              notes: `Created from order ${order.number}`,
            };
            return {
              ...s,
              invoices: [invoice, ...s.invoices],
              orders: s.orders.map((o) =>
                o.id === orderId ? { ...o, invoiceId, status: o.status === 'quotation' ? 'confirmed' : o.status } : o,
              ),
            };
          },
          (s) => {
            const inv = s.invoices.find((i) => i.id === invoiceId);
            return {
              type: 'invoice',
              text: `Invoice ${inv.number} created for ${s.customers.find((c) => c.id === inv.customerId)?.name} (${fmt(
                invoiceTotals(inv).total,
              )})`,
            };
          },
        );
        return invoiceId;
      },

      // ----- invoices & payments -----
      saveInvoice(invoice) {
        const isNew = !invoice.id;
        const id = invoice.id || uid('inv');
        commit(
          (s) => {
            const record = isNew
              ? { payments: [], ...invoice, id, number: nextNumber(s.invoices, 'INV', 1001) }
              : invoice;
            return { ...s, invoices: upsert(s.invoices, record) };
          },
          (s) => {
            const inv = s.invoices.find((i) => i.id === id);
            return {
              type: 'invoice',
              text: `${isNew ? 'Invoice created' : 'Invoice updated'}: ${inv.number} for ${
                s.customers.find((c) => c.id === inv.customerId)?.name
              } (${fmt(invoiceTotals(inv).total)})`,
            };
          },
        );
        return id;
      },
      recordPayment(invoiceId, payment) {
        const record = { id: uid('pay'), ...payment, amount: Number(payment.amount), recordedBy: actorId };
        commit(
          (s) => ({
            ...s,
            invoices: s.invoices.map((inv) =>
              inv.id === invoiceId ? { ...inv, payments: [...inv.payments, record] } : inv,
            ),
          }),
          (s) => {
            const inv = s.invoices.find((i) => i.id === invoiceId);
            return {
              type: 'payment',
              text: `Payment of ${fmt(record.amount)} recorded for ${inv.number} (${
                s.customers.find((c) => c.id === inv.customerId)?.name
              })`,
            };
          },
        );
      },
      deleteInvoice(id) {
        commit(
          (s) => ({
            ...s,
            invoices: s.invoices.filter((i) => i.id !== id),
            orders: s.orders.map((o) => (o.invoiceId === id ? { ...o, invoiceId: undefined } : o)),
          }),
          { type: 'invoice', text: 'An invoice was deleted' },
        );
      },

      // ----- expenses -----
      saveExpense(expense, { needsApproval } = {}) {
        const isNew = !expense.id;
        const record = isNew
          ? { ...expense, id: uid('x'), submittedBy: actorId, status: needsApproval ? 'pending' : 'approved' }
          : expense;
        commit((s) => ({ ...s, expenses: upsert(s.expenses, record) }), {
          type: 'expense',
          text: isNew
            ? `Expense of ${fmt(record.amount)} ${record.status === 'pending' ? 'submitted for approval' : 'recorded'} (${record.vendor || record.category})`
            : `Expense updated (${record.vendor || record.category})`,
        });
      },
      setExpenseStatus(id, status) {
        commit(
          (s) => ({ ...s, expenses: s.expenses.map((x) => (x.id === id ? { ...x, status, reviewedBy: actorId } : x)) }),
          (s) => {
            const x = s.expenses.find((e) => e.id === id);
            return { type: 'expense', text: `Expense ${status}: ${fmt(x.amount)} (${x.vendor || x.category})` };
          },
        );
      },
      deleteExpense(id) {
        commit((s) => ({ ...s, expenses: s.expenses.filter((x) => x.id !== id) }), {
          type: 'expense',
          text: 'An expense record was deleted',
        });
      },

      // ----- employees -----
      saveEmployee(employee) {
        const isNew = !employee.id;
        const record = isNew ? { status: 'active', appRole: 'staff', ...employee, id: uid('e') } : employee;
        commit((s) => ({ ...s, employees: upsert(s.employees, record) }), {
          type: 'employee',
          text: isNew ? `New employee added: ${record.name}` : `Employee profile updated: ${record.name}`,
        });
      },

      // ----- tasks -----
      saveTask(task) {
        const isNew = !task.id;
        const record = isNew
          ? { status: 'todo', createdAt: todayISO(), createdBy: actorId, ...task, id: uid('t') }
          : task;
        commit((s) => ({ ...s, tasks: upsert(s.tasks, record) }), (s) => ({
          type: 'task',
          text: isNew
            ? `Task “${record.title}” assigned to ${s.employees.find((e) => e.id === record.assigneeId)?.name}`
            : `Task updated: “${record.title}”`,
        }));
      },
      setTaskStatus(id, status) {
        const labels = { todo: 'moved to To do', in_progress: 'started', review: 'sent for review', done: 'completed' };
        commit(
          (s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)) }),
          (s) => ({ type: 'task', text: `Task ${labels[status]}: “${s.tasks.find((t) => t.id === id)?.title}”` }),
        );
      },
      deleteTask(id) {
        commit((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
      },

      // ----- bookings -----
      saveBooking(booking) {
        const isNew = !booking.id;
        let record = booking;
        commit(
          (s) => {
            record = isNew
              ? { createdAt: todayISO(), ...booking, id: uid('b'), number: nextNumber(s.bookings, 'BK', 3001) }
              : booking;
            return { ...s, bookings: upsert(s.bookings, record) };
          },
          (s) => ({
            type: 'booking',
            text: `${isNew ? 'Booking created' : 'Booking updated'}: ${record.number} for ${
              s.customers.find((c) => c.id === record.customerId)?.name
            } (${record.status})`,
          }),
        );
      },
      setBookingStatus(id, status) {
        commit(
          (s) => ({ ...s, bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)) }),
          (s) => ({ type: 'booking', text: `Booking ${s.bookings.find((b) => b.id === id)?.number} marked ${status}` }),
        );
      },

      // ----- inventory -----
      saveProduct(product) {
        const isNew = !product.id;
        let record = product;
        commit(
          (s) => {
            record = isNew ? { ...product, id: uid('p'), sku: nextNumber(s.products, 'SKU', 101) } : product;
            return { ...s, products: upsert(s.products, record) };
          },
          { type: 'inventory', text: `${isNew ? 'Product added' : 'Product updated'}: ${product.name}` },
        );
      },
      adjustStock(productId, { type, qty, reason }) {
        const amount = Number(qty);
        commit(
          (s) => ({
            ...s,
            products: s.products.map((p) =>
              p.id === productId ? { ...p, stock: Math.max(0, p.stock + (type === 'in' ? amount : -amount)) } : p,
            ),
            stockMovements: [
              { id: uid('m'), productId, type, qty: amount, date: todayISO(), reason, by: actorId },
              ...s.stockMovements,
            ],
          }),
          (s) => {
            const p = s.products.find((x) => x.id === productId);
            return {
              type: 'inventory',
              text: `Stock ${type === 'in' ? 'received' : 'issued'}: ${amount} × ${p.name} (${p.stock} now in stock)`,
            };
          },
        );
      },
    };
  }, [session?.userId, data.business.currency]);

  const value = useMemo(
    () => ({ ...data, data, session, role, currentUser, money, actions }),
    [data, session, role, currentUser, money, actions],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <DemoStoreProvider>');
  return ctx;
}

/** Lookup helpers derived from store data. */
export function useLookups() {
  const { customers, employees, products } = useStore();
  return useMemo(() => {
    const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
    return { customerById: byId(customers), employeeById: byId(employees), productById: byId(products) };
  }, [customers, employees, products]);
}
