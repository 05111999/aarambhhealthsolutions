import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { formatMoney, roundMoney } from '../billing/money';
import { toDateInputValue } from '../../lib/dateInput';
import { getBillableOptions } from '../bills/billableOptions';
import { IPD_CATEGORIES, admissionEndDay, admissionStartDay, dayKey } from './ipdMath';

export const inputClass = 'w-full px-3.5 py-2.5 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white';
export const labelClass = 'block text-sm font-medium text-text-dark mb-1';

// Shared modal shell: fits a phone, scrolls inside, keeps the title visible.
export const Modal = ({ title, onClose, children, busy }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center px-3 sm:px-4" role="dialog" aria-modal="true" aria-label={title}>
    <div className="absolute inset-0 bg-text-dark/60 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
      <div className="flex justify-between items-center gap-3 p-4 sm:p-5 border-b border-border bg-bg shrink-0">
        <h3 className="text-lg font-bold text-primary mb-0">{title}</h3>
        <button onClick={onClose} disabled={busy} aria-label="Close" className="text-text-muted hover:text-text-dark p-2 -m-1 disabled:opacity-40">
          <X size={20} />
        </button>
      </div>
      <div className="p-4 sm:p-5 overflow-y-auto">{children}</div>
    </div>
  </div>
);

const days = (from, to) => {
  const out = [];
  for (let d = new Date(`${from}T00:00:00`); toDateInputValue(d) <= to; d.setDate(d.getDate() + 1)) out.push(toDateInputValue(d));
  return out;
};

// Add (optionally repeated daily, e.g. room rent) or edit an IPD charge.
// Catalog prices are locked unless canEditRate (Admin+); custom charges are always priced by hand.
export const ChargeModal = ({ admission, departments, charge, canEditRate, onSave, onClose }) => {
  const isEdit = !!charge;
  const start = admissionStartDay(admission);
  const end = admissionEndDay(admission);
  const today = toDateInputValue(new Date());
  const [form, setForm] = useState(() =>
    charge
      ? {
          serviceDate: dayKey(charge.serviceDate || charge.date), category: charge.category || 'Other Charges', catalogId: '',
          serviceName: charge.serviceName || '', description: charge.description || '', quantity: String(charge.quantity ?? 1), rate: String(charge.rate ?? charge.amount),
          repeatUntil: '',
        }
      : { serviceDate: end < today ? end : today, category: 'Room Rent', catalogId: '', serviceName: '', description: '', quantity: '1', rate: '', repeatUntil: '' }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const catalog = useMemo(() => {
    const roots = departments.filter((d) => d.parentId === null && d.isActive !== false).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return roots.map((r) => ({ root: r, options: getBillableOptions(departments, r.id) })).filter((g) => g.options.length);
  }, [departments]);
  const pickCatalog = (id) => {
    const option = catalog.flatMap((g) => g.options.map((o) => ({ ...o, root: g.root.name }))).find((o) => o.id === id);
    if (!option) return set({ catalogId: '' });
    set({ catalogId: id, serviceName: option.name, rate: String(option.price), description: form.description || option.root, category: form.category });
  };
  const rateLocked = !!form.catalogId && !canEditRate;

  const amount = roundMoney((Number(form.quantity) || 0) * (Number(form.rate) || 0));
  const repeatDays = !isEdit && form.repeatUntil ? days(form.serviceDate, form.repeatUntil) : [form.serviceDate];

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.serviceDate || form.serviceDate < start || form.serviceDate > end) return setError(`The date must be within the stay (${start} to ${end}).`);
    if (form.repeatUntil && (form.repeatUntil < form.serviceDate || form.repeatUntil > end)) return setError('“Repeat daily until” must be after the date and within the stay.');
    if (!(Number(form.quantity) > 0)) return setError('Quantity must be more than 0.');
    if (form.rate === '' || !(Number(form.rate) >= 0)) return setError('Enter a rate (0 or more).');
    if (repeatDays.length > 90) return setError('Up to 90 days at a time.');
    setSaving(true);
    try {
      await onSave(repeatDays.map((d) => ({ ...form, serviceDate: d })));
      onClose();
    } catch (err) {
      setError(err.code === 'permission-denied' ? 'You don’t have permission to do this.' : err.message || 'Could not save.');
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? `Edit Charge ${charge.chargeNumber || ''}` : 'Add Charge'} onClose={onClose} busy={saving}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Date *</label>
            <input type="date" name="serviceDate" className={inputClass} min={start} max={end} value={form.serviceDate} onChange={(e) => set({ serviceDate: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Category *</label>
            <select name="category" className={inputClass} value={form.category} onChange={(e) => set({ category: e.target.value })}>
              {IPD_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        {catalog.length > 0 && (
          <div>
            <label className={labelClass}>From service catalog <span className="text-text-muted font-normal">(optional)</span></label>
            <select name="catalog" className={inputClass} value={form.catalogId} onChange={(e) => pickCatalog(e.target.value)}>
              <option value="">— Custom charge —</option>
              {catalog.map((g) => (
                <optgroup key={g.root.id} label={g.root.name}>
                  {g.options.map((o) => (
                    <option key={o.id} value={o.id}>{o.pathLabel} — {formatMoney(o.price)}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className={labelClass}>Service</label>
          <input type="text" name="serviceName" className={inputClass} placeholder={form.category} value={form.serviceName} onChange={(e) => set({ serviceName: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input type="text" name="description" className={inputClass} placeholder="e.g. Private room, CBC + LFT" value={form.description} onChange={(e) => set({ description: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Qty *</label>
            <input type="number" name="quantity" min="0.01" step="0.01" className={inputClass} value={form.quantity} onChange={(e) => set({ quantity: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Rate (₹) *</label>
            <input
              type="number" name="rate" min="0" step="0.01" className={`${inputClass} ${rateLocked ? 'bg-bg text-text-muted' : ''}`}
              value={form.rate} readOnly={rateLocked} title={rateLocked ? 'Catalog price — only an Admin can change it' : undefined}
              onChange={(e) => set({ rate: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Amount</label>
            <p className="py-2.5 mb-0 text-sm font-semibold text-text-dark" data-testid="charge-amount">{formatMoney(amount)}</p>
          </div>
        </div>
        {!isEdit && (
          <div>
            <label className={labelClass}>Repeat daily until <span className="text-text-muted font-normal">(optional — e.g. room rent for each day)</span></label>
            <input type="date" name="repeatUntil" className={inputClass} min={form.serviceDate} max={end} value={form.repeatUntil} onChange={(e) => set({ repeatUntil: e.target.value })} />
          </div>
        )}
        {error && <p className="text-sm text-red-600 mb-0">{error}</p>}
        <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60">
          {saving
            ? 'Saving…'
            : isEdit
              ? 'Save Changes'
              : repeatDays.length > 1
                ? `Add ${repeatDays.length} charges (${formatMoney(amount * repeatDays.length)})`
                : `Add Charge (${formatMoney(amount)})`}
        </button>
        {isEdit && <p className="text-xs text-text-muted mb-0">The previous values are kept in the audit log.</p>}
      </form>
    </Modal>
  );
};

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'bankTransfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'advance', label: 'Advance' },
  { value: 'other', label: 'Other' },
];

// Admin+: correct a payment's amount/mode/reference/remarks. Receipt number stays.
export const PaymentCorrectionModal = ({ payment, onSave, onClose }) => {
  const [form, setForm] = useState({ amount: String(payment.amount), method: payment.method, reference: payment.reference || '', remarks: payment.remarks || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const submit = async (e) => {
    e.preventDefault();
    if (!(Number(form.amount) > 0)) return setError('Amount must be more than 0.');
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.code === 'permission-denied' ? 'You don’t have permission to do this.' : err.message || 'Could not save.');
      setSaving(false);
    }
  };
  return (
    <Modal title={`Correct Payment ${payment.receiptNumber || ''}`} onClose={onClose} busy={saving}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Amount (₹) *</label>
            <input type="number" name="amount" min="0.01" step="0.01" className={inputClass} value={form.amount} onChange={(e) => set({ amount: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Mode *</label>
            <select name="method" className={inputClass} value={form.method} onChange={(e) => set({ method: e.target.value })}>
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Reference</label>
          <input type="text" name="reference" className={inputClass} value={form.reference} onChange={(e) => set({ reference: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Remarks</label>
          <input type="text" name="remarks" className={inputClass} value={form.remarks} onChange={(e) => set({ remarks: e.target.value })} />
        </div>
        {error && <p className="text-sm text-red-600 mb-0">{error}</p>}
        <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Correction'}
        </button>
        <p className="text-xs text-text-muted mb-0">The receipt number and date don’t change. The previous values are kept in the audit log.</p>
      </form>
    </Modal>
  );
};

// Ward, room/bed, treating doctor, expected discharge — stored on the admission.
export const AdmissionDetailsModal = ({ admission, therapists, onSave, onClose }) => {
  const [form, setForm] = useState({
    ward: admission.ward || '',
    roomBed: admission.roomBed || '',
    treatingDoctor: admission.treatingDoctor || '',
    expectedDischargeDate: dayKey(admission.expectedDischargeDate),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save.');
      setSaving(false);
    }
  };
  return (
    <Modal title="Admission Details" onClose={onClose} busy={saving}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Ward</label>
            <input type="text" name="ward" className={inputClass} placeholder="e.g. General Ward" value={form.ward} onChange={(e) => set({ ward: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Room / Bed</label>
            <input type="text" name="roomBed" className={inputClass} placeholder="e.g. 204 / B" value={form.roomBed} onChange={(e) => set({ roomBed: e.target.value })} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Treating doctor</label>
          <input type="text" name="treatingDoctor" list="ipd-doctors" className={inputClass} value={form.treatingDoctor} onChange={(e) => set({ treatingDoctor: e.target.value })} />
          <datalist id="ipd-doctors">
            {therapists.map((t) => (
              <option key={t.id} value={[t.name, t.qualification].filter(Boolean).join(', ')} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={labelClass}>Expected discharge date</label>
          <input type="date" name="expectedDischargeDate" className={inputClass} min={admissionStartDay(admission)} value={form.expectedDischargeDate} onChange={(e) => set({ expectedDischargeDate: e.target.value })} />
        </div>
        {error && <p className="text-sm text-red-600 mb-0">{error}</p>}
        <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Details'}
        </button>
      </form>
    </Modal>
  );
};
