import { supabaseRequest, HAS_SUPABASE } from "../storage/supabaseClient.js";
import { emitToRole } from "../config/socket.js";
import { broadcastSSEEvent } from "./sseService.js";

export const capacityLockingService = {
  async registerForEvent(
    eventId,
    fullName,
    email,
    attendanceMode = "in_person"
  ) {
    if (!HAS_SUPABASE) {
      throw new Error("Supabase is required for event registration");
    }

    try {
      // Use the custom RPC function for atomic capacity check and insertion
      const result = await supabaseRequest("rpc/register_for_event", {
        method: "POST",
        body: {
          p_event_id: eventId,
          p_full_name: fullName,
          p_email: email,
          p_attendance_mode: attendanceMode,
        },
      });

      // Broadcast real-time attendee counter update
      try {
        broadcastSSEEvent("event_registration", {
          eventId,
          fullName,
          timestamp: new Date().toISOString(),
        });
        emitToRole("events_admin", "admin:event-registration", {
          eventId,
          userName: fullName,
          timestamp: new Date(),
        });
      } catch (realtimeErr) {
        console.error(
          "[CapacityLocking Service] Failed to broadcast real-time updates:",
          realtimeErr
        );
      }

      return result;
    } catch (e) {
      if (e.message?.includes("Event capacity has been reached")) {
        const err = new Error("Event capacity has been reached.");
        err.status = 409;
        throw err;
      }
      if (
        e.message?.includes("duplicate key value violates unique constraint") ||
        e.message?.includes("event_registrations_event_id_email_key")
      ) {
        const err = new Error("You have already registered for this event.");
        err.status = 400;
        throw err;
      }
      if (e.message?.includes("Event not found")) {
        const err = new Error("Event not found.");
        err.status = 404;
        throw err;
      }
      throw e;
    }
  },
};
