/**
 * Admin dashboard date helpers.
 *
 * The dashboard slices registrations and check-ins by day/week/range, groups
 * them for trend charts, and displays timestamps in tables. These helpers
 * standardise bucket generation and formatting so chart x-axes and table
 * cells agree on labels.
 */

/**
 * Coerces a value into a valid Date or `null`.
 *
 * @param {Date|string|number|null|undefined} value - Value to coerce.
 * @returns {Date|null} Valid date or `null`.
 */
export function toDate(value) {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Start of day (00:00:00.000).
 *
 * @param {Date|string|number} value - Reference date.
 * @returns {Date|null} Start of day.
 */
export function startOfDay(value) {
  const date = toDate(value);
  if (!date) return null;
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Start of the ISO week (Monday 00:00) for the given date.
 *
 * @param {Date|string|number} value - Reference date.
 * @returns {Date|null} Start of week.
 */
export function startOfWeek(value) {
  const date = startOfDay(value);
  if (!date) return null;
  const dow = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - dow);
  return date;
}

/**
 * Start of the month (1st, 00:00) for the given date.
 *
 * @param {Date|string|number} value - Reference date.
 * @returns {Date|null} Start of month.
 */
export function startOfMonth(value) {
  const date = toDate(value);
  if (!date) return null;
  const copy = new Date(date.getFullYear(), date.getMonth(), 1);
  return copy;
}

/**
 * Adds a number of days to a date, returning a new Date.
 *
 * @param {Date|string|number} value - Base date.
 * @param {number} days - Days to add (may be negative).
 * @returns {Date|null} Resulting date.
 */
export function addDays(value, days) {
  const date = toDate(value);
  if (!date) return null;
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Difference between two dates in whole days (`from` - `to` convention:
 * positive when `from` is before `to`).
 *
 * @param {Date|string|number} from - Earlier date.
 * @param {Date|string|number} to - Later date.
 * @returns {number|null} Day difference.
 */
export function daysBetween(from, to) {
  const fromDate = startOfDay(from);
  const toDateVal = startOfDay(to);
  if (!fromDate || !toDateVal) return null;
  return Math.round((toDateVal.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Returns an array of day-buckets (start-of-day Dates) covering
 * `from`..`to` inclusive.
 *
 * @param {Date|string|number} from - Range start.
 * @param {Date|string|number} to - Range end (inclusive).
 * @returns {Date[]} One Date per day.
 */
export function dayBuckets(from, to) {
  const start = startOfDay(from);
  const end = startOfDay(to);
  if (!start || !end) return [];
  const days = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/**
 * Formats a date for table cells / chart axis labels.
 *
 * @param {Date|string|number} value - Date to format.
 * @param {object} [options] - Options.
 * @param {string} [options.locale] - Locale.
 * @param {object} [options.style={day:'numeric', month:'short', year:'numeric'}] - Style.
 * @returns {string|null} Formatted date.
 */
export function formatDate(value, { locale, style = { day: 'numeric', month: 'short', year: 'numeric' } } = {}) {
  const date = toDate(value);
  if (!date) return null;
  return date.toLocaleDateString(locale, style);
}

/**
 * Formats a date as `YYYY-MM-DD` for query params and inputs.
 *
 * @param {Date|string|number} value - Date to format.
 * @returns {string|null} ISO calendar date.
 */
export function toISODate(value) {
  const date = toDate(value);
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default {
  toDate,
  startOfDay,
  startOfWeek,
  startOfMonth,
  addDays,
  daysBetween,
  dayBuckets,
  formatDate,
  toISODate,
};
