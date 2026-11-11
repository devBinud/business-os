import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CircleDollarSign, Pencil, Printer, Trash2, CircleCheck, Info, ShoppingCart } from 'lucide-react';
import { useStore, useLookups } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { PageHeader, Card, StatusBadge, ConfirmDialog, ProgressBar } from '../components/ui.jsx';
import PaymentForm from '../components/forms/PaymentForm.jsx';
import { useToast } from '../components/Toast.jsx';
import { invoiceStatus, invoiceTotals, lineTotal, daysOverdue } from '../utils/calc.js';
import { formatDate, todayISO } from '../utils/date.js';
import { initials } from '../utils/format.js';
import NotFound from './NotFound.jsx';

export default function InvoiceDetail() {
  const { id } = useParams();
  const { invoices, orders, business, money, actions } = useStore();
  const { customerById, employeeById } = useLookups();
  const access = useAccess();
  const navigate = useNavigate();
  const toast = useToast();
  const [payOpen, setPayOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'paid' | 'delete'

  const invoice = invoices.find((i) => i.id === id);
  if (!invoice) return <NotFound title="Invoice not found" text="This invoice may have been deleted." />;

  const today = todayISO();
  const t = invoiceTotals(invoice);
  const status = invoiceStatus(invoice, today);
  const customer = customerById[invoice.customerId];
  const order = orders.find((o) => o.id === invoice.orderId);
  const canEdit = access.canEdit('invoices');

  return (
    <>
      <PageHeader
        breadcrumb={<Link to="/invoices" className="breadcrumb no-print"><ArrowLeft size={14} /> Invoices</Link>}
        title={<span className="row" style={{ gap: 12 }}>{invoice.number} <StatusBadge kind="invoice" status={status} /></span>}
        description={
          status === 'overdue'
            ? `${money(t.balance)} overdue by ${daysOverdue(invoice, today)} days`
            : status === 'paid'
              ? 'Paid in full'
              : `${money(t.balance)} due ${formatDate(invoice.dueDate)}`
        }
        actions={
          <span className="row wrap no-print">
            {canEdit && t.balance > 0 && (
              <>
                <button className="btn primary" onClick={() => setPayOpen(true)}><CircleDollarSign size={16} /> Record payment</button>
                <button className="btn" onClick={() => setConfirm('paid')}><CircleCheck size={16} /> Mark as paid</button>
              </>
            )}
            {canEdit && <Link className="btn" to={`/invoices/${invoice.id}/edit`}><Pencil size={16} /> Edit</Link>}
            <button className="btn icon" onClick={() => window.print()} aria-label="Print invoice" title="Print"><Printer size={16} /></button>
            {canEdit && (
              <button className="btn icon" onClick={() => setConfirm('delete')} aria-label="Delete invoice" title="Delete"><Trash2 size={16} /></button>
            )}
          </span>
        }
      />

      <div className="grid grid-main-side" style={{ alignItems: 'start' }}>
        <section className="card invoice-doc">
          <div className="head">
            <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
              <span className="brand-mark" style={{ background: business.logoColor, width: 44, height: 44, fontSize: 15 }}>{initials(business.name)}</span>
              <div>
                <div className="strong">{business.name}</div>
                <div className="small muted">{business.address}</div>
                <div className="small muted">{business.email} · {business.phone}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2>Invoice</h2>
              <div className="muted">{invoice.number}</div>
            </div>
          </div>

          <div className="grid grid-3" style={{ marginBottom: 24 }}>
            <div>
              <div className="small muted">Bill to</div>
              {customer ? <Link to={`/customers/${customer.id}`} className="strong">{customer.name}</Link> : <span>Unknown customer</span>}
              <div className="small muted">{customer?.email}</div>
              <div className="small muted">{customer?.phone}</div>
            </div>
            <div>
              <div className="small muted">Issue date</div>
              <div>{formatDate(invoice.issueDate)}</div>
            </div>
            <div>
              <div className="small muted">Due date</div>
              <div className={status === 'overdue' ? 'text-danger strong' : ''}>{formatDate(invoice.dueDate)}</div>
            </div>
          </div>

          <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <table className="table">
              <thead>
                <tr><th>Description</th><th className="num">Qty</th><th className="num">Unit price</th><th className="num">Amount</th></tr>
              </thead>
              <tbody>
                {invoice.items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.description}</td>
                    <td className="num">{it.qty}</td>
                    <td className="num">{money(it.price)}</td>
                    <td className="num">{money(lineTotal(it))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="totals">
            <div className="row"><span className="muted">Subtotal</span><span>{money(t.subtotal)}</span></div>
            <div className="row"><span className="muted">Tax ({invoice.taxRate}%)</span><span>{money(t.tax)}</span></div>
            <div className="row grand"><span>Total</span><span>{money(t.total)}</span></div>
            <div className="row"><span className="muted">Paid</span><span>− {money(t.paid)}</span></div>
            <div className="row grand"><span>Balance due</span><span className={t.balance > 0 ? '' : 'text-success'}>{money(t.balance)}</span></div>
          </div>

          {invoice.notes && (
            <div style={{ marginTop: 24 }}>
              <div className="small muted">Notes</div>
              <p>{invoice.notes}</p>
            </div>
          )}
        </section>

        <div className="stack no-print">
          <Card title="Payment progress">
            <div className="stack" style={{ '--gap': '10px' }}>
              <ProgressBar value={t.total ? t.paid / t.total : 0} />
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="small muted">{money(t.paid)} paid</span>
                <span className="small muted">{money(t.total)} total</span>
              </div>
            </div>
          </Card>

          <Card title="Payments" subtitle={`${invoice.payments.length} recorded`} flush>
            {invoice.payments.length === 0 ? (
              <div className="small muted" style={{ padding: '0 20px 20px' }}>No payments recorded yet.</div>
            ) : (
              <ul className="list">
                {[...invoice.payments].sort((a, b) => b.date.localeCompare(a.date)).map((p) => (
                  <li key={p.id} className="list-item">
                    <span className="feed-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}><CircleDollarSign size={15} /></span>
                    <span className="grow">
                      <div className="strong">{money(p.amount)}</div>
                      <div className="sub">{formatDate(p.date)} · {p.method}{p.note ? ` · ${p.note}` : ''}</div>
                      {p.recordedBy && <div className="sub">Recorded by {employeeById[p.recordedBy]?.name}</div>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {order && (
            <Card title="Linked order">
              <Link to={`/sales?open=${order.id}`} className="row" style={{ gap: 8 }}>
                <ShoppingCart size={16} /> {order.number}
              </Link>
            </Card>
          )}

          <div className="alert info small">
            <Info size={16} />
            <span className="grow">Sample invoice. Payments are simulated and no payment gateway is connected.</span>
          </div>
        </div>
      </div>

      <PaymentForm open={payOpen} onClose={() => setPayOpen(false)} invoice={invoice} />
      <ConfirmDialog
        open={confirm === 'paid'}
        onClose={() => setConfirm(null)}
        title="Mark invoice as paid?"
        message={`This records a payment of ${money(t.balance)} dated today for ${invoice.number}.`}
        confirmLabel="Mark as paid"
        tone="primary"
        onConfirm={() => {
          actions.recordPayment(invoice.id, { amount: t.balance, date: today, method: 'Bank transfer', note: 'Marked as paid' });
          toast(`${invoice.number} marked as paid`);
        }}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        title="Delete invoice?"
        message={
          invoice.payments.length
            ? `${invoice.number} has ${invoice.payments.length} recorded payment(s). Deleting it removes them from all reports.`
            : `${invoice.number} will be permanently removed from the demo data.`
        }
        confirmLabel="Delete invoice"
        onConfirm={() => {
          actions.deleteInvoice(invoice.id);
          toast('Invoice deleted');
          navigate('/invoices');
        }}
      />
    </>
  );
}
