import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, Menu, Info } from 'lucide-react';
import { useStore } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { useLocalPreference, useMediaQuery } from '../utils/hooks.js';
import { invoiceStatus } from '../utils/calc.js';
import { todayISO } from '../utils/date.js';
import { initials } from '../utils/format.js';
import GlobalSearch from './GlobalSearch.jsx';
import NotificationsMenu from './NotificationsMenu.jsx';
import UserMenu from './UserMenu.jsx';

const SECTIONS = [
  { title: null, ids: ['dashboard'] },
  { title: 'Sales & finance', ids: ['customers', 'sales', 'invoices', 'expenses'] },
  { title: 'Operations', ids: ['employees', 'tasks', 'bookings', 'inventory'] },
  { title: 'Insights', ids: ['reports'] },
];

export default function AppShell() {
  const { business, invoices, expenses, tasks, bookings } = useStore();
  const access = useAccess();
  const location = useLocation();

  const isTablet = useMediaQuery('(max-width: 1100px) and (min-width: 761px)');
  const [desktopCollapsed, setDesktopCollapsed] = useLocalPreference('business-os-demo:sidebar', false);
  const [tabletExpanded, setTabletExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer / tablet overlay after navigating.
  useEffect(() => {
    setMobileOpen(false);
    setTabletExpanded(false);
  }, [location.pathname]);

  const narrow = isTablet ? !tabletExpanded : desktopCollapsed;
  const toggleSidebar = () => (isTablet ? setTabletExpanded((v) => !v) : setDesktopCollapsed((v) => !v));

  const counts = useMemo(() => {
    const today = todayISO();
    return {
      invoices: access.canView('invoices') ? invoices.filter((i) => invoiceStatus(i, today) === 'overdue').length : 0,
      expenses: access.approveExpenses ? expenses.filter((x) => x.status === 'pending').length : 0,
      tasks: tasks.filter(
        (t) => t.status !== 'done' && t.dueDate < today && (!access.ownTasksOnly || t.assigneeId === access.userId),
      ).length,
      bookings: bookings.filter((b) => b.status === 'pending').length,
    };
  }, [invoices, expenses, tasks, bookings, access]);

  const visible = new Set(access.navModules.map((m) => m.id));
  const byId = Object.fromEntries(access.navModules.map((m) => [m.id, m]));

  const classes = ['app'];
  if (desktopCollapsed) classes.push('collapsed');
  if (tabletExpanded) classes.push('expanded');
  if (mobileOpen) classes.push('mobile-open');

  const navItem = (m) => (
    <NavLink key={m.id} to={m.path} className="nav-link" title={narrow ? m.label : undefined}>
      <m.icon size={18} />
      <span className="label">{m.label}</span>
      {counts[m.id] > 0 && <span className="count" aria-label={`${counts[m.id]} need attention`}>{counts[m.id]}</span>}
    </NavLink>
  );

  return (
    <div className={classes.join(' ')}>
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar-brand">
          <span className="brand-mark" style={{ background: business.logoColor }}>{initials(business.name)}</span>
          <span className="brand-text">
            <span className="name truncate">{business.name}</span>
            <span className="sub">Business OS</span>
          </span>
        </div>
        <nav className="nav">
          {SECTIONS.map((section) => {
            const items = section.ids.filter((id) => visible.has(id));
            if (!items.length) return null;
            return (
              <div key={section.title ?? 'main'} className="stack" style={{ '--gap': '2px' }}>
                {section.title && <div className="nav-section">{section.title}</div>}
                {items.map((id) => navItem(byId[id]))}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-foot stack" style={{ '--gap': '2px' }}>
          {visible.has('settings') && navItem(byId.settings)}
          <button type="button" className="nav-link desktop-only" style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%' }} onClick={toggleSidebar}>
            {narrow ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            <span className="label">Collapse sidebar</span>
          </button>
        </div>
      </aside>

      {(mobileOpen || tabletExpanded) && (
        <div className="scrim" style={tabletExpanded ? { background: 'transparent' } : undefined} onClick={() => { setMobileOpen(false); setTabletExpanded(false); }} />
      )}

      <div className="main">
        <div className="demo-banner" role="note">
          <Info size={14} />
          <span>Demonstration environment — all data is sample data and no real transactions take place.</span>
        </div>
        <header className="topbar">
          <button type="button" className="icon-btn mobile-only" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <span className="business-name">{business.name}</span>
          <GlobalSearch />
          <span className="spacer" />
          <NotificationsMenu />
          <UserMenu />
        </header>
        <main className="content" id="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
