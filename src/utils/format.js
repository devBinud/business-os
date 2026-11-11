export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'INR', label: 'Indian Rupee (INR)' },
  { code: 'NPR', label: 'Nepalese Rupee (NPR)' },
  { code: 'AED', label: 'UAE Dirham (AED)' },
];

const formatterCache = new Map();

function currencyFormatter(currency, compact) {
  const key = `${currency}|${compact}`;
  if (!formatterCache.has(key)) {
    formatterCache.set(
      key,
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: compact ? 1 : 2,
        minimumFractionDigits: compact ? 0 : 2,
        notation: compact ? 'compact' : 'standard',
      }),
    );
  }
  return formatterCache.get(key);
}

export function formatMoney(amount, currency = 'USD', { compact = false } = {}) {
  return currencyFormatter(currency, compact).format(Number(amount) || 0);
}

export function formatNumber(n) {
  return new Intl.NumberFormat().format(Number(n) || 0);
}

export function formatPercent(ratio, digits = 0) {
  if (!Number.isFinite(ratio)) return '—';
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function capitalize(s = '') {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function pluralize(count, word, plural = `${word}s`) {
  return `${formatNumber(count)} ${count === 1 ? word : plural}`;
}
