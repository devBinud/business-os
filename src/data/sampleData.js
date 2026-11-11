// Sample data for one example business. Dates are generated relative to "today"
// so that dashboard date filters always show meaningful figures.

import { daysFromToday, addDays, todayISO } from '../utils/date.js';
import { OPTIONAL_MODULES } from './modules.js';

// Small deterministic random generator so the sample data is stable between resets.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const d = daysFromToday;

const business = {
  name: 'Summit View Hotel',
  industry: 'hotel',
  email: 'hello@summitview.example',
  phone: '+1 (555) 014-2290',
  address: '48 Lakeshore Road, Pinecrest',
  currency: 'USD',
  taxRate: 10,
  logoColor: '#2f5d62',
  enabledModules: OPTIONAL_MODULES.map((m) => m.id),
  notificationPrefs: {
    overdueInvoices: true,
    lowStock: true,
    pendingApprovals: true,
    taskDeadlines: true,
    newBookings: true,
    emailDigest: false,
  },
};

const employees = [
  { id: 'e1', name: 'Maya Patel', title: 'Owner', department: 'Management', appRole: 'owner', email: 'maya@summitview.example', phone: '+1 555 0101', startDate: '2019-03-01', status: 'active' },
  { id: 'e2', name: 'Daniel Brooks', title: 'Operations Manager', department: 'Management', appRole: 'manager', email: 'daniel@summitview.example', phone: '+1 555 0102', startDate: '2020-06-15', status: 'active' },
  { id: 'e3', name: 'Priya Nair', title: 'Accountant', department: 'Finance', appRole: 'accountant', email: 'priya@summitview.example', phone: '+1 555 0103', startDate: '2021-01-11', status: 'active' },
  { id: 'e4', name: 'Leo Martins', title: 'Housekeeping Supervisor', department: 'Housekeeping', appRole: 'staff', email: 'leo@summitview.example', phone: '+1 555 0104', startDate: '2021-09-20', status: 'active' },
  { id: 'e5', name: 'Sara Okafor', title: 'Front Desk Receptionist', department: 'Front office', appRole: 'staff', email: 'sara@summitview.example', phone: '+1 555 0105', startDate: '2022-02-07', status: 'active' },
  { id: 'e6', name: 'Tomás Rivera', title: 'Night Receptionist', department: 'Front office', appRole: 'staff', email: 'tomas@summitview.example', phone: '+1 555 0106', startDate: '2022-08-01', status: 'active' },
  { id: 'e7', name: 'Hana Kim', title: 'Head Chef', department: 'Kitchen', appRole: 'staff', email: 'hana@summitview.example', phone: '+1 555 0107', startDate: '2020-11-02', status: 'active' },
  { id: 'e8', name: 'Ravi Gurung', title: 'Maintenance Technician', department: 'Maintenance', appRole: 'staff', email: 'ravi@summitview.example', phone: '+1 555 0108', startDate: '2023-04-17', status: 'active' },
  { id: 'e9', name: 'Ella Fischer', title: 'Housekeeper', department: 'Housekeeping', appRole: 'staff', email: 'ella@summitview.example', phone: '+1 555 0109', startDate: '2023-06-05', status: 'active' },
  { id: 'e10', name: 'Omar Haddad', title: 'Sales & Events Coordinator', department: 'Sales', appRole: 'staff', email: 'omar@summitview.example', phone: '+1 555 0110', startDate: '2022-10-10', status: 'active' },
  { id: 'e11', name: 'Grace Liu', title: 'Finance Assistant', department: 'Finance', appRole: 'accountant', email: 'grace@summitview.example', phone: '+1 555 0111', startDate: '2024-01-08', status: 'active' },
  { id: 'e12', name: 'Kofi Mensah', title: 'Sous Chef', department: 'Kitchen', appRole: 'staff', email: 'kofi@summitview.example', phone: '+1 555 0112', startDate: '2024-03-25', status: 'active' },
  { id: 'e13', name: 'Lucia Romano', title: 'Housekeeper', department: 'Housekeeping', appRole: 'staff', email: 'lucia@summitview.example', phone: '+1 555 0113', startDate: '2024-07-01', status: 'on_leave' },
  { id: 'e14', name: 'Jonah Weiss', title: 'Front Office Lead', department: 'Front office', appRole: 'manager', email: 'jonah@summitview.example', phone: '+1 555 0114', startDate: '2021-05-03', status: 'active' },
  { id: 'e15', name: 'Aisha Bello', title: 'Kitchen Porter', department: 'Kitchen', appRole: 'staff', email: 'aisha@summitview.example', phone: '+1 555 0115', startDate: '2025-02-14', status: 'active' },
];

/** Employees who represent each demo role when switching roles. */
export const DEMO_USERS = { owner: 'e1', manager: 'e2', accountant: 'e3', staff: 'e4' };

const customers = [
  { id: 'c1', name: 'Northwind Travel Ltd', type: 'Company', email: 'bookings@northwind.example', phone: '+1 555 0201', city: 'Riverton', status: 'active', createdAt: d(-300) },
  { id: 'c2', name: 'James Carter', type: 'Individual', email: 'james.carter@mail.example', phone: '+1 555 0202', city: 'Pinecrest', status: 'active', createdAt: d(-210) },
  { id: 'c3', name: 'Bluebird Events Co.', type: 'Company', email: 'team@bluebird.example', phone: '+1 555 0203', city: 'Harbor City', status: 'active', createdAt: d(-280) },
  { id: 'c4', name: 'Emily Zhang', type: 'Individual', email: 'emily.z@mail.example', phone: '+1 555 0204', city: 'Oakvale', status: 'active', createdAt: d(-150) },
  { id: 'c5', name: 'Greenleaf Consulting', type: 'Company', email: 'admin@greenleaf.example', phone: '+1 555 0205', city: 'Riverton', status: 'active', createdAt: d(-240) },
  { id: 'c6', name: 'Mohammed Al-Sayed', type: 'Individual', email: 'm.alsayed@mail.example', phone: '+1 555 0206', city: 'Lakeside', status: 'active', createdAt: d(-95) },
  { id: 'c7', name: 'Sofia Rossi', type: 'Individual', email: 'sofia.rossi@mail.example', phone: '+1 555 0207', city: 'Pinecrest', status: 'active', createdAt: d(-60) },
  { id: 'c8', name: 'Atlas Engineering', type: 'Company', email: 'travel@atlas-eng.example', phone: '+1 555 0208', city: 'Granite Falls', status: 'active', createdAt: d(-190) },
  { id: 'c9', name: 'Hannah Becker', type: 'Individual', email: 'hannah.b@mail.example', phone: '+1 555 0209', city: 'Oakvale', status: 'inactive', createdAt: d(-330) },
  { id: 'c10', name: 'Sunrise Weddings', type: 'Company', email: 'plan@sunrise.example', phone: '+1 555 0210', city: 'Harbor City', status: 'active', createdAt: d(-120) },
  { id: 'c11', name: 'Arjun Mehta', type: 'Individual', email: 'arjun.m@mail.example', phone: '+1 555 0211', city: 'Lakeside', status: 'active', createdAt: d(-40) },
  { id: 'c12', name: 'Coastal Health Group', type: 'Company', email: 'ops@coastalhealth.example', phone: '+1 555 0212', city: 'Riverton', status: 'active', createdAt: d(-75) },
  { id: 'c13', name: 'Lina Novak', type: 'Individual', email: 'lina.novak@mail.example', phone: '+1 555 0213', city: 'Pinecrest', status: 'lead', createdAt: d(-6) },
  { id: 'c14', name: 'Peak Outdoor Club', type: 'Company', email: 'hello@peakclub.example', phone: '+1 555 0214', city: 'Granite Falls', status: 'lead', createdAt: d(-3) },
  { id: 'c15', name: 'Daniel Osei', type: 'Individual', email: 'd.osei@mail.example', phone: '+1 555 0215', city: 'Oakvale', status: 'active', createdAt: d(-25) },
  { id: 'c16', name: 'Marigold Foods', type: 'Company', email: 'accounts@marigold.example', phone: '+1 555 0216', city: 'Harbor City', status: 'active', createdAt: d(-160) },
].map((c) => ({ ...c, address: '', notes: [], tags: [] }));

// Notes & enquiry history for a few customers.
const addNote = (id, daysAgo, text, author = 'e5') => {
  const c = customers.find((x) => x.id === id);
  c.notes.push({ id: `n_${id}_${c.notes.length}`, date: d(-daysAgo), text, authorId: author });
};
addNote('c1', 40, 'Corporate rate agreed: 15% off standard rooms for groups of 5+.', 'e2');
addNote('c1', 8, 'Asked for invoice copies to be sent to finance@northwind.example.', 'e3');
addNote('c3', 20, 'Planning a product launch event in the conference hall next month.', 'e10');
addNote('c10', 14, 'Wedding block booking for 12 rooms — waiting on final guest list.', 'e10');
addNote('c13', 6, 'Enquiry by phone: weekend stay for 2 adults, prefers lake view.', 'e5');
addNote('c14', 3, 'Enquiry: group of 18 for a hiking retreat in spring. Sent price list.', 'e10');
addNote('c2', 30, 'Regular guest. Prefers quiet room on upper floor.', 'e5');
customers.find((c) => c.id === 'c1').tags = ['Corporate', 'Priority'];
customers.find((c) => c.id === 'c3').tags = ['Events'];
customers.find((c) => c.id === 'c10').tags = ['Events', 'Group'];
customers.find((c) => c.id === 'c2').tags = ['Returning guest'];

// ---------- Invoices ----------
const ROOM = 'Standard room · night';
const DELUXE = 'Deluxe room · night';
const SUITE = 'Suite · night';
const HALL = 'Conference hall · day';
const CATER = 'Catering package · per guest';
const BREAKFAST = 'Breakfast · per guest';

const invoices = [];
let invoiceNo = 1001;

function makeInvoice({ customerId, issued, dueIn = 14, items, payments = [], notes = '' }) {
  const id = `inv${invoiceNo}`;
  invoices.push({
    id,
    number: `INV-${invoiceNo++}`,
    customerId,
    issueDate: d(-issued),
    dueDate: d(-issued + dueIn),
    taxRate: business.taxRate,
    items: items.map(([description, qty, price], i) => ({ id: `${id}_i${i}`, description, qty, price })),
    payments: payments.map(([daysAgo, amount, method], i) => ({ id: `${id}_p${i}`, date: d(-daysAgo), amount, method })),
    notes,
  });
  return id;
}

// Historical, fully paid invoices across the past ~10 months (feeds yearly charts).
const rand = seeded(42);
const historicalCustomers = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c8', 'c9', 'c10', 'c12', 'c16'];
// Roughly one invoice every two days, averaging ~$1,200 — a healthy small hotel.
for (let daysAgo = 310; daysAgo >= 12; daysAgo -= 1 + Math.floor(rand() * 3)) {
  const customerId = historicalCustomers[Math.floor(rand() * historicalCustomers.length)];
  const nights = 1 + Math.floor(rand() * 4);
  const rooms = 1 + Math.floor(rand() * 4);
  const deluxe = rand() > 0.6;
  const items = [[deluxe ? DELUXE : ROOM, nights * rooms, deluxe ? 185 : 120]];
  if (rand() > 0.5) items.push([BREAKFAST, nights * rooms * 2, 18]);
  if (rand() > 0.85) items.push([HALL, 1, 650]);
  if (rand() > 0.85) items.push([CATER, 20 + Math.floor(rand() * 40), 32]);
  const subtotal = items.reduce((s, [, q, p]) => s + q * p, 0);
  const total = Math.round(subtotal * 1.1 * 100) / 100;
  makeInvoice({
    customerId,
    issued: daysAgo,
    items,
    payments: [[daysAgo - Math.floor(rand() * 10), total, rand() > 0.5 ? 'Card' : 'Bank transfer']],
  });
}

// Recent invoices with a mix of statuses for the demo.
makeInvoice({ customerId: 'c1', issued: 26, items: [[ROOM, 10, 120], [BREAKFAST, 10, 18]], payments: [[12, 1518, 'Bank transfer']] }); // paid
makeInvoice({ customerId: 'c3', issued: 24, dueIn: 10, items: [[HALL, 2, 650], [CATER, 60, 32]], payments: [[16, 1000, 'Bank transfer']], notes: 'Product launch event' }); // overdue, partial
makeInvoice({ customerId: 'c8', issued: 21, dueIn: 14, items: [[DELUXE, 6, 185]] }); // overdue
makeInvoice({ customerId: 'c2', issued: 9, items: [[DELUXE, 3, 185], [BREAKFAST, 3, 18]], payments: [[9, 669.9, 'Card']] }); // paid
makeInvoice({ customerId: 'c10', issued: 6, dueIn: 21, items: [[ROOM, 12, 120], [CATER, 80, 32]], payments: [[4, 1500, 'Bank transfer']], notes: 'Deposit received for wedding block' }); // partial
makeInvoice({ customerId: 'c12', issued: 5, dueIn: 14, items: [[HALL, 1, 650], [CATER, 25, 32]] }); // unpaid
makeInvoice({ customerId: 'c6', issued: 3, items: [[SUITE, 2, 320]], payments: [[2, 704, 'Card']] }); // paid
makeInvoice({ customerId: 'c15', issued: 2, items: [[ROOM, 2, 120], [BREAKFAST, 4, 18]] }); // unpaid
makeInvoice({ customerId: 'c5', issued: 1, dueIn: 30, items: [[DELUXE, 8, 185], [HALL, 1, 650]], payments: [[0, 500, 'Bank transfer']] }); // partial, paid today
makeInvoice({ customerId: 'c7', issued: 0, items: [[ROOM, 3, 120]], payments: [[0, 396, 'Mobile wallet']] }); // paid today
makeInvoice({ customerId: 'c16', issued: 48, dueIn: 14, items: [[CATER, 40, 32]] }); // overdue a while

// ---------- Sales orders ----------
const orders = [
  { id: 'o1', number: 'SO-2001', customerId: 'c3', date: d(-30), status: 'fulfilled', items: [[HALL, 2, 650], [CATER, 60, 32]], invoiceId: 'inv' + (invoiceNo - 10) },
  { id: 'o2', number: 'SO-2002', customerId: 'c10', date: d(-12), status: 'confirmed', items: [[ROOM, 12, 120], [CATER, 80, 32]], invoiceId: 'inv' + (invoiceNo - 7) },
  { id: 'o3', number: 'SO-2003', customerId: 'c14', date: d(-2), status: 'quotation', items: [[ROOM, 9, 120], [BREAKFAST, 18, 18]] },
  { id: 'o4', number: 'SO-2004', customerId: 'c12', date: d(-8), status: 'fulfilled', items: [[HALL, 1, 650], [CATER, 25, 32]], invoiceId: 'inv' + (invoiceNo - 6) },
  { id: 'o5', number: 'SO-2005', customerId: 'c1', date: d(-4), status: 'confirmed', items: [[ROOM, 8, 120], [BREAKFAST, 8, 18]] },
  { id: 'o6', number: 'SO-2006', customerId: 'c13', date: d(-1), status: 'quotation', items: [[DELUXE, 2, 185]] },
  { id: 'o7', number: 'SO-2007', customerId: 'c9', date: d(-70), status: 'cancelled', items: [[SUITE, 3, 320]] },
  { id: 'o8', number: 'SO-2008', customerId: 'c8', date: d(-23), status: 'fulfilled', items: [[DELUXE, 6, 185]], invoiceId: 'inv' + (invoiceNo - 9) },
].map((o) => ({
  ...o,
  items: o.items.map(([description, qty, price], i) => ({ id: `${o.id}_i${i}`, description, qty, price })),
}));
// Link invoices back to their orders.
for (const o of orders) {
  if (o.invoiceId) {
    const inv = invoices.find((i) => i.id === o.invoiceId);
    if (inv) inv.orderId = o.id;
  }
}

// ---------- Expenses ----------
const expenses = [];
let expNo = 1;
const addExpense = (daysAgo, category, vendor, amount, method, status = 'approved', description = '') =>
  expenses.push({ id: `x${expNo++}`, date: d(-daysAgo), category, vendor, amount, method, status, description, submittedBy: 'e3' });

const expRand = seeded(7);
for (let m = 10; m >= 0; m -= 1) {
  const base = m * 30 + 3;
  addExpense(base, 'Salaries', 'Payroll', 8600, 'Bank transfer', 'approved', 'Monthly payroll');
  addExpense(base - 1, 'Rent', 'Lakeshore Properties', 2800, 'Bank transfer', 'approved', 'Building lease');
  addExpense(Math.max(base - 8, 1), 'Utilities', 'City Power & Water', Math.round(650 + expRand() * 300), 'Bank transfer', 'approved', 'Electricity and water');
  addExpense(Math.max(base - 12, 1), 'Food & beverage', 'FreshFarm Supplies', Math.round(900 + expRand() * 500), 'Card', 'approved', 'Kitchen produce');
  addExpense(Math.max(base - 18, 1), 'Supplies', 'CleanPro Wholesale', Math.round(250 + expRand() * 200), 'Card', 'approved', 'Cleaning and room supplies');
  if (expRand() > 0.4) addExpense(Math.max(base - 22, 1), 'Maintenance', 'FixIt Services', Math.round(150 + expRand() * 500), 'Cash', 'approved', 'Repairs');
  if (expRand() > 0.5) addExpense(Math.max(base - 15, 1), 'Marketing', 'Local Listings Co.', Math.round(120 + expRand() * 300), 'Card', 'approved', 'Online listings');
  addExpense(Math.max(base - 5, 1), 'Software', 'CloudBooking SaaS', 89, 'Card', 'approved', 'Booking engine subscription');
}
addExpense(1, 'Maintenance', 'AquaHeat Plumbing', 640, 'Cash', 'pending', 'Boiler valve replacement — Room 202');
addExpense(0, 'Marketing', 'PrintHouse', 275, 'Card', 'pending', 'Brochures for winter season');
addExpense(2, 'Supplies', 'LinenWorks', 980, 'Bank transfer', 'pending', '40 new bath towel sets');
addExpense(0, 'Travel', 'City Cabs', 46, 'Cash', 'approved', 'Airport pickup for VIP guest');

// ---------- Tasks ----------
const tasks = [
  { title: 'Deep clean rooms 201–202 before wedding block', assigneeId: 'e4', priority: 'high', dueDate: d(1), status: 'in_progress' },
  { title: 'Restock minibar in all deluxe rooms', assigneeId: 'e4', priority: 'medium', dueDate: d(2), status: 'todo' },
  { title: 'Inspect housekeeping trolleys', assigneeId: 'e4', priority: 'low', dueDate: d(-1), status: 'todo' },
  { title: 'Prepare linen count for monthly audit', assigneeId: 'e4', priority: 'medium', dueDate: d(5), status: 'todo' },
  { title: 'Follow up with Bluebird Events on overdue balance', assigneeId: 'e3', priority: 'urgent', dueDate: d(0), status: 'todo' },
  { title: 'Reconcile October card payments', assigneeId: 'e11', priority: 'high', dueDate: d(3), status: 'in_progress' },
  { title: 'Fix boiler valve in Room 202', assigneeId: 'e8', priority: 'urgent', dueDate: d(0), status: 'in_progress' },
  { title: 'Quarterly fire extinguisher check', assigneeId: 'e8', priority: 'medium', dueDate: d(9), status: 'todo' },
  { title: 'Draft winter season menu', assigneeId: 'e7', priority: 'medium', dueDate: d(6), status: 'review' },
  { title: 'Send quotation to Peak Outdoor Club', assigneeId: 'e10', priority: 'high', dueDate: d(1), status: 'todo' },
  { title: 'Confirm wedding guest list with Sunrise Weddings', assigneeId: 'e10', priority: 'high', dueDate: d(4), status: 'in_progress' },
  { title: 'Update front desk check-in checklist', assigneeId: 'e5', priority: 'low', dueDate: d(7), status: 'todo' },
  { title: 'Call Lina Novak about weekend availability', assigneeId: 'e5', priority: 'medium', dueDate: d(0), status: 'todo' },
  { title: 'Train new kitchen porter on hygiene standards', assigneeId: 'e12', priority: 'medium', dueDate: d(-3), status: 'done' },
  { title: 'Order replacement towels', assigneeId: 'e9', priority: 'low', dueDate: d(-5), status: 'done' },
  { title: 'Review staff rota for December', assigneeId: 'e2', priority: 'high', dueDate: d(2), status: 'todo' },
].map((t, i) => ({ id: `t${i + 1}`, description: '', createdAt: d(-10 + (i % 7)), createdBy: 'e2', ...t }));

// ---------- Bookings ----------
const bookings = [
  { customerId: 'c2', resource: 'Room 201 · Deluxe', start: d(-2), end: d(1), guests: 1, status: 'confirmed', amount: 555 },
  { customerId: 'c6', resource: 'Room 301 · Suite', start: d(-3), end: d(-1), guests: 2, status: 'completed', amount: 640 },
  { customerId: 'c7', resource: 'Room 101 · Standard', start: d(0), end: d(3), guests: 2, status: 'confirmed', amount: 360 },
  { customerId: 'c15', resource: 'Room 102 · Standard', start: d(0), end: d(2), guests: 2, status: 'confirmed', amount: 240 },
  { customerId: 'c13', resource: 'Room 202 · Deluxe', start: d(3), end: d(5), guests: 2, status: 'pending', amount: 370 },
  { customerId: 'c3', resource: 'Conference Hall', start: d(6), end: d(6), guests: 60, status: 'confirmed', amount: 650 },
  { customerId: 'c10', resource: 'Room 103 · Standard', start: d(12), end: d(14), guests: 2, status: 'confirmed', amount: 240 },
  { customerId: 'c10', resource: 'Room 201 · Deluxe', start: d(12), end: d(14), guests: 2, status: 'confirmed', amount: 370 },
  { customerId: 'c1', resource: 'Room 102 · Standard', start: d(8), end: d(10), guests: 1, status: 'confirmed', amount: 240 },
  { customerId: 'c14', resource: 'Conference Hall', start: d(18), end: d(18), guests: 18, status: 'pending', amount: 650 },
  { customerId: 'c11', resource: 'Room 301 · Suite', start: d(4), end: d(7), guests: 2, status: 'pending', amount: 960 },
  { customerId: 'c4', resource: 'Restaurant table · 8 seats', start: d(1), end: d(1), guests: 6, status: 'confirmed', amount: 0 },
  { customerId: 'c9', resource: 'Room 101 · Standard', start: d(-12), end: d(-10), guests: 1, status: 'cancelled', amount: 240 },
  { customerId: 'c5', resource: 'Room 202 · Deluxe', start: d(-8), end: d(-5), guests: 1, status: 'completed', amount: 555 },
  { customerId: 'c12', resource: 'Conference Hall', start: d(-5), end: d(-5), guests: 25, status: 'completed', amount: 650 },
].map((b, i) => ({ id: `b${i + 1}`, number: `BK-${3001 + i}`, notes: '', createdAt: addDays(b.start, -7), ...b }));

// ---------- Inventory ----------
const products = [
  ['Bath towel set', 'Linen', 'LinenWorks', 64, 40, 14.5],
  ['Bed sheet (queen)', 'Linen', 'LinenWorks', 22, 30, 21],
  ['Shampoo 50 ml', 'Amenities', 'CleanPro Wholesale', 340, 150, 0.6],
  ['Soap bar', 'Amenities', 'CleanPro Wholesale', 120, 150, 0.4],
  ['Toilet paper (case of 48)', 'Housekeeping', 'CleanPro Wholesale', 9, 6, 32],
  ['Multi-surface cleaner 5 L', 'Housekeeping', 'CleanPro Wholesale', 4, 5, 18],
  ['Coffee capsules (box of 50)', 'Minibar', 'BrewMasters', 18, 10, 22],
  ['Bottled water 500 ml', 'Minibar', 'Spring Valley', 240, 120, 0.35],
  ['Snack pack', 'Minibar', 'FreshFarm Supplies', 35, 40, 1.8],
  ['Light bulb LED 9W', 'Maintenance', 'FixIt Services', 46, 20, 2.1],
  ['Key card (blank)', 'Front office', 'SecureCard Inc.', 150, 50, 0.9],
  ['Printer paper (ream)', 'Front office', 'OfficeMart', 3, 5, 5.5],
].map(([name, category, supplier, stock, reorderLevel, unitCost], i) => ({
  id: `p${i + 1}`,
  sku: `SKU-${String(101 + i)}`,
  name, category, supplier, stock, reorderLevel, unitCost,
}));

const stockMovements = [
  { productId: 'p2', type: 'out', qty: 12, date: d(-1), reason: 'Issued to housekeeping', by: 'e4' },
  { productId: 'p4', type: 'out', qty: 60, date: d(-2), reason: 'Room restock', by: 'e9' },
  { productId: 'p1', type: 'in', qty: 40, date: d(-5), reason: 'Delivery from LinenWorks', by: 'e2' },
  { productId: 'p6', type: 'out', qty: 3, date: d(-3), reason: 'Issued to housekeeping', by: 'e4' },
  { productId: 'p12', type: 'out', qty: 4, date: d(-4), reason: 'Front desk use', by: 'e5' },
].map((m, i) => ({ id: `m${i + 1}`, ...m }));

// ---------- Activity feed ----------
const now = Date.now();
const H = 3600000;
const activity = [
  { type: 'payment', text: 'Payment of $396.00 recorded for INV-' + (invoiceNo - 2) + ' (Sofia Rossi)', actorId: 'e3', at: now - 0.5 * H },
  { type: 'task', text: 'Ravi Gurung started “Fix boiler valve in Room 202”', actorId: 'e8', at: now - 1.5 * H },
  { type: 'expense', text: 'Expense of $275.00 submitted for approval (PrintHouse)', actorId: 'e3', at: now - 3 * H },
  { type: 'booking', text: 'Booking BK-3005 created for Lina Novak (pending)', actorId: 'e5', at: now - 5 * H },
  { type: 'payment', text: 'Payment of $500.00 recorded for INV-' + (invoiceNo - 3) + ' (Greenleaf Consulting)', actorId: 'e3', at: now - 7 * H },
  { type: 'customer', text: 'New enquiry from Peak Outdoor Club', actorId: 'e10', at: now - 26 * H },
  { type: 'invoice', text: 'Invoice INV-' + (invoiceNo - 4) + ' created for Daniel Osei', actorId: 'e3', at: now - 48 * H },
  { type: 'inventory', text: 'Stock low: Multi-surface cleaner 5 L (4 left)', actorId: 'e4', at: now - 70 * H },
].map((a, i) => ({ id: `a${i + 1}`, ...a }));

export function createSampleState() {
  return {
    version: 1,
    seededOn: todayISO(),
    business: structuredClone(business),
    setupComplete: false,
    customers: structuredClone(customers),
    employees: structuredClone(employees),
    invoices: structuredClone(invoices),
    orders: structuredClone(orders),
    expenses: structuredClone(expenses),
    tasks: structuredClone(tasks),
    bookings: structuredClone(bookings),
    products: structuredClone(products),
    stockMovements: structuredClone(stockMovements),
    activity: structuredClone(activity),
  };
}
