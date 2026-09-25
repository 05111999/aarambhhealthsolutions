import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, setDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { RefreshCw, HandCoins, Search } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../permissions/usePermission';
import { useUrlFilters } from '../useUrlFilters';
import { useTrashedPatients } from '../patients/trash';
import { formatMoney, roundMoney } from '../billing/money';
import { runAccrual, getDailyRate } from './accrual';
import MarkCollectedModal from './MarkCollectedModal';

const StatCard = ({ label, value, tone }) => (
  <div className="bg-white rounded-2xl border border-border p-6">
    <p className="text-xs text-text-muted mb-1">{label}</p>
    <p className={`text-2xl font-bold ${tone}`}>{value}</p>
  </div>
);

const HospitalSettlementPage = () => {
  const { user, profile } = useAuth();
  const canManage = usePermission('hospitalSettlement', 'manage');
  const isSuperAdmin = profile?.role === 'superadmin';

  const [entries, setEntries] = useState([]);
  const [dailyRate, setDailyRate] = useState(0);
  const [rateInput, setRateInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [{ status: statusFilter }, setFilters] = useUrlFilters({ status: 'all' });
  const setStatusFilter = (status) => setFilters({ status });
  const [searchTerm, setSearchTerm] = useState('');
  const [markingEntry, setMarkingEntry] = useState(null);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await runAccrual(db, user.uid);
      setDailyRate(await getDailyRate(db));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [allEntries, setAllEntries] = useState([]);
  const { ids: trashedIds } = useTrashedPatients();

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'hospitalSettlements'), orderBy('date', 'desc')), (snap) => {
      setAllEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  // Entries for patients in the Trash stay stored but are left out of the page and totals.
  useEffect(() => {
    setEntries(allEntries.filter((e) => !trashedIds.has(e.patientId)));
  }, [allEntries, trashedIds]);

  const handleSaveRate = async (e) => {
    e.preventDefault();
    const amount = roundMoney(rateInput);
    await setDoc(doc(db, 'settings', 'hospitalDailyRate'), { amount, updatedBy: user.uid, updatedAt: serverTimestamp() });
    setDailyRate(amount);
    setRateInput('');
  };

  const totals = useMemo(() => {
    const collected = entries.filter((e) => e.status === 'collected').reduce((s, e) => s + roundMoney(e.amount), 0);
    const pending = entries.filter((e) => e.status === 'pending').reduce((s, e) => s + roundMoney(e.amount), 0);
    return { collected: roundMoney(collected), pending: roundMoney(pending), total: roundMoney(collected + pending) };
  }, [entries]);

  const filtered = entries.filter((e) => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (searchTerm.trim() && !e.patientName?.toLowerCase().includes(searchTerm.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="mb-1">Hospital Settlement</h1>
          <p className="text-text-muted text-sm">Money the hospital owes us for covered inpatient days — kept separate from patient billing.</p>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 bg-white border border-border text-text-dark font-semibold px-4 py-2.5 rounded-lg hover:border-primary/30 transition-colors disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Accrued" value={formatMoney(totals.total)} tone="text-text-dark" />
        <StatCard label="Collected" value={formatMoney(totals.collected)} tone="text-teal" />
        <StatCard label="Pending" value={formatMoney(totals.pending)} tone="text-red-600" />
      </div>

      {isSuperAdmin && (
        <div className="bg-white rounded-2xl border border-border p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary/10 p-2.5 rounded-full">
              <HandCoins className="text-primary" size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-dark">Daily Hospital-Covered Rate</p>
              <p className="text-xs text-text-muted">Current: {formatMoney(dailyRate)} per admitted inpatient-day</p>
            </div>
          </div>
          <form onSubmit={handleSaveRate} className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              step="0.01"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              placeholder="New rate (₹)"
              className="px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none w-48"
            />
            <button type="submit" className="bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-light-blue transition-colors text-sm">
              Update Rate
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by patient name…"
            className="w-full pl-9 pr-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
          />
        </div>
        {['all', 'pending', 'collected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium capitalize cursor-pointer transition-colors ${
              statusFilter === s ? 'bg-primary text-white' : 'bg-bg text-text-muted hover:text-text-dark'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg text-text-muted text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-6 py-3 font-semibold">Patient</th>
              <th className="text-left px-6 py-3 font-semibold">Date</th>
              <th className="text-left px-6 py-3 font-semibold">Amount</th>
              <th className="text-left px-6 py-3 font-semibold">Status</th>
              <th className="text-right px-6 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((e) => (
              <tr key={e.id}>
                <td className="px-6 py-3.5 font-medium text-text-dark">{e.patientName}</td>
                <td className="px-6 py-3.5 text-text-muted">{e.dateKey}</td>
                <td className="px-6 py-3.5 font-mono text-text-dark">{formatMoney(e.amount)}</td>
                <td className="px-6 py-3.5">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                      e.status === 'collected' ? 'bg-teal/10 text-teal' : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {e.status === 'collected' ? 'Collected' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  {canManage && e.status === 'pending' && (
                    <button onClick={() => setMarkingEntry(e)} className="text-primary hover:text-teal font-semibold text-xs transition-colors">
                      Mark Collected
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-text-muted">
                  No settlement entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <MarkCollectedModal isOpen={!!markingEntry} onClose={() => setMarkingEntry(null)} entry={markingEntry} />
    </div>
  );
};

export default HospitalSettlementPage;
