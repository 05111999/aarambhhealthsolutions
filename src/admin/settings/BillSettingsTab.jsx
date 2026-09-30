import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Percent, Save, Building2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { roundMoney } from '../billing/money';
import { useBillSettings, useHospitals } from './useDirectory';
import { ownHospital } from '../bills/billingHospital';

const inputClass = 'w-full px-3.5 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';

// The tax % every new bill uses. Bills already issued keep the tax they were created with.
const BillSettingsTab = () => {
  const { user } = useAuth();
  const { taxPercent, ownHospitalId, loaded } = useBillSettings();
  const { hospitals } = useHospitals();
  const activeHospitals = hospitals.filter((h) => h.isActive !== false);
  const own = ownHospital(hospitals, ownHospitalId);
  const [ownMessage, setOwnMessage] = useState(null);

  const saveOwnHospital = async (id) => {
    setOwnMessage(null);
    try {
      await setDoc(doc(db, 'settings', 'billing'), { ownHospitalId: id || null, updatedBy: user.uid, updatedAt: serverTimestamp() }, { merge: true });
      setOwnMessage({ type: 'success', text: 'Saved.' });
    } catch (err) {
      setOwnMessage({ type: 'error', text: err.message || 'Could not save.' });
    }
  };
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    const value = roundMoney(input);
    if (input === '' || Number.isNaN(Number(input)) || value < 0 || value > 100) {
      setMessage({ type: 'error', text: 'Enter a tax percentage between 0 and 100.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, 'settings', 'billing'), { taxPercent: value, updatedBy: user.uid, updatedAt: serverTimestamp() }, { merge: true });
      setInput('');
      setMessage({ type: 'success', text: `Tax set to ${value}%. All new bills will use it.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not save.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <div className="bg-white rounded-2xl border border-border p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-text-dark mb-0">Your own hospital</h3>
        </div>
        <p className="text-sm text-text-muted mb-4">
          Brands bills and payment receipts for Out Patient, Home Visit and Virtual patients. Hospital-referred patients use their referring
          hospital.
        </p>
        <select
          className={`${inputClass} bg-white cursor-pointer`}
          value={ownHospitalId && activeHospitals.some((h) => h.id === ownHospitalId) ? ownHospitalId : ''}
          onChange={(e) => saveOwnHospital(e.target.value)}
          disabled={!loaded}
          aria-label="Your own hospital"
        >
          <option value="">{own ? `Automatic (${own.name})` : 'Not set — choose a hospital'}</option>
          {activeHospitals.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
        {ownMessage && <p className={`text-sm mt-3 mb-0 ${ownMessage.type === 'error' ? 'text-red-600' : 'text-teal'}`}>{ownMessage.text}</p>}
      </div>

      <div className="bg-white rounded-2xl border border-border p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <Percent size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-text-dark mb-0">Tax on bills</h3>
        </div>
        <p className="text-sm text-text-muted mb-4">
          Current: <span className="font-semibold text-text-dark">{loaded ? `${taxPercent}%` : '…'}</span>. Applied automatically to every new
          bill, by everyone, on the amount after discount. Bills already issued keep the tax they were created with.
        </p>
        <form onSubmit={handleSave} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1">
            <input
              className={inputClass}
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder={loaded ? `${taxPercent}` : ''}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">%</span>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2 rounded-lg cursor-pointer hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
        {message && (
          <p className={`text-sm mt-3 mb-0 ${message.type === 'error' ? 'text-red-600' : 'text-teal'}`}>{message.text}</p>
        )}
      </div>
    </div>
  );
};

export default BillSettingsTab;
