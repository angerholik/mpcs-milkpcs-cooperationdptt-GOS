const monthMap = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatToIsoDate(displayStr) {
  if (!displayStr) return '';
  if (displayStr.includes('-') && displayStr.length === 10) return displayStr;
  const parts = displayStr.trim().split(' ');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = monthMap[parts[1]] || '01';
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return '';
}

export function formatFromIsoDate(isoStr) {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monthName = monthNames[monthIdx] || 'Jan';
    return `${day} ${monthName} ${year}`;
  }
  return isoStr;
}

export function deriveFinancialYear(dateStr) {
  if (!dateStr) return '';
  let year, month;
  if (dateStr.includes('-') && dateStr.length === 10) {
    const parts = dateStr.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  } else {
    const parts = dateStr.trim().split(' ');
    if (parts.length === 3) {
      year = parseInt(parts[2], 10);
      month = parseInt(monthMap[parts[1]] || '01', 10);
    } else {
      return '';
    }
  }

  if (isNaN(year) || isNaN(month)) return '';

  if (month >= 4) {
    return `${year} - ${year + 1}`;
  } else {
    return `${year - 1} - ${year}`;
  }
}

