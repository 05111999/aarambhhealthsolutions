import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { roundMoney } from '../billing/money';

// Shared with PatientLedger's own transaction list so the two never compute the
// balance two different ways. Coerce every term through roundMoney (Number()) before
// combining — a single string-typed amount in the reduce would otherwise silently
// turn `+` into string concatenation instead of addition, corrupting the running total.
// `enabled` defaults to true; callers without billing.view permission (e.g. Therapist)
// must pass false — those Firestore rules don't grant them read access to
// transactions at all, so subscribing anyway would only produce a permission error.
export function usePatientBalance(patientId, enabled = true) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!patientId || !enabled) return undefined;
    const unsubscribe = onSnapshot(collection(db, 'patients', patientId, 'transactions'), (snap) => {
      // Bills in the Trash don't count toward the balance (or the discharge check).
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((t) => !t.isDeleted));
      setLoading(false);
    });
    return unsubscribe;
  }, [patientId, enabled]);

  const balance = roundMoney(
    transactions.reduce((sum, t) => (t.type === 'payment' ? sum + roundMoney(t.amount) : sum - roundMoney(t.netAmount)), 0)
  );

  return { balance, hasPendingDues: balance < 0, loading };
}
