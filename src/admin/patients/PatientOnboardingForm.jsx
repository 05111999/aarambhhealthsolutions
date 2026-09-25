import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { db } from '../../lib/firebase';
import { createPatient } from './patientCode';
import PatientFormFields, { inputClasses } from './PatientFormFields';

const emptyForm = {
  name: '',
  age: '',
  gender: '',
  address: '',
  contact1: '',
  contact2: '',
  primaryDiagnosis: '',
  patientType: 'outpatient',
  advanceAmount: '',
  attenderName: '',
  attenderContact: '',
  sessionFrequency: '',
  referredFromHospital: false,
  referringHospitalName: '',
};

const PATIENT_TYPES = [
  { value: 'inpatient', label: 'Inpatient' },
  { value: 'outpatient', label: 'Outpatient' },
  { value: 'homeVisit', label: 'Home Visit' },
  { value: 'virtual', label: 'Virtual' },
];

const PatientOnboardingForm = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFieldChange = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleClose = () => {
    setForm(emptyForm);
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const patient = await createPatient(db, form, user.uid);
      onCreated?.(patient);
      setForm(emptyForm);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create patient.');
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
            onClick={handleClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[101] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto"
            >
              <div className="flex justify-between items-center p-6 border-b border-border bg-bg sticky top-0">
                <h3 className="text-xl font-bold text-primary mb-0">Onboard New Patient</h3>
                <button onClick={handleClose} className="text-text-muted hover:text-text-dark transition-colors p-1">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <PatientFormFields form={form} onFieldChange={handleFieldChange} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Patient Type *</label>
                    <select name="patientType" required value={form.patientType} onChange={handleChange} className={`${inputClasses} bg-white`}>
                      {PATIENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Advance Payment (₹)</label>
                    <input
                      type="number"
                      name="advanceAmount"
                      min="0"
                      step="0.01"
                      value={form.advanceAmount}
                      onChange={handleChange}
                      className={inputClasses}
                      placeholder="0"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Creating…' : 'Create Patient'}
                    {!submitting && <UserPlus size={18} />}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PatientOnboardingForm;
