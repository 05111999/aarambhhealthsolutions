import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Wallet, CreditCard, Receipt, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../permissions/usePermission';
import { formatMoney } from './money';
import { usePatientBalance } from '../patients/usePatientBalance';
import DeleteConfirmModal from '../patients/DeleteConfirmModal';
import { moveBillToTrash } from '../patients/trash';
import RecordPaymentModal from './RecordPaymentModal';

const METHOD_LABELS = {
  cash: 'Cash', card: 'Card', upi: 'UPI', bankTransfer: 'Bank Transfer', cheque: 'Cheque', advance: 'Advance', other: 'Other',
};

// A transaction is backdated if its effective date falls on a different calendar day
// than when it was actually entered — a same-day difference in time-of-day (date is
// midnight-anchored, createdAt has real time) doesn't count.
function isBackdatedTxn(t) {
  if (!t.date?.toDate || !t.createdAt?.toDate) return false;
  return t.date.toDate().toDateString() !== t.createdAt.toDate().toDateString();
}

// readOnly: the patient is in the Trash — show the ledger, allow no payments or deletes.
const PatientLedger = ({ patientId, readOnly = false }) => {
  const { user, profile } = useAuth();
  const canRecordPayment = usePermission('billing', 'recordPayment') && !readOnly;
  const canDeleteTransactions = profile?.role === 'superadmin' && !readOnly;
  const [transactions, setTransactions] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deletingTxn, setDeletingTxn] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'patients', patientId, 'transactions'), orderBy('createdAt', 'desc')),
      // Bills in the Trash are hidden here; Super Admin can restore them from the Trash page.
      (snap) => setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((t) => !t.isDeleted))
    );
    return unsubscribe;
  }, [patientId]);

  const { balance } = usePatientBalance(patientId);

  const deleteConfirmPhrase = deletingTxn
    ? deletingTxn.type === 'payment'
      ? `${formatMoney(deletingTxn.amount)} ${METHOD_LABELS[deletingTxn.method] || deletingTxn.method}`
      : deletingTxn.serviceName
    : '';

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-full">
            <Wallet className="text-primary" size={20} />
          </div>
          <div>
            <p className="text-xs text-text-muted">Patient Balance</p>
            <p className={`text-xl font-bold ${balance < 0 ? 'text-red-600' : 'text-teal'}`}>{formatMoney(balance)}</p>
          </div>
        </div>
        {canRecordPayment && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="inline-flex items-center gap-2 bg-white border border-border text-text-dark font-semibold px-4 py-2 rounded-lg hover:border-teal/40 hover:text-teal transition-colors text-sm"
          >
            <CreditCard size={16} />
            Record Payment
          </button>
        )}
      </div>

      <h3 className="text-sm font-semibold text-text-dark mb-3">Transaction History</h3>
      <div className="space-y-2">
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${t.type === 'payment' ? 'bg-teal/10' : 'bg-primary/10'}`}>
                <Receipt size={14} className={t.type === 'payment' ? 'text-teal' : 'text-primary'} />
              </div>
              <div>
                <p className="text-sm font-medium text-text-dark">
                  {t.type === 'payment' ? `Payment — ${METHOD_LABELS[t.method] || t.method}` : t.serviceName}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {t.type === 'charge' && `${t.departmentName} · `}
                  {t.date?.toDate ? t.date.toDate().toLocaleDateString() : 'Just now'}
                  {isBackdatedTxn(t) && (
                    <span className="text-amber-600 font-medium"> · Backdated (entered {t.createdAt.toDate().toLocaleDateString()})</span>
                  )}
                  {t.discountAmount > 0 && ` · Discount ${formatMoney(t.discountAmount)}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${t.type === 'payment' ? 'text-teal' : 'text-text-dark'}`}>
                {t.type === 'payment' ? '+' : '-'}{formatMoney(t.type === 'payment' ? t.amount : t.netAmount)}
              </span>
              {canDeleteTransactions && (
                <button
                  onClick={() => setDeletingTxn(t)}
                  title="Move to Trash"
                  className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
        {transactions.length === 0 && <p className="text-text-muted text-sm py-6 text-center">No transactions yet.</p>}
      </div>

      <RecordPaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} patientId={patientId} />

      <DeleteConfirmModal
        isOpen={!!deletingTxn}
        onClose={() => setDeletingTxn(null)}
        title="Move Bill to Trash"
        description="This removes the entry from the patient's ledger and balance. Nothing is erased."
        note="You can restore it from Trash at any time."
        confirmLabel="Move to Trash"
        busyLabel="Moving…"
        confirmPhrase={deleteConfirmPhrase}
        onConfirm={() => moveBillToTrash(patientId, deletingTxn, user.uid)}
      />
    </div>
  );
};

export default PatientLedger;
