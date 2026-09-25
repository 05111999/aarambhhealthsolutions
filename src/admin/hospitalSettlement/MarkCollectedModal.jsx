import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { X, Check } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';

const MarkCollectedModal = ({ isOpen, onClose, entry }) => {
  const { user } = useAuth();
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'hospitalSettlements', entry.id), {
        status: 'collected',
        collectedAt: serverTimestamp(),
        collectedBy: user.uid,
        reference: reference.trim(),
        updatedAt: serverTimestamp(),
      });
      setReference('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && entry && (
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
                <h3 className="text-xl font-bold text-primary mb-0">Mark Collected</h3>
                <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors p-1">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="bg-bg rounded-lg px-4 py-3 text-sm">
                  <p className="text-text-dark font-medium">{entry.patientName}</p>
                  <p className="text-text-muted">
                    {entry.dateKey} · ₹{entry.amount}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Reference <span className="text-text-muted font-normal">(receipt no., collection note, etc.)</span>
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60"
                >
                  {submitting ? 'Saving…' : 'Mark Collected'}
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

export default MarkCollectedModal;
