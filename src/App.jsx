import { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useStore } from './store/DemoStore.jsx';
import { useAccess } from './store/useAccess.js';
import { MODULE_BY_ID } from './data/modules.js';
import { ROLES } from './utils/permissions.js';
import AppShell from './layouts/AppShell.jsx';
import { EmptyState } from './components/ui.jsx';

import SignIn from './pages/SignIn.jsx';
import Setup from './pages/Setup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Customers from './pages/Customers.jsx';
import CustomerDetail from './pages/CustomerDetail.jsx';
import Sales from './pages/Sales.jsx';
import Invoices from './pages/Invoices.jsx';
import InvoiceDetail from './pages/InvoiceDetail.jsx';
import InvoiceEditor from './pages/InvoiceEditor.jsx';
import Expenses from './pages/Expenses.jsx';
import Employees from './pages/Employees.jsx';
import EmployeeDetail from './pages/EmployeeDetail.jsx';
import Tasks from './pages/Tasks.jsx';
import Bookings from './pages/Bookings.jsx';
import Inventory from './pages/Inventory.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';

function RequireAuth({ children }) {
  const { session } = useStore();
  const location = useLocation();
  if (!session) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  return children;
}

/** Shows a clear access state instead of the page when the role or module settings don't allow it. */
function Guard({ module, edit = false, children }) {
  const access = useAccess();
  const mod = MODULE_BY_ID[module];
  const allowed = edit ? access.canEdit(module) : access.canView(module);
  if (allowed) return children;

  const disabled = !access.enabled(module);
  return (
    <div className="card" style={{ marginTop: 24 }}>
      <EmptyState
        icon={Lock}
        title={disabled ? `${mod.label} is turned off for this business` : `${ROLES[access.role].label} access doesn't include ${mod.label}`}
        action={<Link className="btn" to="/dashboard">Go to dashboard</Link>}
      >
        {disabled
          ? 'An owner can turn this module on under Settings → Modules.'
          : 'Switch to another demo role from the profile menu to see how access differs.'}
      </EmptyState>
    </div>
  );
}

function TitleSync() {
  const location = useLocation();
  const { business } = useStore();
  useEffect(() => {
    const seg = location.pathname.split('/')[1];
    const mod = MODULE_BY_ID[seg];
    document.title = `${mod ? `${mod.label} · ` : ''}${business.name} — Business OS`;
  }, [location.pathname, business.name]);
  return null;
}

export default function App() {
  const g = (module, el, edit) => <Guard module={module} edit={edit}>{el}</Guard>;
  return (
    <>
      <TitleSync />
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/setup" element={<RequireAuth><Setup /></RequireAuth>} />
        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={g('dashboard', <Dashboard />)} />
          <Route path="customers" element={g('customers', <Customers />)} />
          <Route path="customers/:id" element={g('customers', <CustomerDetail />)} />
          <Route path="sales" element={g('sales', <Sales />)} />
          <Route path="invoices" element={g('invoices', <Invoices />)} />
          <Route path="invoices/new" element={g('invoices', <InvoiceEditor />, true)} />
          <Route path="invoices/:id" element={g('invoices', <InvoiceDetail />)} />
          <Route path="invoices/:id/edit" element={g('invoices', <InvoiceEditor />, true)} />
          <Route path="expenses" element={g('expenses', <Expenses />)} />
          <Route path="employees" element={g('employees', <Employees />)} />
          <Route path="employees/:id" element={g('employees', <EmployeeDetail />)} />
          <Route path="tasks" element={g('tasks', <Tasks />)} />
          <Route path="bookings" element={g('bookings', <Bookings />)} />
          <Route path="inventory" element={g('inventory', <Inventory />)} />
          <Route path="reports" element={g('reports', <Reports />)} />
          <Route path="settings" element={g('settings', <Settings />)} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
