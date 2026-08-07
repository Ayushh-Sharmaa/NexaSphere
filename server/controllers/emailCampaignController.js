import { emailCampaignService } from '../services/emailCampaignService.js';
import { sendSuccess, sendError, sendNoContent } from '../utils/responseHelper.js';

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      let status = 500;
      const msg = e.message || '';

      if (msg.includes('Forbidden') || msg.includes('permission')) {
        status = 403;
      } else if (msg.includes('Authentication') || msg.includes('authorized')) {
        status = 401;
      } else if (msg.includes('not found') || msg.includes('Not found')) {
        status = 404;
      } else if (msg.includes('invalid') || msg.includes('required') || msg.includes('Cannot')) {
        status = 400;
      }

      sendError(req, res, msg || 'Internal server error', status);
    });
}

// --- Campaigns ---
export const createCampaign = wrapAsync(async (req, res) => {
  const { name, subject, templateName, content, segmentCriteria, scheduledAt } = req.body;
  if (!name || !subject) {
    return sendError(req, res, 'Campaign name and subject are required', 400, 'VALIDATION_ERROR');
  }

  const campaign = await emailCampaignService.createCampaign(
    { name, subject, templateName, content, segmentCriteria, scheduledAt },
    req.studentUser
  );
  return sendSuccess(res, campaign, 201);
});

export const getCampaigns = wrapAsync(async (req, res) => {
  const { status, limit } = req.query;
  const filters = {};
  if (status) filters.status = status;
  if (limit) filters.limit = parseInt(limit, 10);

  const campaigns = await emailCampaignService.getCampaigns(filters);
  return sendSuccess(res, { campaigns });
});

export const getCampaignById = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const campaign = await emailCampaignService.getCampaignById(id);
  return sendSuccess(res, campaign);
});

export const updateCampaign = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const updated = await emailCampaignService.updateCampaign(id, req.body);
  return sendSuccess(res, updated);
});

export const deleteCampaign = wrapAsync(async (req, res) => {
  const { id } = req.params;
  await emailCampaignService.deleteCampaign(id);
  return sendSuccess(res, { success: true });
});

export const sendCampaign = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const result = await emailCampaignService.sendCampaign(id, req.studentUser);
  return sendSuccess(res, result);
});

export const resendBouncedEmails = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const result = await emailCampaignService.resendBouncedEmails(id);
  return sendSuccess(res, result);
});

export const getCampaignStats = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const stats = await emailCampaignService.getCampaignStats(id);
  return sendSuccess(res, stats);
});

export const getCampaignAnalytics = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const analytics = await emailCampaignService.getCampaignAnalytics(id);
  return sendSuccess(res, { analytics });
});

export const trackOpen = wrapAsync(async (req, res) => {
  const { campaignId, email } = req.query;
  if (!campaignId || !email) {
    return sendError(req, res, 'campaignId and email are required', 400, 'VALIDATION_ERROR');
  }
  await emailCampaignService.trackOpen(campaignId, email);
  // Return a 1x1 transparent pixel
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res.status(200).send(pixel);
});

export const trackClick = wrapAsync(async (req, res) => {
  const { campaignId, email, url } = req.query;
  if (!campaignId || !email) {
    return sendError(req, res, 'campaignId and email are required', 400, 'VALIDATION_ERROR');
  }
  await emailCampaignService.trackClick(campaignId, email);
  return res.redirect(url || '/');
});

// --- Templates ---
export const createTemplate = wrapAsync(async (req, res) => {
  const { name, subject, htmlContent, category } = req.body;
  if (!name || !htmlContent) {
    return sendError(
      req,
      res,
      'Template name and HTML content are required',
      400,
      'VALIDATION_ERROR'
    );
  }

  const template = await emailCampaignService.createTemplate(
    { name, subject, htmlContent, category },
    req.studentUser
  );
  return sendSuccess(res, template, 201);
});

export const getTemplates = wrapAsync(async (req, res) => {
  const { category } = req.query;
  const templates = await emailCampaignService.getTemplates(category || null);
  return sendSuccess(res, { templates });
});

export const getTemplateById = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const template = await emailCampaignService.getTemplateById(id);
  return sendSuccess(res, template);
});

export const updateTemplate = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const updated = await emailCampaignService.updateTemplate(id, req.body);
  return sendSuccess(res, updated);
});

export const deleteTemplate = wrapAsync(async (req, res) => {
  const { id } = req.params;
  await emailCampaignService.deleteTemplate(id);
  return sendSuccess(res, { success: true });
});

// --- Unsubscribe ---
export const unsubscribe = wrapAsync(async (req, res) => {
  const { email, reason } = req.body;
  if (!email) {
    return sendError(req, res, 'Email is required', 400, 'VALIDATION_ERROR');
  }
  await emailCampaignService.unsubscribe(email, reason);
  return sendSuccess(res, { success: true, message: 'You have been unsubscribed' });
});

export const resubscribe = wrapAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return sendError(req, res, 'Email is required', 400, 'VALIDATION_ERROR');
  }
  await emailCampaignService.resubscribe(email);
  return sendSuccess(res, { success: true, message: 'You have been resubscribed' });
});

export const checkUnsubscribed = wrapAsync(async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return sendError(req, res, 'Email is required', 400, 'VALIDATION_ERROR');
  }
  const isUnsubscribed = await emailCampaignService.checkUnsubscribed(email);
  return sendSuccess(res, { isUnsubscribed });
});

// --- Automation Triggers ---
export const createTrigger = wrapAsync(async (req, res) => {
  const { name, triggerType, campaignId, conditions, isActive } = req.body;
  if (!name || !triggerType) {
    return sendError(req, res, 'Trigger name and type are required', 400, 'VALIDATION_ERROR');
  }

  const trigger = await emailCampaignService.createTrigger(
    { name, triggerType, campaignId, conditions, isActive },
    req.studentUser
  );
  return sendSuccess(res, trigger, 201);
});

export const getTriggers = wrapAsync(async (req, res) => {
  const triggers = await emailCampaignService.getTriggers();
  return sendSuccess(res, { triggers });
});

export const updateTrigger = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const updated = await emailCampaignService.updateTrigger(id, req.body);
  return sendSuccess(res, updated);
});

export const deleteTrigger = wrapAsync(async (req, res) => {
  const { id } = req.params;
  await emailCampaignService.deleteTrigger(id);
  return sendSuccess(res, { success: true });
});
