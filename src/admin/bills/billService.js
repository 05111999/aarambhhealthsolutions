import { useEffect, useMemo, useState } from 'react';
import { useLiveSource } from '../data/liveStore';
import {
  collection, doc, getDocs, onSnapshot, query, runTransaction, where, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { roundMoney } from '../billing/money';
import { dateInputToTimestamp, isTodayInputValue, toDateInputValue } from '../../lib/dateInput';
import { computeBill } from './billMath';
import { hospitalSnapshot } from './billingHospital';

// Therapists who may see a bill: its creator, its physician, the patient's assigned
// therapists, and every therapist working in a department that appears on the bill.
// Stored on the bill so the security rules can enforce it on list queries too.
export function computeVisibleTo({ createdBy, physicianId, assignedTherapistIds = [], departmentIds = [], therapists = [] }) {
  const ids = new Set([createdBy, physicianId, ...assignedTherapistIds].filter(Boolean));
  for (const t of therapists) {
    if ((t.departmentIds || []).some((d) => departmentIds.includes(d))) ids.add(t.id);
  }
  return [...ids];
}

const cleanItems = (items) =>
  items.map((i) => ({
    name: i.name.trim(),
    description: (i.description || '').trim(),
    price: roundMoney(i.price),
    departmentId: i.departmentId || null,
    departmentName: i.departmentName || null,
  }));

// Everything the bill document and its ledger charge need, derived from the editor form.
// The charge's netAmount is computed as amount − discountAmount with plain arithmetic
// (not re-rounded) so it matches the security rule's own check exactly.
function buildAmounts(form) {
  const items = cleanItems(form.items);
  const { subtotal, discountAmount, taxAmount } = computeBill(items, form.discount, form.tax);
  const amount = roundMoney(subtotal + taxAmount);
  const netAmount = amount - discountAmount;
  return {
    items,
    subtotal,
    discount: { type: form.discount.type, value: roundMoney(form.discount.value), amount: discountAmount },
    tax: { type: form.tax.type, value: roundMoney(form.tax.value), amount: taxAmount },
    total: netAmount,
    charge: { amount, discountAmount, netAmount, items: items.map(({ name, price }) => ({ name, price })) },
  };
}

const departmentIdsOf = (items) => [...new Set(items.map((i) => i.departmentId).filter(Boolean))];

// Creates the bill and its ledger charge in one transaction, numbering it
// <patient code>-0001, -0002 … from a per-patient counter so numbers never collide.
export async function createBill(form, { user, profile, patient, hospital, therapists, canBackdate }) {
  const a = buildAmounts(form);
  const departmentIds = departmentIdsOf(a.items);
  const physician = therapists.find((t) => t.id === form.physicianId);
  const backdated = canBackdate && !isTodayInputValue(form.invoiceDate);
  const invoiceDate = backdated ? dateInputToTimestamp(form.invoiceDate) : serverTimestamp();

  const billRef = doc(collection(db, 'bills'));
  const txnRef = doc(collection(db, 'patients', patient.id, 'transactions'));
  const counterRef = doc(db, 'counters', `bills_${patient.id}`);

  const billNumber = await runTransaction(db, async (tx) => {
    const counter = await tx.get(counterRef);
    const seq = (counter.exists() ? counter.data().seq : 0) + 1;
    const number = `${patient.patientCode}-${String(seq).padStart(4, '0')}`;
    tx.set(counterRef, { seq }, { merge: true });

    tx.set(billRef, {
      billNumber: number,
      patientId: patient.id,
      patient: { ...form.patient, patientCode: patient.patientCode },
      hospitalId: hospital.id,
      hospital: hospitalSnapshot(hospital),
      physicianId: form.physicianId || null,
      physician: physician ? { ...form.physician } : null,
      items: a.items,
      subtotal: a.subtotal,
      discount: a.discount,
      tax: a.tax,
      total: a.total,
      notes: form.notes.trim(),
      invoiceDate,
      dueDate: form.dueDate ? dateInputToTimestamp(form.dueDate) : null,
      departmentIds,
      visibleTo: computeVisibleTo({
        createdBy: user.uid,
        physicianId: form.physicianId,
        assignedTherapistIds: patient.assignedTherapistIds,
        departmentIds,
        therapists,
      }),
      transactionId: txnRef.id,
      isDeleted: false,
      createdBy: user.uid,
      createdByName: profile?.name || '',
      createdAt: serverTimestamp(),
    });

    tx.set(txnRef, {
      type: 'charge',
      billId: billRef.id,
      billNumber: number,
      serviceName: `Bill ${number}`,
      departmentId: null,
      departmentName: hospital.name,
      discountReason: '',
      encounterId: null,
      ...a.charge,
      date: invoiceDate,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    });
    return number;
  });

  return { id: billRef.id, billNumber };
}

// Admin+ only. Updates the bill and its ledger charge together and records the change.
export async function updateBill(bill, form, { user, patient, hospital, therapists, canBackdate }) {
  const a = buildAmounts(form);
  const departmentIds = departmentIdsOf(a.items);
  const physician = therapists.find((t) => t.id === form.physicianId);
  const originalDate = toDateInput(bill.invoiceDate) || null;
  const invoiceDate =
    canBackdate && form.invoiceDate && form.invoiceDate !== originalDate ? dateInputToTimestamp(form.invoiceDate) : bill.invoiceDate;

  const batch = writeBatch(db);
  batch.update(doc(db, 'bills', bill.id), {
    patient: { ...form.patient, patientCode: bill.patient?.patientCode || patient?.patientCode || '' },
    hospitalId: hospital.id,
    hospital: hospitalSnapshot(hospital),
    physicianId: form.physicianId || null,
    physician: physician ? { ...form.physician } : null,
    items: a.items,
    subtotal: a.subtotal,
    discount: a.discount,
    tax: a.tax,
    total: a.total,
    notes: form.notes.trim(),
    invoiceDate,
    dueDate: form.dueDate ? dateInputToTimestamp(form.dueDate) : null,
    departmentIds,
    visibleTo: computeVisibleTo({
      createdBy: bill.createdBy,
      physicianId: form.physicianId,
      assignedTherapistIds: patient?.assignedTherapistIds,
      departmentIds,
      therapists,
    }),
    updatedBy: user.uid,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'patients', bill.patientId, 'transactions', bill.transactionId), {
    ...a.charge,
    date: invoiceDate,
    updatedBy: user.uid,
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(collection(db, 'auditLogs')), {
    action: 'updateBill',
    targetType: 'bill',
    targetId: bill.id,
    performedBy: user.uid,
    performedAt: serverTimestamp(),
    before: { billNumber: bill.billNumber, total: bill.total, items: bill.items },
    after: { billNumber: bill.billNumber, total: a.total, items: a.items },
  });
  await batch.commit();
}

async function commitVisibilityUpdates(updates) {
  for (let i = 0; i < updates.length; i += 450) {
    const batch = writeBatch(db);
    updates.slice(i, i + 450).forEach(({ id, visibleTo }) => batch.update(doc(db, 'bills', id), { visibleTo }));
    await batch.commit();
  }
}

const sameIds = (a = [], b = []) => a.length === b.length && a.every((x) => b.includes(x));

// After a patient's assigned therapists change, their existing bills follow.
export async function recomputeVisibilityForPatient(patientId, assignedTherapistIds, therapists) {
  const snap = await getDocs(query(collection(db, 'bills'), where('patientId', '==', patientId)));
  const updates = [];
  for (const d of snap.docs) {
    const b = d.data();
    const visibleTo = computeVisibleTo({ createdBy: b.createdBy, physicianId: b.physicianId, assignedTherapistIds, departmentIds: b.departmentIds, therapists });
    if (!sameIds(visibleTo, b.visibleTo)) updates.push({ id: d.id, visibleTo });
  }
  await commitVisibilityUpdates(updates);
}

// After a therapist's departments change (Super Admin, Settings), every bill is rechecked.
export async function recomputeVisibilityForAllBills(therapists) {
  const [billsSnap, patientsSnap] = await Promise.all([getDocs(collection(db, 'bills')), getDocs(collection(db, 'patients'))]);
  const assigned = new Map(patientsSnap.docs.map((d) => [d.id, d.data().assignedTherapistIds || []]));
  const updates = [];
  for (const d of billsSnap.docs) {
    const b = d.data();
    const visibleTo = computeVisibleTo({
      createdBy: b.createdBy, physicianId: b.physicianId, assignedTherapistIds: assigned.get(b.patientId), departmentIds: b.departmentIds, therapists,
    });
    if (!sameIds(visibleTo, b.visibleTo)) updates.push({ id: d.id, visibleTo });
  }
  await commitVisibilityUpdates(updates);
}

// Bills the signed-in user may see. Receptionist+ read everything; a therapist's query
// is restricted to bills listing them in visibleTo (the rules require that shape).
export function useBills({ patientId = null } = {}, { uid, role }) {
  const isTherapist = role === 'therapist';
  let spec = null;
  if (uid && role) {
    if (isTherapist) spec = { key: `bills:visibleTo:${uid}`, query: () => query(collection(db, 'bills'), where('visibleTo', 'array-contains', uid)) };
    else if (patientId) spec = { key: `bills:patient:${patientId}`, query: () => query(collection(db, 'bills'), where('patientId', '==', patientId)) };
    else spec = { key: 'bills:all', query: () => collection(db, 'bills') };
    spec.map = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  // Shared live source: returning to the Bills list or a patient's bills reuses it.
  const { data, error } = useLiveSource(spec);

  const bills = useMemo(
    () =>
      data &&
      data
        .filter((b) => !b.isDeleted && (!patientId || b.patientId === patientId))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? Date.now()) - (a.createdAt?.toMillis?.() ?? Date.now())),
    [data, patientId]
  );
  return { bills, error: error ? 'Could not load bills.' : '' };
}

// undefined while loading, null if missing / not allowed, otherwise the bill.
export function useBill(billId) {
  const [bill, setBill] = useState(undefined);
  useEffect(() => {
    if (!billId) {
      setBill(null);
      return undefined;
    }
    return onSnapshot(
      doc(db, 'bills', billId),
      (snap) => setBill(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      () => setBill(null)
    );
  }, [billId]);
  return bill;
}

export const toDateInput = (ts) => (ts?.toDate ? toDateInputValue(ts.toDate()) : '');

// "Save as PDF" in the print dialog uses the page title as the file name.
export function printInvoice(fileTitle) {
  const previous = document.title;
  document.title = fileTitle;
  const restore = () => {
    document.title = previous;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.print();
}
