import { Timestamp } from 'firebase/firestore';

// Local calendar date (YYYY-MM-DD). toISOString() would give the UTC date, which in
// India is the previous day before 5:30 am and for any stored local-midnight date.
export function toDateInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dateInputToTimestamp(value) {
  return Timestamp.fromDate(new Date(`${value}T00:00:00`));
}

export function isTodayInputValue(value) {
  return value === toDateInputValue(new Date());
}
