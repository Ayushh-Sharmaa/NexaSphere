/**
 * String helpers for slugs, casing, masking and plain-text extraction.
 *
 * Several pages build slugs and display-truncated text inline. These helpers
 * centralise that logic and — for the masking functions — reduce the chance
 * of PII (emails, phone numbers) being rendered verbatim in UI or logs.
 */

/**
 * Converts arbitrary text into a URL-safe slug.
 *
 * @param {string} value - Text to slugify.
 * @param {string} [fallback='untitled'] - Returned when the result is empty.
 * @returns {string} Lowercase hyphenated slug.
 *
 * @example
 * slugify('Event 3: Hack-a-thon!') // 'event-3-hack-a-thon'
 */
export function slugify(value, fallback = 'untitled') {
  const slug = String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  return slug || fallback;
}

/**
 * Capitalises the first letter of a string.
 *
 * @param {string} value - Text to capitalise.
 * @returns {string} Capitalised text.
 */
export function capitalize(value) {
  if (typeof value !== 'string' || value.length === 0) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Capitalises the first letter of every word.
 *
 * @param {string} value - Text to title-case.
 * @returns {string} Title-cased text.
 */
export function titleCase(value) {
  if (typeof value !== 'string') return '';
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * Truncates from both ends, keeping the middle of the string.
 * Useful for long hashes, URLs and wallet/contract addresses.
 *
 * @param {string} value - Text to truncate.
 * @param {number} [head=6] - Characters to keep at the start.
 * @param {number} [tail=4] - Characters to keep at the end.
 * @returns {string} E.g. `abc123...wxyz`.
 */
export function truncateMiddle(value, head = 6, tail = 4) {
  if (typeof value !== 'string') return '';
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

/**
 * Masks an email address while keeping the domain readable.
 *
 * @param {string} value - Email to mask.
 * @returns {string} E.g. `j***@example.com`.
 */
export function maskEmail(value) {
  if (typeof value !== 'string' || !value.includes('@')) return '';
  const [local, ...domain] = value.split('@');
  const visible = local.slice(0, 1);
  return `${visible}***@${domain.join('@')}`;
}

/**
 * Masks a phone number, keeping the last four digits.
 *
 * @param {string} value - Phone number to mask.
 * @returns {string} E.g. `+91 ***** 43210`.
 */
export function maskPhone(value) {
  if (typeof value !== 'string') return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  const tail = digits.slice(-4);
  return `${'*'.repeat(Math.max(0, digits.length - 4))} ${tail}`.trim();
}

/**
 * Strips HTML tags, returning plain text. Use for previews and excerpts
 * before user content is rendered (always sanitize before re-inserting).
 *
 * @param {string} html - HTML string.
 * @returns {string} Text content with tags removed.
 */
export function stripHtml(html) {
  if (typeof html !== 'string') return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Counts words in a string.
 *
 * @param {string} value - Text to count.
 * @returns {number} Number of whitespace-separated words.
 */
export function countWords(value) {
  if (typeof value !== 'string') return 0;
  const match = value.trim().match(/\S+/g);
  return match ? match.length : 0;
}

/**
 * Converts camelCase or PascalCase to kebab-case.
 *
 * @param {string} value - Identifier to convert.
 * @returns {string} Kebab-cased identifier.
 *
 * @example
 * camelToKebab('eventBudgetPage') // 'event-budget-page'
 */
export function camelToKebab(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

export default {
  slugify,
  capitalize,
  titleCase,
  truncateMiddle,
  maskEmail,
  maskPhone,
  stripHtml,
  countWords,
  camelToKebab,
};
