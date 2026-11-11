// Demo role model. "edit" includes "view". Missing module = no access.

export const ROLES = {
  owner: {
    id: 'owner',
    label: 'Business owner',
    description: 'Overall performance, settings, reports and access control.',
  },
  manager: {
    id: 'manager',
    label: 'Manager',
    description: 'Coordinates employees, customers, daily operations and approvals.',
  },
  accountant: {
    id: 'accountant',
    label: 'Accountant',
    description: 'Invoices, payments, expenses and financial records.',
  },
  staff: {
    id: 'staff',
    label: 'Staff member',
    description: 'Assigned tasks and permitted customer and booking information.',
  },
};

export const ROLE_LIST = Object.values(ROLES);

const ACCESS = {
  owner: {
    dashboard: 'edit', customers: 'edit', sales: 'edit', invoices: 'edit', expenses: 'edit',
    employees: 'edit', tasks: 'edit', bookings: 'edit', inventory: 'edit', reports: 'edit',
    settings: 'edit',
  },
  manager: {
    dashboard: 'edit', customers: 'edit', sales: 'edit', invoices: 'view', expenses: 'view',
    employees: 'edit', tasks: 'edit', bookings: 'edit', inventory: 'edit', reports: 'view',
  },
  accountant: {
    dashboard: 'edit', customers: 'view', sales: 'view', invoices: 'edit', expenses: 'edit',
    reports: 'view', inventory: 'view',
  },
  staff: {
    dashboard: 'view', customers: 'view', tasks: 'edit', bookings: 'edit', inventory: 'view',
  },
};

export function canView(role, module) {
  return Boolean(ACCESS[role]?.[module]);
}

export function canEdit(role, module) {
  return ACCESS[role]?.[module] === 'edit';
}

/** Can this role see money figures (revenue, balances, expenses)? */
export function canSeeFinancials(role) {
  return role === 'owner' || role === 'accountant' || role === 'manager';
}

/** Expense approval is a manager/owner responsibility. */
export function canApproveExpenses(role) {
  return role === 'owner' || role === 'manager';
}

/** Staff members only see tasks assigned to themselves. */
export function seesOnlyOwnTasks(role) {
  return role === 'staff';
}

export function accessSummary(role) {
  return ACCESS[role] || {};
}
