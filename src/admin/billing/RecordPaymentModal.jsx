import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, Check } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../permissions/usePermission';
import { toDateInputValue, dateInputToTimestamp, isTodayInputValue } from '../../lib/dateInput';
import { roundMoney } from './money';

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

const RecordPaymentModal = ({ isOpen, onClose, patientId }) => {
  const { user } = useAuth();
  const canBackdate = usePermission('billing', 'backdate');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(toDateInputValue(new Date()));
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setAmount('');
    setMethod('cash');
    setReference('');
    setPaymentDate(toDateInputValue(new Date()));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'patients', patientId, 'transactions'), {
        type: 'payment',
        amount: roundMoney(amount),
        method,
        reference: reference.trim(),
        date: canBackdate && !isTodayInputValue(paymentDate) ? dateInputToTimestamp(paymentDate) : serverTimestamp(),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      reset();
      onClose();
    } finally {
      setSubmitting(false);
    }
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
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[101] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto"
            >
              <div className="flex justify-between items-center p-6 border-b border-border bg-bg">
                <h3 className="text-xl font-bold text-primary mb-0">Record Payment</h3>
                <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors p-1">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60"
                >
                  {submitting ? 'Recording…' : 'Record Payment'}
                  {!submitting && <Check size={18} />}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RecordPaymentModal;
