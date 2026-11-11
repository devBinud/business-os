import { useEffect } from 'react';
import { Modal, Field } from '../ui.jsx';
import { useForm } from '../../utils/useForm.js';
import { required, email } from '../../utils/validation.js';
import { DEPARTMENTS } from '../../data/modules.js';
import { ROLE_LIST } from '../../utils/permissions.js';
import { useStore } from '../../store/DemoStore.jsx';
import { useToast } from '../Toast.jsx';
import { todayISO } from '../../utils/date.js';

const BLANK = { name: '', title: '', department: DEPARTMENTS[1], appRole: 'staff', email: '', phone: '', startDate: todayISO(), status: 'active' };

export default function EmployeeForm({ open, onClose, employee, onSaved }) {
  const { actions, employees, role } = useStore();
  const toast = useToast();
  const form = useForm(BLANK, {
    name: [required('Enter the employee name')],
    title: [required('Enter a job title')],
    email: [
      email(),
      [(v) => !employees.some((e) => e.id !== employee?.id && e.email.toLowerCase() === v.trim().toLowerCase()), 'Another employee already uses this email'],
    ],
  });

  useEffect(() => {
    if (open) form.reset(employee ? { ...BLANK, ...employee } : BLANK);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = () =>
    form.submit((v) => {
      actions.saveEmployee({ ...(employee || {}), ...v, name: v.name.trim(), email: v.email.trim() });
      toast(employee ? 'Employee updated' : `${v.name.trim()} added to the team`);
      onClose();
      onSaved?.();
    });

  // Only the owner can grant or change access roles.
  const canChangeRole = role === 'owner';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={employee ? 'Edit employee' : 'Add employee'}
      onSubmit={save}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary">{employee ? 'Save changes' : 'Add employee'}</button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Full name" error={form.errors.name}>{(id) => <input id={id} {...form.bind('name')} />}</Field>
        <Field label="Job title" error={form.errors.title}>{(id) => <input id={id} {...form.bind('title')} placeholder="e.g. Receptionist" />}</Field>
        <Field label="Department">
          {(id) => <select id={id} {...form.bind('department', 'select')}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select>}
        </Field>
        <Field label="Access role" hint={canChangeRole ? 'Controls what they can see in Business OS.' : 'Only the owner can change access roles.'}>
          {(id) => (
            <select id={id} {...form.bind('appRole', 'select')} disabled={!canChangeRole}>
              {ROLE_LIST.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          )}
        </Field>
        <Field label="Email" error={form.errors.email}>{(id) => <input id={id} type="email" {...form.bind('email')} />}</Field>
        <Field label="Phone">{(id) => <input id={id} type="tel" {...form.bind('phone')} />}</Field>
        <Field label="Start date">{(id) => <input id={id} type="date" {...form.bind('startDate')} />}</Field>
        <Field label="Status">
          {(id) => (
            <select id={id} {...form.bind('status', 'select')}>
              <option value="active">Active</option>
              <option value="on_leave">On leave</option>
              <option value="inactive">Inactive</option>
            </select>
          )}
        </Field>
      </div>
    </Modal>
  );
}
