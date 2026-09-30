import React, { useLayoutEffect, useRef, useState } from 'react';
import InvoiceDocument from './InvoiceDocument';

const A4_WIDTH_PX = 794; // 210mm at 96dpi
const A4_HEIGHT_PX = 1123; // 297mm

// Shows the full-size A4 invoice shrunk to fit the available width on screen.
// Printing never uses this — it prints the unscaled copy from PrintableInvoice.
// `children` shows another A4 document (e.g. a payment receipt) in place of the invoice.
// autoHeight: the document is longer than one page, so the frame follows its height.
const ScaledInvoice = ({ bill, logo, maxScale = 1, children, autoHeight = false }) => {
  const ref = useRef(null);
  const [scale, setScale] = useState(0.6);
  const innerRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(A4_HEIGHT_PX);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => {
      setScale(Math.min(maxScale, el.clientWidth / A4_WIDTH_PX));
      if (autoHeight && innerRef.current) setContentHeight(Math.max(A4_HEIGHT_PX, innerRef.current.offsetHeight));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (innerRef.current) observer.observe(innerRef.current);
    return () => observer.disconnect();
  }, [maxScale, autoHeight]);

  return (
    <div ref={ref} className="w-full">
      <div
        className="mx-auto shadow-xl shadow-text-dark/10 rounded-sm overflow-hidden border border-border"
        style={{ width: A4_WIDTH_PX * scale, height: (autoHeight ? contentHeight : A4_HEIGHT_PX) * scale }}
      >
        <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: A4_WIDTH_PX }}>
          {children || <InvoiceDocument bill={bill} logo={logo} />}
        </div>
      </div>
    </div>
  );
};

export default ScaledInvoice;
