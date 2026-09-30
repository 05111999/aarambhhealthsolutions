import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Pencil, Trash2, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { formatMoney } from '../billing/money';
import { useHospitals } from '../settings/useDirectory';
import DeleteConfirmModal from '../patients/DeleteConfirmModal';
import { moveBillToTrash } from '../patients/trash';
import { useBill, printInvoice } from './billService';
import ScaledInvoice from './ScaledInvoice';
import PrintableInvoice from './PrintableInvoice';
import InvoiceDocument from './InvoiceDocument';
import { useBillContext } from './useBillContext';

const actionClass =
  'inline-flex items-center gap-2 bg-white border border-border text-text-dark font-semibold px-4 py-2.5 rounded-lg cursor-pointer hover:border-primary/30 hover:text-primary transition-colors';

const BillView = () => {
  const { billId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const isAdminOrAbove = profile?.role === 'superadmin' || profile?.role === 'admin';
  const bill = useBill(billId);
  const { hospitals } = useHospitals();
  const [notice, setNotice] = useState(
    location.state?.justSaved === 'created' ? 'Bill saved and added to the patient’s balance.' : location.state?.justSaved === 'updated' ? 'Bill updated.' : ''
  );
  const [trashing, setTrashing] = useState(false);
  // Patient record, visit/admission and its payments shown around the bill (shared data).
  const billContext = useBillContext({ patientId: bill?.patientId, bill: bill || {} });

  if (bill === undefined) return <div className="text-text-muted">Loading…</div>;
  if (bill === null || bill.isDeleted) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted mb-4">{bill?.isDeleted ? 'This bill is in the Trash.' : 'Bill not found, or you don’t have access to it.'}</p>
        <Link to="/admin/bills" className="text-primary font-semibold">Back to Bills</Link>
      </div>
    );
  }

  const logo = hospitals.find((h) => h.id === bill.hospitalId)?.logo;
  const fileTitle = `Bill ${bill.billNumber}`;

  return (
    <div>
      <Link to="/admin/bills" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4 transition-colors">
        <ArrowLeft size={16} />
        Back to Bills
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="mb-1 font-mono text-[32px]">{bill.billNumber}</h1>
          <p className="text-text-muted text-sm mb-0">
            <Link to={`/admin/patients/${bill.patientId}`} className="font-semibold text-text-dark hover:text-primary">{bill.patient?.name}</Link>
            {' · '}
            {formatMoney(bill.total)}
            {' · '}
            {bill.hospital?.name}
            {bill.createdByName && ` · Billed by ${bill.createdByName}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => printInvoice(fileTitle)} className={`${actionClass} !bg-primary !text-white !border-primary hover:!bg-light-blue`}>
            <Printer size={16} />
            Print Invoice
          </button>
          <button onClick={() => printInvoice(fileTitle)} className={actionClass} title="Opens the print dialog — choose “Save as PDF”">
            <Download size={16} />
            Download PDF
          </button>
          {isAdminOrAbove && (
            <>
              <Link to={`/admin/bills/${bill.id}/edit`} className={actionClass}>
                <Pencil size={16} />
                Edit
              </Link>
              <button onClick={() => setTrashing(true)} className={`${actionClass} !text-red-600 hover:!bg-red-50 hover:!border-red-200`}>
                <Trash2 size={16} />
                Move to Trash
              </button>
            </>
          )}
        </div>
      </div>

      {notice && (
        <div className="mb-4 bg-teal/10 border border-teal/20 text-teal text-sm font-medium px-4 py-3 rounded-lg flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            {notice}
          </span>
          <button onClick={() => setNotice('')} className="cursor-pointer"><X size={16} /></button>
        </div>
      )}

      <p className="text-xs text-text-muted mb-3">To save a PDF, click Download PDF and choose “Save as PDF” as the destination.</p>

      <div className="max-w-[900px]">
        <ScaledInvoice autoHeight>
          <InvoiceDocument bill={bill} logo={logo} context={billContext} />
        </ScaledInvoice>
      </div>

      <PrintableInvoice multiPage pageClass="print-bill">
        <InvoiceDocument bill={bill} logo={logo} context={billContext} />
      </PrintableInvoice>

      <DeleteConfirmModal
        isOpen={trashing}
        onClose={() => setTrashing(false)}
        title="Move Bill to Trash"
        description="The bill and its charge are removed from the patient’s ledger and balance. Nothing is erased."
        note="A Super Admin can restore it from Trash."
        confirmLabel="Move to Trash"
        busyLabel="Moving…"
        confirmPhrase={bill.billNumber}
        onConfirm={async () => {
          await moveBillToTrash(
            bill.patientId,
            { id: bill.transactionId, billId: bill.id, type: 'charge', netAmount: bill.total, serviceName: `Bill ${bill.billNumber}` },
            user.uid
          );
          navigate(`/admin/patients/${bill.patientId}`);
        }}
      />
    </div>
  );
};

export default BillView;
