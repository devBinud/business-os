import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check, LogOut, Settings, UserCog } from 'lucide-react';
import { useStore } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { useClickOutside } from '../utils/hooks.js';
import { ROLES, ROLE_LIST } from '../utils/permissions.js';
import { Avatar } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';

export default function UserMenu() {
  const { currentUser, role, actions } = useStore();
  const access = useAccess();
  const navigate = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  if (!currentUser) return null;

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        type="button"
        className="btn ghost"
        style={{ height: 40, padding: '0 6px', gap: 10 }}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar name={currentUser.name} />
        <span className="desktop-only" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.25 }}>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{currentUser.name}</span>
          <span className="small muted">{ROLES[role].label}</span>
        </span>
        <ChevronDown size={16} className="faint" />
      </button>
      {open && (
        <div className="popover" style={{ width: 290 }} role="menu">
          <div className="row" style={{ padding: '8px 10px', gap: 10 }}>
            <Avatar name={currentUser.name} />
            <div style={{ minWidth: 0 }}>
              <div className="strong truncate">{currentUser.name}</div>
              <div className="small muted truncate">{currentUser.email}</div>
            </div>
          </div>
          <div className="menu-sep" />
          <div className="popover-title row" style={{ gap: 6 }}>
            <UserCog size={12} /> Switch demo role
          </div>
          {ROLE_LIST.map((r) => (
            <button
              key={r.id}
              type="button"
              role="menuitemradio"
              aria-checked={role === r.id}
              className="menu-item"
              onClick={() => {
                if (r.id !== role) {
                  actions.switchRole(r.id);
                  toast(`Now viewing as ${r.label}`);
                }
                close();
              }}
            >
              <span style={{ width: 16 }}>{role === r.id && <Check size={16} style={{ color: 'var(--accent)' }} />}</span>
              <span className="grow">
                <div>{r.label}</div>
                <div className="sub">{r.description}</div>
              </span>
            </button>
          ))}
          <div className="menu-sep" />
          {access.canView('settings') && (
            <button type="button" className="menu-item" onClick={() => { navigate('/settings'); close(); }}>
              <Settings size={16} className="faint" /> Settings
            </button>
          )}
          <button
            type="button"
            className="menu-item"
            onClick={() => {
              actions.signOut();
              navigate('/signin');
            }}
          >
            <LogOut size={16} className="faint" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
