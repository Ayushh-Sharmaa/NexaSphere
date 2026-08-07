import { eventsService } from "../services/eventsService.js";
import { paginationSchema } from "../validators/eventSchemas.js";

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      console.error("[wrapAsync error]", e);

      res.status(500).json({
        error: "Internal server error",
      });
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

const ALLOWED_EVENT_STATUSES = [
  "upcoming",
  "ongoing",
  "completed",
  "cancelled",
];

export const listEvents = wrapAsync(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const status = ALLOWED_EVENT_STATUSES.includes(req.query.status)
    ? req.query.status
    : undefined;
  const { rows, total } = await eventsService.listEvents({
    page,
    limit,
    status,
  });
  return res.json({
    events: rows,
    pagination: buildPaginationMeta(page, limit, total),
  });
});

export const adminListEvents = wrapAsync(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { rows, total } = await eventsService.adminListEvents({ page, limit });
  return res.json({
    events: rows,
    pagination: buildPaginationMeta(page, limit, total),
  });
});

export const adminCreateEvent = wrapAsync(async (req, res) => {
  const created = await eventsService.createEvent(req.body);
  return res.status(201).json({ ok: true, event: created });
});

export const adminUpdateEvent = wrapAsync(async (req, res) => {
  const id = String(req.params.id || "").trim();
  const updated = await eventsService.updateEvent(id, req.body);
  if (!updated) return res.status(404).json({ error: "Event not found" });
  return res.json({ ok: true, event: updated });
});

export const adminDeleteEvent = wrapAsync(async (req, res) => {
  const id = String(req.params.id || "").trim();
  const deleted = await eventsService.deleteEvent(id);
  if (!deleted) return res.status(404).json({ error: "Event not found" });
  return res.json({ ok: true });
});
