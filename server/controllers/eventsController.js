import { sendSuccess, sendError } from '../utils/responseHelper.js';
import { eventsService } from '../services/eventsService.js';
import { paginationSchema } from '../validators/eventSchemas.js';
import { emitToRole } from '../config/socket.js';

function wrapAsync(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      // Log the full error server-side so it is visible in monitoring.
      // Return only a generic string to the client: raw error messages can
      // expose database column names, table names, file paths, or library
      // internals that help an attacker profile the stack.
      console.error('[eventsController]', e);
      res.status(500).json({ error: 'Internal server error' });
    });
}

// Parses and clamps ?page and ?limit from a request query object.
function parsePagination(query) {
  const { page, limit } = paginationSchema.parse(query);
  return { page, limit };
}

function buildPaginationMeta(page, limit, total) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) || 1 };
}

const ALLOWED_EVENT_STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'];

export const listEvents = wrapAsync(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const status = ALLOWED_EVENT_STATUSES.includes(req.query.status) ? req.query.status : undefined;

  const { startDate, endDate, category, location, search } = req.query;

  let studentGroups = undefined;
  const authHeader = req.headers.authorization;
  let token =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.ns_student_token || null;

  
  
  if (token) {
    // Import dynamically to avoid top-level circular dependencies if any
    const { studentAuthService } = await import('../services/studentAuthService.js');
    const { userGroupsRepository } = await import('../repositories/userGroupsRepository.js');
    const payload = studentAuthService.verifyToken(token);
    if (payload && payload.id) {
      studentGroups = await userGroupsRepository.getUserGroupIds(payload.id);
    }
  }

  // Redis caching (15 min). Cache key must include studentGroups scope.
  const { hashKeyParts, getOrSet } = await import('../utils/endpointCache.js');
  const scopeHash = hashKeyParts(studentGroups || []);
  const cacheKey = `cache:endpoint:events:listing:${hashKeyParts(
    req.query?.status,
    page,
    limit,
    scopeHash
  )}`;

  const { data, hit } = await getOrSet({
    key: cacheKey,
    ttlSeconds: 60 * 15,
    getValue: async () => {
      const { rows, total } = await eventsService.listEvents({
        page,
        limit,
        status,
        studentGroups,
      });
      return { events: rows, pagination: buildPaginationMeta(page, limit, total) };
    },
  });

  res.setHeader('X-Cache', hit ? 'HIT' : 'MISS');
  return sendSuccess(res, data);
  const { rows, total } = await eventsService.listEvents({ page, limit, status, studentGroups });
});