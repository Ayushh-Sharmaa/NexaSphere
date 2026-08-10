import DOMPurify from 'isomorphic-dompurify';

const HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
};

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/[&<>"'`]/g, (character) => HTML_ESCAPE_MAP[character])
    .trim();
}

export function toSafeString(value, max = 4000) {
  return String(value ?? '')
    .trim()
    .slice(0, max);
}

export function sanitizeText(value, max = 4000) {
  return escapeHtml(toSafeString(value, max));
}

export function sanitizeNullableText(value, max = 4000) {
  const text = toSafeString(value, max);
  return text ? escapeHtml(text) : null;
}

export function sanitizeTextArray(arr, max = 4000) {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => sanitizeText(item, max)).filter(Boolean);
}

export function sanitizeEventRecord(event = {}) {
  const sanitized = {};
  for (const [key, value] of Object.entries(event)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = sanitizeTextArray(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function sanitizeActivityEventRecord(event = {}) {
  const sanitized = sanitizeEventRecord(event);
  delete sanitized.createdBy;
  return sanitized;
}

export function sanitizeCoreTeamMemberRecord(member = {}) {
  return sanitizeEventRecord(member);
}

export function normalizePhone(value) {
  if (!value) return null;
  const numeric = String(value).replace(/\D/g, '');
  return numeric.length >= 10 ? numeric : null;
}

export function validateWhatsApp(str) {
  return normalizePhone(str);
}

export function validateSection(str) {
  return sanitizeText(str, 100);
}

export function sanitizePortfolioRecord(data = {}) {
  return sanitizeEventRecord(data);
}

export function sanitizePortfolioOutput(record) {
  return record;
}

export function isSafePortfolioUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}
