/**
 * Date mathematics and calendar helpers.
 *
 * Complements `formatRelativeTime.js` (relative labels) with the day/week
 * arithmetic the events calendar, attendance grid and analytics dashboards
 * need. All functions accept a `Date`, timestamp or ISO string and normalise
 * through `toDate`, returning `null` for anything unparseable instead of
 * throwing on an invalid `Date`.
 */

/**
 * Coerces a value into a valid Date, or `null` when it cannot be parsed.
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
 * Returns a new Date with `days` added (negative values subtract).
 *
 * @param {Date|string|number} value - Base date.
 * @param {number} days - Days to add.
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
 * Returns a new Date at 00:00:00.000 for the given day.
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
 * Returns a new Date at 23:59:59.999 for the given day.
 *
 * @param {Date|string|number} value - Reference date.
 * @returns {Date|null} End of day.
 */
export function endOfDay(value) {
  const date = toDate(value);
  if (!date) return null;
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

/**
 * Whether a date falls on today's calendar day.
 *
 * @param {Date|string|number} value - Date to test.
 * @returns {boolean} True when it is today.
 */
export function isToday(value) {
  const date = toDate(value);
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/**
 * Whether a date is strictly before now.
 *
 * @param {Date|string|number} value - Date to test.
 * @returns {boolean} True when the date is in the past.
 */
export function isPast(value) {
  const date = toDate(value);
  if (!date) return false;
  return date.getTime() < Date.now();
}

/**
 * Whether a date is strictly after now.
 *
 * @param {Date|string|number} value - Date to test.
 * @returns {boolean} True when the date is in the future.
 */
export function isFuture(value) {
  const date = toDate(value);
  if (!date) return false;
  return date.getTime() > Date.now();
}

/**
 * Whether a date falls within `days` days of today (inclusive).
 *
 * @param {Date|string|number} value - Date to test.
 * @param {number} days - Window size in days.
 * @returns {boolean} True when within the window.
 */
export function isWithinDays(value, days) {
  const date = toDate(value);
  if (!date) return false;
  const now = startOfDay(new Date());
  const target = startOfDay(date);
  if (!now || !target) return false;
  const diff = Math.abs(target.getTime() - now.getTime());
  return diff <= days * 24 * 60 * 60 * 1000;
}

/**
 * Whole days between two dates (positive when `from` precedes `to`).
 *
 * @param {Date|string|number} from - Earlier date.
 * @param {Date|string|number} to - Later date.
 * @returns {number|null} Day difference or `null` on invalid input.
 */
export function daysBetween(from, to) {
  const fromDate = startOfDay(from);
  const toDateVal = startOfDay(to);
  if (!fromDate || !toDateVal) return null;
  return Math.round((toDateVal.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Formats a date range as a human string, collapsing same-day ranges.
 *
 * @param {Date|string|number} start - Range start.
 * @param {Date|string|number} end - Range end.
 * @param {object} [options] - Options.
 * @param {string} [options.locale] - Locale for the formatter.
 * @param {object} [options.dateStyle={day:'numeric', month:'short'}] - Style.
 * @returns {string|null} E.g. `12 Aug – 14 Aug` or `12 Aug`.
 */
export function formatDateRange(start, end, { locale, dateStyle = { day: 'numeric', month: 'short' } } = {}) {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate) return null;
  const fmt = (d) => d.toLocaleDateString(locale, dateStyle);
  if (!endDate || startOfDay(startDate).getTime() === startOfDay(endDate).getTime()) {
    return fmt(startDate);
  }
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

/**
 * Formats a date for API/URL payloads as `YYYY-MM-DD`.
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
  addDays,
  startOfDay,
  endOfDay,
  isToday,
  isPast,
  isFuture,
  isWithinDays,
  daysBetween,
  formatDateRange,
  toISODate,
};
