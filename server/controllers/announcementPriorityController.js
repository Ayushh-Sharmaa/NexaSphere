import { announcementPriorityService } from '../services/announcementPriorityService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const getAnnouncements = async (req, res) => {
  try {
    const announcements = announcementPriorityService.getAnnouncements();
    return sendSuccess(res, { announcements });
  } catch (error) {
    console.error(error);

    return sendError(req, res, 'Failed to fetch announcements', 500, 'INTERNAL_ERROR');
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const announcement = announcementPriorityService.createAnnouncement(req.body);
    return sendSuccess(res, { announcement }, 201);
  } catch (error) {
    console.error(error);

    return sendError(req, res, 'Failed to create announcement', 500, 'INTERNAL_ERROR');
  }
};

export const updatePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    const announcement = announcementPriorityService.updatePriority(id, priority);
    if (!announcement) {
      return sendError(req, res, 'Announcement not found', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, { announcement });
  } catch (error) {
    console.error(error);

    return sendError(req, res, 'Failed to update priority', 500, 'INTERNAL_ERROR');
  }
};

export const pinAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { pinned } = req.body;
    const announcement = announcementPriorityService.pinAnnouncement(id, pinned);
    if (!announcement) {
      return sendError(req, res, 'Announcement not found', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, { announcement });
  } catch (error) {
    console.error(error);

    return sendError(req, res, 'Failed to pin announcement', 500, 'INTERNAL_ERROR');
  }
};

export const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const announcement = announcementPriorityService.markAnnouncementRead(id, userId);
    if (!announcement) {
      return sendError(req, res, 'Announcement not found', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, { announcement });
  } catch (error) {
    console.error(error);

    return sendError(req, res, 'Failed to mark announcement as read', 500, 'INTERNAL_ERROR');
  }
};

export const analytics = async (req, res) => {
  try {
    const data = announcementPriorityService.getAnalytics();
    return sendSuccess(res, { analytics: data });
  } catch (error) {
    console.error(error);

    return sendError(req, res, 'Failed to fetch analytics', 500, 'INTERNAL_ERROR');
  }
};
