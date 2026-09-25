import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, collectionGroup, onSnapshot } from 'firebase/firestore';
import { ClipboardList, ChevronRight, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { useUrlFilters } from '../useUrlFilters';
import { SESSION_TYPE_OPTIONS, SESSION_TYPE_LABELS } from '../patients/sessionTypes';
import { isSameDay, isWithinLastDays, isThisMonth } from '../dashboard/dashboardStats';

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All time' },
];

const FILTER_DEFAULTS = { range: 'today', type: 'all', mine: '' };

const chipClass = (selected) =>
  `px-3.5 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors ${
    selected ? 'bg-primary text-white' : 'bg-bg text-text-muted hover:text-text-dark hover:bg-border/60'
  }`;

function inRange(date, range) {
  if (range === 'today') return isSameDay(date, new Date());
  if (range === 'week') return isWithinLastDays(date, 7);
  if (range === 'month') return isThisMonth(date);
  return true;
}

// Every patient's session logs in one place — the landing page for the dashboard's
// "Therapy Sessions" cards. Logging itself still happens on each patient's profile.
const SessionsPage = () => {
  const { user } = useAuth();
  const [filters, setFilters, isDefaultFilters] = useUrlFilters(FILTER_DEFAULTS);
  const [logs, setLogs] = useState(null);
  const [patients, setPatients] = useState(new Map());
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collectionGroup(db, 'sessionLogs'),
      (snap) => setLogs(snap.docs.map((d) => ({ id: d.id, patientId: d.ref.parent.parent.id, ...d.data() }))),
      () => setError('Could not load session logs.')
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'patients'), (snap) => {
      setPatients(new Map(snap.docs.map((d) => [d.id, { id: d.id, ...d.data() }])));
    });
    return unsubscribe;
  }, []);

  const visible = useMemo(() => {
    if (!logs) return [];
    return logs
      .filter((l) => !patients.get(l.patientId)?.isDeleted) // trashed patients' sessions stay hidden
      .filter((l) => inRange(l.date?.toDate?.(), filters.range))
      .filter((l) => filters.type === 'all' || l.sessionType === filters.type)
      .filter((l) => filters.mine !== '1' || l.recordedBy === user?.uid)
      .sort((a, b) => (b.date?.toMillis?.() ?? 0) - (a.date?.toMillis?.() ?? 0) || (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  }, [logs, patients, filters.range, filters.type, filters.mine, user?.uid]);

  const rangeLabel = RANGES.find((r) => r.value === filters.range)?.label || 'All time';

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1">Therapy Sessions</h1>
        <p className="text-text-muted text-sm">Daily treatment progress logged across all patients. Add new entries from a patient&apos;s profile.</p>
      </div>

      <div className="bg-white rounded-2xl border border-border p-4 mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wide w-14">When</span>
          {RANGES.map((r) => (
            <button key={r.value} onClick={() => setFilters({ range: r.value })} className={chipClass(filters.range === r.value)}>
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wide w-14">Type</span>
          <button onClick={() => setFilters({ type: 'all' })} className={chipClass(filters.type === 'all')}>
            All Types
          </button>
          {SESSION_TYPE_OPTIONS.map((o) => (
            <button key={o.value} onClick={() => setFilters({ type: o.value })} className={chipClass(filters.type === o.value)}>
              {o.label}
            </button>
          ))}
          <span className="w-px h-5 bg-border mx-1" />
          <button onClick={() => setFilters({ mine: filters.mine === '1' ? '' : '1' })} className={chipClass(filters.mine === '1')}>
            Logged by me
          </button>
          {!isDefaultFilters && (
            <button
              onClick={() => setFilters({}, { reset: true })}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-text-muted hover:text-red-600 cursor-pointer transition-colors"
            >
              <X size={14} />
              Reset
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-text-muted mb-3">
        {logs ? `${visible.length} session${visible.length === 1 ? '' : 's'} · ${rangeLabel}` : 'Loading…'}
      </p>

      {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      <div className="bg-white rounded-2xl border border-border overflow-hidden divide-y divide-border">
        {visible.map((log) => {
          const patient = patients.get(log.patientId);
          return (
            <Link
              key={`${log.patientId}-${log.id}`}
              to={`/admin/patients/${log.patientId}`}
              className="group flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-bg transition-colors focus:outline-none focus-visible:bg-bg"
            >
              <div className="bg-teal/10 p-2.5 rounded-full shrink-0">
                <ClipboardList size={16} className="text-teal" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-text-dark group-hover:text-primary transition-colors">
                    {patient?.name || 'Unknown patient'}
                  </span>
                  {patient?.patientCode && <span className="font-mono text-xs text-primary">{patient.patientCode}</span>}
                  <span className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded-full font-medium">
                    {SESSION_TYPE_LABELS[log.sessionType] || log.sessionType}
                  </span>
                  {log.recordedBy === user?.uid && <span className="text-xs text-text-muted">· by you</span>}
                </div>
                {log.notes && <p className="text-sm text-text-muted mt-1 line-clamp-2">{log.notes}</p>}
              </div>
              <span className="text-xs text-text-muted shrink-0 mt-0.5">
                {log.date?.toDate ? log.date.toDate().toLocaleDateString() : '—'}
              </span>
              <ChevronRight size={16} className="text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
            </Link>
          );
        })}
        {logs && visible.length === 0 && (
          <p className="px-6 py-12 text-center text-text-muted text-sm">No sessions match these filters.</p>
        )}
      </div>
    </div>
  );
};

export default SessionsPage;
