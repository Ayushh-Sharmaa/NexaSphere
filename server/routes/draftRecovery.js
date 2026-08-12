const express = require('express');
const router = express.Router();

const controller = require('../controllers/draftRecoveryController');

// Create Draft
router.post('/:userId', controller.createDraft);

// Get All Drafts
router.get('/:userId', controller.listDrafts);

// Get Single Draft
router.get('/:userId/:draftId', controller.getDraft);

// Update Draft (Auto Save)
router.put('/:draftId', controller.updateDraft);

// Delete Draft
router.delete('/:draftId', controller.deleteDraft);

// Restore Latest Version
router.post('/:draftId/restore', controller.restoreDraft);

// Version History
router.get('/:draftId/history', controller.versionHistory);

// Cross Device Sync
router.post('/:draftId/sync', controller.syncDraft);

// Dashboard Statistics
router.get('/stats', controller.statistics);

module.exports = router;
