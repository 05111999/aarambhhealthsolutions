import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, ChevronDown, ChevronRight, Plus, Trash2, Save, Search, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { formatMoney } from '../billing/money';
import { toDateInputValue } from '../../lib/dateInput';
import { usePatientMatches } from '../patients/usePatientMatches';
import { useBillSettings, useHospitals, useTherapists } from '../settings/useDirectory';
import { useLiveSource } from '../data/liveStore';
import { SOURCES } from '../data/sources';
import { adjustmentLabel, computeBill } from './billMath';
import { defaultHospitalFor, referringHospital } from './billingHospital';
import { getBillableOptions } from './billableOptions';
import { createBill, updateBill, useBill, toDateInput } from './billService';
import ScaledInvoice from './ScaledInvoice';
import InvoiceDocument from './InvoiceDocument';
import { useBillContext } from './useBillContext';
import HelpLink from '../help/HelpLink';

const inputClass =
  'w-full px-3.5 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';
const labelClass = 'block text-xs font-medium text-text-dark mb-1';

let keySeq = 0;
const newKey = () => `item-${Date.now()}-${keySeq++}`;

const emptyForm = () => ({
  patient: { name: '', phone: '', address: '', cityLine: '' },
  hospitalId: '',
  physicianId: '',
  physician: { name: '', qualification: '', phone: '', address: '' },
  invoiceDate: toDateInputValue(new Date()),
  dueDate: toDateInputValue(new Date()),
  items: [],
  discount: { type: 'amount', value: '' },
  tax: { type: 'percent', value: '' },
  notes: '',
});

// A form section. `step` shows a numbered badge so the page reads as a simple 1-2-3 flow.
const Card = ({ icon: Icon, step, title, children, action, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-border p-4 sm:p-5 min-w-0 ${className}`}>
    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
      <div className="flex items-center gap-2.5">
        {step ? (
          <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">{step}</span>
        ) : (
          Icon && <Icon size={16} className="text-primary" />
        )}
        <h3 className="text-sm font-semibold text-text-dark mb-0">{title}</h3>
      </div>
      {action}
    </div>
    {children}
  </div>
);

const TypeToggle = ({ value, onChange }) => (
  <div className="inline-flex rounded-md border border-border overflow-hidden shrink-0">
    {[
      ['percent', '%'],
      ['amount', '₹'],
    ].map(([type, label]) => (
      <button
        key={type}
        type="button"
        onClick={() => onChange(type)}
        className={`px-3 py-2 text-sm font-semibold cursor-pointer transition-colors ${
          value === type ? 'bg-primary text-white' : 'bg-white text-text-muted hover:text-text-dark'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

const BillEditor = () => {
  const { billId } = useParams();
  const isEdit = !!billId;
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile, hasPermission } = useAuth();
  const canDiscount = hasPermission('billing', 'discount');
  const canBackdate = hasPermission('billing', 'backdate');

  const { hospitals, loaded: hospitalsLoaded } = useHospitals();
  const { therapists } = useTherapists();
  const billSettings = useBillSettings();
  const existing = useBill(isEdit ? billId : null);

  const [form, setForm] = useState(emptyForm);
  const [patient, setPatient] = useState(null);
  const { data: departmentData } = useLiveSource(SOURCES.departments);
  const departments = useMemo(() => departmentData || [], [departmentData]);
  const [initialized, setInitialized] = useState(!isEdit);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [patientHighlight, setPatientHighlight] = useState(0);
  // Once chosen, the patient shows as just a name; "Change" opens the printed details.
  const [patientOpen, setPatientOpen] = useState(false);
  const [pickingPatient, setPickingPatient] = useState(!isEdit);
  // Hospital & Physician shows just the two names until expanded.
  const [hpOpen, setHpOpen] = useState(false);
  const [pickDept, setPickDept] = useState('');
  const [pickService, setPickService] = useState('');
  const [serviceQuery, setServiceQuery] = useState('');
  const [serviceListOpen, setServiceListOpen] = useState(false);
  const [serviceHighlight, setServiceHighlight] = useState(0);
  const serviceInputRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { matches: patientMatches, loading: patientsLoading } = usePatientMatches(searchTerm);
  const activeHospitals = hospitals.filter((h) => h.isActive !== false);
  const activeTherapists = therapists.filter((t) => t.isActive !== false);
  const hospital = hospitals.find((h) => h.id === form.hospitalId) || null;
  // Stays open while a hospital still has to be chosen or the patient's referring
  // hospital isn't set up (its warning must be seen).
  const referralMissing = !isEdit && !!patient?.referredFromHospital && !referringHospital(patient, hospitals);
  const hpExpanded = hpOpen || !form.hospitalId || referralMissing;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));


  const selectPatient = (p) => {
    setPatient(p);
    setSearchTerm('');
    setPickingPatient(false);
    setPatientOpen(false);
    setForm((f) => ({
      ...f,
      patient: { name: p.name || '', phone: p.contact1 || '', address: p.address || '', cityLine: '' },
      // Default the physician to the patient's first assigned therapist, if any.
      physicianId: f.physicianId || (p.assignedTherapistIds || []).find((id) => therapists.some((t) => t.id === id)) || '',
    }));
  };

  // Create: pre-select a patient passed as ?patient=<id>.
  useEffect(() => {
    const pid = params.get('patient');
    if (isEdit || !pid) return;
    getDoc(doc(db, 'patients', pid)).then((snap) => {
      if (snap.exists() && !snap.data().isDeleted) selectPatient({ id: snap.id, ...snap.data() });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, params]);

  // Edit: load the saved bill into the form once.
  useEffect(() => {
    if (!isEdit || !existing || initialized) return;
    setForm({
      patient: { name: '', phone: '', address: '', cityLine: '', ...existing.patient },
      hospitalId: existing.hospitalId || '',
      physicianId: existing.physicianId || '',
      physician: { name: '', qualification: '', phone: '', address: '', ...(existing.physician || {}) },
      invoiceDate: toDateInput(existing.invoiceDate) || toDateInputValue(new Date()),
      dueDate: toDateInput(existing.dueDate),
      items: (existing.items || []).map((i) => ({ ...i, key: newKey(), price: String(i.price) })),
      discount: { type: existing.discount?.type || 'amount', value: existing.discount?.value ? String(existing.discount.value) : '' },
      tax: { type: existing.tax?.type || 'percent', value: existing.tax?.value ? String(existing.tax.value) : '' },
      notes: existing.notes || '',
    });
    getDoc(doc(db, 'patients', existing.patientId)).then((snap) => snap.exists() && setPatient({ id: snap.id, ...snap.data() }));
    setInitialized(true);
  }, [isEdit, existing, initialized]);

  // Physician details fill in when a (different) therapist is picked — and stay
  // editable afterwards. A saved bill keeps its own snapshot until the pick changes.
  const [appliedPhysicianId, setAppliedPhysicianId] = useState(null);
  useEffect(() => {
    if (!initialized) return;
    if (isEdit && appliedPhysicianId === null) {
      setAppliedPhysicianId(form.physicianId);
      return;
    }
    if (form.physicianId === appliedPhysicianId) return;
    const t = therapists.find((x) => x.id === form.physicianId);
    if (form.physicianId && !t) return; // therapist list still loading
    setAppliedPhysicianId(form.physicianId);
    setForm((f) => ({
      ...f,
      physician: t
        ? { name: t.name || '', qualification: t.qualification || '', phone: t.phone || '', address: t.address || '' }
        : { name: '', qualification: '', phone: '', address: '' },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.physicianId, therapists, initialized]);

  // New bill: pre-select the hospital from the patient (their referring hospital, or the
  // clinic's own hospital for direct patients), so it isn't asked again. Still changeable.
  // Before a patient is picked, a single active hospital is picked automatically.
  const [autoHospitalFor, setAutoHospitalFor] = useState(null);
  useEffect(() => {
    if (isEdit || !hospitalsLoaded || !billSettings.loaded) return;
    const key = patient?.id || '';
    if (autoHospitalFor === key) return;
    const h = patient ? defaultHospitalFor(patient, hospitals, billSettings.ownHospitalId) : activeHospitals.length === 1 ? activeHospitals[0] : null;
    if (!h && !patient) return;
    setAutoHospitalFor(key);
    if (h) selectHospital(h.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id, hospitalsLoaded, hospitals, billSettings.loaded, billSettings.ownHospitalId, isEdit]);

  function selectHospital(id) {
    const h = hospitals.find((x) => x.id === id);
    setForm((f) => ({ ...f, hospitalId: id, notes: f.notes || h?.defaultNote || '' }));
  }

  const roots = useMemo(() => departments.filter((d) => d.parentId === null && d.isActive !== false), [departments]);
  // Every priced service in the catalog, tagged with its top-level department, so a
  // service can be found by typing without choosing the department first.
  const allServices = useMemo(
    () => roots.flatMap((root) => getBillableOptions(departments, root.id).map((o) => ({ ...o, deptId: root.id, deptName: root.name }))),
    [departments, roots]
  );
  const serviceSuggestions = useMemo(() => {
    const words = serviceQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return allServices.filter(
      (o) => (!pickDept || o.deptId === pickDept) && words.every((w) => `${o.pathLabel} ${o.deptName}`.toLowerCase().includes(w))
    );
  }, [allServices, pickDept, serviceQuery]);
  const deptHasServices = !pickDept || allServices.some((o) => o.deptId === pickDept);

  // Picking a suggestion fills in its department too; "Add" (or Enter) adds the line.
  const chooseService = (o) => {
    setPickDept(o.deptId);
    setPickService(o.id);
    setServiceQuery(o.pathLabel);
    setServiceListOpen(false);
  };

  const addService = () => {
    const option = allServices.find((o) => o.id === pickService);
    if (!option) return;
    set({
      items: [
        ...form.items,
        { key: newKey(), name: option.name, description: option.pathLabel !== option.name ? option.pathLabel : option.deptName, price: String(option.price), departmentId: option.deptId, departmentName: option.deptName },
      ],
    });
    setPickService('');
    setServiceQuery('');
    serviceInputRef.current?.focus();
  };

  const onServiceKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setServiceListOpen(true);
      const n = serviceSuggestions.length;
      if (n) setServiceHighlight((i) => (e.key === 'ArrowDown' ? (i + 1) % n : (i - 1 + n) % n));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (serviceListOpen && serviceSuggestions[serviceHighlight]) chooseService(serviceSuggestions[serviceHighlight]);
      else addService();
    } else if (e.key === 'Escape') {
      setServiceListOpen(false);
    }
  };

  const onPatientKeyDown = (e) => {
    const n = patientMatches.length;
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && n) {
      e.preventDefault();
      setPatientHighlight((i) => (e.key === 'ArrowDown' ? (i + 1) % n : (i - 1 + n) % n));
    } else if (e.key === 'Enter' && patientMatches[patientHighlight]) {
      e.preventDefault();
      selectPatient(patientMatches[patientHighlight]);
    } else if (e.key === 'Escape' && patient) {
      setPickingPatient(false);
    }
  };
  const addCustomItem = () => set({ items: [...form.items, { key: newKey(), name: '', description: '', price: '', departmentId: null, departmentName: null }] });
  const updateItem = (key, patch) => set({ items: form.items.map((i) => (i.key === key ? { ...i, ...patch } : i)) });
  const removeItem = (key) => set({ items: form.items.filter((i) => i.key !== key) });

  const discount = canDiscount ? form.discount : { type: 'amount', value: 0 };
  // New bills always use the tax % set by the Super Admin; an edited bill keeps the tax it was issued with.
  const tax = isEdit ? form.tax : { type: 'percent', value: billSettings.taxPercent };
  const totals = computeBill(form.items, discount, tax);

  const previewBill = {
    billNumber: existing?.billNumber,
    patient: { ...form.patient, patientCode: patient?.patientCode || existing?.patient?.patientCode },
    physician: form.physicianId ? form.physician : null,
    hospital: hospital || existing?.hospital || {},
    items: form.items.map((i) => ({ ...i, price: Number(i.price) || 0 })),
    discount: { ...discount, amount: totals.discountAmount },
    tax: { ...tax, amount: totals.taxAmount },
    subtotal: totals.subtotal,
    total: totals.total,
    notes: form.notes,
    invoiceDate: form.invoiceDate,
    dueDate: form.dueDate,
    createdByName: existing?.createdByName || profile?.name,
    transactionId: existing?.transactionId,
  };
  // Patient record, visit/admission and its payments for the detailed-bill layout.
  const billContext = useBillContext({ patientId: patient?.id || existing?.patientId, bill: previewBill });

  const handleSave = async () => {
    setError('');
    if (!patient) return setError('Select a patient.');
    if (!hospital) {
      setHpOpen(true);
      return setError('Select a hospital.');
    }
    if (form.items.length === 0) return setError('Add at least one item.');
    if (form.items.some((i) => !i.name.trim())) return setError('Every item needs a name.');
    if (form.items.some((i) => i.price === '' || Number.isNaN(Number(i.price)) || Number(i.price) < 0)) {
      return setError('Every item needs a valid price (0 or more).');
    }
    setSaving(true);
    try {
      const payload = { ...form, discount, tax };
      const ctx = { user, profile, patient, hospital, therapists, canBackdate };
      if (isEdit) {
        await updateBill(existing, payload, ctx);
        navigate(`/admin/bills/${billId}`, { state: { justSaved: 'updated' } });
      } else {
        const { id } = await createBill(payload, ctx);
        navigate(`/admin/bills/${id}`, { state: { justSaved: 'created' } });
      }
    } catch (err) {
      setError(err.message || 'Could not save the bill.');
      setSaving(false);
    }
  };

  if (isEdit && existing === null) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted mb-4">Bill not found.</p>
        <Link to="/admin/bills" className="text-primary font-semibold">Back to Bills</Link>
      </div>
    );
  }
  if (isEdit && !initialized) return <div className="text-text-muted">Loading…</div>;

  return (
    <div>
      <Link
        to={isEdit ? `/admin/bills/${billId}` : patient ? `/admin/patients/${patient.id}` : '/admin/bills'}
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </Link>
      <h1 className="mb-1">{isEdit ? `Edit Bill ${existing.billNumber}` : 'Create Bill'}</h1>
      <p className="text-text-muted text-sm mb-6">
        {isEdit
          ? 'Changes update the bill and the patient’s balance together.'
          : 'Saving adds this bill’s total to the patient’s balance. You can print it afterwards.'}
      </p>
      <HelpLink article={isEdit ? 'bill-correct' : 'bill-create'} label={isEdit ? 'Correcting a bill' : 'Step-by-step: creating a bill'} className="-mt-4 mb-6" />

      {/* Form first (numbered sections, side by side on wider screens), live preview below. */}
      <div className="flex flex-col gap-8">
        <div className="space-y-5 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <Card step={1} title="Patient">
              {pickingPatient ? (
                <div>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      className={`${inputClass} pl-9 ${patient ? 'pr-9' : ''}`}
                      placeholder="Type a name, patient code or phone number…"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPatientHighlight(0);
                      }}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      onKeyDown={onPatientKeyDown}
                      autoFocus
                    />
                    {patient && (
                      <button
                        type="button"
                        onClick={() => setPickingPatient(false)}
                        title="Keep the current patient"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted cursor-pointer hover:text-text-dark"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  {(searchTerm.trim() || searchFocused) && (
                    <div className="mt-2 border border-border rounded-lg divide-y divide-border max-h-72 overflow-auto">
                      {!searchTerm.trim() && patientMatches.length > 0 && (
                        <p className="px-3.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-0">Recently added</p>
                      )}
                      {patientMatches.map((p, i) => (
                        <button
                          key={p.id}
                          type="button"
                          // mousedown (not click) so it registers before the input's blur hides the list
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectPatient(p);
                          }}
                          onMouseEnter={() => setPatientHighlight(i)}
                          className={`w-full text-left px-3.5 py-2.5 cursor-pointer transition-colors ${i === patientHighlight ? 'bg-bg' : 'hover:bg-bg'}`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-text-dark truncate">{p.name}</span>
                            {p.currentStatus === 'discharged' && (
                              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-text-muted bg-bg border border-border rounded px-1.5 py-0.5">Discharged</span>
                            )}
                          </span>
                          <span className="block text-xs text-text-muted truncate">
                            {[p.patientCode, p.contact1, p.age ? `${p.age} yrs` : null].filter(Boolean).join(' · ')}
                          </span>
                        </button>
                      ))}
                      {patientMatches.length === 0 && searchTerm.trim() && (
                        <p className="px-3.5 py-3 text-sm text-text-muted mb-0">{patientsLoading ? 'Loading patients…' : 'No matching patients.'}</p>
                      )}
                    </div>
                  )}
                  {!searchTerm.trim() && !searchFocused && (
                    <p className="text-xs text-text-muted mt-2 mb-0">Any part of the name, code or phone works — use ↑ ↓ and Enter to pick.</p>
                  )}
                </div>
              ) : !patientOpen ? (
                <div className="flex items-center justify-between gap-3 bg-bg rounded-lg px-3.5 py-2.5">
                  <p className="text-sm font-semibold text-text-dark mb-0 truncate">{form.patient.name || patient?.name}</p>
                  <button type="button" onClick={() => setPatientOpen(true)} className="shrink-0 text-xs font-semibold text-primary cursor-pointer hover:text-teal">
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 bg-bg rounded-lg px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-dark mb-0 truncate">{patient?.name || form.patient.name}</p>
                      <p className="text-xs text-text-muted mb-0 font-mono">{patient?.patientCode || existing?.patient?.patientCode}</p>
                    </div>
                    <button type="button" onClick={() => setPatientOpen(false)} className="shrink-0 text-xs font-semibold text-primary cursor-pointer hover:text-teal">
                      Done
                    </button>
                  </div>
                  {!isEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setPickingPatient(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary cursor-pointer hover:text-teal"
                    >
                      <Search size={13} />
                      Choose a different patient
                    </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Name on bill</label>
                      <input className={inputClass} value={form.patient.name} onChange={(e) => set({ patient: { ...form.patient, name: e.target.value } })} />
                    </div>
                    <div>
                      <label className={labelClass}>Phone</label>
                      <input className={inputClass} value={form.patient.phone} onChange={(e) => set({ patient: { ...form.patient, phone: e.target.value } })} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Address</label>
                      <input className={inputClass} value={form.patient.address} onChange={(e) => set({ patient: { ...form.patient, address: e.target.value } })} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelClass}>City / State / PIN</label>
                      <input className={inputClass} value={form.patient.cityLine} onChange={(e) => set({ patient: { ...form.patient, cityLine: e.target.value } })} placeholder="Optional" />
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card
              step={2}
              title="Hospital & Physician"
              action={
                hpExpanded && form.hospitalId ? (
                  <button
                    type="button"
                    onClick={() => setHpOpen(false)}
                    title="Minimise"
                    className="p-1 text-text-muted rounded-md cursor-pointer hover:text-text-dark hover:bg-bg transition-colors"
                  >
                    <ChevronDown size={18} />
                  </button>
                ) : null
              }
            >
              {!hpExpanded ? (
                <button
                  type="button"
                  onClick={() => setHpOpen(true)}
                  title="Show hospital and physician details"
                  className="w-full flex items-center justify-between gap-3 bg-bg rounded-lg px-3.5 py-2.5 text-left cursor-pointer hover:bg-border/40 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-text-dark truncate">{hospital?.name || existing?.hospital?.name}</span>
                    <span className="block text-xs text-text-muted truncate">
                      {form.physicianId ? form.physician.name || 'Physician' : 'No physician'}
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-text-muted" />
                </button>
              ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                  <div>
                    <label className={labelClass}>Hospital *</label>
                    <select className={`${inputClass} bg-white cursor-pointer`} value={form.hospitalId} onChange={(e) => selectHospital(e.target.value)}>
                      <option value="">Select a hospital</option>
                      {activeHospitals.map((h) => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                    {!isEdit && patient && form.hospitalId && form.hospitalId === defaultHospitalFor(patient, hospitals, billSettings.ownHospitalId)?.id && (
                      <p className="text-xs text-text-muted mt-1 mb-0">
                        {patient.referredFromHospital ? 'Set from the patient — referred by this hospital.' : 'Set from the patient — direct patient, billed under your own hospital.'}
                      </p>
                    )}
                    {!isEdit && patient?.referredFromHospital && !referringHospital(patient, hospitals) && (
                      <p className="text-xs text-amber-600 mt-1 mb-0">
                        Referred by “{patient.referringHospitalName || 'a hospital'}”, which isn&apos;t set up in Settings › Hospitals — choose the hospital.
                      </p>
                    )}
                    {activeHospitals.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        No hospitals set up yet.{' '}
                        {profile?.role === 'superadmin' ? (
                          <Link to="/admin/settings?tab=hospitals" className="font-semibold underline">Add one in Settings</Link>
                        ) : (
                          'Ask your Super Admin to add one in Settings.'
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Prescribing physician (therapist)</label>
                    <select className={`${inputClass} bg-white cursor-pointer`} value={form.physicianId} onChange={(e) => set({ physicianId: e.target.value })}>
                      <option value="">None</option>
                      {activeTherapists.map((t) => (
                        <option key={t.id} value={t.id}>{[t.name, t.qualification].filter(Boolean).join(' — ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {form.physicianId && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Name</label>
                      <input className={inputClass} value={form.physician.name} onChange={(e) => set({ physician: { ...form.physician, name: e.target.value } })} />
                    </div>
                    <div>
                      <label className={labelClass}>Qualification</label>
                      <input className={inputClass} value={form.physician.qualification} onChange={(e) => set({ physician: { ...form.physician, qualification: e.target.value } })} />
                    </div>
                    <div>
                      <label className={labelClass}>Phone</label>
                      <input className={inputClass} value={form.physician.phone} onChange={(e) => set({ physician: { ...form.physician, phone: e.target.value } })} />
                    </div>
                    <div>
                      <label className={labelClass}>Address</label>
                      <input className={inputClass} value={form.physician.address} onChange={(e) => set({ physician: { ...form.physician, address: e.target.value } })} />
                    </div>
                  </div>
                )}
              </div>
              )}
            </Card>
          </div>

          <Card
            step={3}
            title="Services"
            action={
              <button type="button" onClick={addCustomItem} className="inline-flex items-center gap-1 text-xs font-semibold text-primary cursor-pointer hover:text-teal">
                <Plus size={14} />
                Custom item
              </button>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-2 mb-4">
              <select
                className={`${inputClass} bg-white cursor-pointer`}
                value={pickDept}
                onChange={(e) => {
                  setPickDept(e.target.value);
                  // Keep a chosen service only if it belongs to the new department.
                  const chosen = allServices.find((o) => o.id === pickService);
                  if (chosen && e.target.value && chosen.deptId !== e.target.value) {
                    setPickService('');
                    setServiceQuery('');
                  }
                }}
              >
                <option value="">All departments</option>
                {roots.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div className="relative min-w-0">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  ref={serviceInputRef}
                  className={`${inputClass} pl-9`}
                  placeholder={deptHasServices ? 'Type a service…' : 'No priced services in this department'}
                  value={serviceQuery}
                  onChange={(e) => {
                    setServiceQuery(e.target.value);
                    setPickService('');
                    setServiceHighlight(0);
                    setServiceListOpen(true);
                  }}
                  onFocus={() => setServiceListOpen(true)}
                  onBlur={() => setServiceListOpen(false)}
                  onKeyDown={onServiceKeyDown}
                />
                {serviceListOpen && !pickService && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-border rounded-lg shadow-lg divide-y divide-border max-h-72 overflow-auto">
                    {serviceSuggestions.map((o, i) => (
                      <button
                        key={o.id}
                        type="button"
                        // mousedown (not click) so it registers before the input's blur hides the list
                        onMouseDown={(e) => {
                          e.preventDefault();
                          chooseService(o);
                        }}
                        onMouseEnter={() => setServiceHighlight(i)}
                        className={`w-full text-left px-3.5 py-2 cursor-pointer flex items-center justify-between gap-3 transition-colors ${i === serviceHighlight ? 'bg-bg' : 'hover:bg-bg'}`}
                      >
                        <span className="min-w-0">
                          <span className="block text-sm text-text-dark truncate">{o.pathLabel}</span>
                          {!pickDept && <span className="block text-xs text-text-muted truncate">{o.deptName}</span>}
                        </span>
                        <span className="shrink-0 text-sm font-medium text-text-dark">{formatMoney(o.price)}</span>
                      </button>
                    ))}
                    {serviceSuggestions.length === 0 && (
                      <p className="px-3.5 py-3 text-sm text-text-muted mb-0">
                        {allServices.length === 0 ? 'No priced services yet.' : 'No matching services — use “Custom item” for anything else.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={addService}
                disabled={!pickService}
                className="shrink-0 inline-flex items-center justify-center gap-1 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-md cursor-pointer hover:bg-light-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={15} />
                Add
              </button>
            </div>

            {form.items.length > 0 && (
              <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_120px_36px] gap-2 px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                <span>Item</span>
                <span>Description</span>
                <span className="text-right pr-2">Price (₹)</span>
                <span />
              </div>
            )}
            <div className="space-y-2">
              {form.items.map((item) => (
                <div
                  key={item.key}
                  className="grid grid-cols-[minmax(0,1fr)_96px_36px] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_120px_36px] gap-2 items-center border border-border sm:border-0 rounded-lg p-2.5 sm:p-0"
                >
                  <input className={`${inputClass} min-w-0`} placeholder="Item" value={item.name} onChange={(e) => updateItem(item.key, { name: e.target.value })} />
                  <input
                    className={`${inputClass} min-w-0 col-span-3 row-start-2 sm:col-span-1 sm:row-start-auto`}
                    placeholder="Description (optional)"
                    value={item.description}
                    onChange={(e) => updateItem(item.key, { description: e.target.value })}
                  />
                  <input
                    className={`${inputClass} text-right`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => updateItem(item.key, { price: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    title="Remove item"
                    className="p-2 text-text-muted rounded-md cursor-pointer hover:text-red-600 hover:bg-red-50 transition-colors justify-self-center"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {form.items.length === 0 && <p className="text-sm text-text-muted text-center py-4 mb-0">Add a service from the catalog, or a custom item.</p>}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            <Card step={4} title="Dates">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Invoice date</label>
                {canBackdate ? (
                  <input type="date" className={inputClass} value={form.invoiceDate} max={toDateInputValue(new Date())} onChange={(e) => set({ invoiceDate: e.target.value })} />
                ) : (
                  <p className="text-sm text-text-dark py-2 mb-0">{isEdit ? form.invoiceDate : 'Today'}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Due date</label>
                <input type="date" className={inputClass} value={form.dueDate} min={form.invoiceDate} onChange={(e) => set({ dueDate: e.target.value })} />
              </div>
            </div>
            </Card>

            <Card step={5} title="Discount, Tax & Notes">
              <div className="space-y-3">
                {canDiscount && (
                  <div>
                    <label className={labelClass}>Discount</label>
                    <div className="flex gap-2">
                      <TypeToggle value={form.discount.type} onChange={(type) => set({ discount: { ...form.discount, type } })} />
                      <input
                        className={inputClass}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={form.discount.value}
                        onChange={(e) => set({ discount: { ...form.discount, value: e.target.value } })}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className={labelClass}>Tax</label>
                  <p className="text-sm text-text-dark py-2 mb-0">
                    {adjustmentLabel(tax, formatMoney) || 'No tax'}
                    <span className="text-text-muted">
                      {isEdit ? ' — as issued on this bill' : ' — set by the Super Admin in Settings › Bill Settings'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Notes</label>
                  <textarea className={`${inputClass} resize-none`} rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
                </div>
              </div>
            </Card>

            <Card title="Bill Summary" icon={Save} className="lg:sticky lg:top-20">
              <div className="space-y-3">
                <div className="bg-bg rounded-lg px-4 py-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span className="font-medium text-text-dark">{formatMoney(totals.subtotal)}</span></div>
                  {canDiscount && <div className="flex justify-between"><span>Discount</span><span className="font-medium text-text-dark">−{formatMoney(totals.discountAmount)}</span></div>}
                  <div className="flex justify-between"><span>Tax</span><span className="font-medium text-text-dark">{formatMoney(totals.taxAmount)}</span></div>
                  <div className="flex justify-between border-t border-border pt-2 mt-1">
                    <span className="font-semibold text-text-dark">Total</span>
                    <span className="text-lg font-bold text-primary">{formatMoney(totals.total)}</span>
                  </div>
                </div>
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg flex items-start justify-between gap-2">
                  {error}
                  <button type="button" onClick={() => setError('')} className="cursor-pointer"><X size={15} /></button>
                </div>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || (!isEdit && !billSettings.loaded)}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl cursor-pointer hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Bill'}
              </button>
              </div>
            </Card>
          </div>
        </div>

        <div className="w-full max-w-[900px] border-t border-border pt-6">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Live preview</p>
          <ScaledInvoice autoHeight>
            <InvoiceDocument bill={previewBill} logo={hospital?.logo} context={billContext} />
          </ScaledInvoice>
        </div>
      </div>
    </div>
  );
};

export default BillEditor;
