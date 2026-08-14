import { sendSuccess, sendError } from "../utils/responseHelper.js";
import { eventsRepository } from "../repositories/eventsRepository.js";
import { registrationsRepository } from "../repositories/registrationsRepository.js";
import { venueLayoutsRepository } from "../repositories/venueLayoutsRepository.js";

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      console.error("[venueLayoutsController]", e);
      res
        .status(e.status || 500)
        .json({ error: e?.message || "Internal server error" });
    });
}

function normalizeGridData(value) {
  const gridData = value && typeof value === "object" ? value : {};
  const rows = Number(gridData.rows);
  const cols = Number(gridData.cols);
  const cells = Array.isArray(gridData.cells) ? gridData.cells : [];

  if (!Number.isInteger(rows) || rows < 1 || rows > 50) {
    const err = new Error("rows must be an integer between 1 and 50");
    err.status = 400;
    throw err;
  }
  if (!Number.isInteger(cols) || cols < 1 || cols > 50) {
    const err = new Error("cols must be an integer between 1 and 50");
    err.status = 400;
    throw err;
  }

  const allowedTypes = new Set(["SEAT", "VIP", "AISLE", "BLOCKED"]);
  const normalizedCells = cells.map((cell) => ({
    row: Number(cell.row),
    col: Number(cell.col),
    code: String(cell.code || "")
      .trim()
      .toUpperCase(),
    type: allowedTypes.has(cell.type) ? cell.type : "SEAT",
  }));

  if (
    normalizedCells.some(
      (cell) =>
        !cell.code ||
        cell.row < 1 ||
        cell.col < 1 ||
        cell.row > rows ||
        cell.col > cols
    )
  ) {
    const err = new Error("cells must include valid row, col, and code values");
    err.status = 400;
    throw err;
  }

  return { rows, cols, cells: normalizedCells };
}

export const listVenueLayouts = wrapAsync(async (_req, res) => {
  const layouts = await venueLayoutsRepository.list();
  return sendSuccess(res, { layouts });
});

export const createVenueLayout = wrapAsync(async (req, res) => {
  const name = String(req.body.name || "")
    .trim()
    .slice(0, 120);
  if (!name) {
    return sendError(
      req,
      res,
      "Layout name is required",
      400,
      "VALIDATION_ERROR"
    );
  }
  const gridData = normalizeGridData(req.body.gridData);
  const layout = await venueLayoutsRepository.create({ name, gridData });
  return sendSuccess(res, { layout }, 201);
});

export const getEventSeatMap = wrapAsync(async (req, res) => {
  const eventId = String(req.params.eventId || "").trim();
  const event = await eventsRepository.getById(eventId);
  if (!event) {
    return sendError(req, res, "Event not found", 404, "EVENT_NOT_FOUND");
  }
  if (!event.venueLayoutId) {
    return sendSuccess(res, { layout: null, occupiedSeats: [] });
  }

  const [layout, occupiedSeats] = await Promise.all([
    venueLayoutsRepository.getById(event.venueLayoutId),
    registrationsRepository.findOccupiedSeats(eventId),
  ]);

  return sendSuccess(res, { layout, occupiedSeats });
});
