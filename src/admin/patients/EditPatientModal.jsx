import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { X, Save } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import PatientFormFields from './PatientFormFields';

// Edit is deliberately scoped to demographic fields only — patientCode, currentStatus,
// currentPatientType, advanceAmount, createdBy/createdAt never go through this form.
// Status changes only ever happen via Discharge/Readmit; type only via onboarding or
// the Readmit flow. firestore.rules enforces the same field split server-side.
const toFormState = (patient) => ({
  name: patient.name || '',
  age: patient.age ?? '',
  gender: patient.gender || '',
  address: patient.address || '',
  contact1: patient.contact1 || '',
  contact2: patient.contact2 || '',
  primaryDiagnosis: patient.primaryDiagnosis || '',
  attenderName: patient.attenderName || '',
  attenderContact: patient.attenderContact || '',
  sessionFrequency: patient.sessionFrequency || '',
  referredFromHospital: !!patient.referredFromHospital,
  referringHospitalName: patient.referringHospitalName || '',
});

const EditPatientModal = ({ isOpen, onClose, patientId, patient }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(() => toFormState(patient));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) setForm(toFormState(patient));
  }, [isOpen, patient]);

  const handleFieldChange = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'patients', patientId), {
        name: form.name.trim(),
        nameLower: form.name.trim().toLowerCase(),
        age: Number(form.age),
        gender: form.gender,
        address: form.address,
        contact1: form.contact1,
        contact1Digits: form.contact1.replace(/\D/g, ''),
        contact2: form.contact2 || '',
        contact2Digits: (form.contact2 || '').replace(/\D/g, ''),
        primaryDiagnosis: form.primaryDiagnosis,
        attenderName: form.attenderName || '',
        attenderContact: form.attenderContact || '',
        attenderContactDigits: (form.attenderContact || '').replace(/\D/g, ''),
        sessionFrequency: form.sessionFrequency || '',
        referredFromHospital: !!form.referredFromHospital,
        referringHospitalName: form.referredFromHospital ? form.referringHospitalName || '' : '',
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update patient.');
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
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto"
            >
              <div className="flex justify-between items-center p-6 border-b border-border bg-bg sticky top-0">
                <h3 className="text-xl font-bold text-primary mb-0">Edit Patient Details</h3>
                <button onClick={onClose} className="text-text-muted hover:text-text-dark transition-colors p-1">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <PatientFormFields form={form} onFieldChange={handleFieldChange} />

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving…' : 'Save Changes'}
                    {!submitting && <Save size={18} />}
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

export default EditPatientModal;
