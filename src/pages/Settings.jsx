import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Minus, RotateCcw, Info } from 'lucide-react';
import { useStore } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { PageHeader, Card, Field, Switch, Person, ConfirmDialog, StatusBadge } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';
import { useForm } from '../utils/useForm.js';
import { required, optionalEmail } from '../utils/validation.js';
import { CURRENCIES, initials } from '../utils/format.js';
import { INDUSTRIES, MODULES, OPTIONAL_MODULES } from '../data/modules.js';
import { ROLES, ROLE_LIST, accessSummary } from '../utils/permissions.js';
import { LOGO_COLORS } from './Setup.jsx';

const TABS = [
  { id: 'profile', label: 'Business profile' },
  { id: 'users', label: 'Users & roles' },
  { id: 'modules', label: 'Modules' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'demo', label: 'Demo data' },
];

function ProfileTab() {
  const { business, actions } = useStore();
  const toast = useToast();
  const form = useForm({ ...business }, {
    name: [required('Enter your business name')],
    email: [optionalEmail()],
    taxRate: [[(v) => v !== '' && Number(v) >= 0 && Number(v) <= 100, 'Enter a rate between 0 and 100']],
  });
  const v = form.values;
  const dirty = ['name', 'industry', 'email', 'phone', 'address', 'currency', 'taxRate', 'logoColor'].some((k) => String(v[k]) !== String(business[k]));

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        form.submit((vals) => {
          actions.updateBusiness({
            name: vals.name.trim(), industry: vals.industry, email: vals.email, phone: vals.phone, address: vals.address,
            currency: vals.currency, taxRate: Number(vals.taxRate), logoColor: vals.logoColor,
          }, 'Business profile updated');
          toast('Business profile saved');
        });
      }}
    >
      <Card
        title="Business profile"
        subtitle="Shown on invoices and across the workspace."
        actions={<button type="submit" className="btn primary sm" disabled={!dirty}>Save changes</button>}
      >
        <div className="stack" style={{ '--gap': '20px' }}>
          <div className="row wrap" style={{ gap: 16 }}>
            <div className="logo-drop" style={{ background: v.logoColor, width: 64, height: 64, fontSize: 20 }}>{initials(v.name) || '?'}</div>
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Logo placeholder</div>
              <div className="swatches">
                {LOGO_COLORS.map((c) => (
                  <button key={c} type="button" className={`swatch ${v.logoColor === c ? 'on' : ''}`} style={{ background: c }} onClick={() => form.setValue('logoColor', c)} aria-label={`Use colour ${c}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="form-grid">
            <Field label="Business name" error={form.errors.name}>{(id) => <input id={id} {...form.bind('name')} />}</Field>
            <Field label="Industry">
              {(id) => <select id={id} {...form.bind('industry', 'select')}>{INDUSTRIES.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}</select>}
            </Field>
            <Field label="Email" error={form.errors.email}>{(id) => <input id={id} type="email" {...form.bind('email')} />}</Field>
            <Field label="Phone">{(id) => <input id={id} type="tel" {...form.bind('phone')} />}</Field>
            <Field label="Address" className="full">{(id) => <input id={id} {...form.bind('address')} />}</Field>
            <Field label="Currency">
              {(id) => <select id={id} {...form.bind('currency', 'select')}>{CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</select>}
            </Field>
            <Field label="Default tax rate (%)" error={form.errors.taxRate} hint="Applied to new invoices.">
              {(id) => <input id={id} type="number" min="0" max="100" step="0.5" {...form.bind('taxRate')} />}
            </Field>
          </div>
        </div>
      </Card>
    </form>
  );
}

function UsersTab() {
  const { employees, actions, role, currentUser } = useStore();
  const toast = useToast();
  const canChange = role === 'owner';
  const active = employees.filter((e) => e.status !== 'inactive').sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="stack">
      <Card title="Users" subtitle={`${active.length} people can sign in to this workspace`} flush>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Person</th><th>Department</th><th>Status</th><th style={{ width: 200 }}>Access role</th></tr></thead>
            <tbody>
              {active.map((e) => (
                <tr key={e.id}>
                  <td><Person name={e.name} sub={e.email} /></td>
                  <td className="muted">{e.department}</td>
                  <td><StatusBadge kind="employee" status={e.status} /></td>
                  <td>
                    <select
                      className="select sm"
                      value={e.appRole}
                      disabled={!canChange || e.id === currentUser?.id}
                      onChange={(ev) => {
                        actions.saveEmployee({ ...e, appRole: ev.target.value });
                        toast(`${e.name} is now ${ROLES[ev.target.value].label}`);
                      }}
                      aria-label={`Access role for ${e.name}`}
                    >
                      {ROLE_LIST.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Role permissions" subtitle="What each role can view (•) or create and edit (✓)." flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Module</th>{ROLE_LIST.map((r) => <th key={r.id} style={{ textAlign: 'center' }}>{r.label}</th>)}</tr>
            </thead>
            <tbody>
              {MODULES.map((m) => (
                <tr key={m.id}>
                  <td><span className="row" style={{ gap: 8 }}><m.icon size={15} className="faint" /> {m.label}</span></td>
                  {ROLE_LIST.map((r) => {
                    const level = accessSummary(r.id)[m.id];
                    return (
                      <td key={r.id} style={{ textAlign: 'center' }}>
                        {level === 'edit' ? <Check size={16} className="text-success" aria-label="Create and edit" />
                          : level === 'view' ? <span className="muted" aria-label="View only">•</span>
                          : <Minus size={16} className="faint" aria-label="No access" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ModulesTab() {
  const { business, actions } = useStore();
  const toast = useToast();
  const toggle = (id, on) => {
    const next = on ? [...business.enabledModules, id] : business.enabledModules.filter((m) => m !== id);
    actions.updateBusiness({ enabledModules: next }, `Module ${on ? 'enabled' : 'disabled'}: ${MODULES.find((m) => m.id === id).label}`);
    toast(`${MODULES.find((m) => m.id === id).label} ${on ? 'turned on' : 'turned off'}`);
  };
  return (
    <Card title="Modules" subtitle="Show only the parts of Business OS your business uses. Data is kept when a module is turned off." flush>
      <ul className="list">
        {MODULES.filter((m) => m.core).map((m) => (
          <li key={m.id} className="list-item" style={{ alignItems: 'center' }}>
            <span className="feed-icon"><m.icon size={15} /></span>
            <span className="grow"><div className="title">{m.label}</div><div className="sub">{m.description}</div></span>
            <span className="small muted">Always on</span>
          </li>
        ))}
        {OPTIONAL_MODULES.map((m) => {
          const on = business.enabledModules.includes(m.id);
          return (
            <li key={m.id} className="list-item" style={{ alignItems: 'center' }}>
              <span className="feed-icon"><m.icon size={15} /></span>
              <span className="grow"><div className="title">{m.label}</div><div className="sub">{m.description}</div></span>
              <Switch checked={on} onChange={(v) => toggle(m.id, v)} label={`${m.label} module`} />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

const NOTIFICATION_OPTIONS = [
  { id: 'overdueInvoices', label: 'Overdue payments', text: 'Alert when an invoice passes its due date.' },
  { id: 'lowStock', label: 'Low stock', text: 'Alert when a product reaches its low-stock threshold.' },
  { id: 'pendingApprovals', label: 'Pending approvals', text: 'Alert approvers about expenses waiting for review.' },
  { id: 'taskDeadlines', label: 'Task deadlines', text: 'Remind people about tasks due today or past due.' },
  { id: 'newBookings', label: 'Bookings to confirm', text: 'Alert when bookings are waiting for confirmation.' },
  { id: 'emailDigest', label: 'Daily email digest', text: 'Send a morning summary by email (not available in the demo).', disabled: true },
];

function NotificationsTab() {
  const { business, actions } = useStore();
  const prefs = business.notificationPrefs;
  return (
    <Card title="Notification preferences" subtitle="Controls what appears in the notification bell and dashboard alerts." flush>
      <ul className="list">
        {NOTIFICATION_OPTIONS.map((o) => (
          <li key={o.id} className="list-item" style={{ alignItems: 'center' }}>
            <span className="grow"><div className="title">{o.label}</div><div className="sub">{o.text}</div></span>
            <Switch
              checked={Boolean(prefs[o.id])}
              disabled={o.disabled}
              label={o.label}
              onChange={(v) => actions.updateBusiness({ notificationPrefs: { ...prefs, [o.id]: v } }, `Notification preference changed: ${o.label}`)}
            />
          </li>
        ))}
      </ul>
      <div className="alert info small" style={{ margin: '0 20px 20px' }}>
        <Info size={16} />
        <span className="grow">The demo does not send real email, SMS, WhatsApp or push notifications.</span>
      </div>
    </Card>
  );
}

function DemoTab() {
  const { actions, seededOn } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  return (
    <Card title="Demo data" subtitle="Changes are saved in this browser only (localStorage) as a convenience for the demo.">
      <div className="stack">
        <p className="muted">
          Sample data was generated on {seededOn}. Resetting restores the original sample business, customers, invoices,
          tasks and bookings, with dates shifted relative to today.
        </p>
        <div className="row wrap">
          <button className="btn" onClick={() => setConfirm(true)}><RotateCcw size={16} /> Reset demo data</button>
          <Link className="btn ghost" to="/setup">Run business setup again</Link>
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Reset all demo data?"
        message="Every change you've made in this browser — customers, invoices, payments, tasks and settings — will be replaced with the original sample data."
        confirmLabel="Reset demo data"
        onConfirm={() => {
          actions.resetDemo();
          toast('Demo data reset');
          navigate('/dashboard');
        }}
      />
    </Card>
  );
}

export default function Settings() {
  const access = useAccess();
  const [tab, setTab] = useState('profile');
  const readOnly = !access.canEdit('settings');

  return (
    <>
      <PageHeader title="Settings" description="Business profile, users, roles, modules and preferences." />
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <fieldset disabled={readOnly} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0 }}>
        {tab === 'profile' && <ProfileTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'modules' && <ModulesTab />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'demo' && <DemoTab />}
      </fieldset>
    </>
  );
}
