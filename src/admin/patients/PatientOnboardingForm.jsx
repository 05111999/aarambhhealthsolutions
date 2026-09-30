import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { db } from '../../lib/firebase';
import { createPatient } from './patientCode';
import PatientFormFields, { inputClasses } from './PatientFormFields';
import { useBillSettings, useHospitals } from '../settings/useDirectory';
import { defaultHospitalFor } from '../bills/billingHospital';

const emptyForm = {
  name: '',
  age: '',
  gender: '',
  address: '',
  contact1: '',
  contact2: '',
  primaryDiagnosis: '',
  source: '', // 'hospital:<id>' | 'outpatient' | 'homeVisit' | 'virtual'
  advanceAmount: '',
  attenderName: '',
  attenderContact: '',
  sessionFrequency: '',
  assignedTherapistIds: [],
};

// Direct patients; a patient received from a hospital is an Inpatient of that hospital.
const DIRECT_TYPES = [
  { value: 'outpatient', label: 'Out Patient' },
  { value: 'homeVisit', label: 'Home Visit' },
  { value: 'virtual', label: 'Virtual' },
];

// One "Received from" choice sets both the patient type and the referring hospital, so
// billing can pick the right hospital without asking again.
function withSource(form, hospitals) {
  const hospitalId = form.source.startsWith('hospital:') ? form.source.slice('hospital:'.length) : null;
  const hospital = hospitalId ? hospitals.find((h) => h.id === hospitalId) : null;
  return {
    ...form,
    patientType: hospital ? 'inpatient' : form.source,
    referredFromHospital: !!hospital,
    referringHospitalId: hospital ? hospital.id : null,
    referringHospitalName: hospital ? hospital.name : '',
  };
}

const PatientOnboardingForm = ({ isOpen, onClose, onCreated }) => {
  const { user, profile } = useAuth();
  const { hospitals } = useHospitals();
  const { ownHospitalId } = useBillSettings();
  const activeHospitals = hospitals.filter((h) => h.isActive !== false);
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
    if (!form.source) {
      setError('Choose where the patient was received from.');
      return;
    }
    setSubmitting(true);
    try {
      const data = withSource(form, hospitals);
      // Any advance gets a receipt, branded like this patient's bills.
      data.receiptHospital = defaultHospitalFor(data, hospitals, ownHospitalId);
      data.receivedByName = profile?.name || '';
      const patient = await createPatient(db, data, user.uid);
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
                <PatientFormFields form={form} onFieldChange={handleFieldChange} hideReferral />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Received from / Patient type *</label>
                    <select name="source" required value={form.source} onChange={handleChange} className={`${inputClasses} bg-white`}>
                      <option value="">Select…</option>
                      <optgroup label="Referred by hospital (Inpatient)">
                        {activeHospitals.map((h) => (
                          <option key={h.id} value={`hospital:${h.id}`}>{h.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Direct">
                        {DIRECT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </optgroup>
                    </select>
                    {activeHospitals.length === 0 && (
                      <p className="text-xs text-text-muted mt-1 mb-0">No partner hospitals yet — the Super Admin adds them in Settings › Hospitals.</p>
                    )}
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
