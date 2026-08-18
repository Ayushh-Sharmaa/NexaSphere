import * as workflowAutomationService from "../services/workflowAutomationService.js";

export const getAllWorkflows = (req, res) => {
  res.status(200).json(workflowAutomationService.getAllWorkflows());
};

export const getWorkflowById = (req, res) => {
  res
    .status(200)
    .json(workflowAutomationService.getWorkflowById(req.params.id));
};

export const createWorkflow = (req, res) => {
  res.status(201).json(workflowAutomationService.createWorkflow(req.body));
};

export const updateWorkflow = (req, res) => {
  res
    .status(200)
    .json(workflowAutomationService.updateWorkflow(req.params.id, req.body));
};

export const deleteWorkflow = (req, res) => {
  res.status(200).json(workflowAutomationService.deleteWorkflow(req.params.id));
};

export const submitRequest = (req, res) => {
  res.status(201).json(workflowAutomationService.submitRequest(req.body));
};

export const approveRequest = (req, res) => {
  res
    .status(200)
    .json(
      workflowAutomationService.approveRequest(req.params.id, req.body.approver)
    );
};

export const rejectRequest = (req, res) => {
  res
    .status(200)
    .json(
      workflowAutomationService.rejectRequest(req.params.id, req.body.approver)
    );
};

export const bulkApprove = (req, res) => {
  res.status(200).json(workflowAutomationService.bulkApprove(req.body.ids));
};

export const getPendingRequests = (req, res) => {
  res.status(200).json(workflowAutomationService.getPendingRequests());
};

export const getApprovalHistory = (req, res) => {
  res.status(200).json(workflowAutomationService.getApprovalHistory());
};

export const getWorkflowTemplates = (req, res) => {
  res.status(200).json(workflowAutomationService.getWorkflowTemplates());
};

export const getWorkflowAnalytics = (req, res) => {
  res.status(200).json(workflowAutomationService.getWorkflowAnalytics());
};

export const escalatePendingRequests = (req, res) => {
  res.status(200).json(workflowAutomationService.escalatePendingRequests());
};

export const getAuditLogs = (req, res) => {
  res.status(200).json(workflowAutomationService.getAuditLogs());
};
