import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useStore } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { PageHeader, SearchInput, StatusBadge, Person, ClearButton, Segmented } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import EmployeeForm from '../components/forms/EmployeeForm.jsx';
import { DEPARTMENTS } from '../data/modules.js';
import { ROLES } from '../utils/permissions.js';

export default function Employees() {
  const { employees, tasks } = useStore();
  const access = useAccess();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('all');
  const [formOpen, setFormOpen] = useState(false);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return employees
      .filter((e) => !department || e.department === department)
      .filter((e) => status === 'all' || e.status === status)
      .filter((e) => !term || `${e.name} ${e.title} ${e.email} ${e.department}`.toLowerCase().includes(term))
      .map((e) => ({ ...e, openTasks: tasks.filter((t) => t.assigneeId === e.id && t.status !== 'done').length }));
  }, [employees, tasks, q, department, status]);

  const columns = [
    { key: 'name', header: 'Employee', render: (e) => <Person name={e.name} sub={e.title} /> },
    { key: 'department', header: 'Department' },
    { key: 'appRole', header: 'Access role', sortValue: (e) => ROLES[e.appRole]?.label, render: (e) => <span className="tag">{ROLES[e.appRole]?.label}</span> },
    { key: 'email', header: 'Contact', render: (e) => (<div><div>{e.email}</div><div className="small muted">{e.phone}</div></div>) },
    ...(access.canView('tasks') ? [{ key: 'openTasks', header: 'Open tasks', align: 'right' }] : []),
    { key: 'status', header: 'Status', render: (e) => <StatusBadge kind="employee" status={e.status} /> },
  ];

  const usedDepartments = DEPARTMENTS.filter((d) => employees.some((e) => e.department === d));

  return (
    <>
      <PageHeader
        title="Employees"
        description={`${employees.filter((e) => e.status === 'active').length} active team members across ${usedDepartments.length} departments.`}
        actions={access.canEdit('employees') && <button className="btn primary" onClick={() => setFormOpen(true)}><Plus size={16} /> Add employee</button>}
      />
      <div className="card">
        <div className="toolbar">
          <SearchInput className="search" value={q} onChange={setQ} placeholder="Search name, title or email" />
          <select className="select sm" value={department} onChange={(e) => setDepartment(e.target.value)} aria-label="Department">
            <option value="">All departments</option>
            {usedDepartments.map((d) => <option key={d}>{d}</option>)}
          </select>
          <Segmented
            label="Status"
            value={status}
            onChange={setStatus}
            options={[{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'on_leave', label: 'On leave' }]}
          />
          {(q || department || status !== 'all') && <ClearButton onClick={() => { setQ(''); setDepartment(''); setStatus('all'); }} />}
        </div>
        <DataTable columns={columns} rows={rows} initialSort={{ key: 'name', dir: 'asc' }} onRowClick={(e) => navigate(`/employees/${e.id}`)} pageSize={15} />
      </div>
      <EmployeeForm open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
