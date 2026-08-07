import { notificationPreferenceService } from '../services/notificationPreferenceService.js';
import { sendSuccess } from '../utils/responseHelper.js';

export const getPreferences = (req, res) => {
  sendSuccess(res, notificationPreferenceService.getPreferences(req.params.userId));
};

export const updatePreferences = (req, res) => {
  const updated = notificationPreferenceService.updatePreferences(req.params.userId, req.body);

  sendSuccess(res, updated);
};

export const getHistory = (req, res) => {
  sendSuccess(res, {
    history: notificationPreferenceService.getHistory(req.params.userId),
  });
};
