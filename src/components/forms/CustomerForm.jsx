import { useEffect } from 'react';
import { Modal, Field } from '../ui.jsx';
import { useForm } from '../../utils/useForm.js';
import { required, optionalEmail } from '../../utils/validation.js';
import { CUSTOMER_STATUSES, CUSTOMER_TYPES } from '../../data/modules.js';
import { useStore } from '../../store/DemoStore.jsx';
import { useToast } from '../Toast.jsx';

const EMPTY = { name: '', type: 'Individual', email: '', phone: '', city: '', address: '', status: 'active', tagsText: '' };

export default function CustomerForm({ open, onClose, customer, onSaved }) {
  const { actions, customers } = useStore();
  const toast = useToast();
  const form = useForm(EMPTY, {
    name: [required('Enter the customer name')],
    email: [
      optionalEmail(),
      [
        (v, all) => !v || !customers.some((c) => c.id !== customer?.id && c.email.toLowerCase() === v.trim().toLowerCase()),
        'Another customer already uses this email',
      ],
    ],
    phone: [[(v, all) => Boolean(String(v).trim() || String(all.email).trim()), 'Add a phone number or email']],
  });

  useEffect(() => {
    if (open) form.reset(customer ? { ...EMPTY, ...customer, tagsText: (customer.tags || []).join(', ') } : EMPTY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer?.id]);

  const save = () =>
    form.submit(({ tagsText, ...values }) => {
      const tags = tagsText.split(',').map((t) => t.trim()).filter(Boolean);
      const record = {
        ...(customer || {}),
        ...values,
        name: values.name.trim(),
        email: values.email.trim(),
        tags,
      };
      const id = actions.saveCustomer(record);
      toast(customer ? 'Customer updated' : `${record.name} added to customers`);
      onClose();
      onSaved?.(id);
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={customer ? 'Edit customer' : 'Add customer'}
      description={customer ? undefined : 'Create a customer profile to track enquiries, invoices and bookings.'}
      onSubmit={save}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary">{customer ? 'Save changes' : 'Add customer'}</button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Name" error={form.errors.name} className="full">
          {(id) => <input id={id} {...form.bind('name')} placeholder="Person or company name" />}
        </Field>
        <Field label="Type">
          {(id) => (
            <select id={id} {...form.bind('type', 'select')}>
              {CUSTOMER_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          )}
        </Field>
        <Field label="Status">
          {(id) => (
            <select id={id} {...form.bind('status', 'select')}>
              {CUSTOMER_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          )}
        </Field>
        <Field label="Email" error={form.errors.email}>
          {(id) => <input id={id} type="email" {...form.bind('email')} placeholder="name@example.com" />}
        </Field>
        <Field label="Phone" error={form.errors.phone}>
          {(id) => <input id={id} type="tel" {...form.bind('phone')} />}
        </Field>
        <Field label="City">{(id) => <input id={id} {...form.bind('city')} />}</Field>
        <Field label="Tags" hint="Comma separated, e.g. Corporate, Priority">
          {(id) => <input id={id} {...form.bind('tagsText')} />}
        </Field>
        <Field label="Address" className="full">{(id) => <input id={id} {...form.bind('address')} />}</Field>
      </div>
    </Modal>
  );
}
