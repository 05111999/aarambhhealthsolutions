#!/usr/bin/env node
// Admin SDK script for the one thing the client SDK can't do: create/modify OTHER
// users' Firebase Auth accounts. Run locally by whoever holds the service account key.
//
// Usage:
//   node scripts/provisionUsers.js bootstrap-superadmin --name "Full Name" --email you@example.com --password "secret"
//   node scripts/provisionUsers.js create
//   node scripts/provisionUsers.js sync-role --uid <uid> --role <superadmin|admin|receptionist|therapist>
//   node scripts/provisionUsers.js seed-role-defaults
//   node scripts/provisionUsers.js seed-departments

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROLES = ['superadmin', 'admin', 'receptionist', 'therapist'];

const DEFAULT_ROLE_DEFAULTS = {
  // Super Admin is always unrestricted in app code; this doc is unused for it.
  superadmin: {},
  admin: {
    users: { view: false },
    patients: { view: true, create: true, edit: true, dischargeOrClose: true },
    departments: { view: true, manage: false },
    billing: { view: true, create: true, discount: true, recordPayment: true, backdate: true },
    hospitalSettlement: { view: true, manage: false },
    inquiries: { view: true, manage: true },
    sessionLogs: { view: true, create: true, manage: true },
  },
  receptionist: {
    users: { view: false },
    patients: { view: true, create: true, edit: true, dischargeOrClose: false },
    departments: { view: true, manage: false },
    billing: { view: true, create: true, discount: true, recordPayment: true, backdate: false },
    // Hospital Settlement is an org-level reconciliation concern, not day-to-day billing.
    hospitalSettlement: { view: false, manage: false },
    // Receptionists are explicitly the front-line staff for public inquiries.
    inquiries: { view: true, manage: true },
    sessionLogs: { view: true, create: true, manage: false },
  },
  therapist: {
    users: { view: false },
    // Real department-scoped access isn't wired up yet — assignedDepartments (Phase 1)
    // is still free-text, not linked to real department IDs (Phase 3). Deferred.
    // patients.view is now true (was false) so a therapist can actually reach a
    // patient's profile to log daily treatment progress — the exact staff this new
    // sessionLogs feature is for. Still no create/edit/discharge/billing access.
    patients: { view: true, create: false, edit: false, dischargeOrClose: false },
    departments: { view: true, manage: false },
    billing: { view: false, create: false, discount: false, recordPayment: false, backdate: false },
    hospitalSettlement: { view: false, manage: false },
    inquiries: { view: false, manage: false },
    sessionLogs: { view: true, create: true, manage: false },
  },
};

// Spec section 7/8's example structure — convenience bootstrap data only, not hardcoded
// application logic. Super Admin can rename/delete/rearrange all of it afterward.
const SEED_DEPARTMENTS = [
  { name: 'Physiotherapy', children: ['Morning Therapy Session', 'Afternoon Therapy Session', 'Third Physio Session', 'HWD', 'Laser', 'Traction', 'Super Specialty Counseling'] },
  { name: 'Occupational Therapy', children: ['OT Session', 'Robotic Hands', 'Gloves', 'Cognitive'] },
  { name: 'Speech & Sound Therapy', children: ['Speech', 'Swallow', 'Audio'] },
  { name: 'Naturopathy', children: [] },
  { name: 'Ayurvedic', children: [] },
  { name: 'Yoga', children: [] },
  { name: 'Aarom Store', children: [] },
  { name: 'Psychology', children: [] },
];

function initAdmin() {
  const usingEmulators = !!process.env.FIRESTORE_EMULATOR_HOST || !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

  if (usingEmulators) {
    const projectId = process.env.GCLOUD_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID || 'demo-aarambh';
    initializeApp({ projectId });
    console.log(`Using Firebase emulators (project: ${projectId})`);
    return;
  }

  const keyPath = path.join(__dirname, 'serviceAccountKey.json');
  if (!existsSync(keyPath)) {
    console.error(
      'Missing scripts/serviceAccountKey.json.\n' +
      'Download it from Firebase Console -> Project Settings -> Service Accounts -> Generate new private key,\n' +
      'or set FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST to target the local emulators instead.'
    );
    process.exit(1);
  }
  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
  initializeApp({ credential: cert(serviceAccount) });
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (!tok.startsWith('--')) continue;
    const key = tok.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < 14; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// Idempotent and safe to re-run in production: only ever ADDS module keys that don't
// exist yet on a role's doc (e.g. a newly-introduced `patients` module). Never touches
// a module that's already present, even if its values differ from the defaults below —
// those may have been intentionally customized by Super Admin through the app.
async function seedRoleDefaults(db) {
  for (const role of ROLES) {
    const ref = db.collection('roleDefaults').doc(role);
    const snap = await ref.get();
    const existing = snap.exists ? snap.data() : {};
    const defaults = DEFAULT_ROLE_DEFAULTS[role];

    // Missing whole modules are added as-is; for modules that already exist, only
    // missing *actions* are added (dotted-path update) — an existing value is never
    // changed, since it may be a deliberate Super Admin customization.
    const missing = {};
    for (const [moduleKey, actions] of Object.entries(defaults)) {
      if (!(moduleKey in existing)) {
        missing[moduleKey] = actions;
        continue;
      }
      for (const [actionKey, value] of Object.entries(actions)) {
        if (!(actionKey in (existing[moduleKey] || {}))) missing[`${moduleKey}.${actionKey}`] = value;
      }
    }

    if (!snap.exists) {
      await ref.set(defaults);
      console.log(`Seeded roleDefaults/${role}`);
    } else if (Object.keys(missing).length > 0) {
      await ref.update(missing);
      console.log(`Added to roleDefaults/${role}: ${Object.keys(missing).join(', ')}`);
    } else {
      console.log(`roleDefaults/${role} already up to date`);
    }
  }
}

// Idempotent and safe to re-run: skips any department/service whose exact name already
// exists under the same parent, so re-running never creates duplicates.
async function seedDepartments(db) {
  const existing = await db.collection('departments').get();
  const existingNames = new Set(existing.docs.map((d) => `${d.data().parentId || 'root'}::${d.data().name}`));

  let order = 0;
  for (const dept of SEED_DEPARTMENTS) {
    const deptKey = `root::${dept.name}`;
    let deptRef;
    if (existingNames.has(deptKey)) {
      deptRef = existing.docs.find((d) => d.data().parentId === null && d.data().name === dept.name).ref;
      console.log(`Department already exists, skipping create: ${dept.name}`);
    } else {
      deptRef = db.collection('departments').doc();
      await deptRef.set({
        name: dept.name,
        parentId: null,
        description: '',
        price: null,
        isActive: true,
        sortOrder: order,
        createdBy: 'seed-script',
        createdAt: FieldValue.serverTimestamp(),
        updatedBy: 'seed-script',
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`Created department: ${dept.name}`);
    }
    order += 1;

    let childOrder = 0;
    for (const childName of dept.children) {
      const childKey = `${deptRef.id}::${childName}`;
      if (existingNames.has(childKey)) {
        console.log(`  Service already exists, skipping: ${childName}`);
      } else {
        await db.collection('departments').add({
          name: childName,
          parentId: deptRef.id,
          description: '',
          price: null,
          isActive: true,
          sortOrder: childOrder,
          createdBy: 'seed-script',
          createdAt: FieldValue.serverTimestamp(),
          updatedBy: 'seed-script',
          updatedAt: FieldValue.serverTimestamp(),
        });
        console.log(`  Created service: ${childName}`);
      }
      childOrder += 1;
    }
  }
}

async function bootstrapSuperAdmin(args) {
  const { name, email, password } = args;
  if (!name || !email || !password) {
    console.error('Usage: bootstrap-superadmin --name "Full Name" --email you@example.com --password "secret"');
    process.exit(1);
  }

  const db = getFirestore();
  const auth = getAuth();

  const existing = await db.collection('users').where('role', '==', 'superadmin').limit(1).get();
  if (!existing.empty) {
    console.error('A Super Admin already exists. Refusing to create a second one.');
    process.exit(1);
  }

  const userRecord = await auth.createUser({ email, password, displayName: name });
  await auth.setCustomUserClaims(userRecord.uid, { role: 'superadmin' });

  await db.collection('users').doc(userRecord.uid).set({
    name,
    email,
    role: 'superadmin',
    status: 'active',
    assignedDepartments: [],
    permissions: {},
    createdBy: 'bootstrap-script',
    createdAt: FieldValue.serverTimestamp(),
    updatedBy: 'bootstrap-script',
    updatedAt: FieldValue.serverTimestamp(),
  });

  await seedRoleDefaults(db);

  console.log(`Super Admin created: ${email} (uid: ${userRecord.uid})`);
}

async function createPendingUsers() {
  const db = getFirestore();
  const auth = getAuth();

  const pending = await db.collection('userRequests').where('status', '==', 'pending').get();
  if (pending.empty) {
    console.log('No pending user requests.');
    return;
  }

  for (const doc of pending.docs) {
    const req = doc.data();
    const tempPassword = generatePassword();

    try {
      const userRecord = await auth.createUser({
        email: req.email,
        password: tempPassword,
        displayName: req.name,
      });
      await auth.setCustomUserClaims(userRecord.uid, { role: req.role });

      await db.collection('users').doc(userRecord.uid).set({
        name: req.name,
        email: req.email,
        role: req.role,
        status: 'active',
        assignedDepartments: req.assignedDepartments || [],
        permissions: req.permissions || {},
        createdBy: req.requestedBy || 'provision-script',
        createdAt: FieldValue.serverTimestamp(),
        updatedBy: req.requestedBy || 'provision-script',
        updatedAt: FieldValue.serverTimestamp(),
      });

      await doc.ref.update({
        status: 'provisioned',
        provisionedAt: FieldValue.serverTimestamp(),
        provisionedUid: userRecord.uid,
      });

      console.log('---');
      console.log(`Created: ${req.name} <${req.email}> (${req.role})`);
      console.log(`Temp password: ${tempPassword}`);
      console.log('Share this with the user securely and have them change it on first login.');
    } catch (err) {
      console.error(`Failed to provision ${req.email}: ${err.message}`);
    }
  }
}

async function syncRole(args) {
  const { uid, role } = args;
  if (!uid || !role || !ROLES.includes(role)) {
    console.error(`Usage: sync-role --uid <uid> --role <${ROLES.join('|')}>`);
    process.exit(1);
  }

  const db = getFirestore();
  const auth = getAuth();

  await auth.setCustomUserClaims(uid, { role });
  await db.collection('users').doc(uid).update({
    role,
    updatedBy: 'sync-role-script',
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`Synced ${uid} to role "${role}" (Firestore + custom claim).`);
}

async function main() {
  const [, , command, ...rest] = process.argv;
  const args = parseArgs(rest);

  initAdmin();

  switch (command) {
    case 'bootstrap-superadmin':
      await bootstrapSuperAdmin(args);
      break;
    case 'create':
      await createPendingUsers();
      break;
    case 'sync-role':
      await syncRole(args);
      break;
    case 'seed-role-defaults':
      await seedRoleDefaults(getFirestore());
      break;
    case 'seed-departments':
      await seedDepartments(getFirestore());
      break;
    default:
      console.log(`Usage:
  node scripts/provisionUsers.js bootstrap-superadmin --name "Full Name" --email you@example.com --password "secret"
  node scripts/provisionUsers.js create
  node scripts/provisionUsers.js sync-role --uid <uid> --role <${ROLES.join('|')}>
  node scripts/provisionUsers.js seed-role-defaults
  node scripts/provisionUsers.js seed-departments`);
      process.exit(command ? 1 : 0);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
