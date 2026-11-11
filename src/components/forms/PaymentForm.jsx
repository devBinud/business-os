import { useEffect } from 'react';
import { Info } from 'lucide-react';
import { Modal, Field } from '../ui.jsx';
import { useForm } from '../../utils/useForm.js';
import { required } from '../../utils/validation.js';
import { PAYMENT_METHODS } from '../../data/modules.js';
import { useStore } from '../../store/DemoStore.jsx';
import { useToast } from '../Toast.jsx';
import { invoiceTotals } from '../../utils/calc.js';
import { todayISO } from '../../utils/date.js';

export default function PaymentForm({ open, onClose, invoice }) {
  const { actions, money } = useStore();
  const toast = useToast();
  const balance = invoice ? invoiceTotals(invoice).balance : 0;
  const form = useForm(
    { amount: '', date: todayISO(), method: 'Bank transfer', note: '' },
    {
      amount: [
        [(v) => Number(v) > 0, 'Enter an amount greater than 0'],
        [(v) => Number(v) <= balance + 0.001, `Amount can't exceed the balance of ${money(balance)}`],
      ],
      date: [required('Choose the payment date'), [(v) => v <= todayISO(), "Payment date can't be in the future"]],
    },
  );

  useEffect(() => {
    if (open) form.reset({ amount: balance.toFixed(2), date: todayISO(), method: 'Bank transfer', note: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!invoice) return null;
  const amount = Number(form.values.amount) || 0;
  const partial = amount > 0 && amount < balance - 0.001;

  const save = () =>
    form.submit((v) => {
      actions.recordPayment(invoice.id, { amount: Number(v.amount), date: v.date, method: v.method, note: v.note.trim() });
      toast(partial ? `Partial payment of ${money(v.amount)} recorded` : `${invoice.number} is now fully paid`);
      onClose();
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record payment"
      description={`${invoice.number} · Balance due ${money(balance)}`}
      size="narrow"
      onSubmit={save}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary">{partial ? 'Record partial payment' : 'Record payment'}</button>
        </>
      }
    >
      <div className="stack" style={{ '--gap': '14px' }}>
        <Field label="Amount" error={form.errors.amount} hint={partial ? `${money(balance - amount)} will remain outstanding.` : 'Full balance.'}>
          {(id) => <input id={id} type="number" step="0.01" min="0" {...form.bind('amount')} />}
        </Field>
        <div className="row wrap" style={{ gap: 6 }}>
          {[0.25, 0.5, 1].map((f) => (
            <button key={f} type="button" className="btn sm" onClick={() => form.setValue('amount', (balance * f).toFixed(2))}>
              {f === 1 ? 'Full balance' : `${f * 100}%`}
            </button>
          ))}
        </div>
        <div className="form-grid">
          <Field label="Payment date" error={form.errors.date}>
            {(id) => <input id={id} type="date" max={todayISO()} {...form.bind('date')} />}
          </Field>
          <Field label="Method">
            {(id) => (
              <select id={id} {...form.bind('method', 'select')}>
                {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            )}
          </Field>
        </div>
        <Field label="Reference / note">{(id) => <input id={id} {...form.bind('note')} placeholder="Optional" />}</Field>
        <div className="alert info small">
          <Info size={16} />
          <span className="grow">Demo only — this records a sample payment. No payment gateway or bank is contacted.</span>
        </div>
      </div>
    </Modal>
  );
}
