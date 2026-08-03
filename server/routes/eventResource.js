const express = require('express');
const router = express.Router();

const eventResourceController = require('../controllers/eventResourceController');

// Resource CRUD
router.post('/', eventResourceController.createResource);

router.get('/', eventResourceController.getAllResources);

router.get('/:id', eventResourceController.getResourceById);

router.put('/:id', eventResourceController.updateResource);

router.delete('/:id', eventResourceController.deleteResource);

// Reservation Management
router.post('/:id/reserve', eventResourceController.reserveResource);

router.post('/:id/return', eventResourceController.returnResource);

router.post('/:id/assign', eventResourceController.assignResource);

// Maintenance
router.post('/:id/report-damage', eventResourceController.reportDamage);

router.put('/:id/maintenance', eventResourceController.updateMaintenanceStatus);

// Availability & Conflict Detection
router.get('/:id/availability', eventResourceController.checkAvailability);

router.get('/conflicts/all', eventResourceController.detectConflicts);

router.get('/calendar/availability', eventResourceController.getAvailabilityCalendar);

// QR & History
router.get('/:id/qrcode', eventResourceController.generateQRCode);

router.get('/:id/history', eventResourceController.getBorrowHistory);

// Analytics
router.get('/analytics/inventory', eventResourceController.getInventoryAnalytics);

router.get('/analytics/utilization', eventResourceController.getUtilizationReport);

module.exports = router;
