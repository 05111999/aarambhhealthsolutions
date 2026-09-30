import React from 'react';
import { Heart } from 'lucide-react';
import { INK, PRIMARY, MUTED } from './documentStyle';

// The A4 page every printed document shares: faded hospital watermark, blue top bar,
// title, and the hospital's footer (service lines, contact, logo, name, website).
// The hospital brands the whole page.

export const Label = ({ children }) => (
  <p style={{ color: PRIMARY, fontSize: '12pt', fontWeight: 600, margin: '0 0 2.5mm' }}>{children}</p>
);

export const Line = ({ children }) =>
  children ? <p style={{ fontSize: '10.5pt', fontWeight: 600, margin: '0 0 1mm', lineHeight: 1.35 }}>{children}</p> : null;

export const BrandMark = ({ logo, size }) =>
  logo ? (
    <img src={logo} alt="" style={{ height: size, width: 'auto', objectFit: 'contain' }} />
  ) : (
    <Heart style={{ width: size, height: size, color: PRIMARY }} strokeWidth={1.5} />
  );

const DocumentFrame = ({ hospital = {}, logo, title, children }) => (
  <div
    className="invoice-document"
    style={{ width: '210mm', minHeight: '297mm', position: 'relative', background: '#fff', color: INK, overflow: 'hidden', fontFamily: 'inherit' }}
  >
    {/* Watermark — a real (faded) element, not a background image, so it prints reliably. */}
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.06, pointerEvents: 'none' }}
    >
      <BrandMark logo={logo} size="120mm" />
    </div>

    <div style={{ height: '9mm', background: PRIMARY }} />

    <div style={{ position: 'relative', padding: '11mm 16mm 46mm' }}>
      <h1 style={{ fontSize: '28pt', fontWeight: 700, color: INK, margin: 0, lineHeight: 1.1 }}>{title}</h1>
      {children}
    </div>

    <div
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0 16mm 12mm',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8mm',
      }}
    >
      <div style={{ color: PRIMARY, fontSize: '11.5pt', lineHeight: 1.35 }}>
        {(hospital.footerLines || []).map((line) => (
          <p key={line} style={{ margin: 0 }}>{line}</p>
        ))}
        {(hospital.addressLine1 || hospital.phone || hospital.email) && (
          <p style={{ margin: '2mm 0 0', fontSize: '8.5pt', color: MUTED }}>
            {[hospital.addressLine1, hospital.addressLine2, hospital.phone, hospital.email].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4mm', flexShrink: 0 }}>
        <BrandMark logo={logo} size="16mm" />
        <div>
          <p style={{ color: PRIMARY, fontSize: '15pt', fontWeight: 700, margin: 0, textTransform: 'uppercase', lineHeight: 1.1, maxWidth: '75mm' }}>
            {hospital.name}
          </p>
          {hospital.website && <p style={{ color: PRIMARY, fontSize: '9pt', fontWeight: 600, margin: '1mm 0 0', textTransform: 'uppercase' }}>{hospital.website}</p>}
        </div>
      </div>
    </div>
  </div>
);

export default DocumentFrame;
