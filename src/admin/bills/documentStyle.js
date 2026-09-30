// Shared look for printed A4 documents (medical invoice, payment receipt).
export const INK = '#1A2B3C';
export const PRIMARY = '#0A6EBD';
export const TOTAL_RED = '#B91C1C';
export const MUTED = '#5A7184';

export function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(`${value}T00:00:00`);
  return null;
}

export const fmtDate = (value) => {
  const d = toDate(value);
  return d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
};
