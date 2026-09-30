import { useMemo } from 'react';
import { useLiveSources } from '../data/liveStore';
import { SOURCES } from '../data/sources';

const SPECS = { transactions: SOURCES.transactions, patients: SOURCES.patients };

// Every transaction across all patients (live), plus a patient lookup for names/codes.
// Both come from the shared live store, so the notification bell's transactions listener
// and the dashboard's data are reused rather than downloaded again.
export function useLedgerData() {
  const live = useLiveSources(SPECS);
  const transactions = live.transactions.data;
  const patientRows = live.patients.data;
  const error = live.transactions.error ? 'Could not load transactions.' : '';

  const patients = useMemo(() => new Map((patientRows || []).map((p) => [p.id, p])), [patientRows]);

  // Trashed bills, and every bill of a trashed patient, are left out of every
  // ledger-wide view and total.
  const liveTransactions = useMemo(
    () => transactions && transactions.filter((t) => !t.isDeleted && !patients.get(t.patientId)?.isDeleted),
    [transactions, patients]
  );

  return { transactions: liveTransactions, patients, error };
}
