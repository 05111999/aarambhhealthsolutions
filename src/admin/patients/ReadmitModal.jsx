import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { X, UserCheck } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';

const PATIENT_TYPES = [
  { value: 'inpatient', label: 'Inpatient' },
  { value: 'outpatient', label: 'Outpatient' },
  { value: 'homeVisit', label: 'Home Visit' },
  { value: 'virtual', label: 'Virtual' },
];

const inputClasses =
  'w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';

// Readmitting a discharged patient opens a new encounter under their existing
// permanent profile — same "one profile, many encounters" model discharge already
// uses, just run in reverse. History (prior encounters, transactions, session logs)
// is untouched.
const ReadmitModal = ({ isOpen, onClose, patientId, lastPatientType }) => {
  const { user } = useAuth();
  const [patientType, setPatientType] = useState(lastPatientType || 'outpatient');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const encounterRef = doc(collection(db, 'patients', patientId, 'encounters'));
      const batch = writeBatch(db);
      batch.set(encounterRef, {
        type: patientType,
        status: 'active',
        startedAt: serverTimestamp(),
        closedAt: null,
        createdBy: user.uid,
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'patients', patientId), {
        currentStatus: 'active',
        currentPatientType: patientType,
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to readmit patient.');
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
                <h3 className="text-xl font-bold text-primary mb-0">Readmit Patient</h3>
                <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors p-1">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Patient Type *</label>
                  <select
                    required
                    value={patientType}
                    onChange={(e) => setPatientType(e.target.value)}
                    className={`${inputClasses} bg-white`}
                  >
                    {PATIENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-xs text-text-muted">
                  This opens a new active encounter. Prior encounters, transactions, and session logs stay exactly as they are.
                </p>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60"
                >
                  {submitting ? 'Readmitting…' : 'Readmit Patient'}
                  {!submitting && <UserCheck size={18} />}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReadmitModal;
