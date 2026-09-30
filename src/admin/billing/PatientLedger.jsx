import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, CreditCard, Receipt, Trash2 } from 'lucide-react';
import { useLiveSource } from '../data/liveStore';
import { patientTransactionsSource } from '../data/sources';
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
const PatientLedger = ({ patientId, readOnly = false, activeEncounterId = null }) => {
  const { user, profile } = useAuth();
  const canRecordPayment = usePermission('billing', 'recordPayment') && !readOnly;
  const canDeleteTransactions = (profile?.role === 'superadmin' || profile?.role === 'admin') && !readOnly;
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deletingTxn, setDeletingTxn] = useState(null);

  // Same shared listener as usePatientBalance below. Newest first; unsaved entries
  // (no server createdAt yet) at the top. Bills in the Trash are hidden here; Super Admin
  // can restore them from the Trash page.
  const { data: ledgerData } = useLiveSource(patientTransactionsSource(patientId));
  const transactions = useMemo(
    () =>
      (ledgerData || [])
        .filter((t) => !t.isDeleted)
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? Number.MAX_SAFE_INTEGER) - (a.createdAt?.toMillis?.() ?? Number.MAX_SAFE_INTEGER)),
    [ledgerData]
  );

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
                  {t.billId && (
                    <Link to={`/admin/bills/${t.billId}`} className="ml-2 text-xs font-semibold text-primary cursor-pointer hover:text-teal">
                      View bill
                    </Link>
                  )}
                  {t.type === 'payment' && (
                    <Link to={`/admin/patients/${patientId}/receipts/${t.id}`} className="ml-2 text-xs font-semibold text-primary cursor-pointer hover:text-teal">
                      Receipt
                    </Link>
                  )}
                </p>
                {t.billId && t.items?.length > 0 && (
                  <p className="text-xs text-text-muted mt-0.5">{t.items.map((i) => i.name).join(', ')}</p>
                )}
                <p className="text-xs text-text-muted mt-0.5">
                  {t.receiptNumber && <span className="font-mono">{t.receiptNumber} · </span>}
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

      <RecordPaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} patientId={patientId} encounterId={activeEncounterId} />

      <DeleteConfirmModal
        isOpen={!!deletingTxn}
        onClose={() => setDeletingTxn(null)}
        title="Move Bill to Trash"
        description={
          deletingTxn?.billId
            ? 'This moves the whole bill and its charge out of the patient’s ledger and balance. Nothing is erased.'
            : "This removes the entry from the patient's ledger and balance. Nothing is erased."
        }
        note={profile?.role === 'superadmin' ? 'You can restore it from Trash at any time.' : 'A Super Admin can restore it from Trash.'}
        confirmLabel="Move to Trash"
        busyLabel="Moving…"
        confirmPhrase={deleteConfirmPhrase}
        onConfirm={() => moveBillToTrash(patientId, deletingTxn, user.uid)}
      />
    </div>
  );
};

export default PatientLedger;
