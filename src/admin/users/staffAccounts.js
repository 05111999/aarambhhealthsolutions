import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth, inMemoryPersistence, connectAuthEmulator, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut, deleteUser,
} from 'firebase/auth';
import { collection, doc, getDocs, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db, firebaseConfig, useEmulators } from '../../lib/firebase';

// Staff logins are created from the browser (no server on this plan). Doing that on
// the main Auth instance would sign the Super Admin out and in as the new user, so a
// separate, in-memory app instance is used purely for account creation.
const PROVISIONING_APP = 'staff-provisioning';
let provisioningAuth = null;

function getProvisioningAuth() {
  if (provisioningAuth) return provisioningAuth;
  const app = getApps().find((a) => a.name === PROVISIONING_APP) || initializeApp(firebaseConfig, PROVISIONING_APP);
  provisioningAuth = initializeAuth(app, { persistence: inMemoryPersistence });
  if (useEmulators) connectAuthEmulator(provisioningAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
  return provisioningAuth;
}

// Never shown to anyone — the new user sets their own password via the emailed link.
function randomPassword() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export const normalizeEmail = (email) => email.trim().toLowerCase();

// The "continue to login" link only works if the current domain is on Firebase Auth's
// Authorized domains list. If it isn't, still send the email — just without that link —
// rather than failing the whole action.
export async function sendResetWithFallback(authInstance, email) {
  try {
    await sendPasswordResetEmail(authInstance, email, { url: `${window.location.origin}/admin/login` });
  } catch (err) {
    if (err.code !== 'auth/unauthorized-continue-uri' && err.code !== 'auth/invalid-continue-uri') throw err;
    await sendPasswordResetEmail(authInstance, email);
  }
}

export function sendSetupEmail(email) {
  return sendResetWithFallback(getProvisioningAuth(), normalizeEmail(email));
}

function auditEntry(batch, action, targetId, actorUid, before, after) {
  batch.set(doc(collection(db, 'auditLogs')), {
    action, targetType: 'user', targetId, performedBy: actorUid, performedAt: serverTimestamp(), before, after,
  });
}

const profileFields = (form) => ({
  name: form.name.trim(),
  role: form.role,
  assignedDepartments: form.assignedDepartments || [],
  permissions: form.permissions || {},
});

export async function findUserByEmail(email) {
  const snap = await getDocs(query(collection(db, 'users'), where('email', '==', normalizeEmail(email))));
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// Returns { created: true } or { restorable: existingUser } when the email belongs to
// a previously deleted account (the caller then offers restoreStaffAccount).
export async function createStaffAccount(form, actorUid) {
  const email = normalizeEmail(form.email);
  const existing = await findUserByEmail(email);
  if (existing?.status === 'deleted') return { restorable: existing };
  if (existing) throw new Error(`${email} is already a staff account.`);

  const provAuth = getProvisioningAuth();
  let cred;
  try {
    cred = await createUserWithEmailAndPassword(provAuth, email, randomPassword());
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      throw new Error(`${email} already has a login that isn't linked to a staff account. Use a different email, or ask your developer to remove the old login.`);
    }
    if (err.code === 'auth/invalid-email') throw new Error('That email address is not valid.');
    throw err;
  }

  const uid = cred.user.uid;
  const data = {
    ...profileFields(form),
    email,
    status: 'active',
    createdBy: actorUid,
    createdAt: serverTimestamp(),
    updatedBy: actorUid,
    updatedAt: serverTimestamp(),
  };
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', uid), data);
  auditEntry(batch, 'createUser', uid, actorUid, null, profileFields(form));
  try {
    await batch.commit();
  } catch (err) {
    // Don't leave a login behind with no staff record attached to it.
    await deleteUser(cred.user).catch(() => {});
    throw err;
  } finally {
    await signOut(provAuth).catch(() => {});
  }

  await sendSetupEmail(email);
  return { created: true };
}

export async function restoreStaffAccount(existing, form, actorUid) {
  const after = { ...profileFields(form), status: 'active' };
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', existing.id), { ...after, updatedBy: actorUid, updatedAt: serverTimestamp() });
  auditEntry(batch, 'restoreUser', existing.id, actorUid, { status: existing.status, role: existing.role }, after);
  await batch.commit();
  await sendSetupEmail(existing.email);
}

export async function updateStaffAccount(target, form, actorUid) {
  const before = {
    name: target.name, role: target.role, assignedDepartments: target.assignedDepartments || [], permissions: target.permissions || {},
  };
  const after = profileFields(form);
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', target.id), { ...after, updatedBy: actorUid, updatedAt: serverTimestamp() });
  auditEntry(batch, 'updateUser', target.id, actorUid, before, after);
  await batch.commit();
}

const STATUS_ACTIONS = { active: 'reactivateUser', disabled: 'deactivateUser', deleted: 'deleteUser' };

// Deactivate / reactivate / delete. Takes effect on the user's next request, because
// the security rules check this status on every read and write.
export async function setStaffStatus(target, status, actorUid) {
  const changes = { status, updatedBy: actorUid, updatedAt: serverTimestamp() };
  // Permission overrides are kept on delete: the 'deleted' status alone already blocks
  // all access (rules check it on every request), and keeping them means a restore
  // from the Trash brings the account back exactly as it was.
  if (status === 'deleted') {
    changes.deletedAt = serverTimestamp();
    changes.deletedBy = actorUid;
  }
  if (target.status === 'deleted' && status === 'active') {
    changes.restoredAt = serverTimestamp();
    changes.restoredBy = actorUid;
  }
  const batch = writeBatch(db);
  batch.update(doc(db, 'users', target.id), changes);
  const action = target.status === 'deleted' && status === 'active' ? 'restoreUser' : STATUS_ACTIONS[status];
  auditEntry(batch, action, target.id, actorUid, { status: target.status }, { status });
  await batch.commit();
}
