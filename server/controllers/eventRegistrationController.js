import { capacityLockingService } from "../services/capacityLockingService.js";
import { ticketService } from "../services/ticketService.js";
import { calendarService } from "../services/calendarService.js";
import { registrationsRepository } from "../repositories/registrationsRepository.js";
import { eventsRepository } from "../repositories/eventsRepository.js";
import { emitToRole } from "../config/socket.js";
import { broadcastSSEEvent } from "../services/sseService.js";
import { recordEventRegistration } from "../observability/metrics.js";

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      const status = e.status || 500;
      res.status(status).json({ error: e?.message || "Internal server error" });
    });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EVENT_ID_REGEX = /^[a-zA-Z0-9\-_]{1,100}$/;

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

  if (!eventId || !EVENT_ID_REGEX.test(eventId)) {
    return res.status(400).json({ error: "Invalid event ID" });
  }
  if (!sanitizedFullName) {
    return res.status(400).json({ error: "Full name is required" });
  }
  if (!sanitizedEmail || !EMAIL_REGEX.test(sanitizedEmail)) {
    return res.status(400).json({ error: "Valid email address is required" });
  }

  const event = await eventsRepository.getById(eventId);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  try {
    const result = await capacityLockingService.registerForEvent(
      eventId,
      sanitizedFullName,
      sanitizedEmail
    );

    const ticket = await ticketService.generateTicket({
      eventId,
      eventName: event.name,
      dateText: event.date_text,
      location: event.location,
      fullName: sanitizedFullName,
      email: sanitizedEmail,
    });

    await registrationsRepository.create({
      eventId,
      fullName: sanitizedFullName,
      email: sanitizedEmail,
      department,
      year,
      teamName,
      teamSize,
      customFields,
      waitlist: false,
    });

    if (ticket.token) {
      await registrationsRepository.updateTicketToken(
        result.id || result.registration_id,
        ticket.token
      );
    }

    try {
      broadcastSSEEvent("event_registration", {
        eventId,
        fullName: sanitizedFullName,
        timestamp: new Date().toISOString(),
      });
      emitToRole("events_admin", "admin:event-registration", {
        eventId,
        userName: sanitizedFullName,
        timestamp: new Date(),
      });
    } catch (realtimeErr) {
      console.error("[EventRegistration] Failed to broadcast:", realtimeErr);
    }

    recordEventRegistration();
    return res.status(201).json({ ...result, ticket });
  } catch (e) {
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
