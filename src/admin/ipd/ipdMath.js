import { roundMoney } from '../billing/money';
import { toDateInputValue } from '../../lib/dateInput';

// Pure calculations for the IPD running bill. A patient's ledger (charges and payments in
// /patients/{id}/transactions) is the single source of truth; this only filters and sums it.

export const IPD_CATEGORIES = [
  'Room Rent', 'Doctor / Professional Charges', 'Nursing Charges', 'Consultation', 'Surgery', 'Operation Theatre',
  'Investigation', 'Laboratory', 'Radiology', 'Pharmacy', 'Medicines', 'Consumables', 'Procedures',
  'Medical Equipment', 'Food / Diet', 'Therapy', 'Other Charges',
];

const toJsDate = (v) => (v?.toDate ? v.toDate() : v instanceof Date ? v : null);
// Local calendar day key, YYYY-MM-DD.
export const dayKey = (v) => {
  const d = toJsDate(v);
  return d ? toDateInputValue(d) : '';
};

// The day a transaction counts on: an IPD charge's service date, otherwise its ledger date.
export const effectiveDay = (t) => dayKey(t.serviceDate || t.date || t.createdAt);

export const admissionStartDay = (enc) => dayKey(enc.startedAt);
export const admissionEndDay = (enc) => dayKey(enc.closedAt) || toDateInputValue(new Date());

// Length of stay in days, counting both the admission and the discharge (or current) day
// — the same inpatient-day convention Hospital Settlement accrues on.
export function lengthOfStay(enc) {
  const start = admissionStartDay(enc);
  const end = admissionEndDay(enc);
  if (!start) return 0;
  const ms = new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`);
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

// Transactions belonging to this admission: linked to it explicitly, or (for entries made
// without a link, e.g. a normal invoice) dated within the stay. Trashed entries excluded.
export function admissionTransactions(ledger, enc) {
  const start = admissionStartDay(enc);
  const end = admissionEndDay(enc);
  return (ledger || []).filter((t) => {
    if (t.isDeleted) return false;
    if (t.encounterId) return t.encounterId === enc.id;
    const day = effectiveDay(t);
    return day >= start && day <= end;
  });
}

const chargeAmount = (t) => roundMoney(t.netAmount);
const paymentAmount = (t) => roundMoney(t.amount);

const byDayThenEntry = (a, b) =>
  effectiveDay(a).localeCompare(effectiveDay(b)) || (a.createdAt?.toMillis?.() ?? Infinity) - (b.createdAt?.toMillis?.() ?? Infinity);

// Everything the account screen and the printed statement need for [from, to].
// balance > 0 → advance/credit; balance < 0 → outstanding (same sign as the ledger).
export function buildStatement(ledger, enc, from, to) {
  const txns = admissionTransactions(ledger, enc).sort(byDayThenEntry);
  const before = txns.filter((t) => effectiveDay(t) < from);
  const inRange = txns.filter((t) => effectiveDay(t) >= from && effectiveDay(t) <= to);

  const opening = roundMoney(before.reduce((s, t) => s + (t.type === 'payment' ? paymentAmount(t) : -chargeAmount(t)), 0));
  const charges = inRange.filter((t) => t.type === 'charge');
  const payments = inRange.filter((t) => t.type === 'payment');
  const totalCharges = roundMoney(charges.reduce((s, t) => s + chargeAmount(t), 0));
  const totalPayments = roundMoney(payments.reduce((s, t) => s + paymentAmount(t), 0));
  const balance = roundMoney(opening + totalPayments - totalCharges);

  // Charges grouped by day, each with its own total.
  const days = [];
  for (const c of charges) {
    const key = effectiveDay(c);
    let day = days[days.length - 1];
    if (!day || day.key !== key) days.push((day = { key, charges: [], total: 0 }));
    day.charges.push(c);
    day.total = roundMoney(day.total + chargeAmount(c));
  }

  // Debit / credit ledger with a running balance.
  let running = opening;
  const ledgerRows = inRange.map((t) => {
    const debit = t.type === 'charge' ? chargeAmount(t) : 0;
    const credit = t.type === 'payment' ? paymentAmount(t) : 0;
    running = roundMoney(running + credit - debit);
    return { t, debit, credit, balance: running };
  });

  return { opening, charges, payments, days, totalCharges, totalPayments, balance, ledgerRows };
}

// How a balance reads to a person: never a negative "outstanding".
export function balanceLabel(balance) {
  if (balance < 0) return { label: 'Outstanding Amount', amount: -balance, tone: 'due' };
  if (balance > 0) return { label: 'Advance / Credit Balance', amount: balance, tone: 'credit' };
  return { label: 'Fully Paid', amount: 0, tone: 'settled' };
}

// Display text for a charge line.
export const chargeTitle = (t) => t.serviceName || t.category || t.departmentName || 'Charge';
