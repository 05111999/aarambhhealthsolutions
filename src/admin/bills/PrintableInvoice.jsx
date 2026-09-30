import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import InvoiceDocument from './InvoiceDocument';

// A copy of the invoice mounted directly under <body>. While it's mounted, the print
// stylesheet (src/index.css, scoped by body.has-print-invoice) hides the whole app and
// prints only this — no sidebar, header, buttons or editor controls.
// `children` prints another document (e.g. a payment receipt) in place of the invoice.
// multiPage: a document that flows over several pages (printed with page margins);
// pageClass picks a different named page (e.g. 'print-bill' for the medical invoice).
const PrintableInvoice = ({ bill, logo, children, multiPage = false, pageClass = '' }) => {
  useEffect(() => {
    document.body.classList.add('has-print-invoice');
    return () => document.body.classList.remove('has-print-invoice');
  }, []);

  return createPortal(
    <div className={`print-only${multiPage ? ' print-multipage' : ''}${pageClass ? ` ${pageClass}` : ''}`}>
      {children || <InvoiceDocument bill={bill} logo={logo} />}
    </div>,
    document.body
  );
};

export default PrintableInvoice;
