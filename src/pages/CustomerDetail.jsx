import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Trash2, Mail, Phone, MapPin, FilePlus2, CalendarPlus, FileText, CircleDollarSign,
  CalendarDays, ShoppingCart, StickyNote, UserPlus,
} from 'lucide-react';
import { useStore, useLookups } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { PageHeader, Card, StatusBadge, ConfirmDialog, EmptyState } from '../components/ui.jsx';
import CustomerForm from '../components/forms/CustomerForm.jsx';
import { useToast } from '../components/Toast.jsx';
import { invoiceStatus, invoiceTotals, orderTotal } from '../utils/calc.js';
import { formatDate, todayISO } from '../utils/date.js';
import NotFound from './NotFound.jsx';

export default function CustomerDetail() {
  const { id } = useParams();
  const { customers, invoices, bookings, orders, money, actions } = useStore();
  const { employeeById } = useLookups();
  const access = useAccess();
  const navigate = useNavigate();
  const toast = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [note, setNote] = useState('');
  const [tab, setTab] = useState('history');

  const customer = customers.find((c) => c.id === id);

  const related = useMemo(() => {
    const inv = invoices.filter((i) => i.customerId === id).sort((a, b) => b.issueDate.localeCompare(a.issueDate));
    const bk = bookings.filter((b) => b.customerId === id).sort((a, b) => b.start.localeCompare(a.start));
    const ord = orders.filter((o) => o.customerId === id).sort((a, b) => b.date.localeCompare(a.date));
    const totals = inv.map(invoiceTotals);
    return {
      invoices: inv, bookings: bk, orders: ord,
      billed: totals.reduce((s, t) => s + t.total, 0),
      paid: totals.reduce((s, t) => s + t.paid, 0),
      balance: totals.reduce((s, t) => s + t.balance, 0),
    };
  }, [invoices, bookings, orders, id]);

  const history = useMemo(() => {
    if (!customer) return [];
    const items = [];
    const showMoney = access.financials;
    if (access.canView('invoices'))
      related.invoices.forEach((inv) => {
        items.push({ date: inv.issueDate, icon: FileText, text: `Invoice ${inv.number} issued`, detail: showMoney && money(invoiceTotals(inv).total), to: `/invoices/${inv.id}` });
        inv.payments.forEach((p) => items.push({ date: p.date, icon: CircleDollarSign, text: `Payment received for ${inv.number}`, detail: `${money(p.amount)} · ${p.method}`, to: `/invoices/${inv.id}` }));
      });
    if (access.canView('bookings'))
      related.bookings.forEach((b) => items.push({ date: b.createdAt || b.start, icon: CalendarDays, text: `Booking ${b.number} · ${b.resource}`, detail: `${formatDate(b.start)} – ${formatDate(b.end)} · ${b.status}`, to: `/bookings?open=${b.id}` }));
    if (access.canView('sales'))
      related.orders.forEach((o) => items.push({ date: o.date, icon: ShoppingCart, text: `Order ${o.number} (${o.status})`, detail: showMoney && money(orderTotal(o)), to: `/sales?open=${o.id}` }));
    customer.notes.forEach((n) => items.push({ date: n.date, icon: StickyNote, text: n.text, detail: `Note by ${employeeById[n.authorId]?.name ?? 'Team'}` }));
    items.push({ date: customer.createdAt, icon: UserPlus, text: 'Customer profile created' });
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [customer, related, access, money, employeeById]);

  if (!customer) return <NotFound title="Customer not found" text="This customer may have been deleted." />;

  const canEdit = access.canEdit('customers');
  const hasLinks = related.invoices.length + related.bookings.length + related.orders.length > 0;
  const today = todayISO();

  const tabs = [
    { id: 'history', label: 'History' },
    access.canView('invoices') && { id: 'invoices', label: `Invoices (${related.invoices.length})` },
    access.canView('bookings') && { id: 'bookings', label: `Bookings (${related.bookings.length})` },
    access.canView('sales') && { id: 'orders', label: `Orders (${related.orders.length})` },
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        breadcrumb={<Link to="/customers" className="breadcrumb"><ArrowLeft size={14} /> Customers</Link>}
        title={
          <span className="row" style={{ gap: 12 }}>
            {customer.name} <StatusBadge kind="customer" status={customer.status} />
          </span>
        }
        description={`${customer.type}${customer.city ? ` · ${customer.city}` : ''} · Customer since ${formatDate(customer.createdAt)}`}
        actions={
          <>
            {access.canEdit('invoices') && (
              <Link className="btn" to={`/invoices/new?customer=${customer.id}`}><FilePlus2 size={16} /> Create invoice</Link>
            )}
            {access.canEdit('bookings') && (
              <Link className="btn" to={`/bookings?new=1&customer=${customer.id}`}><CalendarPlus size={16} /> New booking</Link>
            )}
            {canEdit && <button className="btn" onClick={() => setEditOpen(true)}><Pencil size={16} /> Edit</button>}
            {canEdit && (
              <button className="btn icon" onClick={() => setConfirmDelete(true)} aria-label="Delete customer" title="Delete customer">
                <Trash2 size={16} />
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-main-side" style={{ alignItems: 'start' }}>
        <div className="stack">
          {access.financials && (
            <div className="grid grid-3">
              <div className="card stat-card"><div className="label">Total billed</div><div className="value">{money(related.billed)}</div></div>
              <div className="card stat-card"><div className="label">Total paid</div><div className="value">{money(related.paid)}</div></div>
              <div className="card stat-card"><div className="label">Balance due</div><div className={`value ${related.balance > 0 ? 'text-danger' : ''}`}>{money(related.balance)}</div></div>
            </div>
          )}

          <section className="card">
            <div style={{ padding: '4px 20px 0' }}>
              <div className="tabs" role="tablist" style={{ marginBottom: 0 }}>
                {tabs.map((t) => (
                  <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
                ))}
              </div>
            </div>

            {tab === 'history' && (
              history.length === 0 ? <EmptyState title="No history yet" /> : (
                <ul className="list">
                  {history.map((h, i) => (
                    <li key={i} className="list-item">
                      <span className="feed-icon"><h.icon size={15} /></span>
                      <span className="grow">
                        <div>{h.to ? <Link to={h.to}>{h.text}</Link> : h.text}</div>
                        <div className="sub">{formatDate(h.date)}{h.detail ? ` · ${h.detail}` : ''}</div>
                      </span>
                    </li>
                  ))}
                </ul>
              )
            )}

            {tab === 'invoices' && (
              related.invoices.length === 0 ? (
                <EmptyState icon={FileText} title="No invoices yet" action={access.canEdit('invoices') && <Link className="btn primary" to={`/invoices/new?customer=${customer.id}`}>Create invoice</Link>} />
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Invoice</th><th>Issued</th><th>Due</th><th>Status</th><th className="num">Total</th><th className="num">Balance</th></tr></thead>
                    <tbody>
                      {related.invoices.map((inv) => {
                        const t = invoiceTotals(inv);
                        return (
                          <tr key={inv.id} className="clickable" onClick={() => navigate(`/invoices/${inv.id}`)}>
                            <td className="strong">{inv.number}</td>
                            <td className="nowrap">{formatDate(inv.issueDate)}</td>
                            <td className="nowrap">{formatDate(inv.dueDate)}</td>
                            <td><StatusBadge kind="invoice" status={invoiceStatus(inv, today)} /></td>
                            <td className="num">{money(t.total)}</td>
                            <td className="num">{t.balance > 0 ? money(t.balance) : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {tab === 'bookings' && (
              related.bookings.length === 0 ? <EmptyState icon={CalendarDays} title="No bookings" /> : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Booking</th><th>Resource</th><th>Dates</th><th>Status</th></tr></thead>
                    <tbody>
                      {related.bookings.map((b) => (
                        <tr key={b.id} className="clickable" onClick={() => navigate(`/bookings?open=${b.id}`)}>
                          <td className="strong">{b.number}</td>
                          <td>{b.resource}</td>
                          <td className="nowrap">{formatDate(b.start)} – {formatDate(b.end)}</td>
                          <td><StatusBadge kind="booking" status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {tab === 'orders' && (
              related.orders.length === 0 ? <EmptyState icon={ShoppingCart} title="No orders" /> : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Order</th><th>Date</th><th>Status</th><th className="num">Total</th></tr></thead>
                    <tbody>
                      {related.orders.map((o) => (
                        <tr key={o.id} className="clickable" onClick={() => navigate(`/sales?open=${o.id}`)}>
                          <td className="strong">{o.number}</td>
                          <td className="nowrap">{formatDate(o.date)}</td>
                          <td><StatusBadge kind="order" status={o.status} /></td>
                          <td className="num">{access.financials ? money(orderTotal(o)) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </section>
        </div>

        <div className="stack">
          <Card title="Contact details">
            <dl className="dl">
              <dt><span className="row" style={{ gap: 6 }}><Mail size={14} /> Email</span></dt>
              <dd>{customer.email ? <a href={`mailto:${customer.email}`}>{customer.email}</a> : '—'}</dd>
              <dt><span className="row" style={{ gap: 6 }}><Phone size={14} /> Phone</span></dt>
              <dd>{customer.phone || '—'}</dd>
              <dt><span className="row" style={{ gap: 6 }}><MapPin size={14} /> Address</span></dt>
              <dd>{[customer.address, customer.city].filter(Boolean).join(', ') || '—'}</dd>
            </dl>
            {customer.tags?.length > 0 && (
              <div className="row wrap" style={{ marginTop: 14, gap: 6 }}>
                {customer.tags.map((t) => <span key={t} className="tag">{t}</span>)}
              </div>
            )}
          </Card>

          <Card title="Notes & enquiries" subtitle={`${customer.notes.length} note${customer.notes.length === 1 ? '' : 's'}`} flush>
            {canEdit && (
              <form
                style={{ padding: '0 20px 14px' }}
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!note.trim()) return;
                  actions.addCustomerNote(customer.id, note.trim());
                  setNote('');
                  toast('Note added');
                }}
              >
                <textarea className="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note, call summary or enquiry…" aria-label="New note" />
                <div><button className="btn sm primary" type="submit" disabled={!note.trim()}>Add note</button></div>
              </form>
            )}
            {customer.notes.length === 0 ? (
              <div className="muted small" style={{ padding: '0 20px 20px' }}>No notes yet.</div>
            ) : (
              <ul className="list">
                {customer.notes.map((n) => (
                  <li key={n.id} className="list-item">
                    <span className="grow">
                      <div>{n.text}</div>
                      <div className="sub">{employeeById[n.authorId]?.name ?? 'Team'} · {formatDate(n.date)}</div>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <CustomerForm open={editOpen} onClose={() => setEditOpen(false)} customer={customer} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={hasLinks ? 'This customer has linked records' : 'Delete customer?'}
        message={
          hasLinks
            ? `${customer.name} has invoices, bookings or orders. Mark them as inactive instead so their history is kept.`
            : `${customer.name} will be removed from the demo data. This can't be undone (except by resetting the demo).`
        }
        confirmLabel={hasLinks ? 'Mark as inactive' : 'Delete customer'}
        tone={hasLinks ? 'primary' : 'danger'}
        onConfirm={() => {
          if (hasLinks) {
            actions.saveCustomer({ ...customer, status: 'inactive' });
            toast(`${customer.name} marked as inactive`);
          } else {
            actions.deleteCustomer(customer.id);
            toast('Customer deleted');
            navigate('/customers');
          }
        }}
      />
    </>
  );
}
