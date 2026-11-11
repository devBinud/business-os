import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useStore } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { PageHeader, SearchInput, StatusBadge, Person, Segmented, ClearButton } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import CustomerForm from '../components/forms/CustomerForm.jsx';
import { customerBalance, customerLifetimeValue } from '../utils/calc.js';
import { CUSTOMER_TYPES } from '../data/modules.js';
import { formatDate } from '../utils/date.js';

export default function Customers() {
  const { customers, invoices, money } = useStore();
  const access = useAccess();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('');
  const formOpen = params.get('new') === '1';

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return customers
      .filter((c) => status === 'all' || c.status === status)
      .filter((c) => !type || c.type === type)
      .filter((c) => !term || [c.name, c.email, c.phone, c.city, ...(c.tags || [])].some((f) => String(f).toLowerCase().includes(term)))
      .map((c) => ({
        ...c,
        balance: customerBalance(invoices, c.id),
        lifetime: customerLifetimeValue(invoices, c.id),
      }));
  }, [customers, invoices, q, status, type]);

  const counts = useMemo(() => {
    const by = (s) => customers.filter((c) => c.status === s).length;
    return { all: customers.length, active: by('active'), lead: by('lead'), inactive: by('inactive') };
  }, [customers]);

  const columns = [
    { key: 'name', header: 'Customer', render: (c) => <Person name={c.name} sub={c.type} /> },
    {
      key: 'email', header: 'Contact',
      render: (c) => (<div className="stack" style={{ '--gap': '0' }}><span className="truncate" style={{ maxWidth: 240 }}>{c.email || '—'}</span><span className="small muted">{c.phone}</span></div>),
    },
    { key: 'city', header: 'City', render: (c) => c.city || '—' },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge kind="customer" status={c.status} /> },
    ...(access.financials
      ? [
          { key: 'lifetime', header: 'Total paid', align: 'right', render: (c) => money(c.lifetime) },
          { key: 'balance', header: 'Balance due', align: 'right', render: (c) => (c.balance > 0 ? <span className="strong">{money(c.balance)}</span> : <span className="faint">—</span>) },
        ]
      : []),
    { key: 'createdAt', header: 'Added', render: (c) => <span className="nowrap muted">{formatDate(c.createdAt)}</span> },
  ];

  const setFormOpen = (open) => {
    const next = new URLSearchParams(params);
    if (open) next.set('new', '1');
    else next.delete('new');
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="Customers"
        description="Customer profiles, contact details, enquiries and history."
        actions={access.canEdit('customers') && (
          <button className="btn primary" onClick={() => setFormOpen(true)}><Plus size={16} /> Add customer</button>
        )}
      />
      <div className="card">
        <div className="toolbar">
          <SearchInput className="search" value={q} onChange={setQ} placeholder="Search name, email, phone, city or tag" />
          <Segmented
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'active', label: 'Active', count: counts.active },
              { id: 'lead', label: 'Enquiries', count: counts.lead },
              { id: 'inactive', label: 'Inactive', count: counts.inactive },
            ]}
          />
          <select className="select sm" value={type} onChange={(e) => setType(e.target.value)} aria-label="Customer type">
            <option value="">All types</option>
            {CUSTOMER_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          {(q || status !== 'all' || type) && <ClearButton onClick={() => { setQ(''); setStatus('all'); setType(''); }} />}
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          initialSort={{ key: 'name', dir: 'asc' }}
          onRowClick={(c) => navigate(`/customers/${c.id}`)}
          empty={{ title: 'No customers match', text: 'Try a different search or clear the filters.' }}
        />
      </div>
      <CustomerForm open={formOpen} onClose={() => setFormOpen(false)} onSaved={(id) => navigate(`/customers/${id}`)} />
    </>
  );
}
