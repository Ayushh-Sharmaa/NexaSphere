const express = require('express');
const router = express.Router();

const maintenanceController = require('../controllers/maintenanceController');

// Maintenance CRUD
router.get('/', maintenanceController.getAllMaintenance);
router.get('/:id', maintenanceController.getMaintenanceById);
router.post('/', maintenanceController.createMaintenance);
router.put('/:id', maintenanceController.updateMaintenance);
router.delete('/:id', maintenanceController.deleteMaintenance);

// Maintenance Actions
router.post('/:id/start', maintenanceController.startMaintenance);
router.post('/:id/complete', maintenanceController.completeMaintenance);
router.post('/emergency', maintenanceController.emergencyMaintenance);

// Public Maintenance Status
router.get('/public', maintenanceController.getPublicStatus);

// Maintenance History
router.get('/history', maintenanceController.getHistory);

// Countdown Timer
router.get('/countdown/:id', maintenanceController.getCountdown);

// Notifications
router.post('/notify', maintenanceController.sendNotifications);

// Admin Approval
router.post('/approve/:id', maintenanceController.approveMaintenance);

// Status Banner
router.get('/banner', maintenanceController.getStatusBanner);

// Service Impact
router.get('/services', maintenanceController.getServiceImpact);

module.exports = router;
