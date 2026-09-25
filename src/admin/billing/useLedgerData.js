import { useEffect, useMemo, useState } from 'react';
import { collection, collectionGroup, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Every transaction across all patients (live), plus a patient lookup for names/codes.
export function useLedgerData() {
  const [transactions, setTransactions] = useState(null);
  const [patients, setPatients] = useState(new Map());
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collectionGroup(db, 'transactions'),
      (snap) => setTransactions(snap.docs.map((d) => ({ id: d.id, patientId: d.ref.parent.parent.id, ...d.data() }))),
      () => setError('Could not load transactions.')
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'patients'), (snap) => {
      setPatients(new Map(snap.docs.map((d) => [d.id, { id: d.id, ...d.data() }])));
    });
    return unsubscribe;
  }, []);

  // Trashed bills, and every bill of a trashed patient, are left out of every
  // ledger-wide view and total.
  const liveTransactions = useMemo(
    () => transactions && transactions.filter((t) => !t.isDeleted && !patients.get(t.patientId)?.isDeleted),
    [transactions, patients]
  );

  return { transactions: liveTransactions, patients, error };
}
