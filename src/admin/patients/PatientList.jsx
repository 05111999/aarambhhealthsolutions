import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { Search, UserPlus, X } from 'lucide-react';
import { db } from '../../lib/firebase';
import { usePermission } from '../permissions/usePermission';
import { useUrlFilters } from '../useUrlFilters';
import { usePatientSearch } from './usePatientSearch';
import PatientOnboardingForm from './PatientOnboardingForm';

const STATUS_FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'discharged', label: 'Discharged' },
  { value: 'all', label: 'All' },
];

const FILTER_DEFAULTS = { type: 'all', status: 'active', hospital: '', since: '' };

const chipClass = (selected, tone = 'primary') =>
  `px-3.5 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors ${
    selected
      ? tone === 'primary' ? 'bg-primary text-white' : 'bg-teal/10 text-teal'
      : 'bg-bg text-text-muted hover:text-text-dark hover:bg-border/60'
  }`;

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

const TYPE_FILTERS = [
  { value: 'all', label: 'All Types' },
  { value: 'inpatient', label: 'Inpatient' },
  { value: 'outpatient', label: 'Outpatient' },
  { value: 'homeVisit', label: 'Home Visit' },
  { value: 'virtual', label: 'Virtual' },
];

const TYPE_LABELS = { inpatient: 'Inpatient', outpatient: 'Outpatient', homeVisit: 'Home Visit', virtual: 'Virtual' };

const StatusPill = ({ status }) => (
  <span
    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
      status === 'active' ? 'bg-teal/10 text-teal' : 'bg-bg text-text-muted'
    }`}
  >
    {status === 'active' ? 'Active' : 'Discharged'}
  </span>
);

const PatientList = () => {
  const navigate = useNavigate();
  const canCreate = usePermission('patients', 'create');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters, isDefaultFilters] = useUrlFilters(FILTER_DEFAULTS);
  const typeFilter = filters.type;
  const statusFilter = filters.status;
  const hospitalOnly = filters.hospital === '1';
  const sinceMonth = filters.since === 'month';
  const [patients, setPatients] = useState([]);

  const { results: searchResults, loading: searching } = usePatientSearch(searchTerm);

  useEffect(() => {
    if (searchTerm.trim()) return undefined; // search results take over below

    const constraints = [];
    if (typeFilter !== 'all') constraints.push(where('currentPatientType', '==', typeFilter));
    if (statusFilter !== 'all') constraints.push(where('currentStatus', '==', statusFilter));
    if (hospitalOnly) constraints.push(where('referredFromHospital', '==', true));
    // Range on the same field as the orderBy, so every existing composite index still applies.
    if (sinceMonth) constraints.push(where('createdAt', '>=', Timestamp.fromDate(startOfMonth())));
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(100));

    const unsubscribe = onSnapshot(query(collection(db, 'patients'), ...constraints), (snap) => {
      // Trashed patients are left out here rather than in the query: older records have no
      // isDeleted field at all, and Firestore can't query for a missing field.
      setPatients(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => !p.isDeleted));
    });
    return unsubscribe;
  }, [typeFilter, statusFilter, hospitalOnly, sinceMonth, searchTerm]);

  const rows = searchTerm.trim() ? searchResults : patients;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="mb-1">Patients</h1>
          <p className="text-text-muted text-sm">Search, onboard, and manage patient records.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-light-blue transition-colors"
          >
            <UserPlus size={18} />
            Add Patient
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-border p-4 mb-6 space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient code, name, or phone number…"
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>

        {!searchTerm.trim() && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wide w-14">Type</span>
              {TYPE_FILTERS.map((f) => (
                <button key={f.value} onClick={() => setFilters({ type: f.value })} className={chipClass(typeFilter === f.value)}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wide w-14">Status</span>
              {STATUS_FILTERS.map((f) => (
                <button key={f.value} onClick={() => setFilters({ status: f.value })} className={chipClass(statusFilter === f.value, 'teal')}>
                  {f.label}
                </button>
              ))}
              <span className="w-px h-5 bg-border mx-1" />
              <button onClick={() => setFilters({ hospital: hospitalOnly ? '' : '1' })} className={chipClass(hospitalOnly)}>
                Hospital-referred
              </button>
              <button onClick={() => setFilters({ since: sinceMonth ? '' : 'month' })} className={chipClass(sinceMonth)}>
                New this month
              </button>
              {!isDefaultFilters && (
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
        )}
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg text-text-muted text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-6 py-3 font-semibold">Code</th>
              <th className="text-left px-6 py-3 font-semibold">Name</th>
              <th className="text-left px-6 py-3 font-semibold">Type</th>
              <th className="text-left px-6 py-3 font-semibold">Contact</th>
              <th className="text-left px-6 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((p) => (
              <tr
                key={p.id}
                onClick={() => navigate(`/admin/patients/${p.id}`)}
                className="cursor-pointer hover:bg-bg transition-colors"
              >
                <td className="px-6 py-3.5 font-mono text-xs text-primary font-semibold">{p.patientCode}</td>
                <td className="px-6 py-3.5 font-medium text-text-dark">
                  <span className="inline-flex items-center gap-1.5">
                    {p.name}
                    {p.referredFromHospital && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                        Hospital
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-text-muted">{TYPE_LABELS[p.currentPatientType] || p.currentPatientType}</td>
                <td className="px-6 py-3.5 text-text-muted">{p.contact1}</td>
                <td className="px-6 py-3.5">
                  <StatusPill status={p.currentStatus} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-text-muted">
                  {searchTerm.trim()
                    ? searching ? 'Searching…' : 'No matching patients.'
                    : isDefaultFilters ? 'No patients yet.' : 'No patients match these filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PatientOnboardingForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onCreated={(patient) => navigate(`/admin/patients/${patient.id}`)}
      />
    </div>
  );
};

export default PatientList;
