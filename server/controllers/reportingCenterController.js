const reportingCenterService = require('../services/reportingCenterService');

// Get All Reports
const getReports = async (req, res) => {
  try {
    const reports = await reportingCenterService.getReports();

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports.',
      error: error.message,
    });
  }
};

// Export Data
const exportData = async (req, res) => {
  try {
    const report = await reportingCenterService.exportData(req.body);

    res.status(200).json({
      success: true,
      message: 'Data exported successfully.',
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export data.',
      error: error.message,
    });
  }
};

// Schedule Report
const scheduleReport = async (req, res) => {
  try {
    const schedule = await reportingCenterService.scheduleReport(req.body);

    res.status(201).json({
      success: true,
      message: 'Report scheduled successfully.',
      data: schedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to schedule report.',
      error: error.message,
    });
  }
};

// Generate Custom Report
const generateCustomReport = async (req, res) => {
  try {
    const report = await reportingCenterService.generateCustomReport(req.body);

    res.status(200).json({
      success: true,
      message: 'Custom report generated successfully.',
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate custom report.',
      error: error.message,
    });
  }
};

// Save Report Template
const saveTemplate = async (req, res) => {
  try {
    const template = await reportingCenterService.saveTemplate(req.body);

    res.status(201).json({
      success: true,
      message: 'Template saved successfully.',
      data: template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save template.',
      error: error.message,
    });
  }
};

// Get Templates
const getTemplates = async (req, res) => {
  try {
    const templates = await reportingCenterService.getTemplates();

    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates.',
      error: error.message,
    });
  }
};

// Email Report
const emailReport = async (req, res) => {
  try {
    const result = await reportingCenterService.emailReport(req.body);

    res.status(200).json({
      success: true,
      message: 'Report emailed successfully.',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to email report.',
      error: error.message,
    });
  }
};

// Dashboard Summary
const getDashboardSummary = async (req, res) => {
  try {
    const summary = await reportingCenterService.getDashboardSummary();

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary.',
      error: error.message,
    });
  }
};

// Report History
const getReportHistory = async (req, res) => {
  try {
    const history = await reportingCenterService.getReportHistory();

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report history.',
      error: error.message,
    });
  }
};

// Audit Logs
const getAuditLogs = async (req, res) => {
  try {
    const logs = await reportingCenterService.getAuditLogs();

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs.',
      error: error.message,
    });
  }
};

// Filter Reports
const filterReports = async (req, res) => {
  try {
    const reports = await reportingCenterService.filterReports(req.query);

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to filter reports.',
      error: error.message,
    });
  }
};

// Export Permissions
const getPermissions = async (req, res) => {
  try {
    const permissions = await reportingCenterService.getPermissions();

    res.status(200).json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions.',
      error: error.message,
    });
  }
};

module.exports = {
  getReports,
  exportData,
  scheduleReport,
  generateCustomReport,
  saveTemplate,
  getTemplates,
  emailReport,
  getDashboardSummary,
  getReportHistory,
  getAuditLogs,
  filterReports,
  getPermissions,
};
