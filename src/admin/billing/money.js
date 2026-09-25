// Rounds to 2 decimals at each step to avoid floating-point drift accumulating across
// a chain of computations (price - discount = net, sum of many transactions, etc).
export function roundMoney(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function formatMoney(n) {
  const value = roundMoney(n);
  const sign = value < 0 ? '-' : '';
  return `${sign}₹${Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
