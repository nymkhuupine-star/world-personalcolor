export const UB_TZ = 'Asia/Ulaanbaatar';

const ubFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: UB_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Returns 'YYYY-MM-DD' in UB timezone
export function toUBDate(d: string): string {
  return ubFmt.format(new Date(d));
}

const MONTHS_MN = ['1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар', '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар'];

export function ubDayLabel(day: string): string {
  // Parse YYYY-MM-DD without timezone conversion
  const [y, m, d] = day.split('-').map(Number);
  return `${y} оны ${MONTHS_MN[m - 1]} ${d}`;
}

export function formatDate(d: string): string {
  const dt = new Date(new Date(d).toLocaleString('en-US', { timeZone: UB_TZ }));
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  const hh = String(dt.getHours()).padStart(2, '0');
  const mi = String(dt.getMinutes()).padStart(2, '0');
  return `${yy}.${mm}.${dd} ${hh}:${mi}`;
}

export function today(): string {
  return toUBDate(new Date().toISOString());
}
