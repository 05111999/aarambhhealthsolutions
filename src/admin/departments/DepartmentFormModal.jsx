import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';

const emptyForm = { name: '', description: '', price: '', isActive: true };

const inputClasses =
  'w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';

// Shared create/edit modal. `parentName` (create mode) or `node` (edit mode) tells the
// user what they're adding to / editing.
const DepartmentFormModal = ({ isOpen, onClose, onSubmit, parentName, node }) => {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (node) {
      setForm({
        name: node.name || '',
        description: node.description || '',
        price: node.price ?? '',
        isActive: node.isActive !== false,
      });
    } else {
      setForm(emptyForm);
    }
  }, [node, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        price: form.price === '' ? null : Number(form.price),
        isActive: form.isActive,
      });
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
                <h3 className="text-xl font-bold text-primary mb-0">
                  {node ? 'Edit' : parentName ? `Add under ${parentName}` : 'Add Department'}
                </h3>
                <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors p-1">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">
                    Price (₹) <span className="text-text-muted font-normal">(leave blank for a category with no direct price)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Description</label>
                  <textarea
                    rows="2"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={`${inputClasses} resize-none`}
                  />
                </div>

                {node && (
                  <label className="flex items-center gap-2 text-sm text-text-dark">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary/30"
                    />
                    Active
                  </label>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60"
                >
                  {submitting ? 'Saving…' : 'Save'}
                  {!submitting && <Save size={18} />}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DepartmentFormModal;
