import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, CreditCard, ChevronRight, X } from 'lucide-react';
import { formatMoney, roundMoney } from './money';
import { useUrlFilters } from '../useUrlFilters';
import { isSameDay, isWithinLastDays, isThisMonth } from '../dashboard/dashboardStats';

const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'charge', label: 'Charges' },
  { value: 'payment', label: 'Payments' },
  { value: 'discount', label: 'Discounted' },
];

const RANGES = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'This month' },
];

const METHOD_LABELS = {
  cash: 'Cash', card: 'Card', upi: 'UPI', bankTransfer: 'Bank Transfer', cheque: 'Cheque', advance: 'Advance', other: 'Other',
};

const FILTER_DEFAULTS = { type: 'all', range: 'all', service: '' };
const MAX_ROWS = 300;

const chipClass = (selected) =>
  `px-3.5 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors ${
    selected ? 'bg-primary text-white' : 'bg-bg text-text-muted hover:text-text-dark hover:bg-border/60'
  }`;

function matchesType(t, type) {
  if (type === 'charge') return t.type === 'charge';
  if (type === 'payment') return t.type === 'payment';
  if (type === 'discount') return t.type === 'charge' && roundMoney(t.discountAmount) > 0;
  return true;
}

// Ranges use the transaction's effective `date` (which may be backdated), the same
// field the dashboard's "Collected Today" card uses.
function matchesRange(t, range) {
  const date = t.date?.toDate?.();
  if (range === 'today') return isSameDay(date, new Date());
  if (range === 'week') return isWithinLastDays(date, 7);
  if (range === 'month') return isThisMonth(date);
  return true;
}

const TransactionsList = ({ transactions, patients }) => {
  const [filters, setFilters] = useUrlFilters(FILTER_DEFAULTS);
  const isFiltered = filters.type !== 'all' || filters.range !== 'all' || !!filters.service;

  const services = useMemo(
    () => [...new Set(transactions.filter((t) => t.type === 'charge').map((t) => t.serviceName))].sort(),
    [transactions]
  );

  const matching = useMemo(
    () =>
      transactions
        .filter((t) => matchesType(t, filters.type))
        .filter((t) => matchesRange(t, filters.range))
        .filter((t) => !filters.service || t.serviceName === filters.service)
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)),
    [transactions, filters.type, filters.range, filters.service]
  );

  const totals = useMemo(() => {
    let charged = 0;
    let collected = 0;
    let discounts = 0;
    for (const t of matching) {
      if (t.type === 'payment') collected += roundMoney(t.amount);
      else {
        charged += roundMoney(t.netAmount);
        discounts += roundMoney(t.discountAmount);
      }
    }
    return { charged: roundMoney(charged), collected: roundMoney(collected), discounts: roundMoney(discounts) };
  }, [matching]);

  return (
    <div>
      <div className="bg-white rounded-2xl border border-border p-4 mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wide w-14">Type</span>
          {TYPES.map((t) => (
            <button key={t.value} onClick={() => setFilters({ type: t.value })} className={chipClass(filters.type === t.value)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wide w-14">When</span>
          {RANGES.map((r) => (
            <button key={r.value} onClick={() => setFilters({ range: r.value })} className={chipClass(filters.range === r.value)}>
              {r.label}
            </button>
          ))}
          <span className="w-px h-5 bg-border mx-1" />
          <select
            value={filters.service}
            onChange={(e) => setFilters({ service: e.target.value })}
            className="px-3 py-1.5 border border-border rounded-full text-sm bg-white cursor-pointer focus:ring-2 focus:ring-primary/20 outline-none"
          >
            <option value="">All services</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {isFiltered && (
            <button
              onClick={() => setFilters({ type: 'all', range: 'all', service: '' })}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-text-muted hover:text-red-600 cursor-pointer transition-colors"
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-text-muted mb-3">
        <span>{matching.length} transaction{matching.length === 1 ? '' : 's'}</span>
        {filters.type !== 'payment' && <span>Charged <b className="text-text-dark">{formatMoney(totals.charged)}</b></span>}
        {filters.type !== 'charge' && filters.type !== 'discount' && (
          <span>Collected <b className="text-teal">{formatMoney(totals.collected)}</b></span>
        )}
        {filters.type !== 'payment' && totals.discounts > 0 && <span>Discounts <b className="text-text-dark">{formatMoney(totals.discounts)}</b></span>}
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden divide-y divide-border">
        {matching.slice(0, MAX_ROWS).map((t) => {
          const patient = patients.get(t.patientId);
          const isPayment = t.type === 'payment';
          return (
            <Link
              key={`${t.patientId}-${t.id}`}
              to={`/admin/patients/${t.patientId}`}
              className="group flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-bg transition-colors focus:outline-none focus-visible:bg-bg"
            >
              <div className={`p-2 rounded-full shrink-0 ${isPayment ? 'bg-teal/10' : 'bg-primary/10'}`}>
                {isPayment ? <CreditCard size={14} className="text-teal" /> : <Receipt size={14} className="text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-dark group-hover:text-primary transition-colors truncate">
                  {isPayment ? `Payment — ${METHOD_LABELS[t.method] || t.method}` : t.serviceName}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {patient?.name || 'Unknown patient'}
                  {patient?.patientCode && ` · ${patient.patientCode}`}
                  {' · '}
                  {t.date?.toDate ? t.date.toDate().toLocaleDateString() : '—'}
                  {roundMoney(t.discountAmount) > 0 && ` · Discount ${formatMoney(t.discountAmount)}`}
                </p>
              </div>
              <span className={`text-sm font-semibold shrink-0 ${isPayment ? 'text-teal' : 'text-text-dark'}`}>
                {isPayment ? '+' : '-'}
                {formatMoney(isPayment ? t.amount : t.netAmount)}
              </span>
              <ChevronRight size={16} className="text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          );
        })}
        {matching.length === 0 && <p className="px-6 py-12 text-center text-text-muted text-sm">No transactions match these filters.</p>}
        {matching.length > MAX_ROWS && (
          <p className="px-6 py-3 text-center text-text-muted text-xs">
            Showing the latest {MAX_ROWS} of {matching.length} — narrow the filters to see older entries.
          </p>
        )}
      </div>
    </div>
  );
};

export default TransactionsList;
