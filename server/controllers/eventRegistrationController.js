import { capacityLockingService } from "../services/capacityLockingService.js";
import { ticketService } from "../services/ticketService.js";
import { calendarService } from "../services/calendarService.js";
import QRCode from "qrcode";
import { registrationsRepository } from "../repositories/registrationsRepository.js";
import { eventsRepository } from "../repositories/eventsRepository.js";
import { emitToRole } from "../config/socket.js";
import { broadcastSSEEvent } from "../services/sseService.js";
import { recordEventRegistration } from "../observability/metrics.js";
import { supabaseRequest } from "../storage/supabaseClient.js";
import {
  sendSuccess,
  sendError,
  sendNoContent,
} from "../utils/responseHelper.js";
import { seatLockService } from "../services/seatLockService.js"; // Helper for Redis seat locking

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      const status = e.status || 500;
      res.status(status).json({ error: e?.message || "Internal server error" });
    });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EVENT_ID_REGEX = /^[a-zA-Z0-9\-_]{1,100}$/;
const SEAT_CODE_REGEX = /^[a-zA-Z0-9\-_]{1,20}$/;

export const registerForEvent = wrapAsync(async (req, res) => {
  const eventId = String(req.params.eventId || "").trim();
  const sanitizedFullName = String(req.body.fullName || "")
    .trim()
    .slice(0, 120);
  const sanitizedEmail = String(req.body.email || "")
    .trim()
    .toLowerCase()
    .slice(0, 140);
  const department =
    String(req.body.department || "")
      .trim()
      .slice(0, 80) || null;
  const year =
    String(req.body.year || "")
      .trim()
      .slice(0, 20) || null;
  const teamName =
    String(req.body.teamName || "")
      .trim()
      .slice(0, 120) || null;
  const teamSize = parseInt(req.body.teamSize, 10) || null;
  const customFields = req.body.customFields || null;
  const attendanceMode =
    req.body.attendanceMode === "virtual" ? "virtual" : "in_person";

  // Feature #3318: Parse seat code parameter
  const seatCode = req.body.seatCode
    ? String(req.body.seatCode).trim().toUpperCase()
    : null;

  if (!eventId || !EVENT_ID_REGEX.test(eventId)) {
    return res.status(400).json({ error: "Invalid event ID" });
  }
  if (!sanitizedFullName) {
    return res.status(400).json({ error: "Full name is required" });
  }
  if (!sanitizedEmail || !EMAIL_REGEX.test(sanitizedEmail)) {
    return res.status(400).json({ error: "Valid email address is required" });
  }
  if (seatCode && !SEAT_CODE_REGEX.test(seatCode)) {
    return sendError(
      req,
      res,
      "Invalid seat code format",
      400,
      "VALIDATION_ERROR"
    );
  }

  const event = await eventsRepository.getById(eventId);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  // Feature #3318: Check seat availability & apply 5-min Redis concurrency lock
  let seatLockAcquired = false;
  if (seatCode) {
    const isOccupied = await registrationsRepository.isSeatTaken(
      eventId,
      seatCode
    );
    if (isOccupied) {
      return sendError(
        req,
        res,
        `Seat ${seatCode} is already booked`,
        409,
        "SEAT_OCCUPIED"
      );
    }

    seatLockAcquired = await seatLockService.acquireLock(
      eventId,
      seatCode,
      sanitizedEmail
    );
    if (!seatLockAcquired) {
      return sendError(
        req,
        res,
        `Seat ${seatCode} is currently held by another user. Try again shortly.`,
        409,
        "SEAT_LOCKED"
      );
    }
  }

  try {
    const result = await capacityLockingService.registerForEvent(
      eventId,
      sanitizedFullName,
      sanitizedEmail,
      attendanceMode
    );

    const ticket = await ticketService.generateTicket({
      eventId,
      eventName: event.name,
      dateText: event.date_text,
      location: event.location,
      fullName: sanitizedFullName,
      email: sanitizedEmail,
      seatCode: seatCode || "General Admission", // Pass seatCode to PDF generator
    });

    let localReg;
    try {
      localReg = await registrationsRepository.create({
        eventId,
        fullName: sanitizedFullName,
        email: sanitizedEmail,
        department,
        year,
        teamName,
        teamSize,
        customFields,
        seatCode, // Feature #3318: Save assigned seatCode in Postgres
        attendanceMode,
        waitlist: false,
      });

      if (ticket.token && localReg?.id) {
        await registrationsRepository.updateTicketToken(
          localReg.id,
          ticket.token
        );
      }

      // Permanent lock conversion: Release temporary Redis lock since DB transaction succeeded
      if (seatCode && seatLockAcquired) {
        await seatLockService.releaseLock(eventId, seatCode);
      }
    } catch (pgErr) {
      // Roll back seat lock if registration fails
      if (seatCode && seatLockAcquired) {
        await seatLockService.releaseLock(eventId, seatCode);
      }

      try {
        await supabaseRequest(
          `event_registrations?event_id=eq.${encodeURIComponent(eventId)}&email=eq.${encodeURIComponent(sanitizedEmail)}`,
          { method: "DELETE" }
        );
      } catch (rollbackErr) {
        console.error(
          "[EventRegistration] Compensating delete failed — orphaned Supabase row for",
          sanitizedEmail,
          rollbackErr.message
        );
      }
      throw pgErr;
    }

    try {
      broadcastSSEEvent("event_registration", {
        eventId,
        fullName: sanitizedFullName,
        seatCode,
        timestamp: new Date().toISOString(),
      });
      emitToRole("events_admin", "admin:event-registration", {
        eventId,
        userName: sanitizedFullName,
        seatCode,
        timestamp: new Date(),
      });
    } catch (realtimeErr) {
      console.error("[EventRegistration] Failed to broadcast:", realtimeErr);
    }

    recordEventRegistration();
    return sendSuccess(res, { ...result, seatCode, ticket }, 201);
  } catch (e) {
    // Release temporary Redis lock on failure
    if (seatCode && seatLockAcquired) {
      await seatLockService.releaseLock(eventId, seatCode);
    }

    if (e.message?.includes("Event capacity has been reached")) {
      const waitlistEntry = await registrationsRepository.create({
        eventId,
        fullName: sanitizedFullName,
        email: sanitizedEmail,
        department,
        year,
        teamName,
        teamSize,
        customFields,
        waitlist: true,
      });
      try {
        emitToRole("events_admin", "admin:waitlist-added", {
          eventId,
          userName: sanitizedFullName,
          timestamp: new Date(),
        });
      } catch (realtimeErr) {
        console.error(
          "[EventRegistration] Failed to broadcast waitlist:",
          realtimeErr
        );
      }
      const err = new Error(
        "Event capacity has been reached. You have been added to the waitlist."
      );
      err.status = 409;
      err.waitlistEntry = waitlistEntry;
      throw err;
    }
    throw e;
  }
});

export const cancelRegistration = wrapAsync(async (req, res) => {
  const eventId = String(req.params.eventId || "").trim();
  const sanitizedEmail = String(req.body.email || "")
    .trim()
    .toLowerCase()
    .slice(0, 140);

  if (!eventId || !EVENT_ID_REGEX.test(eventId)) {
    return sendError(req, res, "Invalid event ID", 400, "VALIDATION_ERROR");
  }
  if (!sanitizedEmail || !EMAIL_REGEX.test(sanitizedEmail)) {
    return sendError(
      req,
      res,
      "Valid email address is required",
      400,
      "VALIDATION_ERROR"
    );
  }

  // Ownership check
  const authenticatedEmail = (req.studentUser?.email || "").toLowerCase();
  if (authenticatedEmail !== sanitizedEmail) {
    return sendError(
      req,
      res,
      "Forbidden: you can only cancel your own registration",
      403,
      "FORBIDDEN"
    );
  }

  const event = await eventsRepository.getById(eventId);
  if (!event) {
    return sendError(req, res, "Event not found", 404, "NOT_FOUND");
  }

  // Fetch registration to retrieve assigned seat before cancellation
  const existingReg = await registrationsRepository.getByEmail(
    eventId,
    sanitizedEmail
  );

  const cancelled = await registrationsRepository.cancelConfirmedRegistration(
    eventId,
    sanitizedEmail
  );
  if (!cancelled) {
    return sendError(
      req,
      res,
      "No confirmed registration found for this email",
      404,
      "NOT_FOUND"
    );
  }

  // Feature #3318: Release seat lock in Redis if seat was previously booked
  if (existingReg?.seat_code) {
    await seatLockService.releaseLock(eventId, existingReg.seat_code);
  }

  const promoted = await registrationsRepository.promoteFromWaitlist(eventId);

  if (promoted) {
    try {
      emitToRole("events_admin", "admin:waitlist-promoted", {
        eventId,
        userName: promoted.full_name,
        email: promoted.email,
        timestamp: new Date(),
      });
      broadcastSSEEvent("waitlist_promotion", {
        eventId,
        email: promoted.email,
        timestamp: new Date().toISOString(),
      });
    } catch (realtimeErr) {
      console.error(
        "[EventRegistration] Failed to broadcast promotion:",
        realtimeErr
      );
    }
  }

  return sendSuccess(res, {
    cancelled: true,
    freedSeat: existingReg?.seat_code || null,
    promoted: promoted
      ? { fullName: promoted.full_name, email: promoted.email }
      : null,
  });
});

export const getEventCalendar = wrapAsync(async (req, res) => {
  const eventId = String(req.params.eventId || "").trim();
  if (!eventId || !EVENT_ID_REGEX.test(eventId)) {
    return res.status(400).json({ error: "Invalid event ID" });
  }
  const event = await eventsRepository.getById(eventId);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }
  const ics = calendarService.generateIcsEvent({
    name: event.name,
    dateText: event.date_text,
    description: event.description,
    location: event.location,
    eventId,
  });
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${event.name || "event"}.ics"`
  );
  return res.send(ics);
});

export const getFullCalendarFeed = wrapAsync(async (req, res) => {
  const events = await eventsRepository.list({ page: 1, limit: 100 });
  const allEvents = events?.rows || [];

  const calendarContent = allEvents
    .map((ev) =>
      calendarService.generateIcsEvent({
        name: ev.name,
        dateText: ev.date_text,
        description: ev.description,
        location: ev.location,
        eventId: ev.id,
      })
    )
    .join("\n");

  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//NexaSphere//Events//EN\n${calendarContent}\nEND:VCALENDAR`;

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="nexasphere-events.ics"'
  );
  return res.send(ics);
});

export const getWaitlistPosition = wrapAsync(async (req, res) => {
  const eventId = String(req.params.eventId || "").trim();
  const email = String(req.query.email || "")
    .trim()
    .toLowerCase()
    .slice(0, 140);

  if (!eventId || !EVENT_ID_REGEX.test(eventId)) {
    return res.status(400).json({ error: "Invalid event ID" });
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: "Valid email address is required" });
  }

  const [position, totalWaitlisted] = await Promise.all([
    registrationsRepository.getPosition(eventId, email),
    registrationsRepository.getWaitlistCount(eventId),
  ]);

  if (position === null) {
    return res
      .status(404)
      .json({ error: "Not on the waitlist for this event" });
  }

  return res.status(200).json({ position, totalWaitlisted });
});

export const getRegistrationQr = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const registration = await registrationsRepository.findById(id);

  if (!registration) {
    return sendError(req, res, "Registration not found", 404, "NOT_FOUND");
  }

  // Generate QR code data URL containing the ticket token
  const qrDataUrl = await QRCode.toDataURL(
    registration.ticket_token || registration.id
  );
  return sendSuccess(res, { qrCode: qrDataUrl });
});

export const leaveWaitlist = wrapAsync(async (req, res) => {
  const eventId = String(req.params.eventId || "").trim();
  const sanitizedEmail = String(req.body.email || "")
    .trim()
    .toLowerCase()
    .slice(0, 140);

  if (!eventId || !EVENT_ID_REGEX.test(eventId)) {
    return res.status(400).json({ error: "Invalid event ID" });
  }
  if (!sanitizedEmail || !EMAIL_REGEX.test(sanitizedEmail)) {
    return res.status(400).json({ error: "Valid email address is required" });
  }

  const removed = await registrationsRepository.removeFromWaitlist(
    eventId,
    sanitizedEmail
  );
  if (!removed) {
    return res
      .status(404)
      .json({ error: "No waitlist entry found for this email" });
  }

  return res
    .status(200)
    .json({ success: true, message: "Removed from waitlist" });
});

export const confirmWaitlistSpot = wrapAsync(async (req, res) => {
  const eventId = String(req.params.eventId || "").trim();
  const sanitizedEmail = String(req.body.email || "")
    .trim()
    .toLowerCase()
    .slice(0, 140);

  if (!eventId || !EVENT_ID_REGEX.test(eventId)) {
    return res.status(400).json({ error: "Invalid event ID" });
  }
  if (!sanitizedEmail || !EMAIL_REGEX.test(sanitizedEmail)) {
    return res.status(400).json({ error: "Valid email address is required" });
  }

  const confirmed = await registrationsRepository.confirmWaitlistSpot(
    eventId,
    sanitizedEmail
  );
  if (!confirmed) {
    return res
      .status(404)
      .json({ error: "No pending waitlist promotion found for this email" });
  }

  return sendSuccess(res, {
    success: true,
    message: "Spot confirmed successfully",
  });
});
