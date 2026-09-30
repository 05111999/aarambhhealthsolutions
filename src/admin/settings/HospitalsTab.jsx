import React, { useEffect, useState } from 'react';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Pencil, X, Building2, Heart, Upload, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { useHospitals } from './useDirectory';
import { resizeLogo } from './resizeLogo';
import DeleteConfirmModal from '../patients/DeleteConfirmModal';
import { countBillsForHospital, deleteHospital, friendlyDeleteError } from './directoryDeletion';

const inputClass = 'w-full px-3.5 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
const labelClass = 'block text-sm font-medium text-text-dark mb-1';

const blank = {
  name: '', logo: '', addressLine1: '', addressLine2: '', phone: '', email: '', website: '', footerLines: '', defaultNote: '', isActive: true,
};

// Pre-filled from the public website's footer. Those address/phone values may be
// placeholders, so the form says so.
const AARAMBH_PRESET = {
  ...blank,
  name: 'AArambh Rehabilitation Care Services',
  addressLine1: '123 Health Avenue, Khandagiri',
  addressLine2: 'Bhubaneswar, Odisha 751030',
  phone: '+91 98765 43210',
  email: 'care@aarambh.in',
  website: 'www.aarambhhealthsolutions.com',
  footerLines: 'Physiotherapy & Rehabilitation\nOccupational & Speech Therapy\nHome Visits & Online Consultations',
  defaultNote: 'Thank you for choosing AArambh. Wishing you a speedy recovery!',
};

const HospitalModal = ({ initial, isPreset, onClose }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      set({ logo: await resizeLogo(file) });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const data = {
      name: form.name.trim(),
      logo: form.logo || '',
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
      footerLines: form.footerLines.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 4),
      defaultNote: form.defaultNote.trim(),
      isActive: form.isActive,
      updatedBy: user.uid,
      updatedAt: serverTimestamp(),
    };
    try {
      if (form.id) await updateDoc(doc(db, 'hospitals', form.id), data);
      else await addDoc(collection(db, 'hospitals'), { ...data, createdBy: user.uid, createdAt: serverTimestamp() });
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-text-dark/50 backdrop-blur-sm z-[100] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 className="text-xl font-bold text-primary mb-0">{form.id ? 'Edit Hospital' : 'Add Hospital'}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-dark p-1 cursor-pointer"><X size={22} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isPreset && (
            <div className="bg-amber-50 border border-amber-100 text-amber-700 text-xs px-3 py-2.5 rounded-lg flex gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              Copied from the website footer — please check the address and phone number; they may be placeholder values.
            </div>
          )}
          <div>
            <label className={labelClass}>Hospital name *</label>
            <input required className={inputClass} value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Logo</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg border border-border bg-bg flex items-center justify-center overflow-hidden shrink-0">
                {form.logo ? <img src={form.logo} alt="" className="max-w-full max-h-full object-contain" /> : <Heart size={22} className="text-primary" />}
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-primary cursor-pointer hover:text-teal">
                <Upload size={15} />
                {form.logo ? 'Replace' : 'Upload'}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
              </label>
              {form.logo && (
                <button type="button" onClick={() => set({ logo: '' })} className="text-sm text-text-muted cursor-pointer hover:text-red-600">Remove</button>
              )}
            </div>
            <p className="text-xs text-text-muted mt-1">Shown on the bill footer and as a faint watermark. Without one, the AArambh heart mark is used.</p>
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <input className={`${inputClass} mb-2`} placeholder="Street / area" value={form.addressLine1} onChange={(e) => set({ addressLine1: e.target.value })} />
            <input className={inputClass} placeholder="City, State PIN" value={form.addressLine2} onChange={(e) => set({ addressLine2: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Phone</label>
              <input className={inputClass} value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={inputClass} value={form.email} onChange={(e) => set({ email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Website</label>
            <input className={inputClass} value={form.website} onChange={(e) => set({ website: e.target.value })} placeholder="www.example.com" />
          </div>
          <div>
            <label className={labelClass}>Footer lines <span className="text-text-muted font-normal">(one per line, up to 4)</span></label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={form.footerLines} onChange={(e) => set({ footerLines: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Default bill note</label>
            <input className={inputClass} value={form.defaultNote} onChange={(e) => set({ defaultNote: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-text-dark cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
            Active (available when creating bills)
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl cursor-pointer disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Hospital'}
          </button>
        </form>
      </div>
    </div>
  );
};

// What else is affected — counted when the dialog opens (one count query).
const HospitalImpact = ({ hospital }) => {
  const [billCount, setBillCount] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    countBillsForHospital(hospital.id).then((n) => live && setBillCount(n)).catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [hospital.id]);

  return (
    <div className="text-sm bg-bg rounded-lg px-4 py-3 space-y-1.5">
      <p className="mb-0 text-text-dark font-medium">What happens:</p>
      <ul className="list-disc pl-5 space-y-1 text-text-muted mb-0">
        <li>The hospital, its logo and contact details are removed and it can no longer be chosen on new bills.</li>
        <li>
          {failed ? 'Bills already issued under it' : billCount === null ? 'Checking existing bills…' : `${billCount} bill${billCount === 1 ? '' : 's'} already issued under it`}
          {' '}stay in patients&apos; records and balances, and keep the hospital&apos;s name, address and contact on the invoice — but its logo will no longer print on them.
        </li>
        <li>Staff, patients and services are not linked to a hospital, so they are not affected.</li>
      </ul>
    </div>
  );
};

const HospitalsTab = () => {
  const { user } = useAuth();
  const { hospitals, loaded } = useHospitals();
  const [modal, setModal] = useState(null); // { initial, isPreset }
  const [deleting, setDeleting] = useState(null);
  const [notice, setNotice] = useState('');

  const confirmDelete = async () => {
    try {
      await deleteHospital(deleting, user.uid);
    } catch (err) {
      throw new Error(friendlyDeleteError(err));
    }
    setNotice(`Deleted ${deleting.name}.`);
  };

  const openEdit = (h) =>
    setModal({ initial: { ...blank, ...h, footerLines: (h.footerLines || []).join('\n'), isActive: h.isActive !== false }, isPreset: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-sm text-text-muted mb-0">Partner hospitals. The hospital chosen on a bill brands the whole invoice.</p>
        <button
          onClick={() => setModal({ initial: blank, isPreset: false })}
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-light-blue transition-colors text-sm"
        >
          <Plus size={16} />
          Add Hospital
        </button>
      </div>

      {notice && (
        <div className="mb-4 bg-teal/10 border border-teal/20 text-teal text-sm font-medium px-4 py-3 rounded-lg flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="shrink-0" />{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss" className="cursor-pointer p-1 -m-1"><X size={16} /></button>
        </div>
      )}

      {loaded && hospitals.length === 0 && (
        <div className="bg-white rounded-2xl border border-border p-10 text-center">
          <Building2 size={28} className="mx-auto mb-3 text-text-muted opacity-50" />
          <p className="text-text-dark font-medium mb-1">No hospitals yet</p>
          <p className="text-sm text-text-muted mb-4">Bills can&apos;t be created until at least one hospital exists.</p>
          <button
            onClick={() => setModal({ initial: AARAMBH_PRESET, isPreset: true })}
            className="inline-flex items-center gap-2 bg-white border border-border text-text-dark font-semibold px-4 py-2 rounded-lg cursor-pointer hover:border-primary/30 hover:text-primary transition-colors text-sm"
          >
            <Heart size={15} className="text-primary" />
            Add AArambh (pre-filled)
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hospitals.map((h) => (
          <div key={h.id} className="relative">
            <button
              onClick={() => openEdit(h)}
              className="group w-full text-left bg-white rounded-2xl border border-border p-4 sm:p-5 pr-24 cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-lg border border-border bg-bg flex items-center justify-center overflow-hidden shrink-0">
                  {h.logo ? <img src={h.logo} alt="" className="max-w-full max-h-full object-contain" /> : <Heart size={20} className="text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-text-dark mb-0 group-hover:text-primary transition-colors break-words">{h.name}</p>
                    {h.isActive === false && <span className="text-[11px] bg-bg text-text-muted px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                  <p className="text-xs text-text-muted mb-0 mt-1 break-words">{[h.addressLine1, h.addressLine2].filter(Boolean).join(', ') || 'No address'}</p>
                  <p className="text-xs text-text-muted mb-0 break-words">{[h.phone, h.website].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
            </button>
            <div className="absolute top-3 right-3 flex items-center gap-1">
              <button onClick={() => openEdit(h)} title="Edit hospital" aria-label={`Edit ${h.name}`} className="p-2.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer">
                <Pencil size={16} />
              </button>
              <button onClick={() => { setNotice(''); setDeleting(h); }} title="Delete hospital" aria-label={`Delete ${h.name}`} className="p-2.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && <HospitalModal initial={modal.initial} isPreset={modal.isPreset} onClose={() => setModal(null)} />}

      <DeleteConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Hospital"
        description="This action will permanently delete the hospital and its associated data. This action cannot be undone."
        note=""
        phraseLabel="the hospital name"
        confirmPhrase={deleting?.name || ''}
        confirmLabel="Delete Hospital"
        onConfirm={confirmDelete}
      >
        {deleting && <HospitalImpact hospital={deleting} />}
      </DeleteConfirmModal>
    </div>
  );
};

export default HospitalsTab;
