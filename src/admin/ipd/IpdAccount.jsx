import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BedDouble, Pencil, Plus, Printer, Download, Trash2, CreditCard, FileText, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../permissions/usePermission';
import { useUrlFilters } from '../useUrlFilters';
import { formatMoney } from '../billing/money';
import { useLiveSources } from '../data/liveStore';
import { SOURCES, patientDocSource, patientEncountersSource, patientTransactionsSource } from '../data/sources';
import { useBillSettings, useHospitals, useTherapists } from '../settings/useDirectory';
import { defaultHospitalFor } from '../bills/billingHospital';
import { printInvoice } from '../bills/billService';
import { fmtDate } from '../bills/documentStyle';
import ScaledInvoice from '../bills/ScaledInvoice';
import PrintableInvoice from '../bills/PrintableInvoice';
import RecordPaymentModal from '../billing/RecordPaymentModal';
import { receiptNumberOf } from '../billing/receiptService';
import DeleteConfirmModal from '../patients/DeleteConfirmModal';
import { moveBillToTrash } from '../patients/trash';
import {
  admissionEndDay, admissionStartDay, balanceLabel, buildStatement, chargeTitle, effectiveDay, lengthOfStay,
} from './ipdMath';
import { addIpdCharges, correctPayment, ensureAdmissionNumber, saveAdmissionDetails, updateIpdCharge } from './ipdService';
import { AdmissionDetailsModal, ChargeModal, PaymentCorrectionModal, inputClass, labelClass } from './IpdModals';
import IpdStatementDocument from './IpdStatementDocument';
import HelpLink from '../help/HelpLink';

const METHOD_LABELS = {
  cash: 'Cash', card: 'Card', upi: 'UPI', bankTransfer: 'Bank Transfer', cheque: 'Cheque', advance: 'Advance', other: 'Other',
};
const TABS = [
  { key: 'charges', label: 'Charges by Day' },
  { key: 'payments', label: 'Payments Received' },
  { key: 'ledger', label: 'Account Ledger' },
  { key: 'bill', label: 'Bill Preview' },
];
const btn = 'inline-flex items-center justify-center gap-2 font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors text-sm';
const btnPrimary = `${btn} bg-primary text-white hover:bg-light-blue`;
const btnGhost = `${btn} bg-white border border-border text-text-dark hover:border-primary/30 hover:text-primary`;
const iconBtn = 'p-2 rounded-lg text-text-muted transition-colors cursor-pointer';

const Info = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-xs text-text-muted mb-0">{label}</p>
    <p className="text-sm font-semibold text-text-dark mb-0 break-words">{value || '—'}</p>
  </div>
);

// /admin/billing/ipd/:patientId/:encounterId — one admission's running bill.
const IpdAccount = () => {
  const { patientId, encounterId } = useParams();
  const { user, profile } = useAuth();
  const isAdminOrAbove = profile?.role === 'superadmin' || profile?.role === 'admin';
  const canAddCharges = usePermission('bills', 'create');
  const canRecordPayment = usePermission('billing', 'recordPayment');
  const canEditAdmission = usePermission('patients', 'edit');

  // Only this patient's record, visits and ledger — the ledger is usually already in
  // memory from their profile, so opening the account costs few or no reads.
  const live = useLiveSources({
    patient: patientDocSource(patientId),
    encounters: patientEncountersSource(patientId),
    ledger: patientTransactionsSource(patientId),
    departments: SOURCES.departments,
  });
  const patient = live.patient.data;
  const admission = (live.encounters.data || []).find((e) => e.id === encounterId);
  const ledger = live.ledger.data;
  const { hospitals } = useHospitals();
  const { ownHospitalId } = useBillSettings();
  const { therapists } = useTherapists();

  const [numberError, setNumberError] = useState('');
  useEffect(() => {
    if (patient && admission && !admission.admissionNumber) {
      ensureAdmissionNumber(patient, admission.id).catch((err) => setNumberError(err.message || 'Could not assign an IPD bill number.'));
    }
  }, [patient, admission]);

  const [filters, setFilters] = useUrlFilters({ tab: 'charges', from: '', to: '', final: '' });
  const [modal, setModal] = useState(null); // { kind, item? }
  const [trashing, setTrashing] = useState(null);
  const [notice, setNotice] = useState('');

  const stayStart = admission ? admissionStartDay(admission) : '';
  const stayEnd = admission ? admissionEndDay(admission) : '';
  const discharged = admission && admission.status !== 'active';
  const isFinal = discharged || filters.final === '1';
  // The final bill always covers the whole stay; otherwise the chosen period (clamped).
  const from = isFinal ? stayStart : filters.from && filters.from >= stayStart && filters.from <= stayEnd ? filters.from : stayStart;
  const to = isFinal ? stayEnd : filters.to && filters.to >= from && filters.to <= stayEnd ? filters.to : stayEnd;

  const statement = useMemo(() => (admission && ledger ? buildStatement(ledger, admission, from, to) : null), [ledger, admission, from, to]);
  const overall = useMemo(
    () => (ledger || []).filter((t) => !t.isDeleted).reduce((s, t) => s + (t.type === 'payment' ? Number(t.amount) || 0 : -(Number(t.netAmount) || 0)), 0),
    [ledger]
  );

  if (!live.patient.loaded || !live.encounters.loaded || !live.ledger.loaded) return <div className="text-text-muted">Loading…</div>;
  if (live.ledger.error) return <p className="text-red-600">You don’t have access to this patient’s billing.</p>;
  if (!patient || !admission) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted mb-4">Admission not found.</p>
        <Link to="/admin/billing/ipd" className="text-primary font-semibold">Back to IPD Running Bills</Link>
      </div>
    );
  }

  const hospital = defaultHospitalFor(patient, hospitals, ownHospitalId);
  const closing = balanceLabel(statement.balance);
  const los = lengthOfStay(admission);
  const docData = {
    hospital: hospital || {},
    logo: hospital?.logo,
    patient,
    admission: { ...admission, lengthOfStay: los },
    period: { from, to },
    statement,
    isFinal,
    preparedBy: profile?.name,
  };
  const fileTitle = `${isFinal ? 'Final Bill' : 'IPD Bill'} ${admission.admissionNumber || ''}`.trim();
  const tab = TABS.some((t) => t.key === filters.tab) ? filters.tab : 'charges';
  const toneClass = closing.tone === 'due' ? 'text-red-600' : closing.tone === 'credit' ? 'text-teal' : 'text-text-dark';
  const inTrash = !!patient.isDeleted;

  const saveCharges = async (lines) => {
    if (modal.item) {
      await updateIpdCharge(patientId, modal.item, lines[0], user.uid);
      setNotice(`Updated charge ${modal.item.chargeNumber || ''}.`);
    } else {
      const n = await addIpdCharges(patientId, encounterId, lines, user.uid);
      setNotice(`Added ${n} charge${n === 1 ? '' : 's'}.`);
    }
  };

  return (
    <div>
      <Link to="/admin/billing/ipd" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4 transition-colors">
        <ArrowLeft size={16} />
        IPD Running Bills
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div className="min-w-0">
          <h1 className="mb-1 font-mono text-[32px]">{admission.admissionNumber || 'IPD Bill'}</h1>
          <p className="text-text-muted text-sm mb-0">
            <Link to={`/admin/patients/${patientId}`} className="font-semibold text-text-dark hover:text-primary">{patient.name}</Link>
            {' · '}
            {isFinal ? 'Final discharge bill' : 'Running bill (interim)'}
            {hospital?.name && ` · ${hospital.name}`}
          </p>
          <HelpLink article="ipd-add-charges" label="Adding charges, payments and the final bill" className="mt-1" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => printInvoice(fileTitle)} className={btnPrimary}>
            <Printer size={16} />
            Print Bill
          </button>
          <button onClick={() => printInvoice(fileTitle)} className={btnGhost} title="Opens the print dialog — choose “Save as PDF”">
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </div>

      {(numberError || inTrash || admission.type !== 'inpatient') && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          {inTrash ? 'This patient is in the Trash — the account is read-only.' : numberError || 'This visit is not an inpatient admission.'}
        </div>
      )}
      {notice && (
        <div className="mb-4 bg-teal/10 border border-teal/20 text-teal text-sm font-medium px-4 py-3 rounded-lg flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="shrink-0" />{notice}</span>
          <button onClick={() => setNotice('')} aria-label="Dismiss" className="p-1 -m-1"><X size={16} /></button>
        </div>
      )}

      {/* Patient & admission */}
      <div className="bg-white rounded-2xl border border-border p-4 sm:p-6 mb-4">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <BedDouble size={18} className="text-primary" />
            <h3 className="text-base font-semibold text-text-dark mb-0">Admission</h3>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${discharged ? 'bg-bg text-text-muted' : 'bg-teal/10 text-teal'}`}>
              {discharged ? 'Discharged' : 'Admitted'}
            </span>
          </div>
          {canEditAdmission && !inTrash && (
            <button onClick={() => setModal({ kind: 'admission' })} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-teal">
              <Pencil size={14} />
              Ward, room &amp; doctor
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-3">
          <Info label="Patient" value={patient.name} />
          <Info label="UHID / Patient ID" value={patient.patientCode} />
          <Info label="Admission No." value={admission.admissionNumber} />
          <Info label="Admission date" value={fmtDate(admission.startedAt)} />
          <Info label={discharged ? 'Discharge date' : 'Expected discharge'} value={fmtDate(discharged ? admission.closedAt : admission.expectedDischargeDate)} />
          <Info label="Length of stay" value={`${los} day${los === 1 ? '' : 's'}${discharged ? '' : ' so far'}`} />
          <Info label="Ward" value={admission.ward} />
          <Info label="Room / Bed" value={admission.roomBed} />
          <Info label="Treating doctor" value={admission.treatingDoctor} />
          <Info label="Bill hospital" value={hospital?.name} />
        </div>
      </div>

      {/* Period + totals */}
      <div className="bg-white rounded-2xl border border-border p-4 sm:p-6 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-auto">
            <label className={labelClass}>From</label>
            <input type="date" name="from" className={inputClass} min={stayStart} max={stayEnd} value={from} disabled={isFinal} onChange={(e) => setFilters({ from: e.target.value })} />
          </div>
          <div className="w-full sm:w-auto">
            <label className={labelClass}>To</label>
            <input type="date" name="to" className={inputClass} min={from} max={stayEnd} value={to} disabled={isFinal} onChange={(e) => setFilters({ to: e.target.value })} />
          </div>
          {!discharged && (
            <label className="flex items-center gap-2 text-sm text-text-dark cursor-pointer py-2.5">
              <input type="checkbox" name="final" className="w-4 h-4" checked={isFinal} onChange={(e) => setFilters({ final: e.target.checked ? '1' : '', from: '', to: '' })} />
              Final discharge bill (whole stay)
            </label>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {statement.opening !== 0 && (
            <div className="bg-bg rounded-xl px-4 py-3">
              <p className="text-xs text-text-muted mb-0">Brought forward</p>
              <p className="text-lg font-bold text-text-dark mb-0">{formatMoney(Math.abs(statement.opening))} <span className="text-xs font-medium text-text-muted">{statement.opening < 0 ? 'due' : 'credit'}</span></p>
            </div>
          )}
          <div className="bg-bg rounded-xl px-4 py-3">
            <p className="text-xs text-text-muted mb-0">Total charges</p>
            <p className="text-lg font-bold text-text-dark mb-0" data-testid="ipd-total-charges">{formatMoney(statement.totalCharges)}</p>
          </div>
          <div className="bg-bg rounded-xl px-4 py-3">
            <p className="text-xs text-text-muted mb-0">Payments received</p>
            <p className="text-lg font-bold text-teal mb-0" data-testid="ipd-total-payments">{formatMoney(statement.totalPayments)}</p>
          </div>
          <div className="bg-bg rounded-xl px-4 py-3">
            <p className="text-xs text-text-muted mb-0">{closing.label}</p>
            <p className={`text-lg font-bold mb-0 ${toneClass}`} data-testid="ipd-balance">{formatMoney(closing.amount)}</p>
          </div>
        </div>
        {Math.round(overall * 100) !== Math.round(statement.balance * 100) && (
          <p className="text-xs text-text-muted mt-3 mb-0">
            Patient&apos;s overall balance across all visits: {overall < 0 ? `${formatMoney(-overall)} due` : overall > 0 ? `${formatMoney(overall)} credit` : 'settled'}.
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 mb-4 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilters({ tab: t.key })}
            className={`shrink-0 whitespace-nowrap px-3 sm:px-4 py-3 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-dark'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'charges' && (
        <div className="space-y-3">
          {canAddCharges && !inTrash && admission.admissionNumber && (
            <button onClick={() => setModal({ kind: 'charge' })} className={btnPrimary}>
              <Plus size={16} />
              Add Charge
            </button>
          )}
          {statement.days.map((day) => (
            <div key={day.key} className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 bg-bg border-b border-border">
                <p className="text-sm font-semibold text-text-dark mb-0">{fmtDate(day.key)}</p>
                <p className="text-sm font-semibold text-text-dark mb-0">Daily total {formatMoney(day.total)}</p>
              </div>
              <div className="divide-y divide-border">
                {day.charges.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-3 px-4 sm:px-5 py-3" data-testid="ipd-charge">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-dark mb-0 break-words">
                        {chargeTitle(c)}
                        {c.category && c.category !== chargeTitle(c) && <span className="text-text-muted font-normal"> · {c.category}</span>}
                        {c.billId && (
                          <Link to={`/admin/bills/${c.billId}`} className="ml-2 text-xs font-semibold text-primary hover:text-teal">View bill</Link>
                        )}
                      </p>
                      <p className="text-xs text-text-muted mb-0 break-words">
                        {c.chargeNumber || c.billNumber || ''}
                        {c.description && ` · ${c.description}`}
                        {c.ipd && ` · ${c.quantity} × ${formatMoney(c.rate)}`}
                        {c.updatedAt && ' · edited'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-semibold text-text-dark mr-1">{formatMoney(c.netAmount)}</span>
                      {isAdminOrAbove && !inTrash && c.ipd && (
                        <button onClick={() => setModal({ kind: 'charge', item: c })} title="Edit charge" aria-label="Edit charge" className={`${iconBtn} hover:text-primary hover:bg-primary/5`}>
                          <Pencil size={15} />
                        </button>
                      )}
                      {isAdminOrAbove && !inTrash && (
                        <button onClick={() => setTrashing(c)} title="Remove charge" aria-label="Remove charge" className={`${iconBtn} hover:text-red-600 hover:bg-red-50`}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {statement.days.length === 0 && <p className="text-text-muted text-sm py-6 text-center">No charges in this period.</p>}
        </div>
      )}

      {tab === 'payments' && (
        <div className="space-y-3">
          {canRecordPayment && !inTrash && (
            <button onClick={() => setModal({ kind: 'payment' })} className={btnPrimary}>
              <CreditCard size={16} />
              Add Payment
            </button>
          )}
          <div className="bg-white rounded-2xl border border-border overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-bg text-text-muted text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Receipt No.</th>
                  <th className="text-left px-4 py-3 font-semibold">Mode</th>
                  <th className="text-left px-4 py-3 font-semibold">Remarks</th>
                  <th className="text-right px-4 py-3 font-semibold">Amount</th>
                  <th className="w-28" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {statement.payments.map((p) => (
                  <tr key={p.id} data-testid="ipd-payment">
                    <td className="px-4 py-3 whitespace-nowrap">{fmtDate(effectiveDay(p))}</td>
                    <td className="px-4 py-3 font-mono text-xs">{receiptNumberOf(p)}</td>
                    <td className="px-4 py-3">{METHOD_LABELS[p.method] || p.method}</td>
                    <td className="px-4 py-3 text-text-muted">{[p.remarks, p.reference].filter(Boolean).join(' · ') || '—'}{p.updatedAt && ' · corrected'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-teal whitespace-nowrap">{formatMoney(p.amount)}</td>
                    <td className="px-2 py-1.5 text-right whitespace-nowrap">
                      <Link to={`/admin/patients/${patientId}/receipts/${p.id}`} title="Receipt" aria-label="Receipt" className={`${iconBtn} inline-flex hover:text-primary hover:bg-primary/5`}>
                        <FileText size={15} />
                      </Link>
                      {isAdminOrAbove && !inTrash && (
                        <>
                          <button onClick={() => setModal({ kind: 'correct', item: p })} title="Correct payment" aria-label="Correct payment" className={`${iconBtn} hover:text-primary hover:bg-primary/5`}>
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setTrashing(p)} title="Remove payment" aria-label="Remove payment" className={`${iconBtn} hover:text-red-600 hover:bg-red-50`}>
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {statement.payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-text-muted">No payments in this period.</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-bg">
                  <td colSpan={4} className="px-4 py-3 text-right font-semibold">Total received</td>
                  <td className="px-4 py-3 text-right font-bold text-teal">{formatMoney(statement.totalPayments)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {tab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-border overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-bg text-text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Date</th>
                <th className="text-left px-4 py-3 font-semibold">Description</th>
                <th className="text-right px-4 py-3 font-semibold">Debit</th>
                <th className="text-right px-4 py-3 font-semibold">Credit</th>
                <th className="text-right px-4 py-3 font-semibold">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="text-text-muted">
                <td className="px-4 py-2.5 whitespace-nowrap">{fmtDate(from)}</td>
                <td className="px-4 py-2.5 italic">Opening balance</td>
                <td />
                <td />
                <td className="px-4 py-2.5 text-right whitespace-nowrap">{balanceText(statement.opening)}</td>
              </tr>
              {statement.ledgerRows.map(({ t, debit, credit, balance }) => (
                <tr key={t.id}>
                  <td className="px-4 py-2.5 whitespace-nowrap">{fmtDate(effectiveDay(t))}</td>
                  <td className="px-4 py-2.5">
                    {t.type === 'payment' ? `Payment ${receiptNumberOf(t)} — ${METHOD_LABELS[t.method] || t.method}` : chargeTitle(t)}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">{debit ? formatMoney(debit) : '—'}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap text-teal">{credit ? formatMoney(credit) : '—'}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap font-medium">{balanceText(balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'bill' && (
        <div className="max-w-[900px]">
          <p className="text-xs text-text-muted mb-3">To save a PDF, click Download PDF and choose “Save as PDF” as the destination.</p>
          <ScaledInvoice autoHeight>
            <IpdStatementDocument data={docData} />
          </ScaledInvoice>
        </div>
      )}

      <PrintableInvoice multiPage>
        <IpdStatementDocument data={docData} />
      </PrintableInvoice>

      {modal?.kind === 'charge' && (
        <ChargeModal
          admission={admission}
          departments={live.departments.data || []}
          charge={modal.item}
          canEditRate={isAdminOrAbove}
          onSave={saveCharges}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'correct' && (
        <PaymentCorrectionModal
          payment={modal.item}
          onSave={async (form) => {
            await correctPayment(patientId, modal.item, form, user.uid);
            setNotice(`Corrected payment ${receiptNumberOf(modal.item)}.`);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'admission' && (
        <AdmissionDetailsModal
          admission={admission}
          therapists={therapists}
          onSave={(form) => saveAdmissionDetails(patientId, encounterId, form, user.uid)}
          onClose={() => setModal(null)}
        />
      )}
      <RecordPaymentModal
        isOpen={modal?.kind === 'payment'}
        onClose={() => setModal(null)}
        patientId={patientId}
        encounterId={encounterId}
        defaultRemarks={statement.payments.length === 0 ? 'Advance at admission' : 'Interim payment'}
      />
      <DeleteConfirmModal
        isOpen={!!trashing}
        onClose={() => setTrashing(null)}
        title={trashing?.type === 'payment' ? 'Remove Payment' : 'Remove Charge'}
        description={
          trashing
            ? `${trashing.type === 'payment' ? `Payment ${receiptNumberOf(trashing)}` : chargeTitle(trashing)} — ${formatMoney(trashing.type === 'payment' ? trashing.amount : trashing.netAmount)}. It moves to the Trash (a Super Admin can restore it) and stops counting toward the balance.`
            : ''
        }
        note=""
        confirmPhrase={formatMoney(trashing ? (trashing.type === 'payment' ? trashing.amount : trashing.netAmount) : 0)}
        confirmLabel="Move to Trash"
        busyLabel="Moving…"
        onConfirm={async () => {
          await moveBillToTrash(patientId, trashing, user.uid);
          setNotice('Moved to the Trash.');
        }}
      />
    </div>
  );
};

function balanceText(balance) {
  if (balance < 0) return `${formatMoney(-balance)} due`;
  if (balance > 0) return `${formatMoney(balance)} credit`;
  return formatMoney(0);
}

export default IpdAccount;
