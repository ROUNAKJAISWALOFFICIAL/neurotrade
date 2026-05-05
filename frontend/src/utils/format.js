export function fmtPrice(n) {
  if (n === undefined || n === null) return '—';
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtPct(n, decimals = 2) {
  if (n === undefined || n === null) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${Number(n).toFixed(decimals)}%`;
}

export function fmtChange(n) {
  const sign = n >= 0 ? '+' : '';
  return `${sign}₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtINR(n) {
  if (!n && n !== 0) return '—';
  const abs = Math.abs(n);
  let str;
  if (abs >= 1e7) str = (abs / 1e7).toFixed(2) + ' Cr';
  else if (abs >= 1e5) str = (abs / 1e5).toFixed(2) + ' L';
  else str = abs.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  return (n < 0 ? '-' : '') + '₹' + str;
}

export function fmtVol(n) {
  if (!n) return '—';
  if (n >= 1e7) return (n / 1e7).toFixed(1) + 'Cr';
  if (n >= 1e5) return (n / 1e5).toFixed(1) + 'L';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

export function fmtTime(date) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function fmtDate(date) {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}
