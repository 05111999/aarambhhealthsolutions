import { useMemo } from 'react';
import { useLiveSource } from '../data/liveStore';
import { patientTransactionsSource } from '../data/sources';
import { roundMoney } from '../billing/money';

// Shared with PatientLedger's own transaction list so the two never compute the
// balance two different ways. Coerce every term through roundMoney (Number()) before
// combining — a single string-typed amount in the reduce would otherwise silently
// turn `+` into string concatenation instead of addition, corrupting the running total.
// `enabled` defaults to true; callers without billing.view permission (e.g. Therapist)
// must pass false — those Firestore rules don't grant them read access to
// transactions at all, so subscribing anyway would only produce a permission error.
export function usePatientBalance(patientId, enabled = true) {
  // Shared live source — PatientLedger reads the same listener, so a profile visit
  // downloads the ledger once rather than twice.
  const { data, loaded, error } = useLiveSource(enabled ? patientTransactionsSource(patientId) : null);
  // Bills in the Trash don't count toward the balance (or the discharge check).
  const transactions = useMemo(() => (data || []).filter((t) => !t.isDeleted), [data]);
  const loading = enabled && !!patientId && !loaded;

  const balance = roundMoney(
    transactions.reduce((sum, t) => (t.type === 'payment' ? sum + roundMoney(t.amount) : sum - roundMoney(t.netAmount)), 0)
  );

  // `error`: the ledger couldn't be read, so the balance is unknown (not ₹0).
  return { balance, hasPendingDues: balance < 0, loading, error: enabled && !!error };
}
