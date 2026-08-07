const express = require('express');
const router = express.Router();

const notificationCampaignController = require('../controllers/notificationCampaignController');

// Campaign CRUD
router.get('/', notificationCampaignController.getAllCampaigns);
router.get('/:id', notificationCampaignController.getCampaignById);
router.post('/', notificationCampaignController.createCampaign);
router.put('/:id', notificationCampaignController.updateCampaign);
router.delete('/:id', notificationCampaignController.deleteCampaign);

// Campaign Scheduling & Management
router.post('/:id/schedule', notificationCampaignController.scheduleCampaign);
router.post('/:id/send', notificationCampaignController.sendCampaign);
router.post('/:id/pause', notificationCampaignController.pauseCampaign);
router.post('/:id/resume', notificationCampaignController.resumeCampaign);

// Campaign History
router.get('/history', notificationCampaignController.getCampaignHistory);

// Templates
router.get('/templates', notificationCampaignController.getTemplates);
router.post('/templates', notificationCampaignController.createTemplate);

// Audience Segments
router.get('/segments', notificationCampaignController.getAudienceSegments);

// Analytics
router.get('/analytics/:id', notificationCampaignController.getAnalytics);

// A/B Testing
router.post('/ab-test', notificationCampaignController.createABTest);

module.exports = router;
