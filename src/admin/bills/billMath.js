import { roundMoney } from '../billing/money';

// Discount and tax are each either a percentage or a fixed ₹ amount.
// total = subtotal − discount + tax, where tax applies to the discounted amount.
export function computeBill(items, discount, tax) {
  const subtotal = roundMoney(items.reduce((sum, i) => sum + roundMoney(i.price), 0));

  const discountValue = roundMoney(discount?.value);
  const rawDiscount = discount?.type === 'percent' ? (subtotal * discountValue) / 100 : discountValue;
  const discountAmount = roundMoney(Math.min(Math.max(rawDiscount, 0), subtotal));

  const taxable = roundMoney(subtotal - discountAmount);
  const taxValue = roundMoney(tax?.value);
  const rawTax = tax?.type === 'percent' ? (taxable * taxValue) / 100 : taxValue;
  const taxAmount = roundMoney(Math.max(rawTax, 0));

  const total = roundMoney(taxable + taxAmount);
  return { subtotal, discountAmount, taxAmount, total };
}

// How the discount/tax line reads on the invoice, e.g. "10%" or "₹200.00".
export function adjustmentLabel(adjustment, formatMoney) {
  if (!adjustment || !Number(adjustment.value)) return null;
  return adjustment.type === 'percent' ? `${Number(adjustment.value)}%` : formatMoney(adjustment.value);
}
