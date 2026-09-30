import React from 'react';
import { formatMoney } from '../billing/money';
import { rupeesInWords } from '../billing/amountInWords';
import { receiptNumberOf } from '../billing/receiptService';
import { adjustmentLabel } from './billMath';
import { toDate } from './documentStyle';
import { BrandMark } from './DocumentFrame';

// A4 hospital detailed bill for one medical invoice. Pure presentation: every figure is
// read from the saved bill (or the editor's live form) and from `context`
// (useBillContext — patient record, the visit/admission, and that visit's payments).
// It flows onto further pages when a bill is long (printed on the "statement" page).

const INK = '#111827';
const LINE = '#4B5563';
const MUTED = '#4B5563';

const METHOD_LABELS = {
  cash: 'Cash', card: 'Card', upi: 'UPI', bankTransfer: 'Bank Transfer', cheque: 'Cheque', advance: 'Advance', other: 'Other',
};
const VISIT_TITLES = {
  inpatient: 'IPD Detailed Bill',
  outpatient: 'OPD Detailed Bill',
  homeVisit: 'Home Visit Detailed Bill',
  virtual: 'Virtual Consultation Detailed Bill',
};

const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (v) => {
  const d = toDate(v);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : '-';
};
// Dates picked in the editor have no time; saved dates do.
const fmtDateTime = (v) => {
  const d = toDate(v);
  if (!d) return '-';
  return typeof v === 'string' ? fmtDate(d) : `${fmtDate(d)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const money = (n) => formatMoney(Number(n) || 0);
const plain = (n) => (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const Row = ({ label, value }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '30mm 3mm 1fr', fontSize: '8.8pt', lineHeight: 1.45 }}>
    <span style={{ fontWeight: 600 }}>{label}</span>
    <span>:</span>
    <span style={{ wordBreak: 'break-word' }}>{value || '-'}</span>
  </div>
);

const SectionTitle = ({ children }) => (
  <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '10pt', lineHeight: 1.3, margin: '3mm 0 1mm', borderBottom: `1.2px solid ${LINE}`, paddingBottom: '1mm' }}>{children}</p>
);

const th = { fontWeight: 700, fontSize: '8.5pt', padding: '1.6mm 1.5mm', borderBottom: `1px solid ${LINE}`, textAlign: 'left', whiteSpace: 'nowrap' };
const td = { fontSize: '8.5pt', padding: '1.3mm 1.5mm', verticalAlign: 'top' };
const num = { textAlign: 'right', whiteSpace: 'nowrap' };

const footerLine = { fontSize: '8pt', lineHeight: 1.4, margin: 0 };

const SumLine = ({ label, value, strong }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6mm', fontSize: strong ? '10pt' : '9pt', fontWeight: strong ? 700 : 600, padding: '0.8mm 0' }}>
    <span>{label}</span>
    <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
  </div>
);

const InvoiceDocument = ({ bill, logo, context = {} }) => {
  const { patient: pat = {}, hospital = {}, physician, items = [], discount, tax } = bill;
  const { patient: record, encounter, account, printedBy } = context;
  const visitType = encounter?.type || record?.currentPatientType;
  const title = VISIT_TITLES[visitType] || 'Detailed Bill';
  const discountLabel = adjustmentLabel(discount, formatMoney);
  const taxLabel = adjustmentLabel(tax, formatMoney);

  // Services grouped by the department they came from; custom lines are "Additional Services".
  const groups = [];
  for (const item of items) {
    const name = item.departmentName || 'Additional Services';
    let group = groups.find((g) => g.name === name);
    if (!group) groups.push((group = { name, items: [], total: 0 }));
    group.items.push(item);
    group.total += Number(item.price) || 0;
  }
  let serial = 0;

  // Account for the visit: never shown as a negative "due".
  const balance = account?.balance ?? 0;
  const cashDue = balance < 0 ? -balance : 0;
  const creditDue = balance > 0 && !account?.discharged ? balance : 0;
  const refundable = balance > 0 && account?.discharged ? balance : 0;
  const now = new Date();

  return (
    <div className="invoice-document" style={{ width: '210mm', background: '#fff', color: INK, fontFamily: 'inherit', padding: '3mm 12mm 3mm' }}>
      {/* Hospital header */}
      <div style={{ display: 'grid', gridTemplateColumns: '32mm 1fr 32mm', alignItems: 'center', gap: '4mm', borderBottom: `1.5px solid ${LINE}`, paddingBottom: '3mm' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <BrandMark logo={logo} size="17mm" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '15pt', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.15 }}>{hospital.name || 'Hospital'}</p>
          <p style={{ fontSize: '8.5pt', lineHeight: 1.4, fontWeight: 600, margin: '1mm 0 0' }}>{[hospital.addressLine1, hospital.addressLine2].filter(Boolean).join(', ')}</p>
          <p style={{ fontSize: '8.5pt', lineHeight: 1.4, fontWeight: 600, margin: 0 }}>
            {[hospital.phone && `Call: ${hospital.phone}`, hospital.email, hospital.website].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span />
      </div>

      <p style={{ textAlign: 'center', fontSize: '11.5pt', lineHeight: 1.3, fontWeight: 700, margin: '2.5mm 0 1.5mm' }}>{title}</p>

      {/* Patient / bill details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6mm', borderTop: `1.2px solid ${LINE}`, borderBottom: `1.2px solid ${LINE}`, padding: '2mm 0' }}>
        <div>
          <Row label="Name" value={pat.name} />
          <Row label="Age" value={record?.age ? `${record.age}y` : ''} />
          <Row label="Gender" value={record?.gender ? record.gender.charAt(0).toUpperCase() + record.gender.slice(1) : ''} />
          <Row label="Phone" value={pat.phone} />
          <Row label="Admission Date" value={encounter ? fmtDateTime(encounter.startedAt) : ''} />
          <Row label="Discharge Date" value={encounter?.closedAt ? fmtDateTime(encounter.closedAt) : ''} />
          <Row label="Address" value={[pat.address, pat.cityLine].filter(Boolean).join(', ')} />
          <Row label="Consultant" value={physician ? [physician.name, physician.qualification].filter(Boolean).join(', ') : ''} />
        </div>
        <div>
          <Row label="UHID" value={pat.patientCode} />
          <Row label="Bill Date" value={fmtDateTime(bill.invoiceDate)} />
          <Row label="Bill No" value={bill.billNumber || 'Assigned on save'} />
          <Row label="IPD No" value={encounter?.type === 'inpatient' ? encounter.admissionNumber : ''} />
          <Row label="Room Category" value={[encounter?.ward, encounter?.roomBed].filter(Boolean).join(' · ')} />
          <Row label="Panel" value="Cash" />
          <Row label="Claim No" value="N/A" />
          {bill.dueDate && <Row label="Due Date" value={fmtDate(bill.dueDate)} />}
        </div>
      </div>

      {/* Services */}
      <SectionTitle>Services</SectionTitle>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...th, width: '9mm' }}>S.No</th>
            <th style={{ ...th, width: '19mm' }}>Date</th>
            <th style={th}>Description</th>
            <th style={{ ...th, ...num, width: '17mm' }}>Rate</th>
            <th style={{ ...th, ...num, width: '9mm' }}>Unit</th>
            <th style={{ ...th, ...num, width: '10mm' }}>Dis%</th>
            <th style={{ ...th, ...num, width: '11mm' }}>GST%</th>
            <th style={{ ...th, ...num, width: '11mm' }}>GST</th>
            <th style={{ ...th, ...num, width: '20mm' }}>Amt(Rs)</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <React.Fragment key={g.name}>
              <tr style={{ breakInside: 'avoid' }}>
                <td colSpan={9} style={{ ...td, fontWeight: 700, fontSize: '9.5pt', paddingTop: '2mm' }}>{g.name}</td>
              </tr>
              {g.items.map((item, i) => {
                serial += 1;
                return (
                  <tr key={`${g.name}-${i}`} style={{ breakInside: 'avoid' }}>
                    <td style={td}>{serial}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap', fontSize: '7.8pt' }}>{fmtDate(bill.invoiceDate)}</td>
                    <td style={{ ...td, wordBreak: 'break-word' }}>
                      {item.name}
                      {item.description && <span style={{ color: MUTED }}> - {item.description}</span>}
                    </td>
                    <td style={{ ...td, ...num }}>{plain(item.price)}</td>
                    <td style={{ ...td, ...num }}>1</td>
                    <td style={{ ...td, ...num }}>0</td>
                    <td style={{ ...td, ...num }}>0</td>
                    <td style={{ ...td, ...num }}>0</td>
                    <td style={{ ...td, ...num }}>{plain(item.price)}</td>
                  </tr>
                );
              })}
              <tr style={{ breakInside: 'avoid' }}>
                <td colSpan={8} />
                <td style={{ ...td, ...num, fontWeight: 700, borderTop: `1px solid ${LINE}` }}>{plain(g.total)}</td>
              </tr>
            </React.Fragment>
          ))}
          {groups.length === 0 && (
            <tr>
              <td colSpan={9} style={{ ...td, textAlign: 'center', color: MUTED, padding: '4mm' }}>No items yet</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 72mm', gap: '8mm', borderTop: `1.2px solid ${LINE}`, borderBottom: `1.2px solid ${LINE}`, marginTop: '2mm', padding: '2mm 0', breakInside: 'avoid' }}>
        <div style={{ fontSize: '8.8pt' }}>
          {bill.notes && (
            <>
              <p style={{ fontSize: '8.8pt', lineHeight: 1.4, fontWeight: 700, margin: '0 0 0.5mm' }}>Notes</p>
              <p style={{ fontSize: '8.8pt', lineHeight: 1.4, margin: 0, whiteSpace: 'pre-line' }}>{bill.notes}</p>
            </>
          )}
        </div>
        <div>
          <SumLine label="Service Total :" value={money(bill.subtotal)} />
          <SumLine label={`Discount${discountLabel ? ` (${discountLabel})` : ''} :`} value={money(discount?.amount)} />
          <SumLine label={`GST${taxLabel ? ` (${taxLabel})` : ''} :`} value={money(tax?.amount)} />
          <SumLine label="Final Amount :" value={money(bill.total)} strong />
        </div>
      </div>

      {/* Payments for this visit / admission */}
      {account && (
        <div style={{ breakInside: 'avoid' }}>
          <SectionTitle>Payments</SectionTitle>
          <p style={{ fontSize: '7.8pt', lineHeight: 1.4, color: MUTED, margin: '0 0 1mm', textAlign: 'center' }}>
            All payments for this {visitType === 'inpatient' ? 'admission' : 'visit'}
            {encounter ? ` (from ${fmtDate(encounter.startedAt)})` : ''}, as on {fmtDateTime(now)}
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: '9mm' }}>S.No</th>
                <th style={th}>Type</th>
                <th style={th}>Date</th>
                <th style={th}>Receipt no</th>
                <th style={th}>Category</th>
                <th style={th}>Mode</th>
                <th style={th}>Note</th>
                <th style={th}>Payment Details</th>
                <th style={{ ...th, ...num }}>Amount(₹)</th>
              </tr>
            </thead>
            <tbody>
              {account.payments.map((p, i) => (
                <tr key={p.id} style={{ breakInside: 'avoid' }}>
                  <td style={td}>{i + 1}</td>
                  <td style={td}>{p.method === 'advance' ? 'Advance' : 'Payment'}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap', fontSize: '7.8pt' }}>{fmtDateTime(p.date || p.createdAt)}</td>
                  <td style={{ ...td, fontSize: '7.4pt', whiteSpace: 'nowrap' }}>{receiptNumberOf(p)}</td>
                  <td style={td}>{visitType === 'inpatient' ? 'IPD' : 'OPD'}</td>
                  <td style={td}>{METHOD_LABELS[p.method] || p.method}</td>
                  <td style={{ ...td, wordBreak: 'break-word' }}>{p.remarks || '-'}</td>
                  <td style={{ ...td, wordBreak: 'break-word' }}>{p.reference || '-'}</td>
                  <td style={{ ...td, ...num }}>{plain(p.amount)}</td>
                </tr>
              ))}
              {account.payments.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ ...td, textAlign: 'center', color: MUTED, padding: '3mm' }}>No payments yet</td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: `1.2px solid ${LINE}`, marginTop: '1mm', paddingTop: '1.5mm' }}>
            <div style={{ width: '72mm' }}>
              <SumLine label="Paid Amount :" value={money(account.totalPayments)} strong />
              <SumLine label="Cash Due :" value={money(cashDue)} />
              <SumLine label="Credit Due :" value={money(creditDue)} />
              <SumLine label="Refundable Amount :" value={money(refundable)} />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '6mm', breakInside: 'avoid' }}>
        <p style={{ fontSize: '8.8pt', lineHeight: 1.4, margin: '0 0 2.5mm', fontWeight: 600 }}>
          Discount Authority : <span style={{ display: 'inline-block', minWidth: '45mm', borderBottom: `1px solid ${LINE}` }}>&nbsp;</span>
        </p>
        <p style={{ fontSize: '8.8pt', lineHeight: 1.4, margin: '0 0 3mm', fontWeight: 600 }}>Amount in word :- {rupeesInWords(bill.total)}</p>
        <div style={{ color: MUTED }}>
          {bill.createdByName && <p style={footerLine}>Billed By : {bill.createdByName}</p>}
          <p style={footerLine}>Printed By : {printedBy || '-'}</p>
          <p style={footerLine}>Print Time : {fmtDateTime(now)}</p>
        </div>
        {(hospital.footerLines || []).length > 0 && (
          <p style={{ margin: '4mm 0 0', textAlign: 'center', fontSize: '8pt', lineHeight: 1.4, color: MUTED }}>{hospital.footerLines.join(' · ')}</p>
        )}
      </div>
    </div>
  );
};

export default InvoiceDocument;
