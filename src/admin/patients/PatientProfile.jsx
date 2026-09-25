import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  doc, collection, onSnapshot, orderBy, query, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import {
  ArrowLeft, MapPin, Phone, Stethoscope, Wallet, LogOut, Receipt, Pencil, Trash2, UserCheck,
  AlertTriangle, Building2, Users, RotateCcw,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../permissions/usePermission';
import { usePatientBalance } from './usePatientBalance';
import { formatMoney } from '../billing/money';
import PatientLedger from '../billing/PatientLedger';
import BillingForm from '../billing/BillingForm';
import EditPatientModal from './EditPatientModal';
import ReadmitModal from './ReadmitModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import SessionLogPanel from './SessionLogPanel';
import { moveToTrash, restoreFromTrash } from './trash';

const TYPE_LABELS = { inpatient: 'Inpatient', outpatient: 'Outpatient', homeVisit: 'Home Visit', virtual: 'Virtual' };

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="bg-teal/10 p-2.5 rounded-full shrink-0">
      <Icon className="text-teal" size={18} />
    </div>
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm font-medium text-text-dark">{value || '—'}</p>
    </div>
  </div>
);

const PatientProfile = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const canEdit = usePermission('patients', 'edit');
  const canDischarge = usePermission('patients', 'dischargeOrClose');
  const canBill = usePermission('billing', 'create');
  const canViewBilling = usePermission('billing', 'view');
  const isSuperAdmin = profile?.role === 'superadmin';

  const [patient, setPatient] = useState(null);
  const [encounters, setEncounters] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dischargeError, setDischargeError] = useState('');
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReadmitModal, setShowReadmitModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { balance, hasPendingDues } = usePatientBalance(patientId, canViewBilling);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'patients', patientId), (snap) => {
      if (snap.exists()) {
        setPatient({ id: snap.id, ...snap.data() });
      } else {
        setNotFound(true);
      }
    });
    return unsubscribe;
  }, [patientId]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'patients', patientId, 'encounters'), orderBy('startedAt', 'desc')),
      (snap) => setEncounters(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsubscribe;
  }, [patientId]);

  const handleDischarge = async () => {
    const activeEncounter = encounters.find((e) => e.status === 'active');
    if (!activeEncounter) return;
    setDischargeError('');
    if (hasPendingDues) {
      setDischargeError(`Cannot discharge — patient has pending dues of ${formatMoney(Math.abs(balance))}. Clear the balance first.`);
      return;
    }

    setProcessing(true);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'patients', patientId, 'encounters', activeEncounter.id), {
        status: 'discharged',
        closedAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'patients', patientId), {
        currentStatus: 'discharged',
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    } finally {
      setProcessing(false);
    }
  };

  const [restoring, setRestoring] = useState(false);

  const handleMoveToTrash = async () => {
    await moveToTrash(patient, user.uid);
    navigate('/admin/patients');
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restoreFromTrash(patient, user.uid);
    } finally {
      setRestoring(false);
    }
  };

  // Outside the Super Admin, a trashed patient simply doesn't exist.
  if (notFound || (patient?.isDeleted && !isSuperAdmin)) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted mb-4">Patient not found.</p>
        <Link to="/admin/patients" className="text-primary font-semibold">
          Back to Patients
        </Link>
      </div>
    );
  }

  if (!patient) {
    return <div className="text-text-muted">Loading…</div>;
  }

  const isInpatient = patient.currentPatientType === 'inpatient';
  const isDischarged = patient.currentStatus !== 'active';
  const inTrash = !!patient.isDeleted;

  return (
    <div>
      <Link
        to={inTrash ? '/admin/trash' : '/admin/patients'}
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        {inTrash ? 'Back to Trash' : 'Back to Patients'}
      </Link>

      {inTrash && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <Trash2 size={18} className="text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">This patient is in the Trash</p>
              <p className="text-xs text-red-600/80 mt-0.5">
                Moved to Trash{patient.deletedAt?.toDate ? ` on ${patient.deletedAt.toDate().toLocaleString()}` : ''}. Hidden from every list and
                total, and read-only until restored. Nothing has been erased.
              </p>
            </div>
          </div>
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="inline-flex items-center gap-2 bg-white border border-red-200 text-red-700 font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-red-100 transition-colors disabled:opacity-60"
          >
            <RotateCcw size={16} />
            {restoring ? 'Restoring…' : 'Restore Patient'}
          </button>
        </div>
      )}

      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="mb-0">{patient.name}</h1>
            <span
              className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                patient.currentStatus === 'active' ? 'bg-teal/10 text-teal' : 'bg-bg text-text-muted'
              }`}
            >
              {patient.currentStatus === 'active' ? 'Active' : 'Discharged'}
            </span>
            {hasPendingDues && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">
                <AlertTriangle size={12} />
                Pending Dues: {formatMoney(Math.abs(balance))}
              </span>
            )}
            {patient.referredFromHospital && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                <Building2 size={12} />
                {patient.referringHospitalName ? `From ${patient.referringHospitalName}` : 'Received from Hospital'}
              </span>
            )}
          </div>
          <p className="font-mono text-sm text-primary font-semibold">{patient.patientCode}</p>
        </div>

        {!inTrash && (
        <div className="flex items-center gap-3 flex-wrap">
          {canEdit && (
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-2 bg-white border border-border text-text-dark font-semibold px-4 py-2.5 rounded-lg hover:border-primary/30 hover:text-primary transition-colors"
            >
              <Pencil size={16} />
              Edit
            </button>
          )}
          {canBill && (
            <button
              onClick={() => setShowBillingForm(true)}
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-light-blue transition-colors"
            >
              <Receipt size={16} />
              Add Charge
            </button>
          )}
          {canDischarge && patient.currentStatus === 'active' && (
            <button
              onClick={handleDischarge}
              disabled={processing || hasPendingDues}
              title={hasPendingDues ? 'Clear pending dues before discharging' : undefined}
              className="inline-flex items-center gap-2 bg-white border border-border text-text-dark font-semibold px-5 py-2.5 rounded-lg hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-text-dark"
            >
              <LogOut size={16} />
              {processing ? 'Processing…' : isInpatient ? 'Discharge' : 'Mark Inactive'}
            </button>
          )}
          {canDischarge && isDischarged && (
            <button
              onClick={() => setShowReadmitModal(true)}
              className="inline-flex items-center gap-2 bg-white border border-border text-text-dark font-semibold px-5 py-2.5 rounded-lg hover:border-teal/40 hover:text-teal transition-colors"
            >
              <UserCheck size={16} />
              Readmit
            </button>
          )}
          {isSuperAdmin && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 bg-white border border-border text-red-600 font-semibold px-4 py-2.5 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
            >
              <Trash2 size={16} />
              Move to Trash
            </button>
          )}
        </div>
        )}
      </div>

      {dischargeError && (
        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-2.5 rounded-lg">
          {dischargeError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
            <InfoRow icon={Stethoscope} label="Primary Diagnosis" value={patient.primaryDiagnosis} />
            <InfoRow icon={Phone} label="Contact" value={[patient.contact1, patient.contact2].filter(Boolean).join(' / ')} />
            <InfoRow icon={MapPin} label="Address" value={patient.address} />
            <InfoRow icon={Wallet} label="Advance Paid" value={patient.advanceAmount ? `₹${patient.advanceAmount}` : '₹0'} />
            <InfoRow
              icon={Users}
              label="Attender"
              value={patient.attenderName ? [patient.attenderName, patient.attenderContact].filter(Boolean).join(' · ') : ''}
            />
          </div>
          <div className="bg-white rounded-2xl border border-border p-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-text-muted">Age</p>
              <p className="font-medium text-text-dark">{patient.age}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Gender</p>
              <p className="font-medium text-text-dark capitalize">{patient.gender}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Patient Type</p>
              <p className="font-medium text-text-dark">{TYPE_LABELS[patient.currentPatientType]}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Session Frequency</p>
              <p className="font-medium text-text-dark">{patient.sessionFrequency || '—'}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-border p-6">
            <h3 className="text-base font-semibold text-text-dark mb-4">Encounter History</h3>
            <div className="space-y-3">
              {encounters.map((e) => (
                <div key={e.id} className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-text-dark">{TYPE_LABELS[e.type] || e.type}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Started {e.startedAt?.toDate ? e.startedAt.toDate().toLocaleDateString() : '—'}
                      {e.closedAt?.toDate ? ` · Closed ${e.closedAt.toDate().toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                      e.status === 'active' ? 'bg-teal/10 text-teal' : 'bg-bg text-text-muted'
                    }`}
                  >
                    {e.status === 'active' ? 'Active' : 'Closed'}
                  </span>
                </div>
              ))}
              {encounters.length === 0 && <p className="text-text-muted text-sm">No encounters recorded.</p>}
            </div>
          </div>

          <SessionLogPanel patientId={patientId} readOnly={inTrash} />

          {canViewBilling && <PatientLedger patientId={patientId} readOnly={inTrash} />}
        </div>
      </div>

      <BillingForm
        isOpen={showBillingForm}
        onClose={() => setShowBillingForm(false)}
        patientId={patientId}
        encounterId={encounters.find((e) => e.status === 'active')?.id}
      />

      <EditPatientModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} patientId={patientId} patient={patient} />

      <ReadmitModal
        isOpen={showReadmitModal}
        onClose={() => setShowReadmitModal(false)}
        patientId={patientId}
        lastPatientType={patient.currentPatientType}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Move Patient to Trash"
        description="The patient and all of their visits, bills and session logs will be hidden from every list and total. Nothing is erased."
        note="You can restore them from Trash at any time."
        confirmLabel="Move to Trash"
        busyLabel="Moving…"
        confirmPhrase={patient.name}
        onConfirm={handleMoveToTrash}
      />
    </div>
  );
};

export default PatientProfile;
