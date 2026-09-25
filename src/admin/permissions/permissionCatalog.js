// Catalog of modules/actions the app understands. This list is tied to which admin
// features actually exist in the code, so it lives here rather than in Firestore.
// Who gets which of these (role defaults + per-user overrides) is fully database-driven —
// see /roleDefaults/{role} and /users/{uid}.permissions in Firestore.
export const PERMISSION_CATALOG = {
  // Creating, editing, deactivating and deleting staff is Super-Admin-only (enforced
  // in firestore.rules), so only read access is grantable to other roles.
  users: {
    label: 'User Management',
    actions: {
      view: 'View staff accounts (read-only)',
    },
  },
  patients: {
    label: 'Patients',
    actions: {
      view: 'View patient list & profiles',
      create: 'Onboard new patients',
      edit: 'Edit patient details',
      dischargeOrClose: 'Discharge / close an encounter',
    },
  },
  departments: {
    label: 'Departments & Services',
    actions: {
      view: 'View department/service catalog',
      manage: 'Create, edit, price, activate/deactivate, delete',
    },
  },
  billing: {
    label: 'Billing',
    actions: {
      view: 'View billing & patient ledger',
      create: 'Bill a service to a patient',
      discount: 'Apply a discount',
      recordPayment: 'Record a patient payment',
      backdate: 'Bill or record a payment with a past date',
    },
  },
  hospitalSettlement: {
    label: 'Hospital Settlement',
    actions: {
      view: 'View hospital receivable & settlements',
      manage: 'Mark collected, edit the daily rate',
    },
  },
  inquiries: {
    label: 'Inquiries & Applications',
    actions: {
      view: 'View public form submissions',
      manage: 'Update status, delete spam',
    },
  },
  sessionLogs: {
    label: 'Session Logs',
    actions: {
      view: 'View daily treatment progress entries',
      create: 'Add a session log entry',
      manage: 'Edit or delete any session log entry',
    },
  },
};

export const ROLES = ['superadmin', 'admin', 'receptionist', 'therapist'];

export const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  receptionist: 'Receptionist',
  therapist: 'Therapist',
};
