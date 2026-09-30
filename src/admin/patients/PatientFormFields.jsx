import React from 'react';
import { useHospitals, useTherapists } from '../settings/useDirectory';

// Shared demographic field set used by both the onboarding form (create) and the edit
// modal (update) so the ~15 fields aren't duplicated. Deliberately does NOT include
// patientType or advanceAmount: patientType only ever changes via onboarding or the
// dedicated Readmit flow, and advanceAmount is really a transaction recorded once at
// onboarding, not a patient field that should be silently overwritable later.
export const inputClasses =
  'w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';

const LEGACY = '__legacy__';

// hideReferral: onboarding asks "Received from" together with the patient type instead.
const PatientFormFields = ({ form, onFieldChange, hideReferral = false }) => {
  const set = (name) => (e) => onFieldChange(name, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
  const { therapists } = useTherapists();
  const { hospitals } = useHospitals();

  // Referring hospital: picked from Settings › Hospitals. Older records may only have a
  // typed-in name; it stays selected (and saved unchanged) until someone picks another.
  const referralHospitals = hospitals.filter((h) => h.isActive !== false || h.id === form.referringHospitalId);
  const matched = form.referredFromHospital
    ? hospitals.find((h) => h.id === form.referringHospitalId) ||
      hospitals.find((h) => (h.name || '').trim().toLowerCase() === (form.referringHospitalName || '').trim().toLowerCase())
    : null;
  const referralValue = !form.referredFromHospital ? '' : matched ? matched.id : LEGACY;
  const setReferral = (value) => {
    if (value === LEGACY) return;
    const h = hospitals.find((x) => x.id === value);
    onFieldChange('referredFromHospital', !!h);
    onFieldChange('referringHospitalId', h ? h.id : null);
    onFieldChange('referringHospitalName', h ? h.name : '');
  };
  const assigned = form.assignedTherapistIds || [];
  // Keep already-assigned therapists visible even if later marked inactive.
  const activeTherapists = therapists.filter((t) => t.isActive !== false || assigned.includes(t.id));

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-text-dark mb-1">Patient Name *</label>
        <input type="text" name="name" required value={form.name} onChange={set('name')} className={inputClasses} placeholder="Full name" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1">Age *</label>
          <input type="number" name="age" required min="0" max="150" value={form.age} onChange={set('age')} className={inputClasses} />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1">Gender *</label>
          <select name="gender" required value={form.gender} onChange={set('gender')} className={`${inputClasses} bg-white`}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-dark mb-1">Address *</label>
        <input type="text" name="address" required value={form.address} onChange={set('address')} className={inputClasses} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1">Contact Number 1 *</label>
          <input
            type="tel"
            name="contact1"
            required
            value={form.contact1}
            onChange={set('contact1')}
            className={inputClasses}
            placeholder="+91 98765 43210"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1">Contact Number 2</label>
          <input type="tel" name="contact2" value={form.contact2} onChange={set('contact2')} className={inputClasses} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-dark mb-1">Primary Diagnosis *</label>
        <input
          type="text"
          name="primaryDiagnosis"
          required
          value={form.primaryDiagnosis}
          onChange={set('primaryDiagnosis')}
          className={inputClasses}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1">Attender Name</label>
          <input type="text" name="attenderName" value={form.attenderName} onChange={set('attenderName')} className={inputClasses} />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1">Attender Contact Number</label>
          <input type="tel" name="attenderContact" value={form.attenderContact} onChange={set('attenderContact')} className={inputClasses} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-dark mb-1">
          Session Frequency <span className="text-text-muted font-normal">(e.g. &quot;3×/week&quot;, &quot;Daily&quot;)</span>
        </label>
        <input
          type="text"
          name="sessionFrequency"
          value={form.sessionFrequency}
          onChange={set('sessionFrequency')}
          className={inputClasses}
        />
      </div>

      {!hideReferral && (
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1">Referred by hospital</label>
          <select value={referralValue} onChange={(e) => setReferral(e.target.value)} className={`${inputClasses} bg-white`}>
            <option value="">Not referred by a hospital</option>
            {referralHospitals.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
            {referralValue === LEGACY && <option value={LEGACY}>{form.referringHospitalName} (not in Settings › Hospitals)</option>}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-dark mb-1">
          Assigned Therapists <span className="text-text-muted font-normal">(they&apos;ll see this patient&apos;s bills)</span>
        </label>
        {activeTherapists.length === 0 ? (
          <p className="text-xs text-text-muted">No therapists set up yet — the Super Admin adds them in Settings › Therapists.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeTherapists.map((t) => {
              const selected = assigned.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onFieldChange('assignedTherapistIds', selected ? assigned.filter((id) => id !== t.id) : [...assigned, t.id])}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer border transition-colors ${
                    selected ? 'bg-primary text-white border-primary' : 'bg-white text-text-muted border-border hover:border-primary/40 hover:text-text-dark'
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default PatientFormFields;
