import {
  LayoutDashboard, Users, ShoppingCart, FileText, Receipt, IdCard, CheckSquare,
  CalendarDays, Package, BarChart3, Settings,
} from 'lucide-react';

// Order matches the sidebar described in the product document (section 8).
export const MODULES = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, core: true,
    description: 'Summary of key activity, figures, alerts and recent updates.' },
  { id: 'customers', label: 'Customers', path: '/customers', icon: Users, core: true,
    description: 'Customer profiles, contact details, notes, enquiries and history.' },
  { id: 'sales', label: 'Sales', path: '/sales', icon: ShoppingCart,
    description: 'Sales records, quotations, orders, statuses and order history.' },
  { id: 'invoices', label: 'Invoices', path: '/invoices', icon: FileText,
    description: 'Create invoices, record payments and track outstanding balances.' },
  { id: 'expenses', label: 'Expenses', path: '/expenses', icon: Receipt,
    description: 'Record business expenses, categories, dates and payment methods.' },
  { id: 'employees', label: 'Employees', path: '/employees', icon: IdCard, core: true,
    description: 'Employee profiles, departments, roles and contact information.' },
  { id: 'tasks', label: 'Tasks', path: '/tasks', icon: CheckSquare,
    description: 'Create, assign, prioritize and track work.' },
  { id: 'bookings', label: 'Bookings', path: '/bookings', icon: CalendarDays,
    description: 'Manage appointments or reservations.' },
  { id: 'inventory', label: 'Inventory', path: '/inventory', icon: Package,
    description: 'Products, stock levels, suppliers and stock movements.' },
  { id: 'reports', label: 'Reports', path: '/reports', icon: BarChart3,
    description: 'Summaries of sales, payments, expenses, customers and operations.' },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings, core: true,
    description: 'Business profile, users, roles and permissions.' },
];

export const MODULE_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m]));

export const OPTIONAL_MODULES = MODULES.filter((m) => !m.core);

export const INDUSTRIES = [
  { id: 'hotel', label: 'Hotel / hospitality' },
  { id: 'clinic', label: 'Clinic / healthcare' },
  { id: 'retail', label: 'Retail store' },
  { id: 'restaurant', label: 'Restaurant / café' },
  { id: 'agency', label: 'Agency / services' },
  { id: 'other', label: 'Other' },
];

/** Sensible default modules per industry, used by the business setup screen. */
export const INDUSTRY_MODULES = {
  hotel: ['sales', 'invoices', 'expenses', 'tasks', 'bookings', 'inventory', 'reports'],
  clinic: ['invoices', 'expenses', 'tasks', 'bookings', 'reports'],
  retail: ['sales', 'invoices', 'expenses', 'tasks', 'inventory', 'reports'],
  restaurant: ['sales', 'invoices', 'expenses', 'tasks', 'bookings', 'inventory', 'reports'],
  agency: ['sales', 'invoices', 'expenses', 'tasks', 'reports'],
  other: ['sales', 'invoices', 'expenses', 'tasks', 'reports'],
};

export const EXPENSE_CATEGORIES = [
  'Utilities', 'Supplies', 'Salaries', 'Maintenance', 'Marketing', 'Food & beverage',
  'Rent', 'Software', 'Travel', 'Other',
];

export const PAYMENT_METHODS = ['Cash', 'Card', 'Bank transfer', 'Mobile wallet', 'Cheque'];

export const DEPARTMENTS = ['Management', 'Front office', 'Housekeeping', 'Finance', 'Kitchen', 'Maintenance', 'Sales'];

export const TASK_STATUSES = [
  { id: 'todo', label: 'To do' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'review', label: 'Awaiting review' },
  { id: 'done', label: 'Done' },
];

export const TASK_PRIORITIES = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' },
];

export const BOOKING_STATUSES = [
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const ORDER_STATUSES = [
  { id: 'quotation', label: 'Quotation' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'fulfilled', label: 'Fulfilled' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const CUSTOMER_TYPES = ['Individual', 'Company'];

export const CUSTOMER_STATUSES = [
  { id: 'lead', label: 'Enquiry' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
];

export const RESOURCES = [
  'Room 101 · Standard', 'Room 102 · Standard', 'Room 103 · Standard', 'Room 201 · Deluxe',
  'Room 202 · Deluxe', 'Room 301 · Suite', 'Conference Hall', 'Restaurant table · 8 seats',
];
