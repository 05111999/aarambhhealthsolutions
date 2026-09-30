import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, RotateCcw, Search, CheckCircle2, X, ChevronRight, Users, Receipt, UserCog } from 'lucide-react';
import { useLiveSources } from '../data/liveStore';
import { SOURCES } from '../data/sources';
import { useAuth } from '../auth/AuthContext';
import { useUrlFilters } from '../useUrlFilters';
import { ROLE_LABELS } from '../permissions/permissionCatalog';
import { formatMoney } from '../billing/money';
import {
  useTrashedPatients, useTrashedBills, useTrashedStaff, restoreFromTrash, restoreBillFromTrash,
} from '../patients/trash';
import { setStaffStatus } from '../users/staffAccounts';
import DeleteConfirmModal from '../patients/DeleteConfirmModal';
import {
  deletePatientPermanently, deleteStaffPermanently, deleteTransactionPermanently, friendlyPermanentDeleteError, patientDeletionPlan,
} from './permanentDelete';

const TYPE_LABELS = { inpatient: 'Inpatient', outpatient: 'Outpatient', homeVisit: 'Home Visit', virtual: 'Virtual' };
const METHOD_LABELS = { cash: 'Cash', card: 'Card', upi: 'UPI', bankTransfer: 'Bank Transfer', cheque: 'Cheque', advance: 'Advance', other: 'Other' };

const when = (ts) => (ts?.toDate ? ts.toDate().toLocaleString() : '—');
const byNewest = (a, b) => (b.deletedAt?.toMillis?.() ?? 0) - (a.deletedAt?.toMillis?.() ?? 0);

const RestoreButton = ({ busy, disabled, title, onClick }) => (
  <button
    onClick={onClick}
    disabled={busy || disabled}
    title={title}
    className="inline-flex items-center gap-1.5 bg-white border border-border text-text-dark text-sm font-semibold px-3.5 py-2 rounded-lg cursor-pointer hover:border-teal/40 hover:text-teal transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-text-dark"
  >
    <RotateCcw size={15} />
    {busy ? 'Restoring…' : 'Restore'}
  </button>
);

const DeleteButton = ({ disabled, title, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title || 'Delete permanently'}
    className="inline-flex items-center gap-1.5 bg-white border border-red-200 text-red-600 text-sm font-semibold px-3.5 py-2 rounded-lg cursor-pointer hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
  >
    <Trash2 size={15} />
    Delete
  </button>
);

// Counts what permanently deleting a patient will remove (targeted reads, when the
// dialog opens).
const PatientDeleteImpact = ({ patient }) => {
  const [counts, setCounts] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    patientDeletionPlan(patient.id).then((plan) => live && setCounts(plan.counts)).catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [patient.id]);
  const n = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
  return (
    <div className="text-sm bg-red-50/60 border border-red-100 rounded-lg px-4 py-3">
      <p className="mb-1.5 font-medium text-text-dark">This also permanently deletes:</p>
      {counts ? (
        <ul className="list-disc pl-5 space-y-0.5 text-text-muted mb-0">
          <li>{n(counts.visits, 'visit')} / admission{counts.visits === 1 ? '' : 's'}</li>
          <li>{n(counts.charges, 'charge')} and {n(counts.payments, 'payment')} (with their receipts)</li>
          <li>{n(counts.bills, 'bill')}</li>
          <li>{n(counts.sessionLogs, 'session log')}</li>
          {counts.settlements > 0 && <li>{n(counts.settlements, 'hospital settlement entry')}</li>}
        </ul>
      ) : (
        <p className="text-text-muted mb-0">{failed ? 'Their visits, bills, payments, session logs and settlement entries.' : 'Counting their records…'}</p>
      )}
    </div>
  );
};

const EmptyRow = ({ cols, text }) => (
  <tr>
    <td colSpan={cols} className="px-6 py-14 text-center text-text-muted">
      <Trash2 size={28} className="mx-auto mb-3 opacity-40" />
      {text}
    </td>
  </tr>
);

const Th = ({ children, right }) => <th className={`${right ? 'text-right' : 'text-left'} px-6 py-3 font-semibold`}>{children}</th>;

// Super Admin's bin for deleted patients, bills and staff accounts. Restore puts an item
// back exactly as it was; Delete removes it permanently (type-to-confirm, audit-logged).
const NAME_SPECS = { users: SOURCES.users, patients: SOURCES.patients };

const TrashPage = () => {
  const { user } = useAuth();
  const [{ tab }, setFilters] = useUrlFilters({ tab: 'patients' });
  const { trashed: patients, ids: trashedPatientIds, loaded: patientsLoaded } = useTrashedPatients();
  const { bills, loaded: billsLoaded } = useTrashedBills();
  const { staff, loaded: staffLoaded } = useTrashedStaff();

  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null); // { kind: 'patient' | 'bill' | 'staff', item }

  // Names for trashed bills/staff come from the shared users and patients data.
  const names = useLiveSources(NAME_SPECS);
  const staffNames = useMemo(() => new Map((names.users.data || []).map((u) => [u.id, u.name])), [names.users.data]);
  const patientInfo = useMemo(() => new Map((names.patients.data || []).map((p) => [p.id, p])), [names.patients.data]);

  const term = search.trim().toLowerCase();
  const matches = (...fields) => !term || fields.some((f) => f && String(f).toLowerCase().includes(term));

  const patientRows = useMemo(
    () => patients.filter((p) => matches(p.name, p.patientCode, p.contact1)).sort(byNewest),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patients, term]
  );
  const billRows = useMemo(
    () =>
      bills
        .map((b) => ({ ...b, patient: patientInfo.get(b.patientId) }))
        .filter((b) => matches(b.serviceName, b.patient?.name, b.patient?.patientCode, METHOD_LABELS[b.method]))
        .sort(byNewest),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bills, patientInfo, term]
  );
  const staffRows = useMemo(
    () => staff.filter((s) => matches(s.name, s.email, ROLE_LABELS[s.role])).sort(byNewest),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [staff, term]
  );

  const deletedBy = (uid) => (uid === user.uid ? 'You' : staffNames.get(uid) || '—');

  const restore = async (id, fn, message) => {
    setError('');
    setNotice('');
    setBusyId(id);
    try {
      await fn();
      setNotice(message);
    } catch (err) {
      setError(err.message || 'Could not restore this item.');
    } finally {
      setBusyId(null);
    }
  };

  const openDelete = (kind, item) => {
    setError('');
    setNotice('');
    setDeleting({ kind, item });
  };
  const confirmDelete = async () => {
    const { kind, item } = deleting;
    try {
      if (kind === 'patient') await deletePatientPermanently(item, user.uid);
      if (kind === 'bill') await deleteTransactionPermanently(item, user.uid);
      if (kind === 'staff') await deleteStaffPermanently(item, user.uid);
    } catch (err) {
      throw new Error(friendlyPermanentDeleteError(err));
    }
    setNotice(
      kind === 'patient'
        ? `${item.name} and all their records were permanently deleted.`
        : kind === 'bill'
          ? 'The entry was permanently deleted.'
          : `${item.name}'s staff account was permanently deleted.`
    );
  };
  const amountOf = (b) => formatMoney(b.type === 'payment' ? b.amount : b.netAmount);
  const deleteDialog = !deleting
    ? null
    : deleting.kind === 'patient'
      ? {
          title: 'Delete Patient Permanently',
          description: `${deleting.item.name} (${deleting.item.patientCode || 'no code'}) will be erased for good. This cannot be undone and they cannot be restored.`,
          phraseLabel: 'the patient’s name',
          phrase: deleting.item.name || '',
        }
      : deleting.kind === 'bill'
        ? {
            title: 'Delete Entry Permanently',
            description: `This ${deleting.item.type === 'payment' ? 'payment' : 'charge'}${deleting.item.billNumber ? ` (bill ${deleting.item.billNumber})` : ''} of ${amountOf(deleting.item)} will be erased for good${deleting.item.billId ? ', together with its bill' : ''}. This cannot be undone.`,
            phraseLabel: 'the amount',
            phrase: amountOf(deleting.item),
          }
        : {
            title: 'Delete Staff Account Permanently',
            description: `${deleting.item.name}'s staff account will be erased for good and cannot be restored. Records they created (bills, payments, sessions) are kept. Their email (${deleting.item.email}) can't be used for a new staff account afterwards — restore instead if they may return.`,
            phraseLabel: 'their email',
            phrase: deleting.item.email || '',
          };

  const TABS = [
    { key: 'patients', label: 'Patients', icon: Users, count: patients.length },
    { key: 'bills', label: 'Bills', icon: Receipt, count: bills.length },
    { key: 'staff', label: 'Staff', icon: UserCog, count: staff.length },
  ];
  const activeTab = TABS.some((t) => t.key === tab) ? tab : 'patients';

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1">Trash</h1>
        <p className="text-text-muted text-sm">
          Deleted patients, bills and staff accounts are kept here. Restore puts an item back exactly as it was; Delete removes it permanently.
        </p>
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
      {error && <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="flex items-center gap-1 sm:gap-2 mb-4 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilters({ tab: t.key })}
            className={`inline-flex items-center gap-2 shrink-0 whitespace-nowrap px-3 sm:px-4 py-3 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-dark'
            }`}
          >
            <t.icon size={16} />
            {t.label}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeTab === t.key ? 'bg-primary/10' : 'bg-bg'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border p-4 mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search deleted ${TABS.find((t) => t.key === activeTab).label.toLowerCase()}…`}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          {activeTab === 'patients' && (
            <>
              <thead className="bg-bg text-text-muted text-xs uppercase tracking-wide">
                <tr><Th>Patient</Th><Th>Contact</Th><Th>Status before deletion</Th><Th>Deleted</Th><Th right>Actions</Th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {patientRows.map((p) => (
                  <tr key={p.id} className="group hover:bg-bg/60 transition-colors">
                    <td className="px-6 py-3.5">
                      <Link to={`/admin/patients/${p.id}`} className="inline-flex items-center gap-1.5 cursor-pointer">
                        <span>
                          <span className="block font-medium text-text-dark group-hover:text-primary transition-colors">{p.name}</span>
                          <span className="block font-mono text-xs text-primary">{p.patientCode}</span>
                        </span>
                        <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                    <td className="px-6 py-3.5 text-text-muted">{p.contact1 || '—'}</td>
                    <td className="px-6 py-3.5 text-text-muted">
                      {p.currentStatus === 'active' ? 'Active' : 'Discharged'} · {TYPE_LABELS[p.currentPatientType] || p.currentPatientType}
                    </td>
                    <td className="px-6 py-3.5 text-text-muted">
                      <span className="block">{when(p.deletedAt)}</span>
                      <span className="block text-xs">by {deletedBy(p.deletedBy)}</span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2 justify-end flex-wrap">
                        <RestoreButton
                          busy={busyId === p.id}
                          onClick={() => restore(p.id, () => restoreFromTrash(p, user.uid), `${p.name} has been restored, with all visits, bills and session logs.`)}
                        />
                        <DeleteButton disabled={busyId === p.id} onClick={() => openDelete('patient', p)} />
                      </div>
                    </td>
                  </tr>
                ))}
                {patientsLoaded && patientRows.length === 0 && (
                  <EmptyRow cols={5} text={patients.length === 0 ? 'No deleted patients.' : 'No deleted patients match your search.'} />
                )}
              </tbody>
            </>
          )}

          {activeTab === 'bills' && (
            <>
              <thead className="bg-bg text-text-muted text-xs uppercase tracking-wide">
                <tr><Th>Bill</Th><Th>Patient</Th><Th>Amount</Th><Th>Deleted</Th><Th right>Actions</Th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {billRows.map((b) => {
                  const isPayment = b.type === 'payment';
                  const patientTrashed = trashedPatientIds.has(b.patientId);
                  return (
                    <tr key={`${b.patientId}-${b.id}`} className="group hover:bg-bg/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="block font-medium text-text-dark">
                          {isPayment ? `Payment — ${METHOD_LABELS[b.method] || b.method}` : b.serviceName}
                        </span>
                        <span className="block text-xs text-text-muted">
                          {isPayment ? 'Payment' : 'Charge'} · dated {b.date?.toDate ? b.date.toDate().toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <Link to={`/admin/patients/${b.patientId}`} className="inline-flex items-center gap-1.5 cursor-pointer">
                          <span>
                            <span className="block font-medium text-text-dark group-hover:text-primary transition-colors">
                              {b.patient?.name || 'Unknown patient'}
                            </span>
                            <span className="block font-mono text-xs text-primary">
                              {b.patient?.patientCode}
                              {patientTrashed && <span className="ml-1.5 font-sans text-red-600">· patient in Trash</span>}
                            </span>
                          </span>
                          <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                      <td className={`px-6 py-3.5 font-semibold ${isPayment ? 'text-teal' : 'text-text-dark'}`}>
                        {isPayment ? '+' : '-'}
                        {formatMoney(isPayment ? b.amount : b.netAmount)}
                      </td>
                      <td className="px-6 py-3.5 text-text-muted">
                        <span className="block">{when(b.deletedAt)}</span>
                        <span className="block text-xs">by {deletedBy(b.deletedBy)}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2 justify-end flex-wrap">
                          <RestoreButton
                            busy={busyId === b.id}
                            disabled={patientTrashed}
                            title={patientTrashed ? 'Restore the patient first' : undefined}
                            onClick={() =>
                              restore(b.id, () => restoreBillFromTrash(b, user.uid), `The bill was restored to ${b.patient?.name || 'the patient'}'s ledger and balance.`)
                            }
                          />
                          <DeleteButton disabled={busyId === b.id} onClick={() => openDelete('bill', b)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {billsLoaded && billRows.length === 0 && (
                  <EmptyRow cols={5} text={bills.length === 0 ? 'No deleted bills.' : 'No deleted bills match your search.'} />
                )}
              </tbody>
            </>
          )}

          {activeTab === 'staff' && (
            <>
              <thead className="bg-bg text-text-muted text-xs uppercase tracking-wide">
                <tr><Th>Staff member</Th><Th>Role</Th><Th>Deleted</Th><Th right>Actions</Th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staffRows.map((s) => (
                  <tr key={s.id} className="hover:bg-bg/60 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="block font-medium text-text-dark">{s.name}</span>
                      <span className="block text-xs text-text-muted">{s.email}</span>
                    </td>
                    <td className="px-6 py-3.5 text-text-muted">{ROLE_LABELS[s.role] || s.role}</td>
                    <td className="px-6 py-3.5 text-text-muted">
                      <span className="block">{when(s.deletedAt)}</span>
                      <span className="block text-xs">by {deletedBy(s.deletedBy)}</span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2 justify-end flex-wrap">
                        <RestoreButton
                          busy={busyId === s.id}
                          onClick={() =>
                            restore(s.id, () => setStaffStatus(s, 'active', user.uid), `${s.name}'s account has been restored. They can sign in again with their existing password.`)
                          }
                        />
                        <DeleteButton disabled={busyId === s.id} onClick={() => openDelete('staff', s)} />
                      </div>
                    </td>
                  </tr>
                ))}
                {staffLoaded && staffRows.length === 0 && (
                  <EmptyRow cols={4} text={staff.length === 0 ? 'No deleted staff accounts.' : 'No deleted staff match your search.'} />
                )}
              </tbody>
            </>
          )}
        </table>
      </div>

      <DeleteConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title={deleteDialog?.title || ''}
        description={deleteDialog?.description || ''}
        note=""
        phraseLabel={deleteDialog?.phraseLabel}
        confirmPhrase={deleteDialog?.phrase || ''}
        confirmLabel="Delete Permanently"
        onConfirm={confirmDelete}
      >
        {deleting?.kind === 'patient' && <PatientDeleteImpact patient={deleting.item} />}
      </DeleteConfirmModal>
    </div>
  );
};

export default TrashPage;
