const express = require('express');
const router = express.Router();
const { requireStudentAuth } = require('../middleware/studentAuthMiddleware');
const { requireAdmin } = require('../middleware/adminAuthMiddleware');

const notificationCampaignController = require('../controllers/notificationCampaignController');

router.use(requireStudentAuth);

// Campaign CRUD (admin only)
router.get('/', requireAdmin, notificationCampaignController.getAllCampaigns);
router.get('/:id', requireAdmin, notificationCampaignController.getCampaignById);
router.post('/', requireAdmin, notificationCampaignController.createCampaign);
router.put('/:id', requireAdmin, notificationCampaignController.updateCampaign);
router.delete('/:id', requireAdmin, notificationCampaignController.deleteCampaign);

// Campaign Scheduling & Management (admin only)
router.post('/:id/schedule', requireAdmin, notificationCampaignController.scheduleCampaign);
router.post('/:id/send', requireAdmin, notificationCampaignController.sendCampaign);
router.post('/:id/pause', requireAdmin, notificationCampaignController.pauseCampaign);
router.post('/:id/resume', requireAdmin, notificationCampaignController.resumeCampaign);

// Campaign History (admin only)
router.get('/history', requireAdmin, notificationCampaignController.getCampaignHistory);

// Templates (admin only)
router.get('/templates', requireAdmin, notificationCampaignController.getTemplates);
router.post('/templates', requireAdmin, notificationCampaignController.createTemplate);

// Audience Segments (admin only)
router.get('/segments', requireAdmin, notificationCampaignController.getAudienceSegments);

// Analytics (admin only)
router.get('/analytics/:id', requireAdmin, notificationCampaignController.getAnalytics);

// A/B Testing (admin only)
router.post('/ab-test', requireAdmin, notificationCampaignController.createABTest);

module.exports = router;
