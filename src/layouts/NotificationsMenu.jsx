import { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, TriangleAlert, Info, CircleCheck } from 'lucide-react';
import { useStore } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { useClickOutside } from '../utils/hooks.js';
import { buildAlerts } from '../utils/alerts.js';

export default function NotificationsMenu() {
  const store = useStore();
  const access = useAccess();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const alerts = useMemo(
    () => buildAlerts({ data: store.data, access, money: store.money }),
    [store.data, access, store.money],
  );

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications (${alerts.length})`}
        aria-expanded={open}
      >
        <Bell size={19} />
        {alerts.length > 0 && <span className="dot">{alerts.length > 9 ? '9+' : alerts.length}</span>}
      </button>
      {open && (
        <div className="popover wide" style={{ maxHeight: 440, overflowY: 'auto' }}>
          <div className="row" style={{ padding: '8px 10px 6px', justifyContent: 'space-between' }}>
            <strong>Notifications</strong>
            <span className="small muted">{alerts.length} pending</span>
          </div>
          {alerts.length === 0 && (
            <div className="empty small" style={{ padding: 24 }}>
              <CircleCheck size={24} />
              <div>You're all caught up.</div>
            </div>
          )}
          {alerts.map((a) => (
            <Link key={a.id} to={a.to} className="menu-item" onClick={close}>
              {a.tone === 'info' ? (
                <Info size={16} style={{ color: 'var(--info)', flexShrink: 0 }} />
              ) : (
                <TriangleAlert size={16} style={{ color: a.tone === 'danger' ? 'var(--danger)' : 'var(--warning)', flexShrink: 0 }} />
              )}
              <span className="grow">
                <div className="sub">{a.category}</div>
                <div className="truncate" style={{ color: 'var(--text)' }}>{a.title}</div>
                <div className="sub truncate">{a.detail}</div>
              </span>
            </Link>
          ))}
          <div className="menu-sep" />
          <div className="small muted" style={{ padding: '4px 10px 6px' }}>
            Demo only — no email, SMS or push notifications are sent.
          </div>
        </div>
      )}
    </div>
  );
}
