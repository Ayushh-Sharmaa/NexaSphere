import { mentorshipService } from "../services/mentorshipService.js";
import {
  registerMentorSchema,
  updateMentorSchema,
  requestMentorshipSchema,
  logSessionSchema,
  buddyPairSchema,
  mentorshipPaginationSchema,
} from "../schemas/mentorshipSchema.js";

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      console.error("[mentorshipController]", e);
      return res
        .status(500)
        .json({ error: e.message || "Internal server error" });
    });
}

export const listMentors = wrapAsync(async (req, res) => {
  const { page, limit, domain, q } = mentorshipPaginationSchema.parse(
    req.query
  );
  const result = await mentorshipService.listMentors({
    page,
    limit,
    domain,
    q,
  });
  return res.json({
    mentors: result.rows,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit) || 1,
    },
  });
});

export const getMentor = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid mentor ID" });
  const mentor = await mentorshipService.getMentor(id);
  if (!mentor) return res.status(404).json({ error: "Mentor not found" });
  return res.json({ mentor });
});

export const registerMentor = wrapAsync(async (req, res) => {
  const input = registerMentorSchema.parse(req.body);
  const mentor = await mentorshipService.registerMentor(input);
  if (!mentor)
    return res.status(503).json({ error: "Mentorship system is offline" });
  return res.status(201).json({ mentor });
});

export const updateMentor = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid mentor ID" });
  const input = updateMentorSchema.parse(req.body);
  const mentor = await mentorshipService.updateMentor(id, input);
  if (!mentor) return res.status(404).json({ error: "Mentor not found" });
  return res.json({ mentor });
});

export const requestMentorship = wrapAsync(async (req, res) => {
  const input = requestMentorshipSchema.parse(req.body);
  const mentorship = await mentorshipService.requestMentorship(input);
  if (!mentorship)
    return res.status(503).json({ error: "Mentorship system is offline" });
  return res.status(201).json({ mentorship });
});

export const listMentorships = wrapAsync(async (req, res) => {
  const { page, limit, status } = req.query;
  const email = req.query.email || req.user?.email;
  const result = await mentorshipService.listMentorships({
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 20)),
    status: status || undefined,
    email,
  });
  return res.json({ mentorships: result.rows, total: result.total });
});

export const getMentorship = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id))
    return res.status(400).json({ error: "Invalid mentorship ID" });
  const mentorship = await mentorshipService.getMentorship(id);
  if (!mentorship)
    return res.status(404).json({ error: "Mentorship not found" });
  return res.json({ mentorship });
});

export const updateMentorshipStatus = wrapAsync(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id))
    return res.status(400).json({ error: "Invalid mentorship ID" });
  const { status } = req.body;
  if (!["active", "rejected", "completed"].includes(status)) {
    return res.status(400).json({
      error: "Invalid status. Must be active, rejected, or completed",
    });
  }
  const mentorship = await mentorshipService.updateMentorshipStatus(id, status);
  if (!mentorship)
    return res.status(404).json({ error: "Mentorship not found" });
  return res.json({ mentorship });
});

export const logSession = wrapAsync(async (req, res) => {
  const mentorshipId = parseInt(req.params.id, 10);
  if (isNaN(mentorshipId))
    return res.status(400).json({ error: "Invalid mentorship ID" });
  const input = logSessionSchema.parse(req.body);
  const session = await mentorshipService.logSession(mentorshipId, input);
  if (!session) return res.status(404).json({ error: "Mentorship not found" });
  return res.status(201).json({ session });
});

export const listSessions = wrapAsync(async (req, res) => {
  const mentorshipId = parseInt(req.params.id, 10);
  if (isNaN(mentorshipId))
    return res.status(400).json({ error: "Invalid mentorship ID" });
  const { page, limit } = req.query;
  const result = await mentorshipService.listSessions(mentorshipId, {
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 50)),
  });
  return res.json({ sessions: result.rows, total: result.total });
});

export const createBuddyPair = wrapAsync(async (req, res) => {
  const input = buddyPairSchema.parse(req.body);
  const pair = await mentorshipService.createBuddyPair(input);
  if (!pair)
    return res.status(503).json({ error: "Mentorship system is offline" });
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
  return res.json({ mentorships: result.rows, total: result.total });
});

export const adminListMentors = wrapAsync(async (req, res) => {
  const { page, limit } = req.query;
  const result = await mentorshipService.adminListMentors({
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 50)),
  });
  return res.json({ mentors: result.rows, total: result.total });
});
