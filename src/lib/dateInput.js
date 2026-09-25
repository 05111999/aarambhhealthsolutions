import { Timestamp } from 'firebase/firestore';

export function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

export function dateInputToTimestamp(value) {
  return Timestamp.fromDate(new Date(`${value}T00:00:00`));
}

export function isTodayInputValue(value) {
  return value === toDateInputValue(new Date());
}
