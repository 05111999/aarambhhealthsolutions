import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FilePlus2, Search, X, ChevronRight, FileText } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../permissions/usePermission';
import { useUrlFilters } from '../useUrlFilters';
import { formatMoney, roundMoney } from '../billing/money';
import { useHospitals } from '../settings/useDirectory';
import { useTrashedPatients } from '../patients/trash';
import { isSameDay, isWithinLastDays, isThisMonth } from '../dashboard/dashboardStats';
import { useBills } from './billService';
import HelpLink from '../help/HelpLink';

const RANGES = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'This month' },
];
const FILTER_DEFAULTS = { q: '', range: 'all', hospital: '', mine: '' };

const chipClass = (selected) =>
  `px-3.5 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors ${
    selected ? 'bg-primary text-white' : 'bg-bg text-text-muted hover:text-text-dark hover:bg-border/60'
  }`;

const billDate = (b) => (b.invoiceDate?.toDate ? b.invoiceDate.toDate() : b.createdAt?.toDate ? b.createdAt.toDate() : null);

function inRange(date, range) {
  if (range === 'today') return isSameDay(date, new Date());
  if (range === 'week') return isWithinLastDays(date, 7);
  if (range === 'month') return isThisMonth(date);
  return true;
}

const BillsList = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const canCreate = usePermission('bills', 'create');
  const { bills, error } = useBills({}, { uid: user?.uid, role: profile?.role });
  const { hospitals } = useHospitals();
  const { ids: trashedPatientIds } = useTrashedPatients();
  const [filters, setFilters, isDefault] = useUrlFilters(FILTER_DEFAULTS);

  const rows = useMemo(() => {
    const term = filters.q.trim().toLowerCase();
    return (bills || [])
      .filter((b) => !trashedPatientIds.has(b.patientId))
      .filter((b) => !term || b.billNumber?.toLowerCase().includes(term) || b.patient?.name?.toLowerCase().includes(term))
      .filter((b) => !filters.hospital || b.hospitalId === filters.hospital)
      .filter((b) => filters.mine !== '1' || b.createdBy === user?.uid)
      .filter((b) => inRange(billDate(b), filters.range));
  }, [bills, trashedPatientIds, filters.q, filters.hospital, filters.mine, filters.range, user?.uid]);

  const total = roundMoney(rows.reduce((s, b) => s + roundMoney(b.total), 0));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="mb-1">Bills</h1>
          <p className="text-text-muted text-sm">
            {profile?.role === 'therapist'
              ? 'Bills you created, where you’re the physician, for your assigned patients, and for your departments.'
              : 'Every medical invoice. Each bill’s total is part of its patient’s balance.'}
          </p>
          <HelpLink article="bill-create" label="How to create and print a bill" />
        </div>
        {canCreate && (
          <Link
            to="/admin/bills/new"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg cursor-pointer hover:bg-light-blue transition-colors"
          >
            <FilePlus2 size={18} />
            Create Bill
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-border p-4 mb-4 space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={filters.q}
            onChange={(e) => setFilters({ q: e.target.value })}
            placeholder="Search by bill number or patient name…"
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <button key={r.value} onClick={() => setFilters({ range: r.value })} className={chipClass(filters.range === r.value)}>
              {r.label}
            </button>
          ))}
          <span className="w-px h-5 bg-border mx-1" />
          <button onClick={() => setFilters({ mine: filters.mine === '1' ? '' : '1' })} className={chipClass(filters.mine === '1')}>
            Created by me
          </button>
          {hospitals.length > 1 && (
            <select
              value={filters.hospital}
              onChange={(e) => setFilters({ hospital: e.target.value })}
              className="max-w-full px-3 py-1.5 border border-border rounded-full text-sm bg-white cursor-pointer outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All hospitals</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          )}
          {!isDefault && (
            <button
              onClick={() => setFilters({}, { reset: true })}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-text-muted hover:text-red-600 cursor-pointer transition-colors"
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <p className="text-sm text-text-muted mb-3">
        {bills ? `${rows.length} bill${rows.length === 1 ? '' : 's'} · ${formatMoney(total)}` : 'Loading…'}
      </p>

      <div className="bg-white rounded-2xl border border-border overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-bg text-text-muted text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-6 py-3 font-semibold">Bill No.</th>
              <th className="text-left px-6 py-3 font-semibold">Patient</th>
              <th className="text-left px-6 py-3 font-semibold">Hospital</th>
              <th className="text-left px-6 py-3 font-semibold">Date</th>
              <th className="text-left px-6 py-3 font-semibold">Billed by</th>
              <th className="text-right px-6 py-3 font-semibold">Total</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((b) => (
              <tr key={b.id} onClick={() => navigate(`/admin/bills/${b.id}`)} className="group cursor-pointer hover:bg-bg transition-colors">
                <td className="px-6 py-3.5 font-mono text-xs text-primary font-semibold">{b.billNumber}</td>
                <td className="px-6 py-3.5 font-medium text-text-dark group-hover:text-primary transition-colors">{b.patient?.name}</td>
                <td className="px-6 py-3.5 text-text-muted">{b.hospital?.name}</td>
                <td className="px-6 py-3.5 text-text-muted">{billDate(b)?.toLocaleDateString() || '—'}</td>
                <td className="px-6 py-3.5 text-text-muted">{b.createdBy === user?.uid ? 'You' : b.createdByName || '—'}</td>
                <td className="px-6 py-3.5 text-right font-semibold text-text-dark">{formatMoney(b.total)}</td>
                <td className="pr-4">
                  <ChevronRight size={16} className="text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </td>
              </tr>
            ))}
            {bills && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center text-text-muted">
                  <FileText size={28} className="mx-auto mb-3 opacity-40" />
                  {bills.length === 0 ? 'No bills yet.' : 'No bills match these filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillsList;
