import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, FileText, IdCard, CheckSquare, CalendarDays, Package } from 'lucide-react';
import { useStore } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { useClickOutside } from '../utils/hooks.js';

export default function GlobalSearch() {
  const data = useStore();
  const access = useAccess();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(0);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(boxRef, close, open);

  // Ctrl/Cmd + K focuses search.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const has = (...fields) => fields.some((f) => String(f ?? '').toLowerCase().includes(term));
    const name = (id) => data.customers.find((c) => c.id === id)?.name ?? '';
    const groups = [];
    const add = (module, label, icon, items) => {
      if (access.canView(module) && items.length) groups.push({ label, icon, items: items.slice(0, 5) });
    };

    add('customers', 'Customers', Users, data.customers
      .filter((c) => has(c.name, c.email, c.phone, c.city))
      .map((c) => ({ id: c.id, title: c.name, sub: c.email, to: `/customers/${c.id}` })));
    add('invoices', 'Invoices', FileText, data.invoices
      .filter((i) => has(i.number, name(i.customerId)))
      .map((i) => ({ id: i.id, title: i.number, sub: name(i.customerId), to: `/invoices/${i.id}` })));
    add('employees', 'Employees', IdCard, data.employees
      .filter((e) => has(e.name, e.title, e.department, e.email))
      .map((e) => ({ id: e.id, title: e.name, sub: e.title, to: `/employees/${e.id}` })));
    add('tasks', 'Tasks', CheckSquare, data.tasks
      .filter((t) => (!access.ownTasksOnly || t.assigneeId === access.userId) && has(t.title))
      .map((t) => ({ id: t.id, title: t.title, sub: 'Task', to: `/tasks?open=${t.id}` })));
    add('bookings', 'Bookings', CalendarDays, data.bookings
      .filter((b) => has(b.number, b.resource, name(b.customerId)))
      .map((b) => ({ id: b.id, title: `${b.number} · ${name(b.customerId)}`, sub: b.resource, to: `/bookings?open=${b.id}` })));
    add('inventory', 'Inventory', Package, data.products
      .filter((p) => has(p.name, p.sku, p.supplier))
      .map((p) => ({ id: p.id, title: p.name, sub: p.sku, to: `/inventory?q=${encodeURIComponent(p.name)}` })));
    return groups;
  }, [q, data, access]);

  const flat = results.flatMap((g) => g.items);

  const go = (item) => {
    navigate(item.to);
    setQ('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocus((f) => Math.min(f + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocus((f) => Math.max(f - 1, 0));
    } else if (e.key === 'Enter' && flat[focus]) {
      go(flat[focus]);
    }
  };

  let index = -1;
  return (
    <div className="search" ref={boxRef}>
      <div className="input-icon">
        <Search size={16} />
        <input
          ref={inputRef}
          className="input"
          type="search"
          placeholder="Search customers, invoices, staff…"
          aria-label="Global search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setFocus(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </div>
      {open && q.trim().length >= 2 && (
        <div className="popover left wide" style={{ width: '100%', minWidth: 300 }} role="listbox">
          {results.length === 0 && <div className="empty small" style={{ padding: 20 }}>No matches for “{q}”.</div>}
          {results.map((g) => (
            <div key={g.label}>
              <div className="popover-title">{g.label}</div>
              {g.items.map((item) => {
                index += 1;
                const i = index;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={focus === i}
                    className={`menu-item ${focus === i ? 'focused' : ''}`}
                    onMouseEnter={() => setFocus(i)}
                    onClick={() => go(item)}
                  >
                    <g.icon size={15} className="faint" />
                    <span className="grow">
                      <div className="truncate">{item.title}</div>
                      <div className="sub truncate">{item.sub}</div>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
