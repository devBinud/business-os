import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, LayoutGrid, List, CalendarDays, Trash2, Play, Check, Send } from 'lucide-react';
import { useStore, useLookups } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { PageHeader, SearchInput, StatusBadge, Segmented, Modal, Field, ConfirmDialog, Avatar, ClearButton, Person } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import { useToast } from '../components/Toast.jsx';
import { useForm } from '../utils/useForm.js';
import { required } from '../utils/validation.js';
import { TASK_PRIORITIES, TASK_STATUSES } from '../data/modules.js';
import { addDays, formatDate, relativeDay, startOfWeekISO, todayISO } from '../utils/date.js';

const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };

function TaskModal({ open, onClose, task, defaults }) {
  const { employees, actions } = useStore();
  const { employeeById } = useLookups();
  const access = useAccess();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const blank = {
    title: '', description: '', assigneeId: access.ownTasksOnly ? access.userId : '', priority: 'medium',
    dueDate: addDays(todayISO(), 3), status: 'todo',
  };
  const form = useForm(blank, {
    title: [required('Give the task a title')],
    assigneeId: [required('Choose who should do this')],
    dueDate: [required('Choose a due date')],
  });

  useEffect(() => {
    if (open) form.reset(task ? { ...task } : { ...blank, ...defaults });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id]);

  const save = () =>
    form.submit((v) => {
      actions.saveTask({ ...(task || {}), ...v, title: v.title.trim(), description: v.description.trim() });
      toast(task ? 'Task updated' : `Task assigned to ${employeeById[v.assigneeId]?.name}`);
      onClose();
    });

  const assignable = employees.filter((e) => e.status !== 'inactive').sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={task ? 'Task details' : 'New task'}
        description={task ? `Created ${formatDate(task.createdAt)}${task.createdBy ? ` by ${employeeById[task.createdBy]?.name}` : ''}` : undefined}
        onSubmit={save}
        footer={
          <>
            {task && access.canEdit('tasks') && !access.ownTasksOnly && (
              <button type="button" className="btn icon" onClick={() => setConfirmDelete(true)} aria-label="Delete task" title="Delete task"><Trash2 size={16} /></button>
            )}
            <span className="spacer" />
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary">{task ? 'Save changes' : 'Create task'}</button>
          </>
        }
      >
        <div className="stack">
          <Field label="Title" error={form.errors.title}>{(id) => <input id={id} {...form.bind('title')} placeholder="What needs to be done?" />}</Field>
          <Field label="Description">{(id) => <textarea id={id} {...form.bind('description', 'textarea')} rows={3} placeholder="Details, location or checklist (optional)" />}</Field>
          <div className="form-grid">
            <Field label="Assignee" error={form.errors.assigneeId} hint={access.ownTasksOnly ? 'Staff can only create tasks for themselves.' : undefined}>
              {(id) => (
                <select id={id} {...form.bind('assigneeId', 'select')} disabled={access.ownTasksOnly}>
                  <option value="">Select a person…</option>
                  {assignable.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.title}</option>)}
                </select>
              )}
            </Field>
            <Field label="Due date" error={form.errors.dueDate}>{(id) => <input id={id} type="date" {...form.bind('dueDate')} />}</Field>
            <Field label="Priority">
              {(id) => <select id={id} {...form.bind('priority', 'select')}>{TASK_PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select>}
            </Field>
            <Field label="Status">
              {(id) => <select id={id} {...form.bind('status', 'select')}>{TASK_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>}
            </Field>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete task?"
        message={task ? `“${task.title}” will be permanently removed.` : ''}
        confirmLabel="Delete task"
        onConfirm={() => { actions.deleteTask(task.id); toast('Task deleted'); onClose(); }}
      />
    </>
  );
}

function QuickAction({ task, onStatus, canApprove }) {
  if (task.status === 'todo') return <button className="btn sm" onClick={() => onStatus('in_progress')}><Play size={13} /> Start</button>;
  if (task.status === 'in_progress')
    return canApprove
      ? <button className="btn sm" onClick={() => onStatus('done')}><Check size={13} /> Complete</button>
      : <button className="btn sm" onClick={() => onStatus('review')}><Send size={13} /> Submit</button>;
  if (task.status === 'review' && canApprove) return <button className="btn sm" onClick={() => onStatus('done')}><Check size={13} /> Approve</button>;
  return null;
}

export default function Tasks() {
  const { tasks, employees, actions } = useStore();
  const { employeeById } = useLookups();
  const access = useAccess();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState('board');
  const [q, setQ] = useState('');
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState('');
  const [due, setDue] = useState(params.get('due') || 'all');
  const [dragId, setDragId] = useState(null);
  const [dropCol, setDropCol] = useState(null);

  const today = todayISO();
  const canApprove = access.role !== 'staff';
  const openId = params.get('open');
  const isNew = params.get('new') === '1';
  const openTask = tasks.find((t) => t.id === openId);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    const weekEnd = addDays(startOfWeekISO(today), 6);
    return tasks
      .filter((t) => !access.ownTasksOnly || t.assigneeId === access.userId)
      .filter((t) => !assignee || t.assigneeId === assignee)
      .filter((t) => !priority || t.priority === priority)
      .filter((t) => {
        if (due === 'overdue') return t.status !== 'done' && t.dueDate < today;
        if (due === 'today') return t.dueDate === today;
        if (due === 'week') return t.dueDate >= today && t.dueDate <= weekEnd;
        return true;
      })
      .filter((t) => !term || `${t.title} ${t.description} ${employeeById[t.assigneeId]?.name}`.toLowerCase().includes(term))
      .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.dueDate.localeCompare(b.dueDate));
  }, [tasks, access, assignee, priority, due, q, today, employeeById]);

  const changeStatus = (task, status) => {
    if (task.status === status) return;
    actions.setTaskStatus(task.id, status);
    toast(`“${task.title}” → ${TASK_STATUSES.find((s) => s.id === status).label}`);
  };

  const dueLabel = (t) => (
    <span className={`small row ${t.status !== 'done' && t.dueDate < today ? 'text-danger' : 'muted'}`} style={{ gap: 4 }}>
      <CalendarDays size={13} /> {relativeDay(t.dueDate)}
    </span>
  );

  const columns = [
    { key: 'title', header: 'Task', render: (t) => <span className="strong">{t.title}</span> },
    { key: 'assigneeId', header: 'Assignee', sortValue: (t) => employeeById[t.assigneeId]?.name, render: (t) => <Person name={employeeById[t.assigneeId]?.name ?? 'Unassigned'} size="sm" /> },
    { key: 'priority', header: 'Priority', sortValue: (t) => PRIORITY_RANK[t.priority], render: (t) => <StatusBadge kind="priority" status={t.priority} /> },
    { key: 'dueDate', header: 'Due', render: dueLabel },
    {
      key: 'status', header: 'Status',
      render: (t) => (
        <select
          className="select sm"
          style={{ width: 160 }}
          value={t.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => changeStatus(t, e.target.value)}
          aria-label={`Status of ${t.title}`}
          disabled={!access.canEdit('tasks')}
        >
          {TASK_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      ),
    },
  ];

  const filtersActive = q || assignee || priority || due !== 'all';

  return (
    <>
      <PageHeader
        title={access.ownTasksOnly ? 'My tasks' : 'Tasks'}
        description={access.ownTasksOnly ? 'Tasks assigned to you. Update the status as you work.' : 'Create, assign, prioritize and track work across the team.'}
        actions={
          <>
            <Segmented label="View" value={view} onChange={setView} options={[{ id: 'board', label: 'Board', icon: LayoutGrid }, { id: 'list', label: 'List', icon: List }]} />
            {access.canEdit('tasks') && <button className="btn primary" onClick={() => setParam('new', '1')}><Plus size={16} /> New task</button>}
          </>
        }
      />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="toolbar" style={{ borderBottom: 'none' }}>
          <SearchInput className="search" value={q} onChange={setQ} placeholder="Search tasks" />
          {!access.ownTasksOnly && (
            <select className="select sm" value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Assignee">
              <option value="">Everyone</option>
              {[...employees].sort((a, b) => a.name.localeCompare(b.name)).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          )}
          <select className="select sm" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
            <option value="">Any priority</option>
            {TASK_PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <Segmented
            label="Due"
            value={due}
            onChange={setDue}
            options={[{ id: 'all', label: 'Any time' }, { id: 'overdue', label: 'Overdue' }, { id: 'today', label: 'Today' }, { id: 'week', label: 'This week' }]}
          />
          {filtersActive && <ClearButton onClick={() => { setQ(''); setAssignee(''); setPriority(''); setDue('all'); }} />}
        </div>
      </div>

      {view === 'board' ? (
        <div className="kanban">
          {TASK_STATUSES.map((col) => {
            const items = visible.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className={`kanban-col ${dropCol === col.id ? 'drop' : ''}`}
                onDragOver={(e) => { if (dragId) { e.preventDefault(); setDropCol(col.id); } }}
                onDragLeave={() => setDropCol((c) => (c === col.id ? null : c))}
                onDrop={(e) => {
                  e.preventDefault();
                  const task = tasks.find((t) => t.id === dragId);
                  if (task) changeStatus(task, col.id);
                  setDragId(null);
                  setDropCol(null);
                }}
              >
                <div className="kanban-col-head">
                  <span>{col.label}</span>
                  <span className="badge plain">{items.length}</span>
                </div>
                {items.length === 0 && <div className="small faint" style={{ padding: '12px 4px', textAlign: 'center' }}>Drop tasks here</div>}
                {items.map((t) => (
                  <article
                    key={t.id}
                    className={`task-card ${dragId === t.id ? 'dragging' : ''}`}
                    draggable={access.canEdit('tasks')}
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => { setDragId(null); setDropCol(null); }}
                    onClick={() => setParam('open', t.id)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && setParam('open', t.id)}
                  >
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="title">{t.title}</span>
                    </div>
                    <div className="row wrap" style={{ gap: 6 }}>
                      <StatusBadge kind="priority" status={t.priority} />
                      {dueLabel(t)}
                    </div>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <span className="row small muted" style={{ gap: 6 }}>
                        <Avatar name={employeeById[t.assigneeId]?.name ?? '?'} size="sm" />
                        {employeeById[t.assigneeId]?.name.split(' ')[0]}
                      </span>
                      {access.canEdit('tasks') && (
                        <span onClick={(e) => e.stopPropagation()}>
                          <QuickAction task={t} canApprove={canApprove} onStatus={(s) => changeStatus(t, s)} />
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <DataTable columns={columns} rows={visible} onRowClick={(t) => setParam('open', t.id)} pageSize={15} empty={{ title: 'No tasks match', text: 'Try changing the filters.' }} />
        </div>
      )}

      <TaskModal
        open={isNew || Boolean(openTask)}
        task={openTask}
        defaults={params.get('assignee') ? { assigneeId: params.get('assignee') } : undefined}
        onClose={() => {
          const next = new URLSearchParams(params);
          ['new', 'open', 'assignee'].forEach((k) => next.delete(k));
          setParams(next, { replace: true });
        }}
      />
    </>
  );
}
