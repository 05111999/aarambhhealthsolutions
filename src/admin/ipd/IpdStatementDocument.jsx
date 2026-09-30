import React from 'react';
import { formatMoney } from '../billing/money';
import { rupeesInWords } from '../billing/amountInWords';
import { receiptNumberOf } from '../billing/receiptService';
import { INK, PRIMARY, MUTED, TOTAL_RED, fmtDate } from '../bills/documentStyle';
import { BrandMark } from '../bills/DocumentFrame';
import { balanceLabel, chargeTitle, effectiveDay } from './ipdMath';

const METHOD_LABELS = {
  cash: 'Cash', card: 'Card', upi: 'UPI', bankTransfer: 'Bank Transfer', cheque: 'Cheque', advance: 'Advance', other: 'Other',
};

const cell = { border: `1px solid ${INK}55`, padding: '1.8mm 2.5mm', verticalAlign: 'top' };
const headCell = { ...cell, background: PRIMARY, color: '#fff', border: `1px solid ${PRIMARY}`, fontWeight: 600, textTransform: 'uppercase', fontSize: '8.5pt' };
const right = { textAlign: 'right', whiteSpace: 'nowrap' };
const dayText = (key) => fmtDate(key);

const Field = ({ label, value }) => (
  <div style={{ display: 'flex', gap: '2mm', fontSize: '9.5pt', padding: '0.6mm 0' }}>
    <span style={{ color: MUTED, minWidth: '34mm' }}>{label}</span>
    <span style={{ fontWeight: 600 }}>{value || '—'}</span>
  </div>
);

// A4 inpatient running bill / discharge bill. Flows over as many pages as needed
// (printed on the "statement" page, which has top/bottom margins; table headings repeat).
// data: { hospital, logo, patient, admission, period, statement, isFinal, preparedBy }
const IpdStatementDocument = ({ data }) => {
  const { hospital = {}, logo, patient, admission, period, statement, isFinal, preparedBy } = data;
  const { days, payments, opening, totalCharges, totalPayments, balance } = statement;
  const closing = balanceLabel(balance);
  let serial = 0;

  return (
    <div className="ipd-statement" style={{ width: '210mm', background: '#fff', color: INK, fontFamily: 'inherit', fontSize: '10pt' }}>
      <div style={{ height: '6mm', background: PRIMARY }} />
      <div style={{ padding: '7mm 14mm 10mm' }}>
        {/* Hospital header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8mm', borderBottom: `2px solid ${PRIMARY}`, paddingBottom: '4mm' }}>
          <div>
            <p style={{ fontSize: '17pt', fontWeight: 700, color: PRIMARY, margin: 0, textTransform: 'uppercase', lineHeight: 1.15 }}>{hospital.name}</p>
            <p style={{ fontSize: '8.5pt', color: MUTED, margin: '1.5mm 0 0' }}>
              {[hospital.addressLine1, hospital.addressLine2].filter(Boolean).join(', ')}
            </p>
            <p style={{ fontSize: '8.5pt', color: MUTED, margin: 0 }}>{[hospital.phone, hospital.email, hospital.website].filter(Boolean).join(' · ')}</p>
          </div>
          <BrandMark logo={logo} size="18mm" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '5mm' }}>
          <h1 style={{ fontSize: '16pt', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {isFinal ? 'Final Discharge Bill' : 'IPD Running Bill — Interim Statement'}
          </h1>
          <span style={{ fontSize: '9pt', color: MUTED }}>In INR</span>
        </div>

        {/* Patient / admission */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '10mm', marginTop: '4mm', border: `1px solid ${INK}55`, padding: '3mm 4mm' }}>
          <div>
            <Field label="Patient Name" value={patient.name} />
            <Field label="UHID / Patient ID" value={patient.patientCode} />
            <Field label="IPD Bill / Adm. No." value={admission.admissionNumber} />
            <Field label="Treating Doctor" value={admission.treatingDoctor} />
            <Field label="Ward · Room / Bed" value={[admission.ward, admission.roomBed].filter(Boolean).join(' · ')} />
          </div>
          <div>
            <Field label="Admission Date" value={fmtDate(admission.startedAt)} />
            <Field label="Discharge Date" value={admission.closedAt ? fmtDate(admission.closedAt) : `Not discharged${admission.expectedDischargeDate ? ` (expected ${fmtDate(admission.expectedDischargeDate)})` : ''}`} />
            <Field label="Length of Stay" value={`${admission.lengthOfStay} day${admission.lengthOfStay === 1 ? '' : 's'}`} />
            <Field label="Bill Period" value={`${dayText(period.from)} to ${dayText(period.to)}`} />
            <Field label="Bill Date" value={fmtDate(new Date())} />
          </div>
        </div>

        {/* Charges */}
        <p style={{ color: PRIMARY, fontSize: '11pt', fontWeight: 700, margin: '6mm 0 2mm', textTransform: 'uppercase' }}>Bill Summary — Services &amp; Charges</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...headCell, width: '9mm' }}>S.No</th>
              <th style={{ ...headCell, width: '22mm' }}>Date</th>
              <th style={{ ...headCell, width: '43mm' }}>Bill / Charge No.</th>
              <th style={{ ...headCell, textAlign: 'left' }}>Service</th>
              <th style={{ ...headCell, width: '28mm', ...right }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <React.Fragment key={day.key}>
                {day.charges.map((c) => {
                  serial += 1;
                  return (
                    <tr key={c.id} style={{ breakInside: 'avoid' }}>
                      <td style={{ ...cell, textAlign: 'center' }}>{serial}</td>
                      <td style={cell}>{dayText(effectiveDay(c))}</td>
                      <td style={{ ...cell, fontSize: '8pt', whiteSpace: 'nowrap' }}>{c.chargeNumber || c.billNumber || '—'}</td>
                      <td style={cell}>
                        <span style={{ fontWeight: 600 }}>{chargeTitle(c)}</span>
                        {c.category && c.category !== chargeTitle(c) && <span style={{ color: MUTED }}> · {c.category}</span>}
                        {c.description && <span style={{ color: MUTED }}> — {c.description}</span>}
                        {c.quantity > 1 && <span style={{ color: MUTED }}> ({c.quantity} × {formatMoney(c.rate)})</span>}
                        {c.items?.length > 0 && <span style={{ color: MUTED }}> — {c.items.map((i) => i.name).join(', ')}</span>}
                      </td>
                      <td style={{ ...cell, ...right }}>{formatMoney(c.netAmount)}</td>
                    </tr>
                  );
                })}
                <tr style={{ breakInside: 'avoid' }}>
                  <td colSpan={4} style={{ ...cell, ...right, color: MUTED, fontSize: '8.5pt', background: '#F4F8FB' }}>Daily total — {dayText(day.key)}</td>
                  <td style={{ ...cell, ...right, fontWeight: 600, background: '#F4F8FB' }}>{formatMoney(day.total)}</td>
                </tr>
              </React.Fragment>
            ))}
            {days.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...cell, textAlign: 'center', color: MUTED }}>No charges in this period</td>
              </tr>
            )}
            <tr style={{ breakInside: 'avoid' }}>
              <td colSpan={4} style={{ ...cell, ...right, fontWeight: 700 }}>Total Service Amount</td>
              <td style={{ ...cell, ...right, fontWeight: 700 }}>{formatMoney(totalCharges)}</td>
            </tr>
          </tbody>
        </table>

        {/* Payments */}
        <p style={{ color: PRIMARY, fontSize: '11pt', fontWeight: 700, margin: '6mm 0 2mm', textTransform: 'uppercase' }}>Payments Received</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...headCell, width: '9mm' }}>S.No</th>
              <th style={{ ...headCell, width: '22mm' }}>Date</th>
              <th style={{ ...headCell, width: '40mm' }}>Receipt No.</th>
              <th style={{ ...headCell, width: '26mm', textAlign: 'left' }}>Mode</th>
              <th style={{ ...headCell, textAlign: 'left' }}>Remarks</th>
              <th style={{ ...headCell, width: '28mm', ...right }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, i) => (
              <tr key={p.id} style={{ breakInside: 'avoid' }}>
                <td style={{ ...cell, textAlign: 'center' }}>{i + 1}</td>
                <td style={cell}>{dayText(effectiveDay(p))}</td>
                <td style={{ ...cell, fontSize: '8pt', whiteSpace: 'nowrap' }}>{receiptNumberOf(p)}</td>
                <td style={cell}>{METHOD_LABELS[p.method] || p.method}</td>
                <td style={cell}>{[p.remarks, p.reference].filter(Boolean).join(' · ') || (p.method === 'advance' ? 'Advance at admission' : '—')}</td>
                <td style={{ ...cell, ...right }}>{formatMoney(p.amount)}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...cell, textAlign: 'center', color: MUTED }}>No payments in this period</td>
              </tr>
            )}
            <tr style={{ breakInside: 'avoid' }}>
              <td colSpan={5} style={{ ...cell, ...right, fontWeight: 700 }}>Total Amount Received</td>
              <td style={{ ...cell, ...right, fontWeight: 700 }}>{formatMoney(totalPayments)}</td>
            </tr>
          </tbody>
        </table>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80mm', gap: '8mm', marginTop: '6mm', breakInside: 'avoid' }}>
          <div style={{ border: `1px solid ${INK}55`, padding: '3mm 4mm', fontSize: '9.5pt' }}>
            <p style={{ color: PRIMARY, fontWeight: 600, margin: '0 0 1.5mm' }}>Total amount in words</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{rupeesInWords(totalCharges)}</p>
            {closing.amount > 0 && (
              <p style={{ margin: '2mm 0 0', color: MUTED }}>
                {closing.label}: {rupeesInWords(closing.amount)}
              </p>
            )}
          </div>
          <div style={{ fontSize: '10pt', fontWeight: 600 }}>
            {opening !== 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8mm 0' }}>
                <span>Brought forward ({opening < 0 ? 'due' : 'credit'})</span>
                <span>{formatMoney(Math.abs(opening))}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8mm 0' }}>
              <span>Total Amount</span>
              <span>{formatMoney(totalCharges)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8mm 0' }}>
              <span>Total Amount Received</span>
              <span>{formatMoney(totalPayments)}</span>
            </div>
            <div
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `1px solid ${INK}99`, marginTop: '2mm', paddingTop: '2mm',
                color: closing.tone === 'due' ? TOTAL_RED : closing.tone === 'credit' ? '#0F766E' : INK, fontSize: '12.5pt', fontWeight: 700,
              }}
            >
              <span>{closing.label}</span>
              <span>{formatMoney(closing.amount)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10mm', fontSize: '8.5pt', color: MUTED, breakInside: 'avoid' }}>
          <div>
            {(hospital.footerLines || []).map((line) => (
              <p key={line} style={{ margin: 0, color: PRIMARY, fontSize: '9.5pt' }}>{line}</p>
            ))}
            <p style={{ margin: '2mm 0 0' }}>{preparedBy ? `Prepared by ${preparedBy} · ` : ''}This is a computer-generated statement.</p>
          </div>
          <div style={{ textAlign: 'center', minWidth: '50mm' }}>
            <div style={{ borderTop: `1px solid ${INK}88`, paddingTop: '1.5mm' }}>Authorised Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IpdStatementDocument;
