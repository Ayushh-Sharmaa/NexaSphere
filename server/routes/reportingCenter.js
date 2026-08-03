const express = require('express');
const router = express.Router();

const reportingCenterController = require('../controllers/reportingCenterController');

// Get all reports
router.get('/reports', reportingCenterController.getReports);

// Export data (CSV, Excel, PDF)
router.post('/export', reportingCenterController.exportData);

// Schedule report generation
router.post('/schedule', reportingCenterController.scheduleReport);

// Generate custom report
router.post('/custom', reportingCenterController.generateCustomReport);

// Report templates
router.get('/templates', reportingCenterController.getTemplates);
router.post('/templates', reportingCenterController.saveTemplate);

// Email report
router.post('/email', reportingCenterController.emailReport);

// Dashboard summary
router.get('/dashboard', reportingCenterController.getDashboardSummary);

// Report history
router.get('/history', reportingCenterController.getReportHistory);

// Audit logs
router.get('/audit', reportingCenterController.getAuditLogs);

// Advanced filtering
router.get('/filter', reportingCenterController.filterReports);

// Permission-based exports
router.get('/permissions', reportingCenterController.getPermissions);

module.exports = router;
