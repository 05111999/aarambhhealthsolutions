import React, { useEffect, useRef, useState } from 'react';
import { collection, doc, deleteDoc, updateDoc, onSnapshot, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { UserPlus, X, Pencil, UserX, UserCheck, Mail, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { useUrlFilters } from '../useUrlFilters';
import { PERMISSION_CATALOG, ROLE_LABELS } from '../permissions/permissionCatalog';
import DeleteConfirmModal from '../patients/DeleteConfirmModal';
import {
  createStaffAccount, restoreStaffAccount, updateStaffAccount, setStaffStatus, sendSetupEmail,
} from './staffAccounts';

const ASSIGNABLE_ROLES = ['admin', 'receptionist', 'therapist'];
const FILTER_DEFAULTS = { role: 'all', status: 'all', show: '' };
const emptyForm = { name: '', email: '', role: 'receptionist', assignedDepartments: '', permissions: {} };

const inputClass = 'w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none';

const chipClass = (selected) =>
  `px-3.5 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors ${
    selected ? 'bg-primary text-white' : 'bg-bg text-text-muted hover:text-text-dark hover:bg-border/60'
  }`;

const StatusBadge = ({ status }) => (
  <span
    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
      status === 'active' ? 'bg-teal/10 text-teal' : 'bg-red-100 text-red-600'
    }`}
  >
    {status === 'disabled' ? 'Deactivated' : status}
  </span>
);

const IconAction = ({ title, onClick, icon: Icon, danger }) => (
  <button
    onClick={onClick}
    title={title}
    aria-label={title}
    className={`p-1.5 rounded-md cursor-pointer transition-colors text-text-muted ${
      danger ? 'hover:text-red-600 hover:bg-red-50' : 'hover:text-primary hover:bg-primary/10'
    }`}
  >
    <Icon size={16} />
  </button>
);

const PermissionCheckboxes = ({ value, onChange }) => (
  <div className="space-y-3">
    {Object.entries(PERMISSION_CATALOG).map(([moduleKey, moduleDef]) => (
      <div key={moduleKey}>
        <p className="text-sm font-semibold text-text-dark mb-1.5">{moduleDef.label}</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(moduleDef.actions).map(([actionKey, actionLabel]) => (
            <label key={actionKey} className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={!!value?.[moduleKey]?.[actionKey]}
                onChange={(e) => onChange({ ...value, [moduleKey]: { ...value?.[moduleKey], [actionKey]: e.target.checked } })}
                className="rounded border-border text-primary focus:ring-primary/30"
              />
              {actionLabel}
            </label>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const splitDepartments = (text) => (text ? text.split(',').map((d) => d.trim()).filter(Boolean) : []);

// One modal for Add and Edit. On Add, an email that belongs to a previously deleted
// account turns into a "Restore" confirmation instead of an error.
const UserFormModal = ({ mode, initial, requestId, onClose, onDone }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [restorable, setRestorable] = useState(null);

  const payload = () => ({ ...form, assignedDepartments: splitDepartments(form.assignedDepartments) });

  const markRequestDone = async () => {
    if (requestId) await updateDoc(doc(db, 'userRequests', requestId), { status: 'provisioned', provisionedAt: serverTimestamp() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (mode === 'edit') {
        await updateStaffAccount(initial.target, payload(), user.uid);
        onDone(`Saved changes for ${form.name}.`);
      } else {
        const result = await createStaffAccount(payload(), user.uid);
        if (result.restorable) {
          setRestorable(result.restorable);
          return;
        }
        await markRequestDone();
        onDone(`Account created for ${form.name}. A set-password email was sent to ${form.email.trim().toLowerCase()}.`);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    setSaving(true);
    setError('');
    try {
      await restoreStaffAccount(restorable, payload(), user.uid);
      await markRequestDone();
      onDone(`Restored ${form.name}'s account. A set-password email was sent to ${restorable.email}.`);
    } catch (err) {
      setError(err.message || 'Could not restore the account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-text-dark/50 backdrop-blur-sm z-[100] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 className="text-xl font-bold text-primary mb-0">{mode === 'edit' ? `Edit ${initial.target.name}` : 'Add User'}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-dark p-1 cursor-pointer">
            <X size={22} />
          </button>
        </div>

        {restorable ? (
          <div className="p-6 space-y-4">
            <p className="text-sm text-text-dark">
              <b>{restorable.email}</b> belonged to a staff account that was deleted earlier ({restorable.name}).
            </p>
            <p className="text-sm text-text-muted">
              Restore it with the details you entered? They&apos;ll get a new set-password email and access as{' '}
              <b>{ROLE_LABELS[form.role]}</b>.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setRestorable(null)} className="flex-1 border border-border rounded-xl py-3 font-semibold text-text-muted cursor-pointer hover:bg-bg">
                Back
              </button>
              <button
                onClick={handleRestore}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-primary to-teal text-white font-semibold py-3 rounded-xl cursor-pointer disabled:opacity-60"
              >
                {saving ? 'Restoring…' : 'Restore Account'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Full Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Email *</label>
              <input
                type="email"
                required
                disabled={mode === 'edit'}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`${inputClass} disabled:bg-bg disabled:text-text-muted disabled:cursor-not-allowed`}
              />
              {mode === 'add' && <p className="text-xs text-text-muted mt-1">They&apos;ll receive an email with a link to set their own password.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Role *</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={`${inputClass} bg-white cursor-pointer`}>
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">
                Departments <span className="text-text-muted font-normal">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={form.assignedDepartments}
                onChange={(e) => setForm({ ...form, assignedDepartments: e.target.value })}
                className={inputClass}
                placeholder="Physiotherapy, Occupational Therapy"
              />
            </div>
            <div>
              <p className="block text-sm font-medium text-text-dark mb-1">Permission Overrides</p>
              <p className="text-xs text-text-muted mb-3">Optional. Leave unticked to use the role&apos;s default access.</p>
              <PermissionCheckboxes value={form.permissions} onChange={(permissions) => setForm({ ...form, permissions })} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-primary to-teal text-white font-semibold px-6 py-3 rounded-xl cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const UserManagement = () => {
  const { user, profile } = useAuth();
  const isSuperAdmin = profile?.role === 'superadmin';

  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [modal, setModal] = useState(null); // { mode, initial, requestId? }
  const [deleting, setDeleting] = useState(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);
  const requestsRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  // Account requests are Super-Admin-only data.
  useEffect(() => {
    if (!isSuperAdmin) return undefined;
    const unsubscribe = onSnapshot(query(collection(db, 'userRequests'), where('status', '==', 'pending')), (snap) => {
      // Oldest first; sorted here rather than in the query to avoid a composite index.
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.requestedAt?.toMillis?.() ?? 0) - (b.requestedAt?.toMillis?.() ?? 0));
      setRequests(list);
    });
    return unsubscribe;
  }, [isSuperAdmin]);

  useEffect(() => {
    if (filters.show === 'requests') requestsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [filters.show, requests.length]);

  const visibleUsers = users
    .filter((u) => u.status !== 'deleted')
    .filter((u) => filters.role === 'all' || u.role === filters.role)
    .filter((u) => filters.status === 'all' || u.status === filters.status);

  const canManage = (u) => isSuperAdmin && u.id !== user.uid && u.role !== 'superadmin';

  const run = async (fn, successMessage) => {
    setActionError('');
    setNotice('');
    try {
      await fn();
      if (successMessage) setNotice(successMessage);
    } catch (err) {
      setActionError(err.message || 'Something went wrong.');
    }
  };

  const openAdd = (request) =>
    setModal({
      mode: 'add',
      requestId: request?.id,
      initial: request
        ? {
          name: request.name || '',
          email: request.email || '',
          role: ASSIGNABLE_ROLES.includes(request.role) ? request.role : 'receptionist',
          assignedDepartments: (request.assignedDepartments || []).join(', '),
          permissions: request.permissions || {},
        }
        : emptyForm,
    });

  const openEdit = (u) =>
    setModal({
      mode: 'edit',
      initial: {
        target: u,
        name: u.name || '',
        email: u.email || '',
        role: u.role,
        assignedDepartments: (u.assignedDepartments || []).join(', '),
        permissions: u.permissions || {},
      },
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="mb-1">User Management</h1>
          <p className="text-text-muted text-sm">
            {isSuperAdmin ? 'Add staff, change roles, and deactivate or remove accounts.' : 'Staff accounts (read-only).'}
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => openAdd()}
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg cursor-pointer hover:bg-light-blue transition-colors"
          >
            <UserPlus size={18} />
            Add User
          </button>
        )}
      </div>

      {notice && (
        <div className="mb-4 bg-teal/10 border border-teal/20 text-teal text-sm font-medium px-4 py-3 rounded-lg flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            {notice}
          </span>
          <button onClick={() => setNotice('')} className="cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}
      {actionError && <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">{actionError}</div>}

      {isSuperAdmin && requests.length > 0 && (
        <div
          ref={requestsRef}
          className={`bg-white rounded-2xl border overflow-hidden mb-6 scroll-mt-6 ${
            filters.show === 'requests' ? 'border-primary/40 ring-2 ring-primary/10' : 'border-amber-200'
          }`}
        >
          <div className="px-6 py-4 border-b border-border bg-amber-50/60">
            <h3 className="text-base font-semibold text-text-dark mb-0">Pending Account Requests</h3>
            <p className="text-text-muted text-xs mt-1">Approve to create the account (a set-password email is sent), or dismiss.</p>
          </div>
          <div className="divide-y divide-border">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-6 py-3.5 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm font-medium text-text-dark">{r.name}</p>
                  <p className="text-xs text-text-muted">
                    {r.email} · {ROLE_LABELS[r.role] || r.role}
                  </p>
                </div>
                <button
                  onClick={() => openAdd(r)}
                  className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-light-blue transition-colors"
                >
                  <UserCheck size={15} />
                  Approve
                </button>
                <button
                  onClick={() => run(() => deleteDoc(doc(db, 'userRequests', r.id)), `Dismissed the request for ${r.name}.`)}
                  className="text-sm font-semibold text-text-muted px-3 py-2 rounded-lg cursor-pointer hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border p-4 mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wide w-14">Role</span>
          <button onClick={() => setFilters({ role: 'all' })} className={chipClass(filters.role === 'all')}>
            All Roles
          </button>
          {['superadmin', ...ASSIGNABLE_ROLES].map((r) => (
            <button key={r} onClick={() => setFilters({ role: r })} className={chipClass(filters.role === r)}>
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wide w-14">Status</span>
          {[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'disabled', label: 'Deactivated' },
          ].map((s) => (
            <button key={s.value} onClick={() => setFilters({ status: s.value })} className={chipClass(filters.status === s.value)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg text-text-muted text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-6 py-3 font-semibold">Name</th>
              <th className="text-left px-6 py-3 font-semibold">Email</th>
              <th className="text-left px-6 py-3 font-semibold">Role</th>
              <th className="text-left px-6 py-3 font-semibold">Departments</th>
              <th className="text-left px-6 py-3 font-semibold">Status</th>
              <th className="text-right px-6 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visibleUsers.map((u) => (
              <tr key={u.id} className="hover:bg-bg/60 transition-colors">
                <td className="px-6 py-3.5 font-medium text-text-dark">
                  <span className="inline-flex items-center gap-2">
                    {u.name}
                    {u.id === user.uid && <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">You</span>}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-text-muted">{u.email}</td>
                <td className="px-6 py-3.5 text-text-muted">
                  {u.role === 'superadmin' ? (
                    <span className="inline-flex items-center gap-1 text-primary font-semibold">
                      <ShieldCheck size={14} />
                      Super Admin (Owner)
                    </span>
                  ) : (
                    ROLE_LABELS[u.role] || u.role
                  )}
                </td>
                <td className="px-6 py-3.5 text-text-muted">{(u.assignedDepartments || []).join(', ') || '—'}</td>
                <td className="px-6 py-3.5">
                  <StatusBadge status={u.status} />
                </td>
                <td className="px-6 py-3.5">
                  {canManage(u) && (
                    <div className="flex items-center justify-end gap-1">
                      <IconAction title="Edit" icon={Pencil} onClick={() => openEdit(u)} />
                      {u.status === 'active' ? (
                        <IconAction
                          title="Deactivate"
                          icon={UserX}
                          danger
                          onClick={() => run(() => setStaffStatus(u, 'disabled', user.uid), `${u.name} has been deactivated and can no longer sign in.`)}
                        />
                      ) : (
                        <IconAction
                          title="Reactivate"
                          icon={UserCheck}
                          onClick={() => run(() => setStaffStatus(u, 'active', user.uid), `${u.name} has been reactivated.`)}
                        />
                      )}
                      <IconAction
                        title="Send set-password email"
                        icon={Mail}
                        onClick={() => run(() => sendSetupEmail(u.email), `A set-password email was sent to ${u.email}.`)}
                      />
                      <IconAction title="Delete" icon={Trash2} danger onClick={() => setDeleting(u)} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {visibleUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                  No staff match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <UserFormModal
          key={modal.mode + (modal.requestId || '')}
          mode={modal.mode}
          initial={modal.initial}
          requestId={modal.requestId}
          onClose={() => setModal(null)}
          onDone={(message) => {
            setModal(null);
            setActionError('');
            setNotice(message);
          }}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Move Staff Account to Trash"
        description="This moves the staff account to the Trash and removes all of its access immediately."
        note="You can restore it from Trash at any time."
        confirmLabel="Move to Trash"
        busyLabel="Moving…"
        confirmPhrase={deleting?.name || ''}
        onConfirm={async () => {
          const target = deleting;
          await setStaffStatus(target, 'deleted', user.uid);
          setNotice(`${target.name}'s account was moved to the Trash. You can restore it from there.`);
        }}
      />
    </div>
  );
};

export default UserManagement;
