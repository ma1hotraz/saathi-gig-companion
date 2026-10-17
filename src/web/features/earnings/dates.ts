/** Formats a Date as YYYY-MM-DD in the device's local time zone (not UTC). */
export function toLocalIsoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** The local date `daysAgo` days before today, as YYYY-MM-DD. */
export function isoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return toLocalIsoDate(d);
}

const rupee = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const rupee2 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

/** Formats rupees with the Indian digit grouping, e.g. ₹1,23,456. Whole rupees unless `precise`. */
export function formatRupees(n: number, precise = false): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}₹${(precise ? rupee2 : rupee).format(Math.abs(n))}`;
}
