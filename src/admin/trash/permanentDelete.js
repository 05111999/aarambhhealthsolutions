import { collection, doc, getDoc, getDocs, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Permanent deletion from the Trash — Super Admin only (enforced by firestore.rules:
// only items already in the Trash, or everything belonging to a patient in the Trash).
// This cannot be undone. Each deletion leaves an audit-log entry of what was removed.

const audit = (batch, action, targetType, targetId, actorUid, before) =>
  batch.set(doc(collection(db, 'auditLogs')), {
    action, targetType, targetId, performedBy: actorUid, performedAt: serverTimestamp(), before, after: null,
  });

async function deleteInChunks(refs) {
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

// What a patient's permanent deletion will remove — targeted reads of that patient only.
export async function patientDeletionPlan(patientId) {
  const sub = (name) => getDocs(collection(db, 'patients', patientId, name));
  const [encounters, transactions, sessionLogs, bills, settlements] = await Promise.all([
    sub('encounters'),
    sub('transactions'),
    sub('sessionLogs'),
    getDocs(query(collection(db, 'bills'), where('patientId', '==', patientId))),
    getDocs(query(collection(db, 'hospitalSettlements'), where('patientId', '==', patientId))),
  ]);
  const counterIds = [`bills_${patientId}`, `receipts_${patientId}`, `admissions_${patientId}`];
  const counters = (await Promise.all(counterIds.map((id) => getDoc(doc(db, 'counters', id))))).filter((d) => d.exists());
  return {
    refs: [...encounters.docs, ...transactions.docs, ...sessionLogs.docs, ...bills.docs, ...settlements.docs, ...counters].map((d) => d.ref),
    counts: {
      visits: encounters.size,
      payments: transactions.docs.filter((d) => d.data().type === 'payment').length,
      charges: transactions.docs.filter((d) => d.data().type === 'charge').length,
      sessionLogs: sessionLogs.size,
      bills: bills.size,
      settlements: settlements.size,
    },
  };
}

// Everything linked to the patient is deleted first; the patient record goes last, so if
// anything fails part-way the patient is still in the Trash and the delete can be retried.
export async function deletePatientPermanently(patient, actorUid) {
  const ref = doc(db, 'patients', patient.id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('This patient was already deleted.');
  if (!snap.data().isDeleted) throw new Error('Only patients in the Trash can be deleted permanently.');
  const { refs, counts } = await patientDeletionPlan(patient.id);
  await deleteInChunks(refs);
  const batch = writeBatch(db);
  batch.delete(ref);
  audit(batch, 'deletePatientPermanently', 'patient', patient.id, actorUid, {
    name: patient.name || '', patientCode: patient.patientCode || '', ...counts,
  });
  await batch.commit();
}

// A trashed ledger entry (charge or payment), and its bill document if it had one.
export async function deleteTransactionPermanently(txn, actorUid) {
  const ref = doc(db, 'patients', txn.patientId, 'transactions', txn.id);
  if (!(await getDoc(ref)).exists()) throw new Error('This entry was already deleted.');
  const batch = writeBatch(db);
  batch.delete(ref);
  if (txn.billId) batch.delete(doc(db, 'bills', txn.billId));
  audit(batch, 'deleteTransactionPermanently', 'transaction', `${txn.patientId}/${txn.id}`, actorUid, {
    type: txn.type, amount: txn.type === 'payment' ? txn.amount : txn.netAmount, billNumber: txn.billNumber || null,
    receiptNumber: txn.receiptNumber || null, serviceName: txn.serviceName || null,
  });
  await batch.commit();
}

// A staff account in the Trash. The sign-in itself can't be removed from the browser
// (that needs the Firebase Admin SDK), but with no staff record it can open nothing.
export async function deleteStaffPermanently(staff, actorUid) {
  const ref = doc(db, 'users', staff.id);
  if (!(await getDoc(ref)).exists()) throw new Error('This account was already deleted.');
  const batch = writeBatch(db);
  batch.delete(ref);
  audit(batch, 'deleteUserPermanently', 'user', staff.id, actorUid, { name: staff.name || '', email: staff.email || '', role: staff.role || '' });
  await batch.commit();
}

// Firestore errors → wording a Super Admin can act on.
export function friendlyPermanentDeleteError(err) {
  if (err?.code === 'permission-denied') return 'Not allowed. Only a Super Admin can permanently delete, and only items in the Trash.';
  if (err?.code === 'unavailable' || (typeof navigator !== 'undefined' && !navigator.onLine)) return 'Network problem — check your connection and try again. It’s safe to retry.';
  return err?.message || 'Something went wrong. Please try again.';
}
