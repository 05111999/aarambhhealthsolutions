import React from 'react';

// Shared demographic field set used by both the onboarding form (create) and the edit
// modal (update) so the ~15 fields aren't duplicated. Deliberately does NOT include
// patientType or advanceAmount: patientType only ever changes via onboarding or the
// dedicated Readmit flow, and advanceAmount is really a transaction recorded once at
// onboarding, not a patient field that should be silently overwritable later.
export const inputClasses =
  'w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';

const PatientFormFields = ({ form, onFieldChange }) => {
  const set = (name) => (e) => onFieldChange(name, e.target.type === 'checkbox' ? e.target.checked : e.target.value);

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

      <div className="border border-border rounded-md px-4 py-3 space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-text-dark cursor-pointer">
          <input type="checkbox" name="referredFromHospital" checked={form.referredFromHospital} onChange={set('referredFromHospital')} />
          Received from hospital
        </label>
        {form.referredFromHospital && (
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Referring Hospital Name</label>
            <input
              type="text"
              name="referringHospitalName"
              value={form.referringHospitalName}
              onChange={set('referringHospitalName')}
              className={inputClasses}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default PatientFormFields;
