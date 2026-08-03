/**
 * Pure validation helpers for form inputs and user-generated strings.
 *
 * These are framework-agnostic so they can be shared between the website's
 * controlled forms (ContactPage, MembershipPage, RecruitmentPage) and any
 * client-side pre-validation before a value reaches the API.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w-._~:/?#[\]@!$&'()*+,;=%]*)?$/i;
const PHONE_RE = /^[+]?[\d\s().-]{7,20}$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

/**
 * Returns `true` when the value is a non-empty string after trimming.
 *
 * @param {unknown} value - Value to check.
 * @returns {boolean} Whether the value has content.
 */
export function isRequired(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'string') return value != null;
  return value.trim().length > 0;
}

/**
 * Validates an email address.
 *
 * @param {unknown} value - Value to check.
 * @returns {boolean} Whether the value looks like an email.
 */
export function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  return EMAIL_RE.test(value.trim());
}

/**
 * Validates a URL. Accepts `http(s)` and scheme-less hosts.
 *
 * @param {unknown} value - Value to check.
 * @returns {boolean} Whether the value looks like a URL.
 */
export function isValidUrl(value) {
  if (typeof value !== 'string') return false;
  return URL_RE.test(value.trim());
}

/**
 * Validates a phone number (digits, spaces, dashes, parens, optional `+`).
 *
 * @param {unknown} value - Value to check.
 * @returns {boolean} Whether the value looks like a phone number.
 */
export function isValidPhone(value) {
  if (typeof value !== 'string') return false;
  return PHONE_RE.test(value.trim());
}

/**
 * Validates a username: 3-30 chars, letters, digits and underscores only.
 *
 * @param {unknown} value - Value to check.
 * @returns {boolean} Whether the value is a valid username.
 */
export function isValidUsername(value) {
  if (typeof value !== 'string') return false;
  return USERNAME_RE.test(value.trim());
}

/**
 * Validates a hex colour like `#aabbcc` or `#abc`.
 *
 * @param {unknown} value - Value to check.
 * @returns {boolean} Whether the value is a valid hex colour.
 */
export function isValidHexColor(value) {
  if (typeof value !== 'string') return false;
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value.trim());
}

/**
 * Validates a 4-6 digit numeric PIN.
 *
 * @param {unknown} value - Value to check.
 * @returns {boolean} Whether the value is a valid PIN.
 */
export function isValidPin(value) {
  if (typeof value !== 'string') return false;
  return /^\d{4,6}$/.test(value.trim());
}

/**
 * Returns a password strength score from 0 (very weak) to 4 (strong).
 *
 * Each of the following adds a point: length >= 8, mixed case, a digit,
 * a symbol. Useful for live strength meters in sign-up forms.
 *
 * @param {unknown} value - Password to score.
 * @returns {number} Strength score between 0 and 4.
 */
export function getPasswordStrength(value) {
  if (typeof value !== 'string' || value.length === 0) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^a-zA-Z0-9\s]/.test(value)) score += 1;
  return score;
}

/**
 * Checks that a string stays within a length range after trimming.
 *
 * @param {unknown} value - Value to check.
 * @param {number} min - Minimum length (inclusive).
 * @param {number} max - Maximum length (inclusive).
 * @returns {boolean} Whether the trimmed length is within range.
 */
export function isLengthInRange(value, min, max) {
  if (typeof value !== 'string') return false;
  const length = value.trim().length;
  return length >= min && length <= max;
}

/**
 * Validates a URL against a blocklist of known untrusted schemes.
 * Rejects `javascript:`, `data:`, `vbscript:` and `file:` links, which is a
 * cheap defence-in-depth layer on top of DOMPurify for user-supplied links.
 *
 * @param {unknown} value - Value to check.
 * @returns {boolean} Whether the value is a safe URL for links.
 */
export function isSafeLink(value) {
  if (!isValidUrl(value)) return false;
  const normalized = String(value).trim().toLowerCase();
  return (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('/')
  );
}

export default {
  isRequired,
  isValidEmail,
  isValidUrl,
  isValidPhone,
  isValidUsername,
  isValidHexColor,
  isValidPin,
  getPasswordStrength,
  isLengthInRange,
  isSafeLink,
};
