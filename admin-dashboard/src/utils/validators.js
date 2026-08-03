/**
 * Admin form validation helpers.
 *
 * The dashboard's settings, event and feedback-moderation forms repeat
 * inline regex/length checks. These pure helpers standardise them and add a
 * `validateFields` orchestrator that returns a `{ valid, errors }` shape the
 * form components can consume directly.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w-._~:/?#[\]@!$&'()*+,;=%]*)?$/i;
const HEX_RE = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

/**
 * Whether a value is non-empty after trimming.
 *
 * @param {unknown} value - Value to check.
 * @returns {boolean} True when present.
 */
export function isRequired(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'string') return value != null;
  return value.trim().length > 0;
}

/**
 * Whether a value is a valid email address.
 *
 * @param {unknown} value - Value to check.
 * @returns {boolean} True for valid emails.
 */
export function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  return EMAIL_RE.test(value.trim());
}

/**
 * Whether a value is a valid URL.
 *
 * @param {unknown} value - Value to check.
 * @returns {boolean} True for valid URLs.
 */
export function isValidUrl(value) {
  if (typeof value !== 'string') return false;
  return URL_RE.test(value.trim());
}

/**
 * Whether a value is within a length range (after trimming).
 *
 * @param {unknown} value - Value to check.
 * @param {number} min - Minimum length.
 * @param {number} max - Maximum length.
 * @returns {boolean} True when within range.
 */
export function isLengthInRange(value, min, max) {
  if (typeof value !== 'string') return false;
  const length = value.trim().length;
  return length >= min && length <= max;
}

/**
 * Whether a value is numeric (or a numeric string) within bounds.
 *
 * @param {unknown} value - Value to check.
 * @param {number} [min=-Infinity] - Inclusive lower bound.
 * @param {number} [max=Infinity] - Inclusive upper bound.
 * @returns {boolean} True for in-range numbers.
 */
export function isNumberInRange(value, min = -Infinity, max = Infinity) {
  const num = Number(value);
  return Number.isFinite(num) && num >= min && num <= max;
}

/**
 * Whether a value is a hex colour (`#rgb` or `#rrggbb`).
 *
 * @param {unknown} value - Value to check.
 * @returns {boolean} True for valid hex colours.
 */
export function isValidHexColor(value) {
  if (typeof value !== 'string') return false;
  return HEX_RE.test(value.trim());
}

/**
 * Whether a value passes a custom pattern.
 *
 * @param {unknown} value - Value to check.
 * @param {RegExp} pattern - Pattern to test against.
 * @returns {boolean} True on match.
 */
export function matchesPattern(value, pattern) {
  if (typeof value !== 'string') return false;
  return pattern.test(value.trim());
}

/**
 * A single validation rule.
 *
 * @typedef {Object} ValidationRule
 * @property {Function} test - `(value) => boolean`.
 * @property {string} message - Error message shown when the test fails.
 */

/**
 * Runs a set of rules against an object of fields.
 *
 * @param {Object<string, *>} values - Field name -> value.
 * @param {Object<string, ValidationRule[]>} rules - Field name -> rules.
 * @returns {{ valid: boolean, errors: Object<string, string> }} Result.
 *
 * @example
 * const { valid, errors } = validateFields(
 *   { email: 'a@b.co' },
 *   { email: [{ test: isValidEmail, message: 'Invalid email' }] }
 * );
 */
export function validateFields(values, rules) {
  const errors = {};
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = values[field];
    const failed = fieldRules.find((rule) => !rule.test(value));
    if (failed) errors[field] = failed.message;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export default {
  isRequired,
  isValidEmail,
  isValidUrl,
  isLengthInRange,
  isNumberInRange,
  isValidHexColor,
  matchesPattern,
  validateFields,
};
