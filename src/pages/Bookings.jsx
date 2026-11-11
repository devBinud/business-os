import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, List, CalendarDays, ChevronLeft, ChevronRight, FilePlus2, FileText, UserPlus, TriangleAlert, Pencil } from 'lucide-react';
import { useStore, useLookups } from '../store/DemoStore.jsx';
import { useAccess } from '../store/useAccess.js';
import { PageHeader, SearchInput, StatusBadge, Segmented, Modal, Field, ClearButton, StatCard } from '../components/ui.jsx';
import DataTable from '../components/DataTable.jsx';
import CustomerForm from '../components/forms/CustomerForm.jsx';
import { useToast } from '../components/Toast.jsx';
import { useForm } from '../utils/useForm.js';
import { required } from '../utils/validation.js';
import { BOOKING_STATUSES, RESOURCES } from '../data/modules.js';
import { addDays, diffDays, formatDate, parseISODate, toISODate, todayISO } from '../utils/date.js';

const overlaps = (a, b) => a.start <= b.end && b.start <= a.end;

function BookingForm({ open, onClose, booking, defaults }) {
  const { customers, bookings, actions, money } = useStore();
  const toast = useToast();
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const blank = { customerId: '', resource: RESOURCES[0], start: todayISO(), end: addDays(todayISO(), 1), guests: 1, amount: '', status: 'pending', notes: '' };
  const form = useForm(blank, {
    customerId: [required('Choose a customer')],
    start: [required('Choose a start date')],
    end: [required('Choose an end date'), [(v, all) => v >= all.start, "End date can't be before the start date"]],
    guests: [[(v) => Number(v) >= 1, 'At least 1 guest']],
    amount: [[(v) => v === '' || Number(v) >= 0, 'Enter a valid amount']],
  });

  useEffect(() => {
    if (open) form.reset(booking ? { ...booking } : { ...blank, ...defaults });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const v = form.values;
  const conflict = bookings.find(
    (b) => b.id !== booking?.id && b.status !== 'cancelled' && b.resource === v.resource && v.start && v.end && overlaps(b, v),
  );

  const save = () =>
    form.submit((values) => {
      if (conflict && values.status !== 'cancelled') return;
      actions.saveBooking({ ...(booking || {}), ...values, guests: Number(values.guests), amount: Number(values.amount) || 0 });
      toast(booking ? 'Booking updated' : 'Booking created');
      onClose();
    });

  const nights = Math.max(diffDays(v.end || v.start, v.start), 0);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={booking ? `Edit ${booking.number}` : 'New booking'}
        description="Reservation for a room, hall or table."
        onSubmit={save}
        footer={
          <>
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={Boolean(conflict) && v.status !== 'cancelled'}>{booking ? 'Save changes' : 'Create booking'}</button>
          </>
        }
      >
        <div className="stack">
          <div className="form-grid">
            <Field label="Customer" error={form.errors.customerId} className="full">
              {(id) => (
                <div className="row" style={{ gap: 8 }}>
                  <select id={id} {...form.bind('customerId', 'select')}>
                    <option value="">Select a customer…</option>
                    {[...customers].filter((c) => c.status !== 'inactive' || c.id === v.customerId).sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button type="button" className="btn" onClick={() => setCustomerFormOpen(true)} title="Add new customer"><UserPlus size={16} /></button>
                </div>
              )}
            </Field>
            <Field label="Room / resource" className="full">
              {(id) => <select id={id} {...form.bind('resource', 'select')}>{RESOURCES.map((r) => <option key={r}>{r}</option>)}</select>}
            </Field>
            <Field label="Start" error={form.errors.start}>{(id) => <input id={id} type="date" {...form.bind('start')} />}</Field>
            <Field label="End" error={form.errors.end} hint={nights ? `${nights} night${nights === 1 ? '' : 's'}` : 'Same-day booking'}>
              {(id) => <input id={id} type="date" min={v.start} {...form.bind('end')} />}
            </Field>
            <Field label="Guests" error={form.errors.guests}>{(id) => <input id={id} type="number" min="1" {...form.bind('guests')} />}</Field>
            <Field label="Amount" error={form.errors.amount} hint={v.amount ? money(v.amount) : 'Optional'}>{(id) => <input id={id} type="number" min="0" step="0.01" {...form.bind('amount')} />}</Field>
            <Field label="Status">
              {(id) => <select id={id} {...form.bind('status', 'select')}>{BOOKING_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>}
            </Field>
            <Field label="Notes" className="full">{(id) => <input id={id} {...form.bind('notes')} placeholder="Special requests (optional)" />}</Field>
          </div>
          {conflict && v.status !== 'cancelled' && (
            <div className="alert danger small" role="alert">
              <TriangleAlert size={16} />
              <span className="grow">
                {v.resource} is already booked {formatDate(conflict.start)} – {formatDate(conflict.end)} ({conflict.number}). Choose different dates or another room.
              </span>
            </div>
          )}
        </div>
      </Modal>
      <CustomerForm open={customerFormOpen} onClose={() => setCustomerFormOpen(false)} onSaved={(id) => form.setValue('customerId', id)} />
    </>
  );
}

function BookingDetail({ booking, onClose, onEdit }) {
  const { actions, money, invoices, business } = useStore();
  const { customerById } = useLookups();
  const access = useAccess();
  const navigate = useNavigate();
  const toast = useToast();
  const customer = customerById[booking.customerId];
  const invoice = invoices.find((i) => i.bookingId === booking.id);
  const nights = Math.max(diffDays(booking.end, booking.start), 1);
  const canEdit = access.canEdit('bookings');

  const setStatus = (s) => {
    actions.setBookingStatus(booking.id, s);
    toast(`${booking.number} marked ${s}`);
  };

  const createInvoice = () => {
    const id = actions.saveInvoice({
      customerId: booking.customerId,
      bookingId: booking.id,
      issueDate: todayISO(),
      dueDate: addDays(todayISO(), 7),
      taxRate: business.taxRate,
      items: [{ id: `li_${booking.id}`, description: `${booking.resource} (${formatDate(booking.start)} – ${formatDate(booking.end)})`, qty: nights, price: Math.round((booking.amount / nights) * 100) / 100 }],
      notes: `Booking ${booking.number}`,
    });
    toast('Invoice created from booking');
    navigate(`/invoices/${id}`);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={<span className="row" style={{ gap: 10 }}>{booking.number} <StatusBadge kind="booking" status={booking.status} /></span>}
      description={booking.resource}
      footer={
        <>
          {canEdit && <button type="button" className="btn" onClick={onEdit}><Pencil size={16} /> Edit</button>}
          <span className="spacer" />
          {invoice ? (
            <Link className="btn" to={`/invoices/${invoice.id}`}><FileText size={16} /> View {invoice.number}</Link>
          ) : (
            access.canEdit('invoices') && booking.amount > 0 && booking.status !== 'cancelled' && (
              <button type="button" className="btn" onClick={createInvoice}><FilePlus2 size={16} /> Create invoice</button>
            )
          )}
          {canEdit && booking.status === 'pending' && <button type="button" className="btn primary" onClick={() => setStatus('confirmed')}>Confirm booking</button>}
          {canEdit && booking.status === 'confirmed' && <button type="button" className="btn primary" onClick={() => setStatus('completed')}>Mark completed</button>}
        </>
      }
    >
      <div className="stack">
        <dl className="dl">
          <dt>Customer</dt>
          <dd>{customer ? <Link to={`/customers/${customer.id}`}>{customer.name}</Link> : 'Unknown'}{customer?.phone ? ` · ${customer.phone}` : ''}</dd>
          <dt>Dates</dt>
          <dd>{formatDate(booking.start)} – {formatDate(booking.end)} <span className="muted">({diffDays(booking.end, booking.start)} night{diffDays(booking.end, booking.start) === 1 ? '' : 's'})</span></dd>
          <dt>Guests</dt>
          <dd>{booking.guests}</dd>
          {access.financials && (<><dt>Amount</dt><dd>{booking.amount ? money(booking.amount) : '—'}</dd></>)}
          {booking.notes && (<><dt>Notes</dt><dd>{booking.notes}</dd></>)}
        </dl>
        {canEdit && (
          <div className="row wrap" style={{ gap: 8 }}>
            <span className="small muted">Status:</span>
            <Segmented label="Booking status" value={booking.status} onChange={setStatus} options={BOOKING_STATUSES} />
          </div>
        )}
      </div>
    </Modal>
  );
}

function MonthCalendar({ bookings, month, onOpen, customerById }) {
  const first = parseISODate(`${month}-01`);
  const startOffset = (first.getDay() + 6) % 7; // Monday first
  const gridStart = addDays(toISODate(first), -startOffset);
  const today = todayISO();
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const weeks = days[35].slice(0, 7) === month ? 6 : 5;

  return (
    <div className="calendar" role="grid">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="dow">{d}</div>)}
      {days.slice(0, weeks * 7).map((day) => {
        const items = bookings.filter((b) => b.start <= day && day <= b.end);
        return (
          <div key={day} className={`day ${day.slice(0, 7) !== month ? 'other' : ''} ${day === today ? 'today' : ''}`}>
            <span className="date">{Number(day.slice(8))}</span>
            {items.slice(0, 3).map((b) => (
              <button
                key={b.id}
                type="button"
                className={`cal-event ${b.status}`}
                onClick={() => onOpen(b.id)}
                title={`${b.number} · ${customerById[b.customerId]?.name} · ${b.resource}`}
              >
                {b.resource.split(' · ')[0]} · {customerById[b.customerId]?.name.split(' ')[0]}
              </button>
            ))}
            {items.length > 3 && <span className="small muted">+{items.length - 3} more</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function Bookings() {
  const { bookings, money } = useStore();
  const { customerById } = useLookups();
  const access = useAccess();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState('calendar');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(params.get('status') || 'all');
  const [resource, setResource] = useState('');
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const today = todayISO();
  const openId = params.get('open');
  const openBooking = bookings.find((b) => b.id === openId);

  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing(null);
      setFormOpen(true);
    }
  }, [params]);

  const updateParams = (fn) => {
    const next = new URLSearchParams(params);
    fn(next);
    setParams(next, { replace: true });
  };

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return bookings
      .filter((b) => status === 'all' || b.status === status)
      .filter((b) => !resource || b.resource === resource)
      .filter((b) => !term || `${b.number} ${b.resource} ${customerById[b.customerId]?.name}`.toLowerCase().includes(term))
      .map((b) => ({ ...b, customerName: customerById[b.customerId]?.name ?? 'Unknown' }));
  }, [bookings, status, resource, q, customerById]);

  const active = bookings.filter((b) => b.status !== 'cancelled');
  const inHouse = active.filter((b) => b.start <= today && today <= b.end && b.resource.startsWith('Room'));
  const roomCount = RESOURCES.filter((r) => r.startsWith('Room')).length;

  const shiftMonth = (delta) => {
    const d = parseISODate(`${month}-01`);
    d.setMonth(d.getMonth() + delta);
    setMonth(toISODate(d).slice(0, 7));
  };

  const columns = [
    { key: 'number', header: 'Booking', render: (b) => <span className="strong">{b.number}</span> },
    { key: 'customerName', header: 'Customer' },
    { key: 'resource', header: 'Room / resource' },
    { key: 'start', header: 'Dates', render: (b) => <span className="nowrap">{formatDate(b.start)} – {formatDate(b.end)}</span> },
    { key: 'guests', header: 'Guests', align: 'right' },
    ...(access.financials ? [{ key: 'amount', header: 'Amount', align: 'right', render: (b) => (b.amount ? money(b.amount) : '—') }] : []),
    { key: 'status', header: 'Status', render: (b) => <StatusBadge kind="booking" status={b.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Reservations for rooms, the conference hall and restaurant tables."
        actions={
          <>
            <Segmented label="View" value={view} onChange={setView} options={[{ id: 'calendar', label: 'Calendar', icon: CalendarDays }, { id: 'list', label: 'List', icon: List }]} />
            {access.canEdit('bookings') && <button className="btn primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={16} /> New booking</button>}
          </>
        }
      />

      <div className="stack">
        <div className="grid grid-4">
          <StatCard icon={CalendarDays} label="Arrivals today" value={active.filter((b) => b.start === today).length} />
          <StatCard icon={CalendarDays} label="Departures today" value={active.filter((b) => b.end === today && b.start !== today).length} />
          <StatCard icon={CalendarDays} label="Rooms occupied" value={`${new Set(inHouse.map((b) => b.resource)).size} / ${roomCount}`} />
          <StatCard icon={CalendarDays} label="Pending confirmation" value={bookings.filter((b) => b.status === 'pending').length} />
        </div>

        <div className="card">
          <div className="toolbar">
            {view === 'calendar' ? (
              <div className="row" style={{ gap: 6 }}>
                <button className="btn sm icon" onClick={() => shiftMonth(-1)} aria-label="Previous month"><ChevronLeft size={16} /></button>
                <strong style={{ minWidth: 130, textAlign: 'center' }}>
                  {parseISODate(`${month}-01`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </strong>
                <button className="btn sm icon" onClick={() => shiftMonth(1)} aria-label="Next month"><ChevronRight size={16} /></button>
                <button className="btn sm" onClick={() => setMonth(today.slice(0, 7))}>Today</button>
              </div>
            ) : (
              <SearchInput className="search" value={q} onChange={setQ} placeholder="Search booking, customer or room" />
            )}
            <span className="spacer" />
            <select className="select sm" value={resource} onChange={(e) => setResource(e.target.value)} aria-label="Room or resource">
              <option value="">All rooms & resources</option>
              {RESOURCES.map((r) => <option key={r}>{r}</option>)}
            </select>
            <select className="select sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Booking status">
              <option value="all">All statuses</option>
              {BOOKING_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            {(q || resource || status !== 'all') && <ClearButton onClick={() => { setQ(''); setResource(''); setStatus('all'); }} />}
          </div>
          {view === 'calendar' ? (
            <MonthCalendar bookings={rows} month={month} customerById={customerById} onOpen={(id) => updateParams((p) => p.set('open', id))} />
          ) : (
            <DataTable columns={columns} rows={rows} initialSort={{ key: 'start', dir: 'desc' }} onRowClick={(b) => updateParams((p) => p.set('open', b.id))} />
          )}
        </div>
      </div>

      <BookingForm
        open={formOpen}
        booking={editing}
        defaults={params.get('customer') ? { customerId: params.get('customer') } : undefined}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
          updateParams((p) => { p.delete('new'); p.delete('customer'); });
        }}
      />
      {openBooking && !formOpen && (
        <BookingDetail
          booking={openBooking}
          onClose={() => updateParams((p) => p.delete('open'))}
          onEdit={() => { setEditing(openBooking); setFormOpen(true); updateParams((p) => p.delete('open')); }}
        />
      )}
    </>
  );
}
