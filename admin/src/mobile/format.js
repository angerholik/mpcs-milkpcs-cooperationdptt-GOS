// Mirrors admin/src/App.jsx's fmtL/fmtRs (not exported there) so the mobile
// screens don't need App.jsx touched just to share two formatters.
export const fmtL = (n) => {
  if (n == null || n === '' || n === '—') return '—';
  const num = Number(n.toString().replace(/,/g, '').trim());
  return isNaN(num) ? '—' : `${num.toLocaleString('en-IN')} L`;
};

export const fmtRs = (n) => {
  if (n == null || n === '' || n === '—') return '—';
  const num = Number(n.toString().replace(/,/g, '').trim());
  return isNaN(num) ? '—' : `₹ ${num.toLocaleString('en-IN')}`;
};
