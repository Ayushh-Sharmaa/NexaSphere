import DOMPurify from "isomorphic-dompurify";

const HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/[&<>"'`]/g, (character) => HTML_ESCAPE_MAP[character])
    .trim();
}

function toSafeString(value, max = 4000) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function sanitizeText(value, max = 4000) {
  return escapeHtml(toSafeString(value, max));
}

function sanitizeNullableText(value, max = 4000) {
  const text = toSafeString(value, max);
  return text ? escapeHtml(text) : null;
}

function sanitizeTextArray(values, max = 40) {
  if (!Array.isArray(values)) {
    return String(values || "")
      .split(",")
      .map((entry) => sanitizeText(entry, max))
      .filter(Boolean)
      .slice(0, 12);
  }

  return values
    .map((entry) => sanitizeText(entry, max))
    .filter(Boolean)
    .slice(0, 12);
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

function validateSection(str) {
  const v = String(str || "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z]$/.test(v))
    throw new Error("Section must be a single letter (A-Z)");
  return v;
}

export function sanitizeEventRecord(event = {}) {
  return {
    ...event,
    name: sanitizeText(event.name, 120),
    shortName: sanitizeText(event.shortName || event.name, 60),
    date: sanitizeText(event.date, 80),
    description: sanitizeText(event.description, 1200),
    icon: sanitizeText(event.icon || "Pin", 32),
    tags: sanitizeTextArray(event.tags, 40),
  };
}

export function sanitizeActivityEventRecord(event = {}) {
  const { createdBy, ...rest } = event;
  return {
    ...rest,
    name: sanitizeText(event.name, 120),
    date: sanitizeText(event.date, 80),
    tagline: sanitizeNullableText(event.tagline, 240),
    description: sanitizeText(event.description, 1200),
  };
}

export function sanitizeCoreTeamMemberRecord(member = {}) {
  return {
    ...member,
    name: sanitizeText(member.name, 100),
    role: sanitizeText(member.role, 100),
    year: sanitizeText(member.year, 20),
    branch: sanitizeText(member.branch, 100),
    section: sanitizeText(member.section, 12),
    email: sanitizeText(member.email, 140),
    whatsapp: sanitizeText(member.whatsapp, 40),
    linkedin: sanitizeNullableText(member.linkedin, 255),
    instagram: sanitizeNullableText(member.instagram, 255),
    photoUrl: sanitizeNullableText(member.photoUrl, 500),
  };
}

// ============================================================
// Portfolio sanitization (issue #969)
//
// Portfolio content is rendered to anonymous visitors at
// /p/:username, so any HTML or javascript: URL stored in the
// database becomes a stored XSS vector.  The strategy below:
//
//   * strip ALL HTML from plain-text fields (bio, title, etc.)
//   * normalize unicode whitespace and control characters
//   * validate every URL field against an https?:// allowlist
//   * apply the same rules recursively to JSONB array/object
//     fields (skills, projects, roadmaps, badges, seoMetadata)
// ============================================================

function validateWhatsApp(value) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 30);
}

const SAFE_URL_PROTOCOLS = /^(https?:\/\/|\/[^\/])/i;
const URL_MAX_LENGTH = 2048;

const HTML_TAG_PATTERN = /<\/?[a-z][^>]*>/gi;
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;
const SCRIPT_PATTERN = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi;
const STYLE_PATTERN = /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi;
const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const NULL_BYTE_PATTERN = /\u0000/g;

function stripHtml(value) {
  if (value == null) return "";
  let text = String(value);
  // Clean using DOMPurify with no tags/attributes allowed (plain text output)
  text = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  text = text.replace(CONTROL_CHAR_PATTERN, "");
  text = text.replace(NULL_BYTE_PATTERN, "");
  return text;
}

function stripHtmlTruncated(value, max) {
  return stripHtml(value).trim().slice(0, max);
}

// Check if a URL uses a safe protocol (http, https, or relative)
function isSafeUrl(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > URL_MAX_LENGTH) return false;
  // Reject known dangerous protocols explicitly.
  if (
    /^\s*(javascript|data|vbscript|file|about|chrome|jar|mocha):/i.test(trimmed)
  ) {
    return false;
  }
  return SAFE_URL_PROTOCOLS.test(trimmed);
}

function sanitizeUrlField(value) {
  if (value == null) return "";
  if (!isSafeUrl(value)) return "";
  return String(value).trim().slice(0, URL_MAX_LENGTH);
}

function sanitizeStringArray(values, maxItems, perItemMax) {
  if (!Array.isArray(values)) return [];
  return values
    .map((entry) => stripHtmlTruncated(entry, perItemMax))
    .filter((entry) => entry.length > 0)
    .slice(0, maxItems);
}

function sanitizeSkill(skill) {
  if (!skill || typeof skill !== "object") return null;
  const name = stripHtmlTruncated(skill.name, 100);
  if (!name) return null;
  const out = { name };
  if (skill.level != null) {
    const level = stripHtmlTruncated(skill.level, 40);
    if (level) out.level = level;
  }
  if (skill.category != null) {
    const category = stripHtmlTruncated(skill.category, 60);
    if (category) out.category = category;
  }
  return out;
}

function sanitizeProject(project) {
  if (!project || typeof project !== "object") return null;
  const name = stripHtmlTruncated(project.name, 200);
  if (!name) return null;
  const out = { name };
  if (project.description != null) {
    out.description = stripHtmlTruncated(project.description, 5000);
  }
  if (project.shortDesc != null) {
    out.shortDesc = stripHtmlTruncated(project.shortDesc, 500);
  }
  if (project.techStack != null) {
    out.techStack = sanitizeStringArray(project.techStack, 30, 60);
  }
  const link = sanitizeUrlField(project.link);
  if (link) out.link = link;
  const github = sanitizeUrlField(project.github);
  if (github) out.github = github;
  const demo = sanitizeUrlField(project.demo);
  if (demo) out.demo = demo;
  return out;
}

function sanitizeRoadmap(roadmap) {
  if (!roadmap || typeof roadmap !== "object") return null;
  const title = stripHtmlTruncated(roadmap.title, 200);
  if (!title) return null;
  const out = { title };
  if (roadmap.description != null) {
    out.description = stripHtmlTruncated(roadmap.description, 5000);
  }
  if (Array.isArray(roadmap.milestones)) {
    out.milestones = roadmap.milestones
      .map((m) => {
        if (!m || typeof m !== "object") return null;
        const t = stripHtmlTruncated(m.title, 200);
        if (!t) return null;
        const entry = { title: t };
        if (m.description != null) {
          entry.description = stripHtmlTruncated(m.description, 2000);
        }
        if (m.completed != null && typeof m.completed === "boolean") {
          entry.completed = m.completed;
        }
        return entry;
      })
      .filter(Boolean)
      .slice(0, 100);
  }
  return out;
}

// Sanitize single badge object
function sanitizeBadge(badge) {
  if (!badge || typeof badge !== "object") return null;
  const name = stripHtmlTruncated(badge.name, 120);
  if (!name) return null;
  const out = { name };
  if (badge.description != null) {
    out.description = stripHtmlTruncated(badge.description, 1000);
  }
  if (badge.tier != null) {
    out.tier = stripHtmlTruncated(badge.tier, 40);
  }
  if (badge.iconUrl) {
    const iconUrl = sanitizeUrlField(badge.iconUrl);
    if (iconUrl) out.iconUrl = iconUrl;
  }
  return out;
}

function sanitizeSocialLinks(socialLinks) {
  if (
    !socialLinks ||
    typeof socialLinks !== "object" ||
    Array.isArray(socialLinks)
  ) {
    return {};
  }
  const out = {};
  for (const [key, value] of Object.entries(socialLinks)) {
    if (typeof key !== "string" || key.length === 0 || key.length > 40)
      continue;
    const safe = sanitizeUrlField(value);
    if (safe) out[key] = safe;
  }
  return out;
}

function sanitizeSeoMetadata(seo) {
  if (!seo || typeof seo !== "object" || Array.isArray(seo)) return {};
  const out = {};
  for (const [key, value] of Object.entries(seo)) {
    if (typeof key !== "string" || key.length === 0 || key.length > 60)
      continue;
    out[key] = stripHtmlTruncated(value, 500);
  }
  return out;
}

function sanitizeVisibleSections(sections) {
  if (!sections || typeof sections !== "object" || Array.isArray(sections)) {
    return { quests: true, roadmaps: true, projects: true, analytics: false };
  }
  const out = {};
  for (const [key, value] of Object.entries(sections)) {
    if (typeof key !== "string" || key.length === 0 || key.length > 40)
      continue;
    if (typeof value === "boolean") out[key] = value;
  }
  return out;
}

export function sanitizePortfolioRecord(data = {}) {
  const out = {};
  if (data.username != null)
    out.username = String(data.username).trim().toLowerCase().slice(0, 100);
  if (data.passkey != null) out.passkey = String(data.passkey).slice(0, 256);
  if (data.theme != null) {
    const theme = stripHtmlTruncated(data.theme, 50);
    if (theme) out.theme = theme;
  }
  out.visibleSections = sanitizeVisibleSections(data.visibleSections);
  out.socialLinks = sanitizeSocialLinks(data.socialLinks);
  if (data.customDomain != null) {
    const domain = stripHtmlTruncated(data.customDomain, 255);
    if (domain) out.customDomain = domain;
  }
  out.seoMetadata = sanitizeSeoMetadata(data.seoMetadata);
  if (Array.isArray(data.skills)) {
    out.skills = data.skills.map(sanitizeSkill).filter(Boolean).slice(0, 100);
  } else {
    out.skills = [];
  }
  if (Array.isArray(data.badges)) {
    out.badges = data.badges
      .map((badge) => sanitizeBadge(badge))
      .filter(Boolean)
      .slice(0, 100);
  } else {
    out.badges = [];
  }
  if (Array.isArray(data.projects)) {
    out.projects = data.projects
      .map((project) => sanitizeProject(project))
      .filter(Boolean)
      .slice(0, 50);
  } else {
    out.projects = [];
  }
  if (Array.isArray(data.roadmaps)) {
    out.roadmaps = data.roadmaps
      .map((roadmap) => sanitizeRoadmap(roadmap))
      .filter(Boolean)
      .slice(0, 50);
  } else {
    out.roadmaps = [];
  }
  out.bio = stripHtmlTruncated(data.bio, 5000);
  out.title = stripHtmlTruncated(data.title, 200);
  return out;
}

export function sanitizePortfolioOutput(record) {
  if (!record || typeof record !== "object") return null;
  return sanitizePortfolioRecord(record);
}

export function isSafePortfolioUrl(value) {
  return isSafeUrl(value);
}

export {
  escapeHtml,
  isEmail,
  normalizePhone,
  sanitizeNullableText,
  sanitizeText,
  sanitizeTextArray,
  stripHtml,
  stripHtmlTruncated,
  toSafeString,
  validateSection,
  validateWhatsApp,
};
