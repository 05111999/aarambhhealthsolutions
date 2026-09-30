import React from 'react';
import { formatMoney } from './money';
import { rupeesInWords } from './amountInWords';
import { INK, PRIMARY, MUTED, fmtDate } from '../bills/documentStyle';
import DocumentFrame, { Label, Line } from '../bills/DocumentFrame';

const METHOD_LABELS = {
  cash: 'Cash', card: 'Card', upi: 'UPI', bankTransfer: 'Bank Transfer', cheque: 'Cheque', advance: 'Advance', other: 'Other',
};

// A4 payment receipt, on the same hospital-branded page as the medical invoice.
// receipt: { receiptNumber, date, amount, method, reference, isAdvance, receivedByName,
//            patient: { name, phone, address, patientCode }, hospital }
const ReceiptDocument = ({ receipt, logo }) => {
  const { patient = {}, hospital = {} } = receipt;
  const towards = receipt.remarks || (receipt.isAdvance ? 'Advance payment' : 'Payment towards treatment charges');

  return (
    <DocumentFrame hospital={hospital} logo={logo} title="Payment Receipt">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10mm', marginTop: '10mm' }}>
        <div>
          <Label>Received From</Label>
          <Line>{patient.name}</Line>
          <Line>{patient.phone}</Line>
          <Line>{patient.address}</Line>
          {patient.patientCode && <p style={{ fontSize: '9.5pt', margin: '1.5mm 0 0', color: MUTED }}>Patient ID: {patient.patientCode}</p>}
        </div>
        <div>
          <Label>Received By</Label>
          <Line>{hospital.name}</Line>
          <Line>{receipt.receivedByName}</Line>
        </div>
      </div>

      <div
        style={{
          display: 'grid', gridTemplateColumns: '1.7fr 1fr 1.2fr 1fr', gap: '4mm', marginTop: '9mm',
          border: `1px solid ${INK}80`, padding: '5mm 6mm',
        }}
      >
        {[
          ['Receipt Number', receipt.receiptNumber],
          ['Date', fmtDate(receipt.date)],
          ['Payment Method', METHOD_LABELS[receipt.method] || receipt.method],
          ['Amount', formatMoney(receipt.amount)],
        ].map(([label, value]) => (
          <div key={label}>
            <p style={{ color: PRIMARY, fontSize: '10pt', textTransform: 'uppercase', margin: '0 0 2.5mm', letterSpacing: '0.02em' }}>{label}</p>
            <p style={{ fontSize: '13pt', fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>{value}</p>
          </div>
        ))}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8mm', fontSize: '10pt' }}>
        <thead>
          <tr style={{ background: PRIMARY, color: '#fff' }}>
            {[['Description', '52%', 'left'], ['Reference', '24%', 'left'], ['Amount', '24%', 'center']].map(([h, w, align]) => (
              <th
                key={h}
                style={{ width: w, textAlign: align, textTransform: 'uppercase', fontWeight: 500, padding: '2.4mm 3mm', border: `1px solid ${PRIMARY}` }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: `1px solid ${INK}66`, padding: '2.2mm 3mm', fontWeight: 600 }}>{towards}</td>
            <td style={{ border: `1px solid ${INK}66`, padding: '2.2mm 3mm', fontWeight: 600 }}>{receipt.reference || '—'}</td>
            <td style={{ border: `1px solid ${INK}66`, padding: '2.2mm 3mm', fontWeight: 600, textAlign: 'center' }}>{formatMoney(receipt.amount)}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '12mm', marginTop: '8mm', alignItems: 'start' }}>
        <div style={{ border: `1px solid ${INK}80`, padding: '5mm 6mm', minHeight: '20mm' }}>
          <p style={{ color: PRIMARY, fontSize: '12pt', margin: '0 0 2.5mm' }}>Amount in words</p>
          <p style={{ fontSize: '10.5pt', fontWeight: 600, margin: 0 }}>{rupeesInWords(receipt.amount)}</p>
        </div>
        <div>
          <div style={{ borderTop: `1px solid ${INK}99`, paddingTop: '3mm', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ color: PRIMARY, fontSize: '17pt', fontWeight: 700 }}>RECEIVED</span>
            <span style={{ fontSize: '13pt', fontWeight: 700 }}>{formatMoney(receipt.amount)}</span>
          </div>
          <p style={{ fontSize: '9pt', color: MUTED, margin: '4mm 0 0' }}>This is a computer-generated receipt.</p>
        </div>
      </div>
    </DocumentFrame>
  );
};

export default ReceiptDocument;
