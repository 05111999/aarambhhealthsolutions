import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BedDouble, Search, ChevronRight } from 'lucide-react';
import { useUrlFilters } from '../useUrlFilters';
import { useLiveSource } from '../data/liveStore';
import { activeInpatientsSource, patientEncountersSource } from '../data/sources';
import { usePatientSearch } from '../patients/usePatientSearch';
import { fmtDate } from '../bills/documentStyle';
import { lengthOfStay } from './ipdMath';
import HelpLink from '../help/HelpLink';

// /admin/billing/ipd — choose a patient, then one of their inpatient admissions.
const IpdHome = () => {
  const navigate = useNavigate();
  const [{ patient: selectedId }, setFilters] = useUrlFilters({ patient: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const { results, loading: searching } = usePatientSearch(searchTerm);
  const { data: inpatientData, loaded: inpatientsLoaded } = useLiveSource(activeInpatientsSource());
  const inpatients = useMemo(
    () => (inpatientData || []).filter((p) => !p.isDeleted).sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [inpatientData]
  );
  const { data: encounterData, loaded: encountersLoaded } = useLiveSource(patientEncountersSource(selectedId));
  const admissions = useMemo(
    () => (encounterData || []).filter((e) => e.type === 'inpatient').sort((a, b) => (b.startedAt?.toMillis?.() ?? 0) - (a.startedAt?.toMillis?.() ?? 0)),
    [encounterData]
  );
  const selected = [...inpatients, ...results].find((p) => p.id === selectedId);

  const pick = (p) => {
    setSearchTerm('');
    setFilters({ patient: p.id });
  };

  const PatientRow = ({ p }) => (
    <button
      onClick={() => pick(p)}
      className={`w-full text-left flex items-center justify-between gap-3 px-4 py-3 hover:bg-bg transition-colors cursor-pointer ${p.id === selectedId ? 'bg-primary/5' : ''}`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-text-dark truncate">{p.name}</span>
        <span className="block text-xs text-text-muted font-mono">{p.patientCode}</span>
      </span>
      <span className="text-xs text-text-muted shrink-0">
        {p.currentPatientType === 'inpatient' && p.currentStatus === 'active' ? 'Admitted' : p.currentStatus === 'active' ? 'Active' : 'Discharged'}
      </span>
    </button>
  );

  return (
    <div>
      <Link to="/admin/billing" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4 transition-colors">
        <ArrowLeft size={16} />
        Billing
      </Link>
      <h1 className="mb-1">IPD Running Bills</h1>
      <p className="text-text-muted text-sm mb-6">
        Inpatient account statements — charges during the stay, every payment received, and the running balance. For one-off bills use Bills.
      </p>
      <HelpLink article="ipd-open" label="Learn how IPD billing works" className="-mt-4 mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search any patient by code, name, or phone"
                className="w-full pl-9 pr-3 py-2.5 border border-border rounded-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
          {searchTerm.trim() ? (
            <div className="divide-y divide-border">
              {results.map((p) => <PatientRow key={p.id} p={p} />)}
              {!searching && results.length === 0 && <p className="text-sm text-text-muted px-4 py-6 text-center mb-0">No matching patients.</p>}
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted px-4 pt-3 pb-1 mb-0">Currently admitted</p>
              <div className="divide-y divide-border">
                {inpatients.map((p) => <PatientRow key={p.id} p={p} />)}
                {inpatientsLoaded && inpatients.length === 0 && (
                  <p className="text-sm text-text-muted px-4 py-6 text-center mb-0">No patients are admitted right now. Search for a past inpatient above.</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border p-4 sm:p-5">
          {!selectedId ? (
            <div className="text-center py-8 text-text-muted">
              <BedDouble size={28} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm mb-0">Choose a patient to see their admissions.</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-text-dark mb-3">
                Admissions{selected ? ` — ${selected.name}` : ''}
              </p>
              <div className="space-y-2">
                {admissions.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => navigate(`/admin/billing/ipd/${selectedId}/${a.id}`)}
                    className="group w-full text-left flex items-center justify-between gap-3 border border-border rounded-xl px-4 py-3 hover:border-primary/40 transition-colors cursor-pointer"
                    data-testid="ipd-admission"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-text-dark">
                        {a.admissionNumber || 'New IPD account'}
                        <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${a.status === 'active' ? 'bg-teal/10 text-teal' : 'bg-bg text-text-muted'}`}>
                          {a.status === 'active' ? 'Admitted' : 'Discharged'}
                        </span>
                      </span>
                      <span className="block text-xs text-text-muted">
                        {fmtDate(a.startedAt)} → {a.closedAt ? fmtDate(a.closedAt) : 'now'} · {lengthOfStay(a)} day{lengthOfStay(a) === 1 ? '' : 's'}
                        {a.ward && ` · ${a.ward}`}
                      </span>
                    </span>
                    <ChevronRight size={16} className="text-text-muted group-hover:text-primary shrink-0" />
                  </button>
                ))}
                {encountersLoaded && admissions.length === 0 && (
                  <p className="text-sm text-text-muted py-4 mb-0">
                    This patient has no inpatient admissions. Readmit them as an Inpatient from their profile to open an IPD account.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IpdHome;
