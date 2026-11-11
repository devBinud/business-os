import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, ListPlus, Mail, Phone, Building2, CalendarDays, ShieldCheck, Check, Minus } from 'lucide-react';
import { useStore } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { PageHeader, Card, StatusBadge, Avatar, EmptyState } from '../components/ui.jsx';
import EmployeeForm from '../components/forms/EmployeeForm.jsx';
import { formatDate, relativeDay, todayISO } from '../utils/date.js';
import { ROLES, accessSummary } from '../utils/permissions.js';
import { MODULES } from '../data/modules.js';
import NotFound from './NotFound.jsx';

export default function EmployeeDetail() {
  const { id } = useParams();
  const { employees, tasks } = useStore();
  const access = useAccess();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const employee = employees.find((e) => e.id === id);
  if (!employee) return <NotFound title="Employee not found" />;

  const today = todayISO();
  const theirTasks = tasks.filter((t) => t.assigneeId === id).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const open = theirTasks.filter((t) => t.status !== 'done');
  const done = theirTasks.filter((t) => t.status === 'done');
  const roleAccess = accessSummary(employee.appRole);

  return (
    <>
      <PageHeader
        breadcrumb={<Link to="/employees" className="breadcrumb"><ArrowLeft size={14} /> Employees</Link>}
        title={
          <span className="row" style={{ gap: 14 }}>
            <Avatar name={employee.name} size="lg" />
            <span>
              <span className="row" style={{ gap: 10 }}>{employee.name} <StatusBadge kind="employee" status={employee.status} /></span>
              <span className="muted" style={{ fontSize: 14, fontWeight: 400, display: 'block' }}>{employee.title} · {employee.department}</span>
            </span>
          </span>
        }
        actions={
          <>
            {access.canEdit('tasks') && (
              <Link className="btn" to={`/tasks?new=1&assignee=${employee.id}`}><ListPlus size={16} /> Assign task</Link>
            )}
            {access.canEdit('employees') && <button className="btn" onClick={() => setEditOpen(true)}><Pencil size={16} /> Edit</button>}
          </>
        }
      />

      <div className="grid grid-main-side" style={{ alignItems: 'start' }}>
        <div className="stack">
          {access.canView('tasks') && (
            <Card title="Assigned tasks" subtitle={`${open.length} open · ${done.length} completed`} flush>
              {theirTasks.length === 0 ? (
                <EmptyState title="No tasks assigned" />
              ) : (
                <ul className="list">
                  {theirTasks.map((t) => (
                    <li key={t.id} className="list-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/tasks?open=${t.id}`)}>
                      <span className="grow">
                        <div className="title" style={t.status === 'done' ? { textDecoration: 'line-through', color: 'var(--muted)' } : undefined}>{t.title}</div>
                        <div className={`sub ${t.status !== 'done' && t.dueDate < today ? 'text-danger' : ''}`}>Due {relativeDay(t.dueDate).toLowerCase()}</div>
                      </span>
                      <StatusBadge kind="priority" status={t.priority} />
                      <StatusBadge kind="task" status={t.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Card title="Access in Business OS" subtitle={`${ROLES[employee.appRole].label} — ${ROLES[employee.appRole].description}`} flush>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Module</th><th>View</th><th>Create & edit</th></tr></thead>
                <tbody>
                  {MODULES.map((m) => {
                    const level = roleAccess[m.id];
                    return (
                      <tr key={m.id}>
                        <td><span className="row" style={{ gap: 8 }}><m.icon size={15} className="faint" /> {m.label}</span></td>
                        <td>{level ? <Check size={16} className="text-success" /> : <Minus size={16} className="faint" />}</td>
                        <td>{level === 'edit' ? <Check size={16} className="text-success" /> : <Minus size={16} className="faint" />}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card title="Profile">
          <dl className="dl" style={{ gridTemplateColumns: '120px minmax(0,1fr)' }}>
            <dt><span className="row" style={{ gap: 6 }}><Mail size={14} /> Email</span></dt><dd><a href={`mailto:${employee.email}`}>{employee.email}</a></dd>
            <dt><span className="row" style={{ gap: 6 }}><Phone size={14} /> Phone</span></dt><dd>{employee.phone || '—'}</dd>
            <dt><span className="row" style={{ gap: 6 }}><Building2 size={14} /> Department</span></dt><dd>{employee.department}</dd>
            <dt><span className="row" style={{ gap: 6 }}><ShieldCheck size={14} /> Access</span></dt><dd>{ROLES[employee.appRole].label}</dd>
            <dt><span className="row" style={{ gap: 6 }}><CalendarDays size={14} /> Started</span></dt><dd>{formatDate(employee.startDate)}</dd>
          </dl>
        </Card>
      </div>

      <EmployeeForm open={editOpen} onClose={() => setEditOpen(false)} employee={employee} />
    </>
  );
}
