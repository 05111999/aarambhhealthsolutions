import { collection, collectionGroup, doc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Shared live data sources (see liveStore.js). Screens that need the same data use the
// same key, so it is downloaded once and reused rather than fetched again per screen.
// Ordering is done in the browser, so one listener can serve every screen whatever order
// it displays in.

const rows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
// Collection-group rows also carry their owning patient's ID.
const patientRows = (snap) => snap.docs.map((d) => ({ id: d.id, patientId: d.ref.parent.parent.id, ...d.data() }));

const whole = (name) => ({ key: name, query: () => collection(db, name), map: rows });

export const SOURCES = {
  patients: whole('patients'),
  trashedPatients: { key: 'trashedPatients', query: () => query(collection(db, 'patients'), where('isDeleted', '==', true)), map: rows },
  transactions: { key: 'transactions', query: () => collectionGroup(db, 'transactions'), map: patientRows },
  sessionLogs: { key: 'sessionLogs', query: () => collectionGroup(db, 'sessionLogs'), map: patientRows },
  settlements: whole('hospitalSettlements'),
  pendingSettlements: {
    key: 'pendingSettlements',
    query: () => query(collection(db, 'hospitalSettlements'), where('status', '==', 'pending')),
    map: rows,
  },
  departments: whole('departments'),
  users: whole('users'),
  userRequests: { key: 'userRequests', query: () => query(collection(db, 'userRequests'), where('status', '==', 'pending')), map: rows },
  inquiries: whole('inquiries'),
  applications: whole('jobApplications'),
  newInquiries: { key: 'newInquiries', query: () => query(collection(db, 'inquiries'), where('status', '==', 'new')), map: rows },
  newApplications: { key: 'newApplications', query: () => query(collection(db, 'jobApplications'), where('status', '==', 'new')), map: rows },
  hospitals: whole('hospitals'),
  therapists: whole('therapists'),
  billSettings: {
    key: 'billSettings',
    query: () => doc(db, 'settings', 'billing'),
    map: (snap) => ({ taxPercent: Number(snap.data()?.taxPercent) || 0, ownHospitalId: snap.data()?.ownHospitalId || null }),
  },
};

// Patients onboarded in the last `days` days (notifications). The window is fixed when
// the listener opens; it lives at most for the session plus the grace period.
export const recentPatientsSource = (days) => ({
  key: `recentPatients:${days}`,
  query: () => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return query(collection(db, 'patients'), where('createdAt', '>=', Timestamp.fromDate(since)));
  },
  map: rows,
});

// Session logs dated today onwards — just enough to tell a therapist whether they've
// logged anything today, instead of downloading every session log ever recorded.
export const todaysSessionLogsSource = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return {
    key: `sessionLogsSince:${start.toDateString()}`,
    query: () => query(collectionGroup(db, 'sessionLogs'), where('date', '>=', Timestamp.fromDate(start))),
    map: patientRows,
  };
};

// One patient's ledger, shared by the profile's balance and the ledger table.
export const patientTransactionsSource = (patientId) =>
  patientId && {
    key: `patientTransactions:${patientId}`,
    query: () => collection(db, 'patients', patientId, 'transactions'),
    map: rows,
  };

// Patients currently admitted (IPD running bill picker). Two equality filters only.
export const activeInpatientsSource = () => ({
  key: 'activeInpatients',
  query: () => query(collection(db, 'patients'), where('currentPatientType', '==', 'inpatient'), where('currentStatus', '==', 'active')),
  map: rows,
});

// One patient's record, and their visits/admissions (encounters).
export const patientDocSource = (patientId) =>
  patientId && {
    key: `patient:${patientId}`,
    query: () => doc(db, 'patients', patientId),
    map: (snap) => (snap.exists() ? { id: snap.id, ...snap.data() } : null),
  };

export const patientEncountersSource = (patientId) =>
  patientId && {
    key: `patientEncounters:${patientId}`,
    query: () => collection(db, 'patients', patientId, 'encounters'),
    map: rows,
  };

