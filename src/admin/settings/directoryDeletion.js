import {
  collection, doc, getCountFromServer, getDoc, getDocs, query, where, writeBatch, serverTimestamp, arrayRemove,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { setStaffStatus } from '../users/staffAccounts';

// Super Admin only (enforced by firestore.rules: /hospitals and /therapists are
// writable only by an active Super Admin, checked against their /users doc).

const audit = (batch, action, targetType, targetId, actorUid, before) =>
  batch.set(doc(collection(db, 'auditLogs')), {
    action, targetType, targetId, performedBy: actorUid, performedAt: serverTimestamp(), before, after: null,
  });

// Bills issued under a hospital. They are patient financial records, so they are kept;
// each carries its own copy of the hospital's name/address/contact. One count query.
export async function countBillsForHospital(hospitalId) {
  const snap = await getCountFromServer(query(collection(db, 'bills'), where('hospitalId', '==', hospitalId)));
  return snap.data().count;
}

// A hospital owns no other data in this app (staff, patients and services are not
// per-hospital), so deleting it removes just the hospital record, with an audit entry.
export async function deleteHospital(hospital, actorUid) {
  const ref = doc(db, 'hospitals', hospital.id);
  if (!(await getDoc(ref)).exists()) throw new Error('This hospital was already deleted.');
  const { logo, ...before } = hospital; // the logo image is too large for the audit log
  const batch = writeBatch(db);
  batch.delete(ref);
  audit(batch, 'deleteHospital', 'hospital', hospital.id, actorUid, { ...before, hadLogo: !!logo });
  await batch.commit();
}

// Where a therapist is referenced — so the confirmation can say what will change.
// Targeted queries only (never the whole collection).
export async function therapistReferences(therapistId) {
  const [patients, bills] = await Promise.all([
    getDocs(query(collection(db, 'patients'), where('assignedTherapistIds', 'array-contains', therapistId))),
    getDocs(query(collection(db, 'bills'), where('visibleTo', 'array-contains', therapistId))),
  ]);
  return { patients: patients.docs, bills: bills.docs };
}

async function commitInChunks(ops) {
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    ops.slice(i, i + 450).forEach((op) => op(batch));
    await batch.commit();
  }
}

// Deletes a therapist entry while preserving history:
// - removed from patients' Assigned Therapists (patients in the Trash can't be edited
//   and are left as they are);
// - removed from bill visibility, except bills they created or were the physician on;
// - bills keep their physician details, session logs and ledger entries keep who
//   recorded them;
// - optionally their staff login is moved to the Trash (existing mechanism: blocks all
//   access, restorable). Firebase Auth accounts can't be deleted from the browser.
// References are cleaned first and the therapist is deleted last, so if anything fails
// part-way the therapist still exists and the action can simply be retried.
export async function deleteTherapist(therapist, { removeLogin, login }, actorUid) {
  const ref = doc(db, 'therapists', therapist.id);
  if (!(await getDoc(ref)).exists()) throw new Error('This therapist was already deleted.');

  const { patients, bills } = await therapistReferences(therapist.id);
  const ops = [];
  for (const p of patients) {
    if (p.data().isDeleted) continue;
    ops.push((b) => b.update(p.ref, { assignedTherapistIds: arrayRemove(therapist.id), updatedBy: actorUid, updatedAt: serverTimestamp() }));
  }
  for (const bill of bills) {
    const { createdBy, physicianId } = bill.data();
    if (createdBy === therapist.id || physicianId === therapist.id) continue;
    ops.push((b) => b.update(bill.ref, { visibleTo: arrayRemove(therapist.id) }));
  }
  await commitInChunks(ops);

  const batch = writeBatch(db);
  batch.delete(ref);
  audit(batch, 'deleteTherapist', 'therapist', therapist.id, actorUid, {
    name: therapist.name || '', qualification: therapist.qualification || '', phone: therapist.phone || '',
    linkedUserId: therapist.linkedUserId || null, departmentIds: therapist.departmentIds || [],
  });
  await batch.commit();

  if (removeLogin && login && login.status !== 'deleted') await setStaffStatus(login, 'deleted', actorUid);
}

// Firestore errors → wording a Super Admin can act on.
export function friendlyDeleteError(err) {
  const code = err?.code || '';
  if (code === 'permission-denied') return 'You don’t have permission to do this. Only an active Super Admin can delete.';
  if (code === 'unavailable' || code === 'deadline-exceeded' || !navigator.onLine) return 'Network problem — check your connection and try again. It’s safe to retry.';
  if (code === 'unauthenticated') return 'Your session has expired. Sign in again and retry.';
  return err?.message || 'Something went wrong. Please try again.';
}
