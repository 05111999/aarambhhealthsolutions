import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, addDoc, setDoc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Plus, Pencil, X, Stethoscope, Link2, Download, CheckCircle2, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useLiveSources } from '../data/liveStore';
import DeleteConfirmModal from '../patients/DeleteConfirmModal';
import { syncStaffDepartments } from './therapistSync';
import { deleteTherapist, friendlyDeleteError, therapistReferences } from './directoryDeletion';
import { SOURCES } from '../data/sources';

const SPECS = { departments: SOURCES.departments, users: SOURCES.users };
import { useAuth } from '../auth/AuthContext';
import { useTherapists } from './useDirectory';
import { recomputeVisibilityForAllBills } from '../bills/billService';

const inputClass = 'w-full px-3.5 py-2 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';
const labelClass = 'block text-sm font-medium text-text-dark mb-1';
const blank = { name: '', qualification: '', phone: '', address: '', departmentIds: [], linkedUserId: '', isActive: true };

const sameIds = (a = [], b = []) => a.length === b.length && a.every((x) => b.includes(x));

const TherapistModal = ({ initial, therapists, departments, logins, onClose, onSaved }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const isEdit = !!form.id;

  // Logins not yet linked to a therapist entry (an entry's id is its login's uid).
  const availableLogins = logins.filter((u) => !therapists.some((t) => t.id === u.id));

  const toggleDept = (id) =>
    set({ departmentIds: form.departmentIds.includes(id) ? form.departmentIds.filter((d) => d !== id) : [...form.departmentIds, id] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const data = {
      name: form.name.trim(),
      qualification: form.qualification.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      departmentIds: form.departmentIds,
      departmentNames: departments.filter((d) => form.departmentIds.includes(d.id)).map((d) => d.name),
      isActive: form.isActive,
      updatedBy: user.uid,
      updatedAt: serverTimestamp(),
    };
    try {
      let id = form.id;
      if (isEdit) await updateDoc(doc(db, 'therapists', id), data);
      else if (form.linkedUserId) {
        id = form.linkedUserId;
        await setDoc(doc(db, 'therapists', id), { ...data, linkedUserId: id, createdBy: user.uid, createdAt: serverTimestamp() });
      } else {
        id = (await addDoc(collection(db, 'therapists'), { ...data, linkedUserId: null, createdBy: user.uid, createdAt: serverTimestamp() })).id;
      }
      // Keep the linked staff account (User Management) showing the same departments,
      // phone, address and qualification.
      const linked = isEdit ? initial.linkedUserId : form.linkedUserId;
      const detailsChanged = ['phone', 'address', 'qualification'].some((k) => (initial[k] || '') !== data[k]);
      if (linked && logins.some((u) => u.id === linked) && (detailsChanged || !sameIds(initial.departmentIds, form.departmentIds))) {
        await syncStaffDepartments({
          uid: linked,
          departmentIds: data.departmentIds,
          departmentNames: data.departmentNames,
          details: { phone: data.phone, address: data.address, qualification: data.qualification },
          actorUid: user.uid,
        });
      }
      // Departments decide which bills a therapist can see, so re-check bills when they change.
      if (!sameIds(initial.departmentIds, form.departmentIds)) {
        const next = [...therapists.filter((t) => t.id !== id), { id, ...data }];
        await recomputeVisibilityForAllBills(next);
      }
      onSaved(`${data.name} saved.`);
    } catch (err) {
      setError(err.message || 'Could not save.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-text-dark/50 backdrop-blur-sm z-[100] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 className="text-xl font-bold text-primary mb-0">{isEdit ? 'Edit Therapist' : 'Add Therapist'}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-dark p-1 cursor-pointer"><X size={22} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isEdit && (
            <div>
              <label className={labelClass}>Staff login <span className="text-text-muted font-normal">(optional)</span></label>
              <select
                className={`${inputClass} bg-white cursor-pointer`}
                value={form.linkedUserId}
                onChange={(e) => {
                  const login = logins.find((u) => u.id === e.target.value);
                  set({ linkedUserId: e.target.value, name: form.name || login?.name || '' });
                }}
              >
                <option value="">Not linked — therapist without an app login</option>
                {availableLogins.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-1">Link a login so this therapist can see bills for their patients and departments.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Name *</label>
              <input required className={inputClass} value={form.name} onChange={(e) => set({ name: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Qualification</label>
              <input className={inputClass} value={form.qualification} onChange={(e) => set({ qualification: e.target.value })} placeholder="e.g. BPT, MPT" />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input className={inputClass} value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input className={inputClass} value={form.address} onChange={(e) => set({ address: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Departments</label>
            <div className="grid grid-cols-2 gap-2">
              {departments.map((d) => (
                <label key={d.id} className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                  <input type="checkbox" checked={form.departmentIds.includes(d.id)} onChange={() => toggleDept(d.id)} />
                  {d.name}
                </label>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-1">They&apos;ll see bills containing services from these departments.</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-text-dark cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
            Active (selectable on bills and patients)
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl cursor-pointer disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Therapist'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Who/what the therapist is linked to — loaded when the dialog opens (targeted queries).
const TherapistImpact = ({ therapist, login, removeLogin, setRemoveLogin }) => {
  const [refs, setRefs] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    therapistReferences(therapist.id)
      .then(({ patients, bills }) => {
        if (!live) return;
        const own = bills.filter((b) => [b.data().createdBy, b.data().physicianId].includes(therapist.id)).length;
        setRefs({ patients: patients.filter((p) => !p.data().isDeleted).length, bills: bills.length - own, own });
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [therapist.id]);
  const n = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

  return (
    <div className="space-y-3">
      <div className="text-sm border border-border rounded-lg px-4 py-3 space-y-0.5">
        <p className="mb-0 font-semibold text-text-dark break-words">{therapist.name}{therapist.qualification ? `, ${therapist.qualification}` : ''}</p>
        <p className="mb-0 text-text-muted break-all">{login?.email || 'No staff login linked'}</p>
        {therapist.phone && <p className="mb-0 text-text-muted">{therapist.phone}</p>}
      </div>
      <div className="text-sm bg-bg rounded-lg px-4 py-3">
        <p className="mb-1.5 text-text-dark font-medium">What happens:</p>
        <ul className="list-disc pl-5 space-y-1 text-text-muted mb-0">
          <li>They&apos;re removed from the physician list for new bills.</li>
          <li>
            {failed || !refs ? (failed ? 'They’re unassigned from their patients' : 'Checking assigned patients…') : `Unassigned from ${n(refs.patients, 'patient')}`}
            {refs && refs.bills > 0 && ` and no longer shown ${n(refs.bills, 'bill')} they only saw through their department or assignment`}.
          </li>
          <li>
            History is kept: bills they created or are the physician on{refs?.own ? ` (${refs.own})` : ''} keep their name, and session logs and payments keep who recorded them.
          </li>
        </ul>
      </div>
      {login && login.status !== 'deleted' && (
        <label className="flex items-start gap-3 text-sm text-text-dark cursor-pointer border border-border rounded-lg px-4 py-3">
          <input type="checkbox" className="mt-0.5 w-4 h-4 shrink-0" checked={removeLogin} onChange={(e) => setRemoveLogin(e.target.checked)} />
          <span>
            Also remove their staff login ({login.email}). They&apos;re signed out and blocked from everything; the login moves to the Trash and can be restored.
          </span>
        </label>
      )}
    </div>
  );
};

const TherapistsTab = () => {
  const { user } = useAuth();
  const { therapists, loaded } = useTherapists();
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState('');
  const [importing, setImporting] = useState(false);

  // Shared live sources (also used by the dashboard, Departments and User Management).
  const live = useLiveSources(SPECS);
  const departmentData = live.departments.data;
  const userData = live.users.data;
  const departments = useMemo(
    () => (departmentData || []).filter((d) => d.parentId === null).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [departmentData]
  );
  const logins = useMemo(() => (userData || []).filter((u) => u.role === 'therapist' && u.status !== 'deleted'), [userData]);

  const unlinked = logins.filter((u) => !therapists.some((t) => t.id === u.id));

  const importLogins = async () => {
    setImporting(true);
    try {
      const batch = writeBatch(db);
      unlinked.forEach((u) =>
        batch.set(doc(db, 'therapists', u.id), {
          name: u.name || '', qualification: u.qualification || '', phone: u.phone || '', address: u.address || '',
          departmentIds: u.assignedDepartmentIds || [],
          departmentNames: u.assignedDepartmentIds?.length ? u.assignedDepartments || [] : [],
          linkedUserId: u.id, isActive: u.status === 'active', createdBy: user.uid, createdAt: serverTimestamp(),
        })
      );
      await batch.commit();
      setNotice(`Added ${unlinked.length} therapist${unlinked.length === 1 ? '' : 's'} from staff logins. Open each to add qualification, phone and departments.`);
    } finally {
      setImporting(false);
    }
  };

  const loginName = (id) => logins.find((u) => u.id === id)?.email;

  const [deleting, setDeleting] = useState(null);
  const [removeLogin, setRemoveLogin] = useState(true);
  const deletingLogin = deleting?.linkedUserId ? (userData || []).find((u) => u.id === deleting.linkedUserId) : null;
  const openDelete = (t) => {
    setNotice('');
    setRemoveLogin(true);
    setDeleting(t);
  };
  const confirmDelete = async () => {
    const withLogin = removeLogin && !!deletingLogin && deletingLogin.status !== 'deleted';
    try {
      await deleteTherapist(deleting, { removeLogin: withLogin, login: deletingLogin }, user.uid);
    } catch (err) {
      throw new Error(friendlyDeleteError(err));
    }
    setNotice(`Deleted ${deleting.name}${withLogin ? ' and moved their staff login to the Trash' : ''}.`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-sm text-text-muted mb-0">Therapists appear as the prescribing physician on bills and can be assigned to patients.</p>
        <div className="flex gap-2">
          {unlinked.length > 0 && (
            <button
              onClick={importLogins}
              disabled={importing}
              className="inline-flex items-center gap-2 bg-white border border-border text-text-dark font-semibold px-4 py-2 rounded-lg cursor-pointer hover:border-primary/30 hover:text-primary transition-colors text-sm disabled:opacity-60"
            >
              <Download size={16} />
              Import {unlinked.length} therapist login{unlinked.length === 1 ? '' : 's'}
            </button>
          )}
          <button
            onClick={() => setModal(blank)}
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-light-blue transition-colors text-sm"
          >
            <Plus size={16} />
            Add Therapist
          </button>
        </div>
      </div>

      {notice && (
        <div className="mb-4 bg-teal/10 border border-teal/20 text-teal text-sm font-medium px-4 py-3 rounded-lg flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="shrink-0" />{notice}</span>
          <button onClick={() => setNotice('')} className="cursor-pointer"><X size={16} /></button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-bg text-text-muted text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-6 py-3 font-semibold">Therapist</th>
              <th className="text-left px-6 py-3 font-semibold">Departments</th>
              <th className="text-left px-6 py-3 font-semibold">Phone</th>
              <th className="text-left px-6 py-3 font-semibold">Login</th>
              <th className="w-24" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {therapists.map((t) => (
              <tr
                key={t.id}
                onClick={() => setModal({ ...blank, ...t, departmentIds: t.departmentIds || [], isActive: t.isActive !== false })}
                className="group cursor-pointer hover:bg-bg transition-colors"
              >
                <td className="px-6 py-3.5">
                  <span className="block font-medium text-text-dark group-hover:text-primary transition-colors">
                    {t.name}
                    {t.isActive === false && <span className="ml-2 text-[11px] bg-bg text-text-muted px-2 py-0.5 rounded-full">Inactive</span>}
                  </span>
                  <span className="block text-xs text-text-muted">{t.qualification || '—'}</span>
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {(t.departmentNames || []).map((n) => (
                      <span key={n} className="text-[11px] bg-teal/10 text-teal px-2 py-0.5 rounded-full font-medium">{n}</span>
                    ))}
                    {!(t.departmentNames || []).length && <span className="text-text-muted">—</span>}
                  </div>
                </td>
                <td className="px-6 py-3.5 text-text-muted">{t.phone || '—'}</td>
                <td className="px-6 py-3.5 text-text-muted">
                  {t.linkedUserId ? (
                    <span className="inline-flex items-center gap-1 text-xs"><Link2 size={12} />{loginName(t.linkedUserId) || 'Linked'}</span>
                  ) : (
                    <span className="text-xs">Not linked</span>
                  )}
                </td>
                <td className="pr-3 whitespace-nowrap text-right">
                  <button onClick={(e) => { e.stopPropagation(); setModal({ ...blank, ...t, departmentIds: t.departmentIds || [], isActive: t.isActive !== false }); }} title="Edit therapist" aria-label={`Edit ${t.name}`} className="p-2.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer">
                    <Pencil size={15} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); openDelete(t); }} title="Delete therapist" aria-label={`Delete ${t.name}`} className="p-2.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {loaded && therapists.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                  <Stethoscope size={28} className="mx-auto mb-3 opacity-40" />
                  No therapists yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <TherapistModal
          initial={modal}
          therapists={therapists}
          departments={departments}
          logins={logins}
          onClose={() => setModal(null)}
          onSaved={(msg) => {
            setModal(null);
            setNotice(msg);
          }}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Therapist?"
        description="The therapist entry is permanently deleted. Their historical records are kept."
        note=""
        phraseLabel="the therapist's name"
        confirmPhrase={deleting?.name || ''}
        confirmLabel="Delete Therapist"
        onConfirm={confirmDelete}
      >
        {deleting && <TherapistImpact therapist={deleting} login={deletingLogin} removeLogin={removeLogin} setRemoveLogin={setRemoveLogin} />}
      </DeleteConfirmModal>
    </div>
  );
};

export default TherapistsTab;
