import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, FilePlus2, FileText, ShoppingCart, CircleCheck, Trash2 } from 'lucide-react';
import { useStore, useLookups } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { PageHeader, SearchInput, StatusBadge, Segmented, StatCard, Modal, Field, ConfirmDialog, ClearButton } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import LineItemsEditor, { newLine, validateLines, cleanLines } from '../components/forms/LineItemsEditor.jsx';
import { useToast } from '../components/Toast.jsx';
import { useForm } from '../utils/useForm.js';
import { required } from '../utils/validation.js';
import { orderTotal, lineTotal, invoiceStatus } from '../utils/calc.js';
import { formatDate, todayISO, rangeBounds, inRange } from '../utils/date.js';
import { ORDER_STATUSES } from '../data/modules.js';

function OrderForm({ open, onClose, order }) {
  const { customers, actions, money } = useStore();
  const toast = useToast();
  const [itemsError, setItemsError] = useState(null);
  const blank = { customerId: '', date: todayISO(), status: 'quotation', items: [newLine()], notes: '' };
  const form = useForm(blank, { customerId: [required('Choose a customer')], date: [required('Choose a date')] });

  useEffect(() => {
    if (open) {
      form.reset(order ? { ...order, items: order.items.map((i) => ({ ...i })) } : blank);
      setItemsError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = () => {
    const err = validateLines(form.values.items);
    setItemsError(err);
    form.submit((v) => {
      if (err) return;
      actions.saveOrder({ ...(order || {}), ...v, items: cleanLines(v.items) });
      toast(order ? 'Order updated' : v.status === 'quotation' ? 'Quotation created' : 'Order created');
      onClose();
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="wide"
      title={order ? `Edit ${order.number}` : 'New order or quotation'}
      onSubmit={save}
      footer={
        <>
          <span className="spacer muted small">Total {money(cleanLines(form.values.items).reduce((s, i) => s + lineTotal(i), 0))}</span>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary">{order ? 'Save changes' : 'Create'}</button>
        </>
      }
    >
      <div className="stack">
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <Field label="Customer" error={form.errors.customerId}>
            {(id) => (
              <select id={id} {...form.bind('customerId', 'select')}>
                <option value="">Select…</option>
                {[...customers].sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </Field>
          <Field label="Date" error={form.errors.date}>{(id) => <input id={id} type="date" {...form.bind('date')} />}</Field>
          <Field label="Status">
            {(id) => (
              <select id={id} {...form.bind('status', 'select')}>
                {ORDER_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            )}
          </Field>
        </div>
        <LineItemsEditor items={form.values.items} onChange={(items) => { form.setValue('items', items); setItemsError(null); }} money={money} error={itemsError} />
      </div>
    </Modal>
  );
}

function OrderDetail({ order, onClose, onEdit }) {
  const { money, actions, invoices } = useStore();
  const { customerById } = useLookups();
  const access = useAccess();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!order) return null;
  const invoice = invoices.find((i) => i.id === order.invoiceId);
  const canEdit = access.canEdit('sales');

  return (
    <>
      <Modal
        open
        onClose={onClose}
        size="wide"
        title={<span className="row" style={{ gap: 10 }}>{order.number} <StatusBadge kind="order" status={order.status} /></span>}
        description={`${customerById[order.customerId]?.name ?? 'Unknown customer'} · ${formatDate(order.date)}`}
        footer={
          <>
            {canEdit && !invoice && (
              <button type="button" className="btn icon" onClick={() => setConfirmDelete(true)} aria-label="Delete order" title="Delete order"><Trash2 size={16} /></button>
            )}
            <span className="spacer" />
            {canEdit && <button type="button" className="btn" onClick={onEdit}>Edit</button>}
            {invoice ? (
              <Link className="btn primary" to={`/invoices/${invoice.id}`}><FileText size={16} /> View {invoice.number}</Link>
            ) : (
              access.canEdit('invoices') && order.status !== 'cancelled' && (
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    const invoiceId = actions.createInvoiceFromOrder(order.id);
                    toast('Invoice created from order');
                    navigate(`/invoices/${invoiceId}`);
                  }}
                >
                  <FilePlus2 size={16} /> Create invoice
                </button>
              )
            )}
          </>
        }
      >
        <div className="stack">
          {canEdit && (
            <div className="row wrap" style={{ gap: 8 }}>
              <span className="small muted">Status:</span>
              <Segmented
                label="Order status"
                value={order.status}
                onChange={(s) => { actions.setOrderStatus(order.id, s); toast(`Order marked ${s}`); }}
                options={ORDER_STATUSES}
              />
            </div>
          )}
          <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <table className="table">
              <thead><tr><th>Item</th><th className="num">Qty</th><th className="num">Price</th><th className="num">Amount</th></tr></thead>
              <tbody>
                {order.items.map((it) => (
                  <tr key={it.id}><td>{it.description}</td><td className="num">{it.qty}</td><td className="num">{money(it.price)}</td><td className="num">{money(lineTotal(it))}</td></tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan={3}>Total (before tax)</td><td className="num">{money(orderTotal(order))}</td></tr></tfoot>
            </table>
          </div>
          {invoice && (
            <div className="alert info small">
              <CircleCheck size={16} />
              <span className="grow">Invoiced as {invoice.number} — <StatusBadge kind="invoice" status={invoiceStatus(invoice)} /></span>
            </div>
          )}
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete order?"
        message={`${order.number} will be removed from the demo data.`}
        confirmLabel="Delete order"
        onConfirm={() => { actions.deleteOrder(order.id); toast('Order deleted'); onClose(); }}
      />
    </>
  );
}

export default function Sales() {
  const { orders, money } = useStore();
  const { customerById } = useLookups();
  const access = useAccess();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openId = params.get('open');
  const openOrder = orders.find((o) => o.id === openId);
  const setOpen = (id) => {
    const next = new URLSearchParams(params);
    if (id) next.set('open', id);
    else next.delete('open');
    setParams(next, { replace: true });
  };

  const enriched = useMemo(
    () => orders.map((o) => ({ ...o, total: orderTotal(o), customerName: customerById[o.customerId]?.name ?? 'Unknown' })),
    [orders, customerById],
  );

  const month = rangeBounds('month');
  const summary = {
    quotations: enriched.filter((o) => o.status === 'quotation'),
    confirmed: enriched.filter((o) => o.status === 'confirmed'),
    monthSales: enriched.filter((o) => o.status !== 'cancelled' && o.status !== 'quotation' && inRange(o.date, month)),
  };
  const sum = (list) => list.reduce((s, o) => s + o.total, 0);

  const rows = enriched
    .filter((o) => status === 'all' || o.status === status)
    .filter((o) => !q.trim() || `${o.number} ${o.customerName}`.toLowerCase().includes(q.trim().toLowerCase()));

  const columns = [
    { key: 'number', header: 'Order', render: (o) => <span className="strong">{o.number}</span> },
    { key: 'customerName', header: 'Customer' },
    { key: 'date', header: 'Date', render: (o) => <span className="nowrap">{formatDate(o.date)}</span> },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge kind="order" status={o.status} /> },
    { key: 'invoiceId', header: 'Invoice', sortValue: (o) => (o.invoiceId ? 1 : 0), render: (o) => (o.invoiceId ? <span className="badge success plain">Invoiced</span> : <span className="faint">—</span>) },
    { key: 'total', header: 'Total', align: 'right', render: (o) => money(o.total) },
  ];

  return (
    <>
      <PageHeader
        title="Sales"
        description="Quotations, orders and their status. Turn any order into an invoice in one step."
        actions={access.canEdit('sales') && (
          <button className="btn primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={16} /> New order</button>
        )}
      />
      <div className="stack">
        <div className="grid grid-3">
          <StatCard icon={ShoppingCart} label="Sales this month" value={money(sum(summary.monthSales))} meta={<span>{summary.monthSales.length} confirmed or fulfilled orders</span>} />
          <StatCard icon={FileText} label="Open quotations" value={money(sum(summary.quotations))} meta={<span>{summary.quotations.length} awaiting customer decision</span>} />
          <StatCard icon={CircleCheck} label="Confirmed, not fulfilled" value={money(sum(summary.confirmed))} meta={<span>{summary.confirmed.length} orders</span>} />
        </div>
        <div className="card">
          <div className="toolbar">
            <SearchInput className="search" value={q} onChange={setQ} placeholder="Search order number or customer" />
            <Segmented
              label="Order status"
              value={status}
              onChange={setStatus}
              options={[{ id: 'all', label: 'All', count: orders.length }, ...ORDER_STATUSES.map((s) => ({ ...s, count: orders.filter((o) => o.status === s.id).length }))]}
            />
            {(q || status !== 'all') && <ClearButton onClick={() => { setQ(''); setStatus('all'); }} />}
          </div>
          <DataTable columns={columns} rows={rows} initialSort={{ key: 'date', dir: 'desc' }} onRowClick={(o) => setOpen(o.id)} />
        </div>
      </div>

      <OrderForm open={formOpen} onClose={() => setFormOpen(false)} order={editing} />
      {openOrder && !formOpen && (
        <OrderDetail
          order={openOrder}
          onClose={() => setOpen(null)}
          onEdit={() => { setEditing(openOrder); setFormOpen(true); setOpen(null); }}
        />
      )}
    </>
  );
}
