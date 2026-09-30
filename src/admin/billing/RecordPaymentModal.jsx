import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { serverTimestamp } from 'firebase/firestore';
import { X, Check, FileText } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../permissions/usePermission';
import { toDateInputValue, dateInputToTimestamp, isTodayInputValue } from '../../lib/dateInput';
import { roundMoney, formatMoney } from './money';
import { recordPayment } from './receiptService';
import { useBillSettings, useHospitals } from '../settings/useDirectory';
import { defaultHospitalFor } from '../bills/billingHospital';

const inputClasses =
  'w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'bankTransfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

// encounterId (optional) links the payment to an admission — e.g. an IPD running bill.
const RecordPaymentModal = ({ isOpen, onClose, patientId, encounterId = null, defaultRemarks = '' }) => {
  const { user, profile } = useAuth();
  const { hospitals } = useHospitals();
  const { ownHospitalId } = useBillSettings();
  const [recorded, setRecorded] = useState(null); // { id, receiptNumber, amount } after saving
  const [error, setError] = useState('');
  const canBackdate = usePermission('billing', 'backdate');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [remarks, setRemarks] = useState(defaultRemarks);
  const [paymentDate, setPaymentDate] = useState(toDateInputValue(new Date()));
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setRecorded(null);
    setError('');
    setAmount('');
    setMethod('cash');
    setReference('');
    setRemarks(defaultRemarks);
    setPaymentDate(toDateInputValue(new Date()));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await recordPayment({
        patientId,
        payment: {
          amount: roundMoney(amount),
          method,
          reference: reference.trim(),
          remarks: remarks.trim(),
          ...(encounterId ? { encounterId } : {}),
          date: canBackdate && !isTodayInputValue(paymentDate) ? dateInputToTimestamp(paymentDate) : serverTimestamp(),
        },
        hospitalFor: (patient) => defaultHospitalFor(patient, hospitals, ownHospitalId),
        user,
        profile,
      });
      // Stay open to offer the receipt.
      setRecorded({ ...result, amount: roundMoney(amount) });
    } catch (err) {
      setError(err.message || 'Could not record the payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-text-dark/60 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[101] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto"
            >
              <div className="flex justify-between items-center p-4 sm:p-6 border-b border-border bg-bg">
                <h3 className="text-xl font-bold text-primary mb-0">{recorded ? 'Payment Recorded' : 'Record Payment'}</h3>
                <button onClick={handleClose} aria-label="Close" className="text-text-muted hover:text-text-dark transition-colors p-2 -m-1">
                  <X size={22} />
                </button>
              </div>

              {recorded ? (
                <div className="p-4 sm:p-6 space-y-4 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center">
                    <Check size={24} className="text-teal" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-text-dark mb-0">{formatMoney(recorded.amount)} received</p>
                    <p className="text-sm text-text-muted mb-0">Receipt <span className="font-mono">{recorded.receiptNumber}</span></p>
                  </div>
                  <Link
                    to={`/admin/patients/${patientId}/receipts/${recorded.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl"
                  >
                    <FileText size={18} />
                    View &amp; Print Receipt
                  </Link>
                  <button type="button" onClick={handleClose} className="w-full px-6 py-3 rounded-xl border border-border text-text-dark font-semibold hover:bg-bg transition-colors">
                    Done
                  </button>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                {canBackdate && (
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">
                      Payment Date <span className="text-text-muted font-normal">(defaults to today)</span>
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      max={toDateInputValue(new Date())}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Payment Method *</label>
                  <select value={method} onChange={(e) => setMethod(e.target.value)} className={`${inputClasses} bg-white`}>
                    {METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Reference <span className="text-text-muted font-normal">(optional — cheque no., transaction ID, etc.)</span>
                  </label>
                  <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className={inputClasses} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Remarks <span className="text-text-muted font-normal">(optional — e.g. “Interim payment”)</span>
                  </label>
                  <input type="text" name="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} className={inputClasses} />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60"
                >
                  {submitting ? 'Recording…' : 'Record Payment'}
                  {!submitting && <Check size={18} />}
                </button>
                {error && <p className="text-sm text-red-600 mb-0">{error}</p>}
              </form>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RecordPaymentModal;
