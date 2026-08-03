const express = require('express');
const router = express.Router();
const { adminAuthMiddleware } = require("../middleware/adminAuthMiddleware.js");

const controller = require("../controllers/workflowAutomationController");
const requireAdmin = adminAuthMiddleware ? adminAuthMiddleware.requireAdmin : (req, res, next) => next();

// Workflow CRUD
router.get('/workflows', controller.getAllWorkflows);

router.get('/workflows/:id', controller.getWorkflowById);

router.post(
  "/workflows",
  requireAdmin,
  controller.createWorkflow
);

router.put(
  "/workflows/:id",
  requireAdmin,
  controller.updateWorkflow
);

router.delete(
  "/workflows/:id",
  requireAdmin,
  controller.deleteWorkflow
);

// Workflow Requests
router.post(
  "/requests",
  requireAdmin,
  controller.submitRequest
);

router.put(
  "/requests/:id/approve",
  requireAdmin,
  controller.approveRequest
);

router.put(
  "/requests/:id/reject",
  requireAdmin,
  controller.rejectRequest
);

router.post(
  "/requests/bulk-approve",
  requireAdmin,
  controller.bulkApprove
);

router.get('/requests/pending', controller.getPendingRequests);

// History & Templates
router.get('/history', controller.getApprovalHistory);

router.get('/templates', controller.getWorkflowTemplates);

// Analytics
router.get('/analytics', controller.getWorkflowAnalytics);

// Escalation
router.post(
  "/escalate",
  requireAdmin,
  controller.escalatePendingRequests
);

// Audit Logs
router.get('/audit-logs', controller.getAuditLogs);

module.exports = router;
