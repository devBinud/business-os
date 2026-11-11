import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Wallet, TriangleAlert, CircleCheck } from 'lucide-react';
import { useStore, useLookups } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { PageHeader, SearchInput, StatusBadge, Segmented, StatCard, ClearButton } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import { invoiceStatus, invoiceTotals, daysOverdue, revenueInRange } from '../utils/calc.js';
import { formatDate, todayISO, rangeBounds } from '../utils/date.js';

export default function Invoices() {
  const { invoices, money } = useStore();
  const { customerById } = useLookups();
  const access = useAccess();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const today = todayISO();

  const enriched = useMemo(
    () =>
      invoices.map((inv) => ({
        ...inv,
        ...invoiceTotals(inv),
        status: invoiceStatus(inv, today),
        customerName: customerById[inv.customerId]?.name ?? 'Unknown customer',
      })),
    [invoices, customerById, today],
  );

  const summary = useMemo(() => {
    const open = enriched.filter((i) => i.balance > 0);
    const overdue = enriched.filter((i) => i.status === 'overdue');
    return {
      outstanding: open.reduce((s, i) => s + i.balance, 0),
      openCount: open.length,
      overdue: overdue.reduce((s, i) => s + i.balance, 0),
      overdueCount: overdue.length,
      paidThisMonth: revenueInRange(invoices, rangeBounds('month')),
    };
  }, [enriched, invoices]);

  const counts = useMemo(() => {
    const c = { all: enriched.length, unpaid: 0, partial: 0, overdue: 0, paid: 0 };
    enriched.forEach((i) => (c[i.status] += 1));
    return c;
  }, [enriched]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return enriched
      .filter((i) => status === 'all' || i.status === status)
      .filter((i) => !term || i.number.toLowerCase().includes(term) || i.customerName.toLowerCase().includes(term));
  }, [enriched, q, status]);

  const columns = [
    { key: 'number', header: 'Invoice', render: (i) => <span className="strong">{i.number}</span> },
    { key: 'customerName', header: 'Customer' },
    { key: 'issueDate', header: 'Issued', render: (i) => <span className="nowrap">{formatDate(i.issueDate)}</span> },
    {
      key: 'dueDate', header: 'Due',
      render: (i) => (
        <span className="nowrap">
          {formatDate(i.dueDate)}
          {i.status === 'overdue' && <div className="small text-danger">{daysOverdue(i, today)} days overdue</div>}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (i) => <StatusBadge kind="invoice" status={i.status} /> },
    { key: 'total', header: 'Amount', align: 'right', render: (i) => money(i.total) },
    { key: 'balance', header: 'Balance', align: 'right', render: (i) => (i.balance > 0 ? <span className="strong">{money(i.balance)}</span> : <span className="faint">—</span>) },
  ];

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Create invoices, record payments and track outstanding balances."
        actions={access.canEdit('invoices') && <Link className="btn primary" to="/invoices/new"><Plus size={16} /> Create invoice</Link>}
      />
      <div className="stack">
        <div className="grid grid-3">
          <StatCard icon={Wallet} label="Outstanding" value={money(summary.outstanding)} meta={<span>{summary.openCount} open invoices</span>} />
          <StatCard icon={TriangleAlert} label="Overdue" value={<span className={summary.overdue > 0 ? 'text-danger' : ''}>{money(summary.overdue)}</span>} meta={<span>{summary.overdueCount} invoices past due date</span>} />
          <StatCard icon={CircleCheck} label="Received this month" value={money(summary.paidThisMonth)} meta={<span>Payments recorded since the 1st</span>} />
        </div>
        <div className="card">
          <div className="toolbar">
            <SearchInput className="search" value={q} onChange={setQ} placeholder="Search invoice number or customer" />
            <Segmented
              label="Invoice status"
              value={status}
              onChange={setStatus}
              options={[
                { id: 'all', label: 'All', count: counts.all },
                { id: 'unpaid', label: 'Unpaid', count: counts.unpaid },
                { id: 'partial', label: 'Partial', count: counts.partial },
                { id: 'overdue', label: 'Overdue', count: counts.overdue },
                { id: 'paid', label: 'Paid', count: counts.paid },
              ]}
            />
            {(q || status !== 'all') && <ClearButton onClick={() => { setQ(''); setStatus('all'); }} />}
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            initialSort={{ key: 'issueDate', dir: 'desc' }}
            onRowClick={(i) => navigate(`/invoices/${i.id}`)}
            empty={{ title: 'No invoices match', text: 'Try a different search or status.' }}
          />
        </div>
      </div>
    </>
  );
}
