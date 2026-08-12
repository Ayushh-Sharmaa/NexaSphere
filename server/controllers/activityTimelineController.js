import { activityTimelineService } from '../services/activityTimelineService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const getTimeline = (req, res) => {
  const userId = req.params.userId;

  sendSuccess(res, {
    timeline: activityTimelineService.getTimeline(userId),
  });
};

export const addActivity = (req, res) => {
  const userId = req.params.userId;

  activityTimelineService.addActivity(userId, req.body);

  sendSuccess(res, {
    message: 'Activity added.',
  });
};

export const getSummary = (req, res) => {
  sendSuccess(res, activityTimelineService.getMonthlySummary(req.params.userId));
};

export const getStats = (req, res) => {
  sendSuccess(res, activityTimelineService.getStats(req.params.userId));
};
