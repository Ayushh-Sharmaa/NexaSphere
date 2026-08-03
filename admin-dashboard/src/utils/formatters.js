/**
 * Admin dashboard formatting helpers.
 *
 * The dashboard renders registration counts, revenue, feedback percentages
 * and storage figures across LiveMetricsCards, AnalyticsDashboard and the
 * financial tables. These helpers keep those numbers consistent and readable
 * without scattering `.toLocaleString`/`.toFixed` calls (and inconsistent
 * fallbacks) through every widget.
 */

/**
 * Formats a number with thousands separators.
 *
 * @param {number|string} value - Number to format.
 * @param {number} [decimals=0] - Decimal places.
 * @returns {string} Formatted number or the raw value when unparseable.
 */
export function formatNumber(value, decimals = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value ?? '');
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a value as currency (defaults to INR).
 *
 * @param {number|string} value - Amount to format.
 * @param {object} [options] - Options.
 * @param {string} [options.currency='INR'] - ISO 4217 code.
 * @param {number} [options.decimals=0] - Decimal places.
 * @returns {string} Currency string.
 */
export function formatCurrency(value, { currency = 'INR', decimals = 0 } = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value ?? '');
  return num.toLocaleString(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a ratio as a percentage.
 *
 * @param {number|string} value - Ratio (0-1) or pre-scaled percentage.
 * @param {object} [options] - Options.
 * @param {number} [options.decimals=1] - Decimal places.
 * @param {boolean} [options.isScaled=false] - True when `value` is out of 100.
 * @returns {string} E.g. `62.5%`.
 */
export function formatPercent(value, { decimals = 1, isScaled = false } = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value ?? '');
  const scaled = isScaled ? num : num * 100;
  return `${scaled.toFixed(decimals)}%`;
}

/**
 * Formats a byte count into a human-readable string.
 *
 * @param {number|string} bytes - Byte count.
 * @param {number} [decimals=1] - Decimals for partial units.
 * @returns {string} E.g. `1.5 MB`.
 */
export function formatBytes(bytes, decimals = 1) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return '0 B';
  if (value === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const amount = value / 1024 ** index;
  return `${amount.toFixed(decimals).replace(/\.0+$/, '')} ${units[index]}`;
}

/**
 * Abbreviates large numbers for compact widgets (`1234` -> `1.2K`).
 *
 * @param {number|string} value - Number to abbreviate.
 * @param {number} [decimals=1] - Decimals for the unit part.
 * @returns {string} Compact number.
 */
export function formatCompact(value, decimals = 1) {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value ?? '');
  if (Math.abs(num) < 1000) return String(Math.round(num));
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Pads a single-digit number with a leading zero.
 *
 * @param {number|string} value - Number to pad.
 * @returns {string} Two-character string.
 */
export function pad2(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '00';
  return String(Math.trunc(Math.abs(num))).padStart(2, '0');
}

/**
 * Renders a signed percentage with an explicit plus/minus sign, used for
 * trend deltas in metric cards.
 *
 * @param {number|string} value - Delta in percent points.
 * @param {object} [options] - Options.
 * @param {boolean} [options.showZero=true] - Render `0%` when the delta is 0.
 * @returns {string} E.g. `+12.4%`, `-3.0%`.
 */
export function formatSignedPercent(value, { showZero = true } = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value ?? '');
  if (num === 0 && !showZero) return '';
  const sign = num > 0 ? '+' : num < 0 ? '-' : '';
  return `${sign}${formatPercent(Math.abs(num), { isScaled: true })}`;
}

export default {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatBytes,
  formatCompact,
  pad2,
  formatSignedPercent,
};
