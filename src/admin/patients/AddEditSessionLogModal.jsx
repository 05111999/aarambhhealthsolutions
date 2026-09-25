import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { X, ClipboardPlus } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { toDateInputValue, dateInputToTimestamp } from '../../lib/dateInput';
import { SESSION_TYPE_OPTIONS } from './sessionTypes';

const inputClasses =
  'w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';

// Handles both create (log === null) and edit (log === the existing doc) — same form,
// same validation, so the two paths can't quietly drift apart.
const AddEditSessionLogModal = ({ isOpen, onClose, patientId, log }) => {
  const { user } = useAuth();
  const isEdit = !!log;
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [sessionType, setSessionType] = useState('free');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (log) {
      setDate(toDateInputValue(log.date?.toDate ? log.date.toDate() : new Date()));
      setSessionType(log.sessionType || 'free');
      setNotes(log.notes || '');
    } else {
      setDate(toDateInputValue(new Date()));
      setSessionType('free');
      setNotes('');
    }
    setError('');
  }, [isOpen, log]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const dateTimestamp = dateInputToTimestamp(date);
      if (isEdit) {
        await updateDoc(doc(db, 'patients', patientId, 'sessionLogs', log.id), {
          date: dateTimestamp,
          sessionType,
          notes: notes.trim(),
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'patients', patientId, 'sessionLogs'), {
          date: dateTimestamp,
          sessionType,
          notes: notes.trim(),
          recordedBy: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save session log.');
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
                <h3 className="text-xl font-bold text-primary mb-0">{isEdit ? 'Edit Session Log' : 'Add Session Log'}</h3>
                <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors p-1">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Session Date *</label>
                    <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClasses} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Session Type *</label>
                    <select
                      required
                      value={sessionType}
                      onChange={(e) => setSessionType(e.target.value)}
                      className={`${inputClasses} bg-white`}
                    >
                      {SESSION_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Progress Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="4"
                    className={`${inputClasses} resize-none`}
                    placeholder="What happened in this session…"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60"
                >
                  {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Session Log'}
                  {!submitting && <ClipboardPlus size={18} />}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddEditSessionLogModal;
