const workflowAutomationService = require('../services/workflowAutomationService');

exports.getAllWorkflows = (req, res) => {
  res.status(200).json(workflowAutomationService.getAllWorkflows());
};

exports.getWorkflowById = (req, res) => {
  res.status(200).json(workflowAutomationService.getWorkflowById(req.params.id));
};

exports.createWorkflow = (req, res) => {
  res.status(201).json(workflowAutomationService.createWorkflow(req.body));
};

exports.updateWorkflow = (req, res) => {
  res.status(200).json(workflowAutomationService.updateWorkflow(req.params.id, req.body));
};

exports.deleteWorkflow = (req, res) => {
  res.status(200).json(workflowAutomationService.deleteWorkflow(req.params.id));
};

exports.submitRequest = (req, res) => {
  res.status(201).json(workflowAutomationService.submitRequest(req.body));
};

exports.approveRequest = (req, res) => {
  res.status(200).json(workflowAutomationService.approveRequest(req.params.id, req.body.approver));
};

exports.rejectRequest = (req, res) => {
  res.status(200).json(workflowAutomationService.rejectRequest(req.params.id, req.body.approver));
};

exports.bulkApprove = (req, res) => {
  res.status(200).json(workflowAutomationService.bulkApprove(req.body.ids));
};

exports.getPendingRequests = (req, res) => {
  res.status(200).json(workflowAutomationService.getPendingRequests());
};

exports.getApprovalHistory = (req, res) => {
  res.status(200).json(workflowAutomationService.getApprovalHistory());
};

exports.getWorkflowTemplates = (req, res) => {
  res.status(200).json(workflowAutomationService.getWorkflowTemplates());
};

exports.getWorkflowAnalytics = (req, res) => {
  res.status(200).json(workflowAutomationService.getWorkflowAnalytics());
};

exports.escalatePendingRequests = (req, res) => {
  res.status(200).json(workflowAutomationService.escalatePendingRequests());
};

exports.getAuditLogs = (req, res) => {
  res.status(200).json(workflowAutomationService.getAuditLogs());
};
