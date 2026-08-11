const express = require('express');
const router = express.Router();
const { requireStudentAuth } = require('../middleware/studentAuthMiddleware');
const { requireAdmin } = require('../middleware/adminAuthMiddleware');

const maintenanceController = require('../controllers/maintenanceController');

// Public Maintenance Status (no auth required)
router.get('/public', maintenanceController.getPublicStatus);

// Countdown Timer (public)
router.get('/countdown/:id', maintenanceController.getCountdown);

// Status Banner (public)
router.get('/banner', maintenanceController.getStatusBanner);

// Service Impact (public)
router.get('/services', maintenanceController.getServiceImpact);

router.use(requireStudentAuth);

// Maintenance CRUD (admin only)
router.get('/', requireAdmin, maintenanceController.getAllMaintenance);
router.get('/:id', requireAdmin, maintenanceController.getMaintenanceById);
router.post('/', requireAdmin, maintenanceController.createMaintenance);
router.put('/:id', requireAdmin, maintenanceController.updateMaintenance);
router.delete('/:id', requireAdmin, maintenanceController.deleteMaintenance);

// Maintenance Actions (admin only)
router.post('/:id/start', requireAdmin, maintenanceController.startMaintenance);
router.post('/:id/complete', requireAdmin, maintenanceController.completeMaintenance);
router.post('/emergency', requireAdmin, maintenanceController.emergencyMaintenance);

// Maintenance History (admin only)
router.get('/history', requireAdmin, maintenanceController.getHistory);

// Notifications (admin only)
router.post('/notify', requireAdmin, maintenanceController.sendNotifications);

// Admin Approval (admin only)
router.post('/approve/:id', requireAdmin, maintenanceController.approveMaintenance);

module.exports = router;
