const draftService = require('../services/draftRecoveryService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

function getAuthenticatedUserId(req) {
  return req.studentUser?.sub || req.user?.id;
}

exports.createDraft = (req, res) => {
  try {
    const { userId } = req.params;
    const authUserId = getAuthenticatedUserId(req);

    if (userId !== authUserId) {
      return sendError(req, res, 'Access denied: can only create drafts for yourself', 403, 'FORBIDDEN');
    }

    const { module, title, content } = req.body;
    const draft = draftService.createDraft(userId, module, title, content);

    sendSuccess(res, { message: 'Draft created successfully', draft }, 201);
  } catch (err) {
    sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

exports.getDraft = (req, res) => {
  const draft = draftService.getDraft(req.params.draftId);

  if (!draft) {
    return sendError(req, res, 'Draft not found', 404, 'NOT_FOUND');
  }

  const authUserId = getAuthenticatedUserId(req);
  if (draft.userId !== authUserId) {
    return sendError(req, res, 'Access denied: can only view your own drafts', 403, 'FORBIDDEN');
  }

  sendSuccess(res, { draft });
};

exports.listDrafts = (req, res) => {
  const { userId } = req.params;
  const authUserId = getAuthenticatedUserId(req);

  if (userId !== authUserId) {
    return sendError(req, res, 'Access denied: can only view your own drafts', 403, 'FORBIDDEN');
  }

  const drafts = draftService.listDrafts(userId);
  sendSuccess(res, { drafts });
};

exports.updateDraft = (req, res) => {
  const draft = draftService.getDraft(req.params.draftId);

  if (!draft) {
    return sendError(req, res, 'Draft not found', 404, 'NOT_FOUND');
  }

  const authUserId = getAuthenticatedUserId(req);
  if (draft.userId !== authUserId) {
    return sendError(req, res, 'Access denied: can only update your own drafts', 403, 'FORBIDDEN');
  }

  const updatedDraft = draftService.updateDraft(req.params.draftId, req.body.content);
  sendSuccess(res, { message: 'Draft auto-saved', draft: updatedDraft });
};

exports.deleteDraft = (req, res) => {
  const draft = draftService.getDraft(req.params.draftId);

  if (!draft) {
    return sendError(req, res, 'Draft not found', 404, 'NOT_FOUND');
  }

  const authUserId = getAuthenticatedUserId(req);
  if (draft.userId !== authUserId) {
    return sendError(req, res, 'Access denied: can only delete your own drafts', 403, 'FORBIDDEN');
  }

  const deleted = draftService.deleteDraft(req.params.draftId);
  sendSuccess(res, { success: deleted });
};

exports.restoreDraft = (req, res) => {
  const draft = draftService.getDraft(req.params.draftId);

  if (!draft) {
    return sendError(req, res, 'Draft not found', 404, 'NOT_FOUND');
  }

  const authUserId = getAuthenticatedUserId(req);
  if (draft.userId !== authUserId) {
    return sendError(req, res, 'Access denied: can only restore your own drafts', 403, 'FORBIDDEN');
  }

  const version = draftService.restoreDraft(req.params.draftId);
  sendSuccess(res, { version });
};

exports.versionHistory = (req, res) => {
  const draft = draftService.getDraft(req.params.draftId);

  if (!draft) {
    return sendError(req, res, 'Draft not found', 404, 'NOT_FOUND');
  }

  const authUserId = getAuthenticatedUserId(req);
  if (draft.userId !== authUserId) {
    return sendError(req, res, 'Access denied: can only view history of your own drafts', 403, 'FORBIDDEN');
  }

  sendSuccess(res, { versions: draftService.versionHistory(req.params.draftId) });
};

exports.syncDraft = (req, res) => {
  const draft = draftService.getDraft(req.params.draftId);

  if (!draft) {
    return sendError(req, res, 'Draft not found', 404, 'NOT_FOUND');
  }

  const authUserId = getAuthenticatedUserId(req);
  if (draft.userId !== authUserId) {
    return sendError(req, res, 'Access denied: can only sync your own drafts', 403, 'FORBIDDEN');
  }

  sendSuccess(res, { draft: draftService.syncDraft(req.params.draftId) });
};

exports.statistics = (req, res) => {
  sendSuccess(res, { statistics: draftService.getStatistics() });
};
