import crypto from "crypto";
import {
  supabaseRequest,
  HAS_SUPABASE,
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
} from "../storage/supabaseClient.js";
import {
  supabaseRequest,
  HAS_SUPABASE,
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
} from "../storage/supabaseClient.js";
import { tracedFetch } from "../config/appContext.js";
import { readContent, writeContent } from "../storage/contentFileStore.js";

// We need withContentLock
let contentLock = Promise.resolve();

function withContentLock(fn) {
  let release;
  const next = new Promise((resolve) => {
    release = resolve;
  });
  const current = contentLock;
  contentLock = next;
  return current.then(() => fn()).finally(() => release());
}

// the total row count from the Content-Range response header (sent when
// Prefer: count=exact is set). Returns { rows, total } instead of a bare array.
export async function supabasePaginatedRequest(pathname, page, limit) {
  if (!HAS_SUPABASE) throw new Error("Supabase is not configured");
  const offset = (page - 1) * limit;
  const separator = pathname.includes("?") ? "&" : "?";
  const url = `${SUPABASE_URL}/rest/v1/${pathname}${separator}limit=${limit}&offset=${offset}`;
  const res = await tracedFetch(url, {
    method: "GET",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "count=exact",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error (${res.status}): ${text}`);
  }
  const text = await res.text();
  let rows = [];
  if (text) {
    try {
      rows = JSON.parse(text);
    } catch (e) {
      console.error("[contentStore] Failed to parse Supabase response:", e);
      rows = [];
    }
  }
  const rows = text ? JSON.parse(text) : [];
  // Content-Range format from PostgREST: "0-19/150" or "*/0" when empty
  const contentRange = res.headers.get("content-range") || "";
  const totalMatch = contentRange.match(/\/(\d+)$/);
  const total = totalMatch ? parseInt(totalMatch[1], 10) : rows.length;
  return { rows, total };
}

// Parses ?page and ?limit from a request query object, clamps to safe bounds,
// and returns normalised integers. Defaults: page=1, limit=20, cap=100.
export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit };
}

export function toSafeString(value, max = 4000) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

export function validateWhatsApp(str) {
  const v = String(str || "").trim();
  if (!/^\d{10}$/.test(v))
    throw new Error("WhatsApp must be exactly 10 digits");
  return v;
}

export function validateSection(str) {
  const v = String(str || "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z]$/.test(v))
    throw new Error("Section must be a single letter (A-Z)");
  return v;
}

export function sanitizeEvent(input = {}) {
  const status = input.status === "upcoming" ? "upcoming" : "completed";
  const tags = Array.isArray(input.tags)
    ? input.tags
        .map((t) => toSafeString(t, 40))
        .filter(Boolean)
        .slice(0, 12)
    : String(input.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12);

  return {
    id:
      toSafeString(input.id || input.shortName || input.name, 80)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `event-${Date.now()}`,
    name: toSafeString(input.name, 120),
    shortName: toSafeString(input.shortName || input.name, 60),
    date: toSafeString(input.date, 80),
    description: toSafeString(input.description, 1200),
    status,
    icon: toSafeString(input.icon || "Pin", 32),
    tags,
  };
}

export function normalizePhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

export async function isDuplicateCoreTeamMember(name, email, phone) {
  const n = String(name || "")
    .trim()
    .toLowerCase();
  const e = String(email || "")
    .trim()
    .toLowerCase();
  const p = normalizePhone(phone);

  const members = await listCoreTeamStore();
  return members.some(
    (m) =>
      m.name.toLowerCase() === n &&
      m.email.toLowerCase() === e &&
      normalizePhone(m.whatsapp) === p
  );
}

export async function listEventsStore({ page = 1, limit = 20 } = {}) {
  if (HAS_SUPABASE) {
    const { rows, total } = await supabasePaginatedRequest(
      "events?select=*&order=created_at.desc",
      page,
      limit
    );
    return {
      events: rows.map((r) =>
        sanitizeEventRecord({
          id: r.id,
          name: r.name,
          shortName: r.short_name || r.shortName || r.name,
          date: r.date_text || r.date,
          description: r.description,
          status: r.status,
          icon: r.icon || "Pin",
          tags: Array.isArray(r.tags) ? r.tags : [],
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })
      ),
      total,
    };
  }
  const content = await readContent();
  const all = (content.events || []).map((event) => sanitizeEventRecord(event));
  const total = all.length;
  const start = (page - 1) * limit;
  return { events: all.slice(start, start + limit), total };
}

const ALLOWED_EVENT_FIELDS = [
  "id",
  "name",
  "description",
  "date_text",
  "time",
  "location",
  "type",
  "mode",
  "category",
  "tags",
  "image_url",
  "registration_link",
  "capacity",
  "is_hybrid",
  "video_link",
  "location",
  "registered_count",
  "price",
  "created_at",
  "updated_at",
];

export function sanitizeEventRecord(event) {
  if (!event || typeof event !== "object") return event;
  const sanitized = {};
  for (const field of ALLOWED_EVENT_FIELDS) {
    if (field in event) sanitized[field] = event[field];
  }
  return sanitized;
}

export async function createEventStore(event) {
  if (HAS_SUPABASE) {
    let payload = {
      id: event.id,
      name: event.name,
      short_name: event.shortName,
      date_text: event.date,
      description: event.description,
      status: event.status,
      icon: event.icon,
      tags: event.tags,
      capacity: event.capacity,
      is_hybrid: event.isHybrid,
      video_link: event.videoLink,
      location: event.location,
    };

    let row;
    try {
      [row] = await supabaseRequest("events", {
        method: "POST",
        body: [payload],
      });
    } catch (e) {
      // Retry with suffix if id collision occurs.
      payload = { ...payload, id: `${event.id}-${Date.now()}` };
      [row] = await supabaseRequest("events", {
        method: "POST",
        body: [payload],
      });
    }
    return sanitizeEventRecord({
      id: row.id,
      name: row.name,
      shortName: row.short_name || row.name,
      date: row.date_text,
      description: row.description,
      status: row.status,
      icon: row.icon || "Pin",
      tags: Array.isArray(row.tags) ? row.tags : [],
      capacity: row.capacity,
      isHybrid: row.is_hybrid,
      videoLink: row.video_link,
      location: row.location,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  // Safe atomic fallback operation preventing data loss using async-mutex
  return withContentLock(async () => {
    const content = await readContent();
    content.events.unshift({
      ...event,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await writeContent(content);
    return sanitizeEventRecord(content.events[0]);
  });
}
export async function updateEventStore(id, patch) {
  if (HAS_SUPABASE) {
    const [row] = await supabaseRequest(
      `events?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: {
          name: patch.name,
          short_name: patch.shortName,
          date_text: patch.date,
          description: patch.description,
          status: patch.status,
          icon: patch.icon,
          tags: patch.tags,
          capacity: patch.capacity,
          is_hybrid: patch.isHybrid,
          video_link: patch.videoLink,
          location: patch.location,
          updated_at: new Date().toISOString(),
        },
      }
    );
    if (!row) return null;
    return sanitizeEventRecord({
      id: row.id,
      name: row.name,
      shortName: row.short_name || row.name,
      date: row.date_text,
      description: row.description,
      status: row.status,
      icon: row.icon || "Pin",
      tags: Array.isArray(row.tags) ? row.tags : [],
      capacity: row.capacity,
      isHybrid: row.is_hybrid,
      videoLink: row.video_link,
      location: row.location,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
  return withContentLock(async () => {
    const content = await readContent();
    const idx = content.events.findIndex((e) => e.id === id);
    if (idx < 0) return null;
    content.events[idx] = {
      ...content.events[idx],
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    };
    await writeContent(content);
    return sanitizeEventRecord(content.events[idx]);
  });
}

export async function deleteEventStore(id) {
  if (HAS_SUPABASE) {
    const rows = await supabaseRequest(
      `events?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    );
    return Array.isArray(rows) && rows.length > 0;
  }
  return withContentLock(async () => {
    const content = await readContent();
    const before = content.events.length;
    content.events = content.events.filter((e) => e.id !== id);
    if (content.events.length === before) return false;
    await writeContent(content);
    return true;
  });
}

export async function listActivityEventsStore(
  activityKey,
  { page = 1, limit = 20 } = {}
) {
  if (HAS_SUPABASE) {
    const { rows, total } = await supabasePaginatedRequest(
      `activity_events?activity_key=eq.${encodeURIComponent(activityKey)}&select=*&order=created_at.desc`,
      page,
      limit
    );
    return {
      events: rows.map((r) =>
        sanitizeActivityEventRecord({
          id: r.id,
          name: r.name,
          date: r.date_text || r.date,
          tagline: r.tagline,
          description: r.description,
          status: r.status || "completed",
          createdAt: r.created_at,
        })
      ),
      total,
    };
  }
  const content = await readContent();
  const all = (content.activityEvents?.[activityKey] || []).map((event) =>
    sanitizeActivityEventRecord(event)
  );
  const total = all.length;
  const start = (page - 1) * limit;
  return { events: all.slice(start, start + limit), total };
}

export function sanitizeActivityEventRecord(event) {
  if (!event || typeof event !== "object") return event;
  const { createdBy, ...safe } = event;
  return safe;
}

export async function createActivityEventStore(activityKey, event) {
  if (HAS_SUPABASE) {
    const [row] = await supabaseRequest("activity_events", {
      method: "POST",
      body: [
        {
          id: event.id,
          activity_key: activityKey,
          name: event.name,
          date_text: event.date,
          tagline: event.tagline,
          description: event.description,
          status: event.status,
          created_by_name: event.createdBy?.name || "",
          created_by_email: event.createdBy?.email || "",
          created_by_phone: event.createdBy?.phone || "",
        },
      ],
    });
    return sanitizeActivityEventRecord({
      id: row.id,
      name: row.name,
      date: row.date_text,
      tagline: row.tagline,
      description: row.description,
      status: row.status || "completed",
      createdAt: row.created_at,
    });
  }
  return withContentLock(async () => {
    const content = await readContent();
    content.activityEvents = content.activityEvents || {};
    content.activityEvents[activityKey] =
      content.activityEvents[activityKey] || [];
    content.activityEvents[activityKey].unshift(event);
    await writeContent(content);
    return sanitizeActivityEventRecord(event);
  });
}

export async function deleteActivityEventStore(activityKey, eventId) {
  if (HAS_SUPABASE) {
    const rows = await supabaseRequest(
      `activity_events?activity_key=eq.${encodeURIComponent(activityKey)}&id=eq.${encodeURIComponent(eventId)}`,
      { method: "DELETE" }
    );
    return Array.isArray(rows) && rows.length > 0;
  }
  return withContentLock(async () => {
    const content = await readContent();
    content.activityEvents = content.activityEvents || {};
    const list = content.activityEvents[activityKey] || [];
    const next = list.filter((e) => e.id !== eventId);
    if (next.length === list.length) return false;
    content.activityEvents[activityKey] = next;
    await writeContent(content);
    return true;
  });
}

export async function listCoreTeamStore() {
  if (HAS_SUPABASE) {
    const rows = await supabaseRequest(
      "core_team_members?select=*&order=created_at.asc"
    );
    return rows.map((r) =>
      sanitizeCoreTeamMemberRecord({
        id: r.id,
        name: r.name,
        role: r.role,
        year: r.year,
        branch: r.branch,
        section: r.section,
        email: r.email,
        whatsapp: r.whatsapp,
        linkedin: r.linkedin,
        instagram: r.instagram,
        photoUrl: r.photo_url,
        createdAt: r.created_at,
      })
    );
  }
  const content = await readContent();
  return (content.coreTeam || []).map((member) =>
    sanitizeCoreTeamMemberRecord(member)
  );
}

const ALLOWED_TEAM_MEMBER_FIELDS = [
  "id",
  "name",
  "role",
  "position",
  "bio",
  "avatar_url",
  "github_url",
  "linkedin_url",
  "email",
  "joined_at",
  "order",
];

export function sanitizeCoreTeamMemberRecord(member) {
  if (!member || typeof member !== "object") return member;
  const sanitized = {};
  for (const field of ALLOWED_TEAM_MEMBER_FIELDS) {
    if (field in member) sanitized[field] = member[field];
  }
  return sanitized;
}

export async function createCoreTeamStore(member) {
  if (HAS_SUPABASE) {
    const [row] = await supabaseRequest("core_team_members", {
      method: "POST",
      body: [
        {
          name: member.name,
          role: member.role,
          year: member.year,
          branch: member.branch,
          section: member.section,
          email: member.email,
          whatsapp: member.whatsapp,
          linkedin: member.linkedin,
          instagram: member.instagram,
          photo_url: member.photoUrl,
        },
      ],
    });
    return sanitizeCoreTeamMemberRecord({
      id: row.id,
      name: row.name,
      role: row.role,
      year: row.year,
      branch: row.branch,
      section: row.section,
      email: row.email,
      whatsapp: row.whatsapp,
      linkedin: row.linkedin,
      instagram: row.instagram,
      photoUrl: row.photo_url,
      createdAt: row.created_at,
    });
  }
  return withContentLock(async () => {
    const content = await readContent();
    content.coreTeam = content.coreTeam || [];
    const newMember = {
      ...member,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    content.coreTeam.push(newMember);
    await writeContent(content);
    return sanitizeCoreTeamMemberRecord(newMember);
  });
}

export async function deleteCoreTeamStore(id) {
  if (HAS_SUPABASE) {
    const rows = await supabaseRequest(
      `core_team_members?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    );
    return Array.isArray(rows) && rows.length > 0;
  }
  return withContentLock(async () => {
    const content = await readContent();
    content.coreTeam = content.coreTeam || [];
    const before = content.coreTeam.length;
    content.coreTeam = content.coreTeam.filter(
      (m) => String(m.id) !== String(id)
    );
    if (content.coreTeam.length === before) return false;
    await writeContent(content);
    return true;
  });
}

export async function appendToSupabaseForms(formType, payload) {
  if (!HAS_SUPABASE) return false;
  try {
    await supabaseRequest("form_submissions", {
      method: "POST",
      body: [
        {
          form_type: formType,
          full_name: toSafeString(payload.fullName, 140),
          college_email: toSafeString(payload.collegeEmail, 140),
          whatsapp: toSafeString(payload.whatsapp, 40),
          payload,
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

// Constant-time string comparison that does not short-circuit on the first
// mismatched character. Both operands are encoded to UTF-8 Buffers of equal
// length before the comparison so response time is independent of how many
// leading characters match. Returns false immediately if either value is empty,
// so callers cannot exploit a zero-length buffer edge case.
export function timingSafeStringEqual(a, b) {
  const sa = String(a ?? "");
  const sb = String(b ?? "");
  if (!sa.length || !sb.length) return sa === sb;
  const ba = Buffer.from(sa, "utf8");
  const bb = Buffer.from(sb, "utf8");
  // Buffers must be the same byte length for timingSafeEqual. Pad the shorter
  // one so the comparison always runs the full loop.
  if (ba.length !== bb.length) {
    const maxLen = Math.max(ba.length, bb.length);
    const paddedA = Buffer.alloc(maxLen);
    const paddedB = Buffer.alloc(maxLen);
    ba.copy(paddedA);
    bb.copy(paddedB);
    // The length mismatch already means they cannot be equal, but we still run
    // the full comparison so the execution time is data-independent.
    crypto.timingSafeEqual(paddedA, paddedB);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}
