import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, TriangleAlert } from 'lucide-react';
import { useStore } from '../store/DemoStore.jsx';
import { PageHeader, Card, Field } from '../components/ui.jsx';
import LineItemsEditor, { newLine, validateLines, cleanLines } from '../components/forms/LineItemsEditor.jsx';
import CustomerForm from '../components/forms/CustomerForm.jsx';
import { useToast } from '../components/Toast.jsx';
import { useForm } from '../utils/useForm.js';
import { required } from '../utils/validation.js';
import { addDays, diffDays, todayISO } from '../utils/date.js';
import { invoiceTotals } from '../utils/calc.js';
import NotFound from './NotFound.jsx';

const TERMS = [
  { days: 0, label: 'Due on receipt' },
  { days: 7, label: 'Net 7' },
  { days: 14, label: 'Net 14' },
  { days: 30, label: 'Net 30' },
];

export default function InvoiceEditor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { invoices, customers, business, actions, money } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const existing = id ? invoices.find((i) => i.id === id) : null;
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [itemsError, setItemsError] = useState(null);

  const form = useForm(
    existing
      ? { ...existing, items: existing.items.map((i) => ({ ...i })) }
      : {
          customerId: params.get('customer') || '',
          issueDate: todayISO(),
          dueDate: addDays(todayISO(), 14),
          taxRate: business.taxRate,
          items: [newLine()],
          notes: '',
        },
    {
      customerId: [required('Choose a customer')],
      issueDate: [required('Choose an issue date')],
      dueDate: [required('Choose a due date'), [(v, all) => v >= all.issueDate, "Due date can't be before the issue date"]],
      taxRate: [[(v) => v !== '' && Number(v) >= 0 && Number(v) <= 100, 'Enter a tax rate between 0 and 100']],
    },
  );
  const v = form.values;

  const totals = useMemo(
    () => invoiceTotals({ items: cleanLines(v.items), taxRate: v.taxRate, payments: existing?.payments ?? [] }),
    [v.items, v.taxRate, existing],
  );

  if (id && !existing) return <NotFound title="Invoice not found" />;

  const activeCustomers = customers
    .filter((c) => c.status !== 'inactive' || c.id === v.customerId)
    .sort((a, b) => a.name.localeCompare(b.name));
  const termDays = diffDays(v.dueDate, v.issueDate);

  const save = () => {
    const lineError = validateLines(v.items);
    setItemsError(lineError);
    form.submit((values) => {
      if (lineError) return;
      const record = {
        ...(existing || {}),
        customerId: values.customerId,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        taxRate: Number(values.taxRate),
        items: cleanLines(values.items),
        notes: values.notes.trim(),
      };
      const savedId = actions.saveInvoice(record);
      toast(existing ? 'Invoice updated' : 'Invoice created');
      navigate(`/invoices/${savedId}`);
    });
  };

  return (
    <>
      <PageHeader
        breadcrumb={<Link to={existing ? `/invoices/${existing.id}` : '/invoices'} className="breadcrumb"><ArrowLeft size={14} /> {existing ? existing.number : 'Invoices'}</Link>}
        title={existing ? `Edit ${existing.number}` : 'Create invoice'}
        description="Sample invoice — no real billing or payment collection takes place."
      />
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="grid grid-main-side"
        style={{ alignItems: 'start' }}
      >
        <div className="stack">
          <Card title="Details">
            <div className="form-grid">
              <Field label="Customer" error={form.errors.customerId} className="full">
                {(fid) => (
                  <div className="row" style={{ gap: 8 }}>
                    <select id={fid} {...form.bind('customerId', 'select')}>
                      <option value="">Select a customer…</option>
                      {activeCustomers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button type="button" className="btn" onClick={() => setCustomerFormOpen(true)} title="Add a new customer">
                      <UserPlus size={16} /> <span className="desktop-only">New</span>
                    </button>
                  </div>
                )}
              </Field>
              <Field label="Issue date" error={form.errors.issueDate}>
                {(fid) => <input id={fid} type="date" {...form.bind('issueDate')} />}
              </Field>
              <Field label="Payment terms">
                {(fid) => (
                  <select
                    id={fid}
                    className="select"
                    value={TERMS.some((t) => t.days === termDays) ? termDays : 'custom'}
                    onChange={(e) => e.target.value !== 'custom' && form.setValue('dueDate', addDays(v.issueDate, Number(e.target.value)))}
                  >
                    {TERMS.map((t) => <option key={t.days} value={t.days}>{t.label}</option>)}
                    <option value="custom" disabled>Custom</option>
                  </select>
                )}
              </Field>
              <Field label="Due date" error={form.errors.dueDate}>
                {(fid) => <input id={fid} type="date" min={v.issueDate} {...form.bind('dueDate')} />}
              </Field>
              <Field label="Tax rate (%)" error={form.errors.taxRate}>
                {(fid) => <input id={fid} type="number" min="0" max="100" step="0.5" {...form.bind('taxRate')} />}
              </Field>
            </div>
          </Card>

          <Card title="Line items" subtitle="Pick a common item or type your own">
            <LineItemsEditor items={v.items} onChange={(items) => { form.setValue('items', items); setItemsError(null); }} money={money} error={itemsError} />
          </Card>

          <Card title="Notes">
            <textarea className="textarea" value={v.notes} onChange={form.set('notes')} placeholder="Payment instructions, thank-you note or reference (optional)" aria-label="Notes" />
          </Card>
        </div>

        <div className="stack" style={{ position: 'sticky', top: 84 }}>
          <Card title="Summary">
            <div className="stack" style={{ '--gap': '8px' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Subtotal</span><span>{money(totals.subtotal)}</span></div>
              <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Tax ({Number(v.taxRate) || 0}%)</span><span>{money(totals.tax)}</span></div>
              <div className="row" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <strong>Total</strong><strong style={{ fontSize: 18 }}>{money(totals.total)}</strong>
              </div>
              {existing?.payments.length > 0 && (
                <>
                  <div className="row" style={{ justifyContent: 'space-between' }}><span className="muted">Already paid</span><span>{money(totals.paid)}</span></div>
                  {totals.paid > totals.total && (
                    <div className="alert warning small"><TriangleAlert size={16} /><span className="grow">The new total is lower than the payments already recorded.</span></div>
                  )}
                </>
              )}
            </div>
            <div className="stack" style={{ '--gap': '8px', marginTop: 16 }}>
              <button type="submit" className="btn primary block">{existing ? 'Save changes' : 'Create invoice'}</button>
              <button type="button" className="btn block" onClick={() => navigate(-1)}>Cancel</button>
            </div>
          </Card>
        </div>
      </form>

      <CustomerForm
        open={customerFormOpen}
        onClose={() => setCustomerFormOpen(false)}
        onSaved={(cid) => form.setValue('customerId', cid)}
      />
    </>
  );
}
