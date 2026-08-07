import { coreTeamService } from "../services/coreTeamService.js";
import { wrapAsync } from "../middleware/asyncHandler.js";
import { NotFoundError } from "../utils/errors.js";

function toSafeString(value, max = 4000) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function validateWhatsApp(str) {
  const v = String(str || "").trim();
  if (!/^\d{10}$/.test(v))
    throw new Error("WhatsApp must be exactly 10 digits");
  return v;
}

function validateSection(str) {
  const v = String(str || "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z]$/.test(v))
    throw new Error("Section must be a single letter (A-Z)");
  return v;
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
}

export const publicListMembers = wrapAsync(async (_req, res) => {
  const members =
    (await coreTeamService.listPublicMembers?.()) ??
    (await coreTeamService.listMembers?.()) ??
    [];
  res.json({ members });
});

export const adminListCoreTeamMembers = wrapAsync(async (req, res) => {
  const members = await coreTeamService.listMembers();
  return res.json({ members });
});

export const adminAddCoreTeamMember = wrapAsync(async (req, res) => {
  const body = req.body || {};
  const member = {
    name: toSafeString(body.name, 100),
    role: toSafeString(body.role, 100),
    year: toSafeString(body.year, 20),
    branch: toSafeString(body.branch, 100),
    section: validateSection(body.section),
    email: toSafeString(body.email, 140),
    whatsapp: validateWhatsApp(body.whatsapp),
    linkedin: toSafeString(body.linkedin, 255) || null,
    instagram: toSafeString(body.instagram, 255) || null,
    photoUrl: toSafeString(body.photoUrl, 500) || null,
  };

  if (
    !member.name ||
    !member.role ||
    !member.year ||
    !member.branch ||
    !member.email
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!isEmail(member.email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const saved = await coreTeamService.addMember(member);
  const adminEmail = req.adminSession?.username || "admin";
  req.app?.emit?.("CORE_TEAM_MEMBER_ADDED", {
    adminEmail,
    member: saved,
    timestamp: new Date().toISOString(),
  });
  return res.status(201).json(saved);
});

export const adminUpdateCoreTeamMember = wrapAsync(async (req, res) => {
  const id = String(req.params.id || "").trim();
  const body = req.body || {};
  const member = {
    name: toSafeString(body.name, 100),
    role: toSafeString(body.role, 100),
    year: toSafeString(body.year, 20),
    branch: toSafeString(body.branch, 100),
    section: validateSection(body.section),
    email: toSafeString(body.email, 140),
    whatsapp: validateWhatsApp(body.whatsapp),
    linkedin: toSafeString(body.linkedin, 255) || null,
    instagram: toSafeString(body.instagram, 255) || null,
    photoUrl: toSafeString(body.photoUrl, 500) || null,
  };

  if (
    !member.name ||
    !member.role ||
    !member.year ||
    !member.branch ||
    !member.email
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!isEmail(member.email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const updated = await coreTeamService.updateMember(id, member);
  if (!updated) throw new NotFoundError("Member not found");
  const adminEmail = req.adminSession?.username || "admin";
  req.app?.emit?.("CORE_TEAM_MEMBER_UPDATED", {
    adminEmail,
    member: updated,
    timestamp: new Date().toISOString(),
  });
  return res.json(updated);
});

export const adminDeleteCoreTeamMember = wrapAsync(async (req, res) => {
  const id = String(req.params.id || "").trim();
  const deleted = await coreTeamService.deleteMember(id);
  if (!deleted) throw new NotFoundError("Member not found");
  return res.json({ ok: true });
});
