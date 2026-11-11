import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Check, Eye, EyeOff, Info, LayoutDashboard } from 'lucide-react';
import { useStore } from '../store/DemoStore.jsx';
import { ROLE_LIST } from '../utils/permissions.js';
import { DEMO_USERS } from '../data/sampleData.js';
import { Field } from '../components/ui.jsx';
import { useForm } from '../utils/useForm.js';
import { email, required } from '../utils/validation.js';

export default function SignIn() {
  const { session, employees, setupComplete, actions } = useStore();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm(
    { email: 'maya@summitview.example', password: 'demo1234' },
    { email: [required('Enter your email'), email()], password: [required('Enter your password')] },
  );

  // After signing in, the owner goes through business setup once; everyone else lands where they were headed.
  if (session) {
    const target = session.role === 'owner' && !setupComplete ? '/setup' : location.state?.from || '/dashboard';
    return <Navigate to={target} replace />;
  }

  const enter = (roleId, userId) => actions.signIn(roleId, userId);

  const submit = () =>
    form.submit(({ email: address }) => {
      // Simulated authentication: a known staff email signs in as that person; anything else as the owner.
      const match = employees.find((e) => e.email.toLowerCase() === address.trim().toLowerCase());
      if (match) enter(match.appRole, match.id);
      else enter('owner', DEMO_USERS.owner);
    });

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <div className="row" style={{ gap: 10 }}>
          <span className="brand-mark" style={{ background: '#2f6b66' }}>
            <LayoutDashboard size={18} />
          </span>
          <strong style={{ color: '#fff', fontSize: 16 }}>Business OS</strong>
        </div>
        <div>
          <h2>Run your whole business from one organized workspace.</h2>
          <p>
            Customers, sales, invoices, expenses, employees, tasks, bookings, inventory and reports — together,
            with access based on each person's role.
          </p>
        </div>
        <ul>
          {[
            'One dashboard for revenue, payments, expenses and team activity',
            'Invoices and payments that update balances everywhere',
            'Role-based access for owners, managers, finance and staff',
            'Optional modules — use only what your business needs',
          ].map((t) => (
            <li key={t}>
              <Check size={16} /> {t}
            </li>
          ))}
        </ul>
      </aside>

      <main className="auth-main">
        <div className="auth-card stack" style={{ '--gap': '20px' }}>
          <div>
            <h1>Sign in</h1>
            <p className="muted" style={{ marginTop: 4 }}>Welcome back. Sign in to your business workspace.</p>
          </div>

          <div className="alert info" role="note">
            <Info size={16} />
            <div className="grow small">
              <strong>Demo environment.</strong> No real accounts exist — any password works. Use a sample staff
              email (e.g. <code>priya@summitview.example</code>) or pick a role below.
            </div>
          </div>

          <form
            className="stack"
            style={{ '--gap': '14px' }}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Field label="Email" error={form.errors.email}>
              {(id) => <input id={id} type="email" autoComplete="username" {...form.bind('email')} />}
            </Field>
            <Field label="Password" error={form.errors.password}>
              {(id) => (
                <div style={{ position: 'relative' }}>
                  <input
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...form.bind('password')}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ position: 'absolute', right: 1, top: 1, height: 36 }}
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              )}
            </Field>
            <button className="btn primary block" type="submit" style={{ height: 40 }}>
              Sign in
            </button>
          </form>

          <div className="divider">or explore the demo as</div>

          <div className="role-grid">
            {ROLE_LIST.map((r) => {
              const person = employees.find((e) => e.id === DEMO_USERS[r.id]);
              return (
                <button key={r.id} type="button" className="role-option" onClick={() => enter(r.id)}>
                  <span className="r">{r.label}</span>
                  <span className="d">{person?.name}</span>
                  <span className="d">{r.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
