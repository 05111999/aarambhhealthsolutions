import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

// Generic type-to-confirm destructive-action dialog. The confirm button stays disabled
// until the typed text exactly matches confirmPhrase — used for the only two hard
// deletes Super Admin can perform (a patient, or a single bill/transaction).
const DeleteConfirmModal = ({
  isOpen, onClose, title, description, confirmPhrase, onConfirm,
  note = 'This cannot be undone.', confirmLabel = 'Permanently Delete', busyLabel = 'Deleting…',
}) => {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setTyped('');
    setError('');
    onClose();
  };

  const handleConfirm = async () => {
    setError('');
    setDeleting(true);
    try {
      await onConfirm();
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to delete.');
    } finally {
      setDeleting(false);
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
            className="fixed inset-0 bg-text-dark/60 backdrop-blur-sm z-[110]"
            onClick={handleClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[111] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto"
            >
              <div className="flex justify-between items-center p-6 border-b border-border bg-red-50">
                <h3 className="text-xl font-bold text-red-600 mb-0 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  {title}
                </h3>
                <button onClick={handleClose} className="text-text-muted hover:text-text-dark transition-colors p-1">
                  <X size={22} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-text-muted">{description}</p>
                <p className="text-sm text-text-dark">
                  {note} Type <span className="font-mono font-bold">{confirmPhrase}</span> to confirm.
                </p>
                <input
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition-all font-mono"
                  placeholder={confirmPhrase}
                  autoFocus
                />

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={typed !== confirmPhrase || deleting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-red-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? busyLabel : confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmModal;
