const express = require('express');
const router = express.Router();
const { requireStudentAuth } = require('../middleware/studentAuthMiddleware');
const { requireAdmin } = require('../middleware/adminAuthMiddleware');

const reportingCenterController = require('../controllers/reportingCenterController');

router.use(requireStudentAuth);

// Get all reports (admin only)
router.get('/reports', requireAdmin, reportingCenterController.getReports);

// Export data (CSV, Excel, PDF) (admin only)
router.post('/export', requireAdmin, reportingCenterController.exportData);

// Schedule report generation (admin only)
router.post('/schedule', requireAdmin, reportingCenterController.scheduleReport);

// Generate custom report (admin only)
router.post('/custom', requireAdmin, reportingCenterController.generateCustomReport);

// Report templates (admin only)
router.get('/templates', requireAdmin, reportingCenterController.getTemplates);
router.post('/templates', requireAdmin, reportingCenterController.saveTemplate);

// Email report (admin only)
router.post('/email', requireAdmin, reportingCenterController.emailReport);

// Dashboard summary (admin only)
router.get('/dashboard', requireAdmin, reportingCenterController.getDashboardSummary);

// Report history (admin only)
router.get('/history', requireAdmin, reportingCenterController.getReportHistory);

// Audit logs (admin only)
router.get('/audit', requireAdmin, reportingCenterController.getAuditLogs);

// Advanced filtering (admin only)
router.get('/filter', requireAdmin, reportingCenterController.filterReports);

// Permission-based exports (admin only)
router.get('/permissions', requireAdmin, reportingCenterController.getPermissions);

module.exports = router;
