// All record dates are stored as local ISO date strings: "YYYY-MM-DD".

const pad = (n) => String(n).padStart(2, '0');

export function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDays(iso, days) {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function daysFromToday(days) {
  return addDays(todayISO(), days);
}

export function diffDays(aISO, bISO) {
  return Math.round((parseISODate(aISO) - parseISODate(bISO)) / 86400000);
}

export function startOfWeekISO(iso = todayISO()) {
  const d = parseISODate(iso);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return toISODate(d);
}

export function startOfMonthISO(iso = todayISO()) {
  const d = parseISODate(iso);
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function startOfYearISO(iso = todayISO()) {
  const d = parseISODate(iso);
  return toISODate(new Date(d.getFullYear(), 0, 1));
}

export const DATE_RANGES = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'year', label: 'This year' },
];

/** Returns { from, to } (inclusive ISO dates) for a named range. */
export function rangeBounds(rangeId) {
  const to = todayISO();
  switch (rangeId) {
    case 'today':
      return { from: to, to };
    case 'week':
      return { from: startOfWeekISO(to), to };
    case 'year':
      return { from: startOfYearISO(to), to };
    case 'month':
    default:
      return { from: startOfMonthISO(to), to };
  }
}

/**
 * The comparable earlier period: yesterday, the same days of last week,
 * the same dates last month, or the same dates last year (period-to-date comparison).
 */
export function previousRangeBounds(rangeId) {
  const today = parseISODate(todayISO());
  const shift = (d, { days = 0, months = 0, years = 0 }) => {
    const r = new Date(d.getFullYear() + years, d.getMonth() + months, 1);
    // Clamp the day so e.g. 31 March → 28/29 February instead of rolling over.
    const lastDay = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
    r.setDate(Math.min(d.getDate(), lastDay) + days);
    return toISODate(r);
  };
  const { from, to } = rangeBounds(rangeId);
  const f = parseISODate(from);
  switch (rangeId) {
    case 'today':
      return { from: addDays(from, -1), to: addDays(to, -1) };
    case 'week':
      return { from: addDays(from, -7), to: addDays(to, -7) };
    case 'year':
      return { from: shift(f, { years: -1 }), to: shift(today, { years: -1 }) };
    case 'month':
    default:
      return { from: shift(f, { months: -1 }), to: shift(today, { months: -1 }) };
  }
}

export function inRange(iso, { from, to }) {
  return iso >= from && iso <= to;
}

export function formatDate(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '—';
  return parseISODate(iso).toLocaleDateString(undefined, opts);
}

export function formatShortDate(iso) {
  return formatDate(iso, { day: 'numeric', month: 'short' });
}

export function relativeDay(iso) {
  const diff = diffDays(iso, todayISO());
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  if (diff < -1 && diff > -7) return `${-diff} days ago`;
  return formatDate(iso);
}

export function timeAgo(timestamp) {
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
