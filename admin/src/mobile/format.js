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

// Mirrors App.jsx's isYes (module-scope there, not exported).
export const isYes = (val) => typeof val === 'string' && val.trim().toLowerCase().startsWith('yes');

// Mirrors App.jsx's fmtAadhaar (module-scope there, not exported).
export const fmtAadhaar = (n) => {
  const digits = (n || '').toString().replace(/\D/g, '');
  if (digits.length !== 12) return digits || '—';
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
};
