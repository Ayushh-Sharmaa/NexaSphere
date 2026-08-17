/**
 * Shared String Utilities for Admin Dashboard
 */

export const slugify = (str) => {
  if (!str) return "";
  return String(str)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export const maskString = (str, start = 2, end = 2, maskChar = "*") => {
  if (!str) return "";
  const s = String(str);
  if (s.length <= start + end) return maskChar.repeat(s.length);
  return (
    s.substring(0, start) +
    maskChar.repeat(s.length - start - end) +
    s.substring(s.length - end)
  );
};

export const maskEmail = (email) => {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${"*".repeat(local.length)}@${domain}`;
  }
  return `${local.substring(0, 2)}${"*".repeat(local.length - 2)}@${domain}`;
};

export const stripHtml = (html) => {
  if (!html) return "";
  return String(html).replace(/<[^>]*>?/gm, "");
};

export const truncate = (str, length = 30, suffix = "...") => {
  if (!str) return "";
  const s = String(str);
  if (s.length <= length) return s;
  return s.substring(0, length) + suffix;
};

export const capitalize = (str) => {
  if (!str) return "";
  const s = String(str);
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

export const escapeHtml = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const unescapeHtml = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
};
