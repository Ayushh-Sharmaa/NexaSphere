import { coreTeamService } from '../services/coreTeamService.js';
import { coreTeamApplicationsRepository } from '../repositories/coreTeamApplicationsRepository.js';
import { wrapAsync } from '../middleware/asyncHandler.js';
import { NotFoundError } from '../utils/errors.js';
import { sendSuccess, sendError, sendNoContent } from '../utils/responseHelper.js';

function toSafeString(value, max = 4000) {
  return String(value ?? '')
    .trim()
    .slice(0, max);
}

function validateWhatsApp(str) {
  const v = String(str || '').trim();
  if (!/^\d{10}$/.test(v)) {
    const err = new Error('WhatsApp must be exactly 10 digits');
    err.status = 400;
    throw err;
  }
  return v;
}

function validateSection(str) {
  const v = String(str || '')
    .trim()
    .toUpperCase();
  if (!/^[A-Z]$/.test(v)) throw new Error('Section must be a single letter (A-Z)');
  return v;
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
}

export const adminListCoreTeamMembers = wrapAsync(async (req, res) => {
  const members = await coreTeamService.listMembers();
  return sendSuccess(res, { members });
});

export const publicListMembers = wrapAsync(async (req, res) => {
  try {
    const rawMembers = await coreTeamService.listMembers();
    const members = (rawMembers || []).map((m) => {
      let email = m.email || null;
      if (email && !email.toLowerCase().endsWith('@glbajajgroup.org')) {
        email = null;
      }
      return {
        ...m,
        email,
        whatsapp: 'https://chat.whatsapp.com/FhpJEaod2g419jFMfqrhGZ',
      };
    });
    return sendSuccess(res, { members });
  } catch (e) {
    return sendError(req, res, e?.message || 'Failed to load core team', 500, 'INTERNAL_ERROR');
  }
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

  if (!member.name || !member.role || !member.year || !member.branch || !member.email) {
    return sendError(req, res, 'Missing required fields', 400, 'VALIDATION_ERROR');
  }
  if (!isEmail(member.email)) {
    return sendError(req, res, 'Invalid email format', 400, 'VALIDATION_ERROR');
  }

  const saved = await coreTeamService.addMember(member);
  const adminEmail = req.adminSession?.username || 'admin';
  req.app?.emit?.('CORE_TEAM_MEMBER_ADDED', {
    adminEmail,
    member: saved,
    timestamp: new Date().toISOString(),
  });
  return sendSuccess(res, saved, 201);
});

export const adminUpdateCoreTeamMember = wrapAsync(async (req, res) => {
  const id = String(req.params.id || '').trim();
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

  if (!member.name || !member.role || !member.year || !member.branch || !member.email) {
    return sendError(req, res, 'Missing required fields', 400, 'VALIDATION_ERROR');
  }
  if (!isEmail(member.email)) {
    return sendError(req, res, 'Invalid email format', 400, 'VALIDATION_ERROR');
  }

  const updated = await coreTeamService.updateMember(id, member);
  if (!updated) throw new NotFoundError('Member not found');
  const adminEmail = req.adminSession?.username || 'admin';
  req.app?.emit?.('CORE_TEAM_MEMBER_UPDATED', {
    adminEmail,
    member: updated,
    timestamp: new Date().toISOString(),
  });
  return sendSuccess(res, updated);
});


export const adminDeleteCoreTeamMember = wrapAsync(async (req, res) => {
  const id = String(req.params.id || '').trim();
  const deleted = await coreTeamService.deleteMember(id);
  if (!deleted) throw new NotFoundError('Member not found');
  return sendSuccess(res, { ok: true });
});

// ── Core Team Application Workflow ──────────────────────────────────────────

/**
 * POST /api/core-team/apply
 * Student submits an application to join the core team.
 */
export const submitApplication = wrapAsync(async (req, res) => {
  const { name, email, year, branch, section, whatsapp, reason } = req.body;

  if (!name || !email || !year || !branch || !section || !whatsapp || !reason) {
    return sendError(req, res, 'All fields are required.', 400, 'VALIDATION_ERROR');
  }

  // Use student session if available, otherwise use email as identifier.
  const studentId = req.user?.id ?? email;

  // Prevent duplicate applications.
  const existing = await coreTeamApplicationsRepository.findByStudentId(studentId);
  if (existing) {
    return sendError(
      req,
      res,
      'You already have a pending or approved application.',
      409,
      'CONFLICT',
      { status: existing.status }
    );
  }

  const application = await coreTeamApplicationsRepository.create({
    studentId,
    name: toSafeString(name, 100),
    email: toSafeString(email, 200),
    year: toSafeString(year, 10),
    branch: toSafeString(branch, 100),
    section: validateSection(section),
    whatsapp: validateWhatsApp(whatsapp),
    reason: toSafeString(reason, 2000),
  });

  return sendSuccess(res, { message: 'Application submitted successfully.', application }, 201);
});

/**
 * GET /api/admin/core-team/applications
 * Admin lists all core team applications.
 */
export const listApplications = wrapAsync(async (req, res) => {
  const { status } = req.query;
  const validStatuses = ['pending', 'approved', 'rejected'];
  const filter = validStatuses.includes(status) ? status : null;
  const applications = await coreTeamApplicationsRepository.list(filter);
  return sendSuccess(res, { applications });
});

/**
 * POST /api/admin/core-team/applications/:id/approve
 * Admin approves an application and adds the student to the core team.
 */
export const approveApplication = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { reviewNote } = req.body;
  const reviewedBy = req.admin?.email ?? 'admin';

  const application = await coreTeamApplicationsRepository.findById(id);
  if (!application) throw new NotFoundError('Application not found');

  if (application.status !== 'pending') {
    return sendError(req, res, `Application is already ${application.status}.`, 409, 'CONFLICT');
  }

  // Update application status.
  const updated = await coreTeamApplicationsRepository.updateStatus(
    id,
    'approved',
    reviewedBy,
    toSafeString(reviewNote ?? '', 500)
  );

  // Add approved applicant to core team.
  await coreTeamService.addMember({
    name: application.name,
    email: application.email,
    year: application.year,
    branch: application.branch,
    section: application.section,
    whatsapp: application.whatsapp,
  });

  return sendSuccess(res, {
    message: 'Application approved and member added to core team.',
    application: updated,
  });
});

/**
 * POST /api/admin/core-team/applications/:id/reject
 * Admin rejects an application.
 */
export const rejectApplication = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { reviewNote } = req.body;
  const reviewedBy = req.admin?.email ?? 'admin';

  const application = await coreTeamApplicationsRepository.findById(id);
  if (!application) throw new NotFoundError('Application not found');

  if (application.status !== 'pending') {
    return sendError(req, res, `Application is already ${application.status}.`, 409, 'CONFLICT');
  }

  const updated = await coreTeamApplicationsRepository.updateStatus(
    id,
    'rejected',
    reviewedBy,
    toSafeString(reviewNote ?? '', 500)
  );

  return sendSuccess(res, {
    message: 'Application rejected.',
    application: updated,
  });
});

// ── Core Team Application Workflow ──────────────────────────────────────────

/**
 * POST /api/core-team/apply
 * Student submits an application to join the core team.
 */

/**
 * GET /api/admin/core-team/applications
 * Admin lists all core team applications.
 */

/**
 * POST /api/admin/core-team/applications/:id/approve
 * Admin approves an application and adds the student to the core team.
 */

/**
 * POST /api/admin/core-team/applications/:id/reject
 * Admin rejects an application.
 */
