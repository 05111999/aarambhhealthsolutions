import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { recomputeVisibilityForAllBills } from '../bills/billService';

const sameIds = (a = [], b = []) => a.length === b.length && a.every((id) => b.includes(id));

// A therapist's departments live in two places: their staff account (/users, shown in
// User Management) and their therapist entry (/therapists, which decides the bills they
// can see). These keep the two in step whichever screen they were changed on.

// From User Management: update (or create) the therapist entry linked to this login.
// details: { phone, address, qualification } — printed as the physician's on bills.
export async function syncTherapistEntry({ uid, name, details, departmentIds, departments, therapists, actorUid }) {
  const departmentNames = departments.filter((d) => departmentIds.includes(d.id)).map((d) => d.name);
  const ref = doc(db, 'therapists', uid);
  const snap = await getDoc(ref);
  const before = snap.exists() ? snap.data().departmentIds || [] : [];
  const departmentsChanged = !sameIds(before, departmentIds);
  if (snap.exists()) {
    const current = snap.data();
    const detailsChanged = ['phone', 'address', 'qualification'].some((k) => (current[k] || '') !== (details[k] || ''));
    if (!departmentsChanged && !detailsChanged) return;
    await updateDoc(ref, { ...details, departmentIds, departmentNames, updatedBy: actorUid, updatedAt: serverTimestamp() });
    if (!departmentsChanged) return;
  } else {
    await setDoc(ref, {
      name, ...details, departmentIds, departmentNames,
      linkedUserId: uid, isActive: true, createdBy: actorUid, createdAt: serverTimestamp(),
    });
    if (!departmentIds.length) return;
  }
  // Departments decide which bills a therapist can see, so re-check bills when they change.
  const next = [...therapists.filter((t) => t.id !== uid), { id: uid, departmentIds }];
  await recomputeVisibilityForAllBills(next);
}

// From Settings › Therapists: mirror departments and contact details onto the linked
// staff account (User Management).
export async function syncStaffDepartments({ uid, departmentIds, departmentNames, details, actorUid }) {
  if (!uid) return;
  await updateDoc(doc(db, 'users', uid), {
    assignedDepartmentIds: departmentIds,
    assignedDepartments: departmentNames,
    ...details,
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
  });
}
