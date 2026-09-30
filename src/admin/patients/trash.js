import { useEffect, useMemo, useState } from 'react';
import { collection, collectionGroup, doc, onSnapshot, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useLiveSource } from '../data/liveStore';
import { SOURCES } from '../data/sources';

// Deleting a patient never erases anything: it sets isDeleted so the patient (and all
// their visits, bills and session logs) disappears from every list and total, and
// can be restored from the Trash exactly as it was. Both actions are audit-logged.

export async function moveToTrash(patient, actorUid) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'patients', patient.id), {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    deletedBy: actorUid,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
  });
  batch.set(doc(collection(db, 'auditLogs')), {
    action: 'trashPatient', targetType: 'patient', targetId: patient.id, performedBy: actorUid,
    performedAt: serverTimestamp(), before: { isDeleted: false }, after: { isDeleted: true, name: patient.name, patientCode: patient.patientCode },
  });
  await batch.commit();
}

export async function restoreFromTrash(patient, actorUid) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'patients', patient.id), {
    isDeleted: false,
    restoredAt: serverTimestamp(),
    restoredBy: actorUid,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
  });
  batch.set(doc(collection(db, 'auditLogs')), {
    action: 'restorePatient', targetType: 'patient', targetId: patient.id, performedBy: actorUid,
    performedAt: serverTimestamp(), before: { isDeleted: true }, after: { isDeleted: false, name: patient.name, patientCode: patient.patientCode },
  });
  await batch.commit();
}

// A bill (charge or payment) moved to the Trash drops out of the patient's balance
// and every total; restoring puts it straight back. Amounts are never changed.
function billAudit(batch, action, patientId, bill, actorUid, isDeleted) {
  batch.set(doc(collection(db, 'auditLogs')), {
    action, targetType: 'transaction', targetId: `${patientId}/${bill.id}`, performedBy: actorUid,
    performedAt: serverTimestamp(), before: { isDeleted: !isDeleted },
    after: { isDeleted, type: bill.type, amount: bill.type === 'payment' ? bill.amount : bill.netAmount, serviceName: bill.serviceName || null },
  });
}

// A charge created by the bill generator carries billId; the bill document and its
// ledger charge always move to and from the Trash together.
export async function moveBillToTrash(patientId, bill, actorUid) {
  const batch = writeBatch(db);
  const trashFields = { isDeleted: true, deletedAt: serverTimestamp(), deletedBy: actorUid };
  batch.update(doc(db, 'patients', patientId, 'transactions', bill.id), trashFields);
  if (bill.billId) batch.update(doc(db, 'bills', bill.billId), trashFields);
  billAudit(batch, 'trashBill', patientId, bill, actorUid, true);
  await batch.commit();
}

export async function restoreBillFromTrash(bill, actorUid) {
  const batch = writeBatch(db);
  const restoreFields = { isDeleted: false, restoredAt: serverTimestamp(), restoredBy: actorUid };
  batch.update(doc(db, 'patients', bill.patientId, 'transactions', bill.id), restoreFields);
  if (bill.billId) batch.update(doc(db, 'bills', bill.billId), restoreFields);
  billAudit(batch, 'restoreBill', bill.patientId, bill, actorUid, false);
  await batch.commit();
}

// Trashed bills across all patients (Super Admin's Trash). Needs the collection-group
// index on transactions.isDeleted defined in firestore.indexes.json.
export function useTrashedBills(enabled = true) {
  const [bills, setBills] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!enabled) return undefined;
    return onSnapshot(
      query(collectionGroup(db, 'transactions'), where('isDeleted', '==', true)),
      (snap) => {
        setBills(snap.docs.map((d) => ({ id: d.id, patientId: d.ref.parent.parent.id, ...d.data() })));
        setLoaded(true);
      },
      () => setLoaded(true)
    );
  }, [enabled]);
  return { bills, loaded };
}

// Deleted staff accounts (status 'deleted') — Super Admin only.
export function useTrashedStaff(enabled = true) {
  const [staff, setStaff] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!enabled) return undefined;
    return onSnapshot(
      query(collection(db, 'users'), where('status', '==', 'deleted')),
      (snap) => {
        setStaff(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoaded(true);
      },
      () => setLoaded(true)
    );
  }, [enabled]);
  return { staff, loaded };
}

// Live list of trashed patients (shared listener — the sidebar keeps it open, so every
// screen that needs it reuses the same data). `ids` is what list/total screens use to
// leave out a trashed patient's bills, sessions and settlements.
export function useTrashedPatients() {
  const { data, loaded } = useLiveSource(SOURCES.trashedPatients);
  const trashed = useMemo(() => data || [], [data]);
  const ids = useMemo(() => new Set(trashed.map((p) => p.id)), [trashed]);
  return { trashed, ids, loaded };
}
