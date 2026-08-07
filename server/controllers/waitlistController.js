import { waitlistService } from "../services/waitlistService.js";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export const joinWaitlist = async (req, res) => {
  try {
    const result = await waitlistService.joinWaitlist(req.body);

    return sendSuccess(res, {
      message: "User added to waitlist successfully.",
      data: result,
    });
  } catch (err) {
    console.error(err);

    return sendError(
      req,
      res,
      "Failed to join waitlist.",
      500,
      "INTERNAL_ERROR"
    );
  }
};

export const getPosition = async (req, res) => {
  try {
    const { eventId, userId } = req.query;

    const position = await waitlistService.getPosition(eventId, userId);

    return sendSuccess(res, {
      data: position,
    });
  } catch (err) {
    console.error(err);

    return sendError(
      req,
      res,
      "Failed to fetch waitlist position.",
      500,
      "INTERNAL_ERROR"
    );
  }
};

export const autoEnroll = async (req, res) => {
  try {
    const { eventId } = req.body;

    const enrolled = await waitlistService.autoEnroll(eventId);

    return sendSuccess(res, {
      message: "Auto-enrollment completed.",
      data: enrolled,
    });
  } catch (err) {
    console.error(err);

    return sendError(
      req,
      res,
      "Auto-enrollment failed.",
      500,
      "INTERNAL_ERROR"
    );
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await waitlistService.notifications();

    return sendSuccess(res, {
      total: notifications.length,
      data: notifications,
    });
  } catch (err) {
    console.error(err);

    return sendError(
      req,
      res,
      "Failed to fetch notifications.",
      500,
      "INTERNAL_ERROR"
    );
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const analytics = await waitlistService.analytics();

    return sendSuccess(res, {
      data: analytics,
    });
  } catch (err) {
    console.error(err);

    return sendError(
      req,
      res,
      "Failed to fetch analytics.",
      500,
      "INTERNAL_ERROR"
    );
  }
};

export const setDeadline = async (req, res) => {
  try {
    const { eventId, deadline } = req.body;

    const result = await waitlistService.setDeadline(eventId, deadline);

    return sendSuccess(res, {
      message: "Registration deadline updated.",
      data: result,
    });
  } catch (err) {
    console.error(err);

    return sendError(
      req,
      res,
      "Failed to update registration deadline.",
      500,
      "INTERNAL_ERROR"
    );
  }
};

import { registrationsRepository } from "../repositories/registrationsRepository.js";

export const getWaitlistForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const waitlist = await registrationsRepository.getWaitlist(eventId);
    return sendSuccess(res, { data: waitlist });
  } catch (err) {
    console.error(err);
    return sendError(
      req,
      res,
      "Failed to fetch waitlist for event.",
      500,
      "INTERNAL_ERROR"
    );
  }
};

export const manuallyPromote = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email } = req.body;

    if (!email) {
      return sendError(
        req,
        res,
        "Email is required to promote a user.",
        400,
        "BAD_REQUEST"
      );
    }

    const promoted = await registrationsRepository.manuallyPromote(
      eventId,
      email
    );

    if (!promoted) {
      return sendError(
        req,
        res,
        "User not found in waitlist or already promoted.",
        404,
        "NOT_FOUND"
      );
    }

    // Optionally broadcast via SSE or socket if needed
    // import { emitToRole } from '../config/socket.js';
    // emitToRole('events_admin', 'admin:waitlist-promoted', { eventId, email });

    return sendSuccess(res, {
      message: "User successfully promoted to confirmed attendee.",
      data: promoted,
    });
  } catch (err) {
    console.error(err);
    return sendError(
      req,
      res,
      "Failed to promote user from waitlist.",
      500,
      "INTERNAL_ERROR"
    );
  }
};
