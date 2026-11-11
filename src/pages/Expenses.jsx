import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Receipt, Clock, Check, X, Info, Pencil, Trash2 } from 'lucide-react';
import { useStore, useLookups } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { PageHeader, Card, SearchInput, StatusBadge, Segmented, StatCard, Modal, Field, ConfirmDialog, ClearButton } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import { BreakdownBars } from '../components/Charts.jsx';
import { useToast } from '../components/Toast.jsx';
import { useForm } from '../utils/useForm.js';
import { required } from '../utils/validation.js';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../data/modules.js';
import { DATE_RANGES, formatDate, inRange, rangeBounds, todayISO } from '../utils/date.js';

const APPROVAL_THRESHOLD = 500;
const PERIODS = [...DATE_RANGES.filter((r) => r.id !== 'today'), { id: 'all', label: 'All time' }];

function ExpenseForm({ open, onClose, expense }) {
  const { actions, money } = useStore();
  const access = useAccess();
  const toast = useToast();
  const blank = { date: todayISO(), amount: '', category: 'Supplies', vendor: '', method: 'Card', description: '' };
  const form = useForm(blank, {
    date: [required('Choose a date'), [(v) => v <= todayISO(), "Expense date can't be in the future"]],
    amount: [[(v) => Number(v) > 0, 'Enter an amount greater than 0']],
    vendor: [required('Enter who was paid')],
  });

  useEffect(() => {
    if (open) form.reset(expense ? { ...expense } : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const needsApproval = !expense && !access.approveExpenses && Number(form.values.amount) >= APPROVAL_THRESHOLD;

  const save = () =>
    form.submit((v) => {
      actions.saveExpense({ ...(expense || {}), ...v, amount: Number(v.amount), vendor: v.vendor.trim(), description: v.description.trim() }, { needsApproval });
      toast(needsApproval ? 'Expense submitted for approval' : expense ? 'Expense updated' : 'Expense recorded');
      onClose();
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense ? 'Edit expense' : 'Add expense'}
      onSubmit={save}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary">{needsApproval ? 'Submit for approval' : expense ? 'Save changes' : 'Add expense'}</button>
        </>
      }
    >
      <div className="stack">
        <div className="form-grid">
          <Field label="Amount" error={form.errors.amount}>{(id) => <input id={id} type="number" min="0" step="0.01" {...form.bind('amount')} />}</Field>
          <Field label="Date" error={form.errors.date}>{(id) => <input id={id} type="date" max={todayISO()} {...form.bind('date')} />}</Field>
          <Field label="Category">
            {(id) => <select id={id} {...form.bind('category', 'select')}>{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>}
          </Field>
          <Field label="Payment method">
            {(id) => <select id={id} {...form.bind('method', 'select')}>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select>}
          </Field>
          <Field label="Paid to (vendor)" error={form.errors.vendor} className="full">{(id) => <input id={id} {...form.bind('vendor')} placeholder="e.g. City Power & Water" />}</Field>
          <Field label="Description" className="full">{(id) => <input id={id} {...form.bind('description')} placeholder="What was this for? (optional)" />}</Field>
        </div>
        {needsApproval && (
          <div className="alert warning small">
            <Info size={16} />
            <span className="grow">Expenses of {money(APPROVAL_THRESHOLD)} or more need approval from a manager or the owner.</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function Expenses() {
  const { expenses, money, actions } = useStore();
  const { employeeById } = useLookups();
  const access = useAccess();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(params.get('status') || 'all');
  const [category, setCategory] = useState('');
  const [method, setMethod] = useState('');
  const [period, setPeriod] = useState('month');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const formOpen = params.get('new') === '1' || Boolean(editing);
  const canEdit = access.canEdit('expenses');

  const closeForm = () => {
    setEditing(null);
    const next = new URLSearchParams(params);
    next.delete('new');
    setParams(next, { replace: true });
  };

  const range = period === 'all' ? null : rangeBounds(period);
  const inPeriod = useMemo(() => expenses.filter((x) => !range || inRange(x.date, range)), [expenses, range?.from, range?.to]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return inPeriod
      .filter((x) => status === 'all' || x.status === status)
      .filter((x) => !category || x.category === category)
      .filter((x) => !method || x.method === method)
      .filter((x) => !term || `${x.vendor} ${x.description} ${x.category}`.toLowerCase().includes(term));
  }, [inPeriod, q, status, category, method]);

  const approvedInPeriod = inPeriod.filter((x) => x.status === 'approved');
  const total = approvedInPeriod.reduce((s, x) => s + Number(x.amount), 0);
  const pending = expenses.filter((x) => x.status === 'pending');
  const byCategory = Object.entries(
    approvedInPeriod.reduce((acc, x) => ({ ...acc, [x.category]: (acc[x.category] || 0) + Number(x.amount) }), {}),
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const filteredTotal = rows.filter((x) => x.status === 'approved').reduce((s, x) => s + Number(x.amount), 0);

  const columns = [
    { key: 'date', header: 'Date', render: (x) => <span className="nowrap">{formatDate(x.date)}</span> },
    {
      key: 'vendor', header: 'Paid to',
      render: (x) => (<div><div>{x.vendor}</div>{x.description && <div className="small muted truncate" style={{ maxWidth: 260 }}>{x.description}</div>}</div>),
    },
    { key: 'category', header: 'Category', render: (x) => <span className="tag">{x.category}</span> },
    { key: 'method', header: 'Method', render: (x) => <span className="muted">{x.method}</span> },
    {
      key: 'status', header: 'Status',
      render: (x) => (
        <div>
          <StatusBadge kind="expense" status={x.status} />
          {x.status === 'pending' && x.submittedBy && <div className="small muted">by {employeeById[x.submittedBy]?.name}</div>}
        </div>
      ),
    },
    { key: 'amount', header: 'Amount', align: 'right', render: (x) => <span className="strong">{money(x.amount)}</span> },
    {
      key: 'actions', header: '', sortable: false,
      render: (x) => (
        <div className="row" style={{ justifyContent: 'flex-end', gap: 4 }} onClick={(e) => e.stopPropagation()}>
          {x.status === 'pending' && access.approveExpenses && (
            <>
              <button className="btn sm" onClick={() => { actions.setExpenseStatus(x.id, 'approved'); toast('Expense approved'); }}><Check size={14} /> Approve</button>
              <button className="btn sm icon" onClick={() => { actions.setExpenseStatus(x.id, 'rejected'); toast('Expense rejected'); }} aria-label="Reject" title="Reject"><X size={14} /></button>
            </>
          )}
          {canEdit && (
            <>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setEditing(x)} aria-label="Edit expense"><Pencil size={14} /></button>
              <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setDeleting(x)} aria-label="Delete expense"><Trash2 size={14} /></button>
            </>
          )}
        </div>
      ),
    },
  ];

  const periodLabel = PERIODS.find((p) => p.id === period).label;

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Record business expenses, categories, dates and payment methods."
        actions={
          <>
            <select className="select" style={{ width: 'auto' }} value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period">
              {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            {canEdit && <button className="btn primary" onClick={() => setParams({ new: '1' })}><Plus size={16} /> Add expense</button>}
          </>
        }
      />
      <div className="stack">
        <div className="grid grid-3">
          <StatCard icon={Receipt} label={`Approved expenses · ${periodLabel.toLowerCase()}`} value={money(total)} meta={<span>{approvedInPeriod.length} records</span>} />
          <StatCard icon={Clock} label="Pending approval" value={money(pending.reduce((s, x) => s + Number(x.amount), 0))} meta={<span>{pending.length} expense{pending.length === 1 ? '' : 's'} waiting{access.approveExpenses ? ' for you' : ''}</span>} />
          <StatCard icon={Receipt} label="Largest category" value={byCategory[0]?.label ?? '—'} meta={byCategory[0] && <span>{money(byCategory[0].value)} · {Math.round((byCategory[0].value / total) * 100)}% of spend</span>} />
        </div>

        <div className="grid grid-main-side" style={{ alignItems: 'start' }}>
          <div className="card">
            <div className="toolbar">
              <SearchInput className="search" value={q} onChange={setQ} placeholder="Search vendor or description" />
              <Segmented
                label="Expense status"
                value={status}
                onChange={setStatus}
                options={[
                  { id: 'all', label: 'All' },
                  { id: 'approved', label: 'Approved' },
                  { id: 'pending', label: 'Pending', count: pending.length },
                  { id: 'rejected', label: 'Rejected' },
                ]}
              />
              <select className="select sm" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
                <option value="">All categories</option>
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select className="select sm" value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Payment method">
                <option value="">All methods</option>
                {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
              {(q || status !== 'all' || category || method) && (
                <ClearButton onClick={() => { setQ(''); setStatus('all'); setCategory(''); setMethod(''); }} />
              )}
            </div>
            <DataTable
              columns={columns}
              rows={rows}
              initialSort={{ key: 'date', dir: 'desc' }}
              footer={rows.length > 0 && (
                <tr><td colSpan={5}>Approved total for current filters</td><td className="num">{money(filteredTotal)}</td><td /></tr>
              )}
            />
          </div>
          <Card title="Spending by category" subtitle={periodLabel}>
            {byCategory.length ? <BreakdownBars rows={byCategory} money={money} total={total} /> : <div className="muted small">No approved expenses in this period.</div>}
          </Card>
        </div>
      </div>

      <ExpenseForm open={formOpen} onClose={closeForm} expense={editing} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete expense?"
        message={deleting ? `${money(deleting.amount)} paid to ${deleting.vendor} on ${formatDate(deleting.date)} will be removed.` : ''}
        confirmLabel="Delete expense"
        onConfirm={() => { actions.deleteExpense(deleting.id); toast('Expense deleted'); }}
      />
    </>
  );
}
