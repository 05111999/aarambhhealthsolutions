import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { db } from '../../lib/firebase';
import { formatMoney } from './money';
import { receiptNumberOf } from './receiptService';
import { useLiveSource } from '../data/liveStore';
import { patientTransactionsSource } from '../data/sources';
import { useBillSettings, useHospitals } from '../settings/useDirectory';
import { defaultHospitalFor, hospitalSnapshot } from '../bills/billingHospital';
import { printInvoice } from '../bills/billService';
import ScaledInvoice from '../bills/ScaledInvoice';
import PrintableInvoice from '../bills/PrintableInvoice';
import ReceiptDocument from './ReceiptDocument';

const actionClass =
  'inline-flex items-center gap-2 bg-white border border-border text-text-dark font-semibold px-4 py-2.5 rounded-lg cursor-pointer hover:border-primary/30 hover:text-primary transition-colors';

// /admin/patients/:patientId/receipts/:transactionId — printable receipt for one payment.
const ReceiptView = () => {
  const { patientId, transactionId } = useParams();
  // The patient's ledger is usually already loaded (profile → receipt costs no reads).
  const { data: ledger, loaded } = useLiveSource(patientTransactionsSource(patientId));
  const { hospitals } = useHospitals();
  const { ownHospitalId } = useBillSettings();
  const [patient, setPatient] = useState(undefined);

  useEffect(() => {
    getDoc(doc(db, 'patients', patientId))
      .then((snap) => setPatient(snap.exists() ? { id: snap.id, ...snap.data() } : null))
      .catch(() => setPatient(null));
  }, [patientId]);

  const payment = (ledger || []).find((t) => t.id === transactionId && t.type === 'payment');
  if (!loaded || patient === undefined) return <div className="text-text-muted">Loading…</div>;
  if (!payment || !patient) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted mb-4">Payment not found, or you don’t have access to it.</p>
        <Link to={`/admin/patients/${patientId}`} className="text-primary font-semibold">Back to patient</Link>
      </div>
    );
  }

  // Payments recorded before receipts existed have no stored hospital; they use the
  // hospital this patient is billed under now.
  const liveHospital = hospitals.find((h) => h.id === payment.hospitalId) || (!payment.hospital && defaultHospitalFor(patient, hospitals, ownHospitalId));
  const receipt = {
    receiptNumber: receiptNumberOf(payment),
    date: payment.date,
    amount: payment.amount,
    method: payment.method,
    reference: payment.reference,
    remarks: payment.remarks || '',
    isAdvance: payment.method === 'advance',
    receivedByName: payment.receivedByName || '',
    patient: { name: patient.name, phone: patient.contact1, address: patient.address, patientCode: patient.patientCode },
    hospital: payment.hospital || hospitalSnapshot(liveHospital),
  };
  const fileTitle = `Receipt ${receipt.receiptNumber}`;

  return (
    <div>
      <Link to={`/admin/patients/${patientId}`} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4 transition-colors">
        <ArrowLeft size={16} />
        Back to {patient.name}
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="mb-1 font-mono text-[32px]">{receipt.receiptNumber}</h1>
          <p className="text-text-muted text-sm mb-0">
            Payment receipt · <span className="font-semibold text-text-dark">{patient.name}</span> · {formatMoney(payment.amount)}
            {receipt.hospital?.name && ` · ${receipt.hospital.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => printInvoice(fileTitle)} className={`${actionClass} !bg-primary !text-white !border-primary hover:!bg-light-blue`}>
            <Printer size={16} />
            Print Receipt
          </button>
          <button onClick={() => printInvoice(fileTitle)} className={actionClass} title="Opens the print dialog — choose “Save as PDF”">
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </div>

      {payment.isDeleted && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-lg">
          This payment has been moved to the Trash and no longer counts toward the patient’s balance.
        </div>
      )}

      <p className="text-xs text-text-muted mb-3">To save a PDF, click Download PDF and choose “Save as PDF” as the destination.</p>

      <div className="max-w-[900px]">
        <ScaledInvoice>
          <ReceiptDocument receipt={receipt} logo={liveHospital?.logo} />
        </ScaledInvoice>
      </div>
      <PrintableInvoice>
        <ReceiptDocument receipt={receipt} logo={liveHospital?.logo} />
      </PrintableInvoice>
    </div>
  );
};

export default ReceiptView;
