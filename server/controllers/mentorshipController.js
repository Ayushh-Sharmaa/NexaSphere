import { mentorshipService } from '../services/mentorshipService.js';
import {
  registerMentorSchema,
  updateMentorSchema,
  requestMentorshipSchema,
  logSessionSchema,
  buddyPairSchema,
  mentorshipPaginationSchema,
} from '../schemas/mentorshipSchema.js';
import { sendSuccess, sendError, sendNoContent } from '../utils/responseHelper.js';

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      console.error('[mentorshipController]', e);
      return sendError(req, res, e.message || 'Internal server error', 500, 'INTERNAL_ERROR');
      return res.status(500).json({ error: e.message || 'Internal server error' });
    });
}

export const listMentors = wrapAsync(async (req, res) => {
  const { page, limit, domain, q } = mentorshipPaginationSchema.parse(req.query);
  const result = await mentorshipService.listMentors({ page, limit, domain, q });
  return sendSuccess(res, {
    mentors: result.rows,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit) || 1,
    },
  return res.json({
    mentors: result.rows,
    pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) || 1 },
  });
});

export const getMentor = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return sendError(req, res, 'Invalid mentor ID', 400, 'VALIDATION_ERROR');
  const mentor = await mentorshipService.getMentor(id);
  if (!mentor) return sendError(req, res, 'Mentor not found', 404, 'NOT_FOUND');
  return sendSuccess(res, { mentor });
});

export const registerMentor = wrapAsync(async (req, res) => {
  if (!req.studentUser) {
    return sendError(req, res, 'Authentication required', 401, 'UNAUTHORIZED');
  }
  const input = registerMentorSchema.parse({
    ...req.body,
    name: req.studentUser.name,
    email: req.studentUser.email,
  });
  const mentor = await mentorshipService.registerMentor(input);
  if (!mentor) return sendError(req, res, 'Mentorship system is offline', 503, 'DEPENDENCY_ERROR');
  return sendSuccess(res, { mentor }, 201);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid mentor ID' });
  const mentor = await mentorshipService.getMentor(id);
  if (!mentor) return res.status(404).json({ error: 'Mentor not found' });
  return res.json({ mentor });
});

export const registerMentor = wrapAsync(async (req, res) => {
  const input = registerMentorSchema.parse(req.body);
  const mentor = await mentorshipService.registerMentor(input);
  if (!mentor) return res.status(503).json({ error: 'Mentorship system is offline' });
  return res.status(201).json({ mentor });
});

export const updateMentor = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return sendError(req, res, 'Invalid mentor ID', 400, 'VALIDATION_ERROR');
  if (!req.studentUser) {
    return sendError(req, res, 'Authentication required', 401, 'UNAUTHORIZED');
  }

  const mentor = await mentorshipService.getMentor(id);
  if (!mentor) return sendError(req, res, 'Mentor not found', 404, 'NOT_FOUND');

  const isAdmin = req.studentUser.role === 'admin';
  if (mentor.email !== req.studentUser.email && !isAdmin) {
    return sendError(req, res, 'Forbidden: You do not own this mentor profile', 403, 'FORBIDDEN');
  }

  const input = updateMentorSchema.parse(req.body);
  const updated = await mentorshipService.updateMentor(id, input);
  return sendSuccess(res, { mentor: updated });
});

export const requestMentorship = wrapAsync(async (req, res) => {
  if (!req.studentUser) {
    return sendError(req, res, 'Authentication required', 401, 'UNAUTHORIZED');
  }
  const input = requestMentorshipSchema.parse({
    ...req.body,
    mentee_name: req.studentUser.name,
    mentee_email: req.studentUser.email,
  });
  const mentorship = await mentorshipService.requestMentorship(input);
  if (!mentorship)
    return sendError(req, res, 'Mentorship system is offline', 503, 'DEPENDENCY_ERROR');
  return sendSuccess(res, { mentorship }, 201);
});

export const listMentorships = wrapAsync(async (req, res) => {
  if (!req.studentUser) {
    return sendError(req, res, 'Authentication required', 401, 'UNAUTHORIZED');
  }
  const { page, limit, status } = req.query;
  const isAdmin = req.studentUser.role === 'admin';
  const email = isAdmin && req.query.email ? req.query.email : req.studentUser.email;

  if (isNaN(id)) return res.status(400).json({ error: 'Invalid mentor ID' });
  const input = updateMentorSchema.parse(req.body);
  const mentor = await mentorshipService.updateMentor(id, input);
  if (!mentor) return res.status(404).json({ error: 'Mentor not found' });
  return res.json({ mentor });
});

export const requestMentorship = wrapAsync(async (req, res) => {
  const input = requestMentorshipSchema.parse(req.body);
  const mentorship = await mentorshipService.requestMentorship(input);
  if (!mentorship) return res.status(503).json({ error: 'Mentorship system is offline' });
  return res.status(201).json({ mentorship });
});

export const listMentorships = wrapAsync(async (req, res) => {
  const { page, limit, status } = req.query;
  const email = req.query.email || req.user?.email;
  const result = await mentorshipService.listMentorships({
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 20)),
    status: status || undefined,
    email: isAdmin && !req.query.email ? undefined : email,
  });
  return sendSuccess(res, { mentorships: result.rows, total: result.total });
    email,
  });
  return res.json({ mentorships: result.rows, total: result.total });
});

export const getMentorship = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return sendError(req, res, 'Invalid mentorship ID', 400, 'VALIDATION_ERROR');
  if (!req.studentUser) {
    return sendError(req, res, 'Authentication required', 401, 'UNAUTHORIZED');
  }

  const mentorship = await mentorshipService.getMentorship(id);
  if (!mentorship) return sendError(req, res, 'Mentorship not found', 404, 'NOT_FOUND');

  const mentor = await mentorshipService.getMentor(mentorship.mentorId);
  const mentorEmail = mentor ? mentor.email : null;

  const isAdmin = req.studentUser.role === 'admin';
  const isAuthorized =
    isAdmin ||
    mentorship.menteeEmail === req.studentUser.email ||
    mentorEmail === req.studentUser.email;
  if (!isAuthorized) {
    return sendError(
      req,
      res,
      'Forbidden: You are not authorized to view this mentorship',
      403,
      'FORBIDDEN'
    );
  }

  return sendSuccess(res, { mentorship });
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid mentorship ID' });
  const mentorship = await mentorshipService.getMentorship(id);
  if (!mentorship) return res.status(404).json({ error: 'Mentorship not found' });
  return res.json({ mentorship });
});

export const updateMentorshipStatus = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return sendError(req, res, 'Invalid mentorship ID', 400, 'VALIDATION_ERROR');
  if (!req.studentUser && !req.adminSession) {
    return sendError(req, res, 'Authentication required', 401, 'UNAUTHORIZED');
  }

  const mentorship = await mentorshipService.getMentorship(id);
  if (!mentorship) return sendError(req, res, 'Mentorship not found', 404, 'NOT_FOUND');

  const { status } = req.body;
  if (!['active', 'rejected', 'completed'].includes(status)) {
    return sendError(
      req,
      res,
      'Invalid status. Must be active, rejected, or completed',
      400,
      'VALIDATION_ERROR'
    );
  }

  const isAdmin = req.adminSession || req.studentUser?.role === 'admin';
  const mentor = await mentorshipService.getMentor(mentorship.mentorId);
  const mentorEmail = mentor ? mentor.email : null;

  const isMentor = req.studentUser && req.studentUser.email === mentorEmail;
  const isMentee = req.studentUser && req.studentUser.email === mentorship.menteeEmail;

  if (!isAdmin && !isMentor && !isMentee) {
    return sendError(
      req,
      res,
      'Forbidden: You are not authorized to update this status',
      403,
      'FORBIDDEN'
    );
  }

  if (isMentee && !isAdmin && status !== 'completed') {
    return sendError(
      req,
      res,
      'Forbidden: Mentees can only mark mentorship as completed',
      403,
      'FORBIDDEN'
    );
  }

  const updated = await mentorshipService.updateMentorshipStatus(id, status);
  return sendSuccess(res, { mentorship: updated });
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid mentorship ID' });
  const { status } = req.body;
  if (!['active', 'rejected', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be active, rejected, or completed' });
  }
  const mentorship = await mentorshipService.updateMentorshipStatus(id, status);
  if (!mentorship) return res.status(404).json({ error: 'Mentorship not found' });
  return res.json({ mentorship });
});

export const logSession = wrapAsync(async (req, res) => {
  const mentorshipId = parseInt(req.params.id, 10);
  if (isNaN(mentorshipId))
    return sendError(req, res, 'Invalid mentorship ID', 400, 'VALIDATION_ERROR');
  if (!req.studentUser) {
    return sendError(req, res, 'Authentication required', 401, 'UNAUTHORIZED');
  }

  const mentorship = await mentorshipService.getMentorship(mentorshipId);
  if (!mentorship) return sendError(req, res, 'Mentorship not found', 404, 'NOT_FOUND');

  const mentor = await mentorshipService.getMentor(mentorship.mentorId);
  const mentorEmail = mentor ? mentor.email : null;

  const isAdmin = req.studentUser.role === 'admin';
  const isAuthorized =
    isAdmin ||
    mentorship.menteeEmail === req.studentUser.email ||
    mentorEmail === req.studentUser.email;
  if (!isAuthorized) {
    return sendError(
      req,
      res,
      'Forbidden: You are not authorized to log sessions for this mentorship',
      403,
      'FORBIDDEN'
    );
  }

  const input = logSessionSchema.parse(req.body);
  const session = await mentorshipService.logSession(mentorshipId, input);
  if (!session) return sendError(req, res, 'Failed to log session', 404, 'NOT_FOUND');
  return sendSuccess(res, { session }, 201);
  if (isNaN(mentorshipId)) return res.status(400).json({ error: 'Invalid mentorship ID' });
  const input = logSessionSchema.parse(req.body);
  const session = await mentorshipService.logSession(mentorshipId, input);
  if (!session) return res.status(404).json({ error: 'Mentorship not found' });
  return res.status(201).json({ session });
});

export const listSessions = wrapAsync(async (req, res) => {
  const mentorshipId = parseInt(req.params.id, 10);
  if (isNaN(mentorshipId))
    return sendError(req, res, 'Invalid mentorship ID', 400, 'VALIDATION_ERROR');
  if (!req.studentUser) {
    return sendError(req, res, 'Authentication required', 401, 'UNAUTHORIZED');
  }

  const mentorship = await mentorshipService.getMentorship(mentorshipId);
  if (!mentorship) return sendError(req, res, 'Mentorship not found', 404, 'NOT_FOUND');

  const mentor = await mentorshipService.getMentor(mentorship.mentorId);
  const mentorEmail = mentor ? mentor.email : null;

  const isAdmin = req.studentUser.role === 'admin';
  const isAuthorized =
    isAdmin ||
    mentorship.menteeEmail === req.studentUser.email ||
    mentorEmail === req.studentUser.email;
  if (!isAuthorized) {
    return sendError(
      req,
      res,
      'Forbidden: You are not authorized to view sessions for this mentorship',
      403,
      'FORBIDDEN'
    );
  }

  if (isNaN(mentorshipId)) return res.status(400).json({ error: 'Invalid mentorship ID' });
  const { page, limit } = req.query;
  const result = await mentorshipService.listSessions(mentorshipId, {
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 50)),
  });
  return sendSuccess(res, { sessions: result.rows, total: result.total });
});

export const createBuddyPair = wrapAsync(async (req, res) => {
  if (!req.studentUser) {
    return sendError(req, res, 'Authentication required', 401, 'UNAUTHORIZED');
  }
  const input = buddyPairSchema.parse(req.body);

  const isAdmin = req.studentUser.role === 'admin';
  const isSelf =
    input.buddy1_email === req.studentUser.email || input.buddy2_email === req.studentUser.email;
  if (!isSelf && !isAdmin) {
    return sendError(
      req,
      res,
      'Forbidden: You can only register buddy pairings for yourself',
      403,
      'FORBIDDEN'
    );
  }

  const pair = await mentorshipService.createBuddyPair(input);
  if (!pair) return sendError(req, res, 'Mentorship system is offline', 503, 'DEPENDENCY_ERROR');
  return sendSuccess(res, { pair }, 201);
});

export const listBuddyPairs = wrapAsync(async (req, res) => {
  if (!req.studentUser) {
    return sendError(req, res, 'Authentication required', 401, 'UNAUTHORIZED');
  }
  const { page, limit } = req.query;
  const isAdmin = req.studentUser.role === 'admin';
  const email = isAdmin && req.query.email ? req.query.email : req.studentUser.email;

  const result = await mentorshipService.listBuddyPairs({
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 50)),
    email: isAdmin && !req.query.email ? undefined : email,
  });
  return sendSuccess(res, { pairs: result.rows, total: result.total });
  return res.json({ sessions: result.rows, total: result.total });
});

export const createBuddyPair = wrapAsync(async (req, res) => {
  const input = buddyPairSchema.parse(req.body);
  const pair = await mentorshipService.createBuddyPair(input);
  if (!pair) return res.status(503).json({ error: 'Mentorship system is offline' });
  return res.status(201).json({ pair });
});

export const listBuddyPairs = wrapAsync(async (req, res) => {
  const { page, limit, email } = req.query;
  const result = await mentorshipService.listBuddyPairs({
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 50)),
    email,
  });
  return res.json({ pairs: result.rows, total: result.total });
});

export const adminListAll = wrapAsync(async (req, res) => {
  const { page, limit, status } = req.query;
  const result = await mentorshipService.adminListAll({
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 50)),
    status,
  });
  return sendSuccess(res, { mentorships: result.rows, total: result.total });
  return res.json({ mentorships: result.rows, total: result.total });
});

export const adminListMentors = wrapAsync(async (req, res) => {
  const { page, limit } = req.query;
  const result = await mentorshipService.adminListMentors({
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 50)),
  });
  return sendSuccess(res, { mentors: result.rows, total: result.total });
  return res.json({ mentors: result.rows, total: result.total });
});
