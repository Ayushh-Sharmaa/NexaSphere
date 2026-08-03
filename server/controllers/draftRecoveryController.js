const draftService = require('../services/draftRecoveryService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

exports.createDraft = (req, res) => {
  try {
    const { userId } = req.params;
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

  sendSuccess(res, { draft });
};

exports.listDrafts = (req, res) => {
  const drafts = draftService.listDrafts(req.params.userId);

  sendSuccess(res, { drafts });
};

exports.updateDraft = (req, res) => {
  const draft = draftService.updateDraft(req.params.draftId, req.body.content);

  if (!draft) {
    return sendError(req, res, 'Draft not found', 404, 'NOT_FOUND');
  }

  sendSuccess(res, { message: 'Draft auto-saved', draft });
};

exports.deleteDraft = (req, res) => {
  const deleted = draftService.deleteDraft(req.params.draftId);

  sendSuccess(res, { success: deleted });
};

exports.restoreDraft = (req, res) => {
  const version = draftService.restoreDraft(req.params.draftId);

  sendSuccess(res, { version });
};

exports.versionHistory = (req, res) => {
  sendSuccess(res, { versions: draftService.versionHistory(req.params.draftId) });
};

exports.syncDraft = (req, res) => {
  sendSuccess(res, { draft: draftService.syncDraft(req.params.draftId) });
};

exports.statistics = (req, res) => {
  sendSuccess(res, { statistics: draftService.getStatistics() });
};
