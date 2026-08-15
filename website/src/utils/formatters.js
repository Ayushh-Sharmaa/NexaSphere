/**
 * Presentation helpers for numbers, sizes and short text.
 *
 * Consolidates the ad hoc `.toFixed`, `Math.round` and slice logic scattered
 * across dashboard and portfolio components into deterministic, tested
 * functions. All helpers are locale-aware where it makes sense and fail
 * gracefully on missing/invalid input.
 */

/**
 * Formats a number with thousand separators and fixed decimals.
 *
 * @param {number|string} value - Number to format.
 * @param {number} [decimals=0] - Decimal places to keep.
 * @returns {string} Formatted number, or the original value when unparseable.
 */
export function formatNumber(value, decimals = 0) {
  if (value == null || value === '') return '';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value ?? '');
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a value as currency using the given locale/currency.
 *
 * @param {number|string} value - Amount to format.
 * @param {object} [options] - Options.
 * @param {string} [options.locale] - Locale (defaults to the runtime locale).
 * @param {string} [options.currency='INR'] - ISO 4217 currency code.
 * @param {number} [options.decimals=0] - Decimal places.
 * @returns {string} Formatted currency string.
 */
export function formatCurrency(value, { locale = 'en-US', currency = 'INR', decimals = 0 } = {}) {
  if (value == null || value === '') return '';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value ?? '');
  return num.toLocaleString(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a ratio as a percentage with a fixed number of decimals.
 *
 * @param {number|string} value - Ratio (0-1) or already-scaled percentage.
 * @param {object} [options] - Options.
 * @param {number} [options.decimals=0] - Decimal places.
 * @param {boolean} [options.isScaled=false] - When `true`, `value` is already
 *   out of 100 and is not multiplied.
 * @returns {string} Percentage string, e.g. `42%`.
 */
export function formatPercent(value, { decimals = 0, isScaled = false } = {}) {
  if (value == null || value === '') return '';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value ?? '');
  const scaled = isScaled ? num : num * 100;
  return `${scaled.toFixed(decimals)}%`;
}

/**
 * Formats a byte count into a human-readable string.
 *
 * @param {number|string} bytes - Byte count.
 * @param {number} [decimals=1] - Decimal places for partial units.
 * @returns {string} E.g. `1.5 MB`.
 */
export function formatBytes(bytes, decimals = 1) {
  if (bytes == null || bytes === '') return '0 B';
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return '0 B';
  if (value === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const amount = value / 1024 ** index;
  const rendered = amount.toFixed(decimals).replace(/\.0+$/, '');
  return `${rendered} ${units[index]}`;
}

/**
 * Returns `singular` or `plural` based on the count.
 *
 * @param {number} count - The value to test against.
 * @param {string} singular - Singular form, e.g. `'attendee'`.
 * @param {string} [plural] - Plural form; defaults to `singular + 's'`.
 * @returns {string} The correctly inflected form.
 */
export function pluralize(count, singular, plural) {
  const n = Number(count) || 0;
  return n === 1 ? singular : plural || `${singular}s`;
}

/**
 * Truncates a string to `max` characters, appending an ellipsis when cut.
 *
 * @param {string} value - Text to truncate.
 * @param {number} max - Maximum length including the ellipsis.
 * @param {string} [suffix='...'] - Ellipsis to append.
 * @returns {string} Truncated string.
 */
export function truncate(value, max, suffix = '...') {
  if (typeof value !== 'string') return '';
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - suffix.length)).trimEnd()}${suffix}`;
}

/**
 * Returns the ordinal suffix for a number (`1st`, `2nd`, `3rd`, `4th`...).
 *
 * @param {number|string} value - Number to make ordinal.
 * @returns {string} Ordinal string.
 */
export function ordinal(value) {
  const n = Math.abs(Number(value));
  if (!Number.isFinite(n)) return String(value ?? '');
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/**
 * Abbreviates large numbers (`1200` -> `1.2K`, `3400000` -> `3.4M`).
 *
 * @param {number|string} value - Number to abbreviate.
 * @param {number} [decimals=1] - Decimal places for the unit part.
 * @returns {string} Abbreviated number.
 */
export function formatCompact(value, decimals = 1) {
  if (value == null || value === '') return '';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value ?? '');
  if (Math.abs(num) < 1000) return String(Math.round(num));
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: decimals,
  }).format(num);
}

export default {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatBytes,
  pluralize,
  truncate,
  ordinal,
  formatCompact,
};
