import { registrationsRepository } from "../repositories/registrationsRepository.js";
import { eventsRepository } from "../repositories/eventsRepository.js";
import { emitToRole } from "../config/socket.js";

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      const status = e.status || 500;
      res.status(status).json({ error: e?.message || "Internal server error" });
    });
}

export const markAttendance = wrapAsync(async (req, res) => {
  const { eventId, token, email } = req.body;
  if (!eventId && !token && !email) {
    return res
      .status(400)
      .json({ error: "Provide eventId and either token or email" });
  }

  let registration;
  if (token) {
    registration = await registrationsRepository.findByTicketToken(token);
  } else if (email && eventId) {
    registration = await registrationsRepository.findByEmailAndEvent(
      email,
      eventId
    );
  }

  if (!registration) {
    return res.status(404).json({ error: "Registration not found" });
  }

  if (registration.attended) {
    return res.status(200).json({ ...registration, already_attended: true });
  }

  const updated = await registrationsRepository.markAttendance(registration.id);
  if (!updated) {
    return res.status(500).json({ error: "Failed to mark attendance" });
  }

  try {
    emitToRole("events_admin", "admin:attendance-marked", {
      eventId: registration.event_id,
      userName: registration.full_name,
      email: registration.email,
      timestamp: new Date(),
    });
  } catch (e) {
    console.error("[Attendance] Failed to broadcast:", e);
  }

  return res.status(200).json({ ...updated, already_attended: false });
});

export const getAttendanceList = wrapAsync(async (req, res) => {
  const eventId = String(req.params.eventId || "").trim();
  if (!eventId) {
    return res.status(400).json({ error: "Event ID required" });
  }
  const registrations = await registrationsRepository.findByEventId(eventId);
  return res.json({ registrations });
});
