import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, UserPlus, ArrowRight, BedDouble } from 'lucide-react';
import { usePatientSearch } from '../patients/usePatientSearch';
import { usePermission } from '../permissions/usePermission';
import { useUrlFilters } from '../useUrlFilters';
import PatientOnboardingForm from '../patients/PatientOnboardingForm';
import OutstandingDues from './OutstandingDues';
import TransactionsList from './TransactionsList';
import { useLedgerData } from './useLedgerData';
import HelpLink from '../help/HelpLink';

const TYPE_LABELS = { inpatient: 'Inpatient', outpatient: 'Outpatient', homeVisit: 'Home Visit', virtual: 'Virtual' };

const VIEWS = [
  { value: 'find', label: 'Bill a Patient' },
  { value: 'outstanding', label: 'Outstanding Dues' },
  { value: 'transactions', label: 'Transactions' },
];

// Pick an existing patient (or onboard a new one on the spot), then go straight to the
// bill generator with that patient pre-selected.
const FindPatient = () => {
  const navigate = useNavigate();
  const canOnboard = usePermission('patients', 'create');
  const canBill = usePermission('bills', 'create');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { results, loading } = usePatientSearch(searchTerm);

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-2xl border border-border p-4 mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient code, name, or phone number…"
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            autoFocus
          />
        </div>
      </div>

      {searchTerm.trim() && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden mb-4">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(canBill ? `/admin/bills/new?patient=${p.id}` : `/admin/patients/${p.id}`)}
              className="w-full flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-bg transition-colors border-b border-border last:border-0 text-left"
            >
              <div>
                <p className="text-sm font-medium text-text-dark">{p.name}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {p.patientCode} · {TYPE_LABELS[p.currentPatientType] || p.currentPatientType}
                </p>
              </div>
              <ArrowRight size={16} className="text-text-muted" />
            </button>
          ))}
          {results.length === 0 && (
            <p className="px-5 py-8 text-center text-text-muted text-sm">{loading ? 'Searching…' : 'No matching patients.'}</p>
          )}
        </div>
      )}

      {canOnboard && (
        <button
          onClick={() => setShowOnboarding(true)}
          className="inline-flex items-center gap-2 text-primary font-semibold text-sm cursor-pointer hover:text-teal transition-colors"
        >
          <UserPlus size={16} />
          Patient not found — onboard a new one
        </button>
      )}

      <PatientOnboardingForm
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onCreated={(patient) => navigate(canBill ? `/admin/bills/new?patient=${patient.id}` : `/admin/patients/${patient.id}`)}
      />
    </div>
  );
};

// Ledger-wide views only subscribe once one of them is actually opened.
const LedgerViews = ({ view }) => {
  const { transactions, patients, error } = useLedgerData();
  if (error) return <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>;
  if (!transactions) return <p className="text-text-muted text-sm">Loading…</p>;
  return view === 'outstanding' ? (
    <OutstandingDues transactions={transactions} patients={patients} />
  ) : (
    <TransactionsList transactions={transactions} patients={patients} />
  );
};

const BillingEntry = () => {
  const [{ view }, setFilters] = useUrlFilters({ view: 'find' });
  const activeView = VIEWS.some((v) => v.value === view) ? view : 'find';

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="mb-1">Billing</h1>
          <p className="text-text-muted text-sm mb-1">Bill a patient, follow up on dues, or review every transaction.</p>
          <HelpLink article="payment-record" label="Recording payments, receipts and dues" />
        </div>
        <Link
          to="/admin/billing/ipd"
          className="inline-flex items-center gap-2 bg-white border border-border text-text-dark font-semibold px-4 py-2.5 rounded-lg hover:border-primary/30 hover:text-primary transition-colors text-sm"
        >
          <BedDouble size={16} />
          IPD / Hospital Running Bill
        </Link>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 mb-6 border-b border-border overflow-x-auto">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            // Switching tabs drops the other tab's filters instead of carrying them over.
            onClick={() => setFilters({ view: v.value }, { reset: true })}
            className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-3 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              activeView === v.value ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-dark'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {activeView === 'find' ? <FindPatient /> : <LedgerViews view={activeView} />}
    </div>
  );
};

export default BillingEntry;
