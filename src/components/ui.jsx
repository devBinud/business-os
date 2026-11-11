import { useEffect, useId, useRef } from 'react';
import { Search, X, ArrowUpRight, ArrowDownRight, Inbox } from 'lucide-react';
import { initials } from '../utils/format.js';

export function PageHeader({ title, description, actions, breadcrumb }) {
  return (
    <header className="page-header">
      <div style={{ minWidth: 0 }}>
        {breadcrumb}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  );
}

export function Card({ title, subtitle, actions, children, flush, className = '', ...rest }) {
  return (
    <section className={`card ${className}`} {...rest}>
      {(title || actions) && (
        <div className="card-header">
          <div style={{ minWidth: 0 }}>
            {title && <h2>{title}</h2>}
            {subtitle && <div className="sub">{subtitle}</div>}
          </div>
          {actions && <div className="row">{actions}</div>}
        </div>
      )}
      <div className={`card-body ${flush ? 'flush' : ''}`}>{children}</div>
    </section>
  );
}

export function StatCard({ icon: Icon, label, value, change, changeLabel, meta, invertTrend }) {
  let trend = null;
  if (change !== undefined && change !== null && Number.isFinite(change)) {
    const up = change >= 0;
    const good = invertTrend ? !up : up;
    trend = (
      <span className={good ? 'trend-up' : 'trend-down'}>
        {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {Math.abs(change * 100).toFixed(0)}%
      </span>
    );
  }
  return (
    <div className="card stat-card">
      <div className="label">
        {Icon && <Icon size={16} />}
        {label}
      </div>
      <div className="value">{value}</div>
      <div className="meta">
        {trend}
        {trend && changeLabel && <span>{changeLabel}</span>}
        {meta}
      </div>
    </div>
  );
}

const BADGES = {
  invoice: { paid: ['success', 'Paid'], partial: ['info', 'Partially paid'], unpaid: ['warning', 'Unpaid'], overdue: ['danger', 'Overdue'] },
  booking: { pending: ['warning', 'Pending'], confirmed: ['accent', 'Confirmed'], completed: ['success', 'Completed'], cancelled: ['', 'Cancelled'] },
  order: { quotation: ['', 'Quotation'], confirmed: ['info', 'Confirmed'], fulfilled: ['success', 'Fulfilled'], cancelled: ['', 'Cancelled'] },
  task: { todo: ['', 'To do'], in_progress: ['info', 'In progress'], review: ['warning', 'Awaiting review'], done: ['success', 'Done'] },
  priority: { low: ['', 'Low'], medium: ['info', 'Medium'], high: ['warning', 'High'], urgent: ['danger', 'Urgent'] },
  expense: { approved: ['success', 'Approved'], pending: ['warning', 'Pending approval'], rejected: ['danger', 'Rejected'] },
  customer: { lead: ['info', 'Enquiry'], active: ['success', 'Active'], inactive: ['', 'Inactive'] },
  employee: { active: ['success', 'Active'], on_leave: ['warning', 'On leave'], inactive: ['', 'Inactive'] },
  stock: { low: ['danger', 'Low stock'], ok: ['success', 'In stock'], out: ['danger', 'Out of stock'] },
};

export function StatusBadge({ kind, status }) {
  const [tone, label] = BADGES[kind]?.[status] ?? ['', status];
  return <span className={`badge ${tone}`}>{label}</span>;
}

export function statusLabel(kind, status) {
  return BADGES[kind]?.[status]?.[1] ?? status;
}

export function Avatar({ name, size = '', color }) {
  return (
    <span className={`avatar ${size}`} style={color ? { background: color, color: '#fff' } : undefined} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function Person({ name, sub, size }) {
  return (
    <span className="person">
      <Avatar name={name} size={size} />
      <span className="meta">
        <span className="truncate">{name}</span>
        {sub && <span className="sub truncate">{sub}</span>}
      </span>
    </span>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, children, action }) {
  return (
    <div className="empty">
      <Icon size={32} />
      <div className="title">{title}</div>
      {children && <div>{children}</div>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

/** Label + control + error/hint. Children may be a function receiving the generated input id. */
export function Field({ label, error, hint, children, className = '' }) {
  const id = useId();
  return (
    <div className={`field ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      {typeof children === 'function' ? children(id) : children}
      {error ? <span className="error" role="alert">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '', ...rest }) {
  return (
    <div className={`input-icon ${className}`}>
      <Search size={16} />
      <input
        className="input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        {...rest}
      />
    </div>
  );
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          className={value === o.id ? 'active' : ''}
          onClick={() => onChange(o.id)}
        >
          {o.icon && <o.icon size={14} />}
          {o.label}
          {o.count !== undefined && <span className="n">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span />
    </label>
  );
}

export function Modal({ open, onClose, title, description, children, footer, size = '', onSubmit }) {
  const ref = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    const previous = document.activeElement;
    // Focus first form control, falling back to the dialog itself.
    requestAnimationFrame(() => {
      const first = ref.current?.querySelector('input:not([type=hidden]), select, textarea');
      (first || ref.current)?.focus();
    });
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const Body = onSubmit ? 'form' : 'div';
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1}>
        <Body
          style={{ display: 'contents' }}
          {...(onSubmit && {
            noValidate: true,
            onSubmit: (e) => {
              e.preventDefault();
              onSubmit();
            },
          })}
        >
          <div className="modal-header">
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 id={titleId}>{title}</h2>
              {description && <p>{description}</p>}
            </div>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </Body>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', tone = 'danger', onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="narrow"
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className={`btn ${tone === 'danger' ? 'danger' : 'primary'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="muted">{message}</p>
    </Modal>
  );
}

export function ProgressBar({ value }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${Math.min(Math.max(value, 0), 1) * 100}%` }} />
    </div>
  );
}

export function ClearButton({ onClick, label = 'Clear filters' }) {
  return (
    <button type="button" className="btn ghost sm" onClick={onClick}>
      <X size={14} /> {label}
    </button>
  );
}
