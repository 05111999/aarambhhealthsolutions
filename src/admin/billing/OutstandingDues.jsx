import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { formatMoney } from './money';
import { balancesByPatient } from '../dashboard/dashboardStats';

const GRID = 'grid grid-cols-[1.6fr_1fr_0.8fr_1fr_1fr_2.5rem] items-center';

// Every patient currently owing money, largest balance first — the landing page for
// the dashboard's "Outstanding" card. Uses the exact same balance math as the card.
const OutstandingDues = ({ transactions, patients }) => {
  const rows = useMemo(() => {
    const lastActivity = new Map();
    for (const t of transactions) {
      const at = t.createdAt?.toDate?.();
      if (at && (!lastActivity.get(t.patientId) || at > lastActivity.get(t.patientId))) lastActivity.set(t.patientId, at);
    }
    return [...balancesByPatient(transactions).entries()]
      .filter(([, balance]) => balance < 0)
      .map(([patientId, balance]) => ({ patientId, due: -balance, patient: patients.get(patientId), lastActivity: lastActivity.get(patientId) }))
      .sort((a, b) => b.due - a.due);
  }, [transactions, patients]);

  const total = rows.reduce((sum, r) => sum + r.due, 0);

  return (
    <div>
      <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 mb-4 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-red-600 font-semibold">
          <AlertTriangle size={18} />
          {rows.length} patient{rows.length === 1 ? '' : 's'} with pending dues
        </div>
        <span className="text-xl font-bold text-red-600">{formatMoney(total)}</span>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden text-sm">
        <div className={`${GRID} bg-bg text-text-muted text-xs uppercase tracking-wide font-semibold`}>
          <span className="px-6 py-3">Patient</span>
          <span className="px-6 py-3">Contact</span>
          <span className="px-6 py-3">Status</span>
          <span className="px-6 py-3">Last Activity</span>
          <span className="px-6 py-3 text-right">Amount Due</span>
          <span />
        </div>
        <div className="divide-y divide-border">
          {rows.map((r) => (
            <Link
              key={r.patientId}
              to={`/admin/patients/${r.patientId}`}
              className={`${GRID} group cursor-pointer hover:bg-bg transition-colors focus:outline-none focus-visible:bg-bg`}
            >
              <span className="px-6 py-3.5 min-w-0">
                <span className="block font-medium text-text-dark group-hover:text-primary transition-colors truncate">
                  {r.patient?.name || 'Unknown patient'}
                </span>
                <span className="block font-mono text-xs text-primary">{r.patient?.patientCode}</span>
              </span>
              <span className="px-6 py-3.5 text-text-muted">{r.patient?.contact1 || '—'}</span>
              <span className="px-6 py-3.5 text-text-muted capitalize">{r.patient?.currentStatus || '—'}</span>
              <span className="px-6 py-3.5 text-text-muted">{r.lastActivity ? r.lastActivity.toLocaleDateString() : '—'}</span>
              <span className="px-6 py-3.5 text-right font-semibold text-red-600">{formatMoney(r.due)}</span>
              <ChevronRight size={16} className="text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
          {rows.length === 0 && <p className="px-6 py-12 text-center text-text-muted">No outstanding dues — every patient is settled.</p>}
        </div>
      </div>
    </div>
  );
};

export default OutstandingDues;
