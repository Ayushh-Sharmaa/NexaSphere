/**
 * Reporting Center Service
 * Mock implementation for Platform-Wide Data Export & Reporting Center
 */

const reports = [
  {
    id: 1,
    name: "Event Registration Report",
    type: "CSV",
    status: "Completed",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Attendance Analytics",
    type: "PDF",
    status: "Completed",
    createdAt: new Date().toISOString(),
  },
];

const templates = [
  {
    id: 1,
    name: "Monthly Event Summary",
    filters: {
      module: "events",
      format: "PDF",
    },
  },
];

const scheduledReports = [];

const reportHistory = [];

const auditLogs = [];

// Get All Reports
export const getReports = async () => reports;

// Get Scheduled Reports
export const getScheduledReports = async () => scheduledReports;

// Export Data
export const exportData = async (data) => {
  const nextId =
    reports.length > 0 ? Math.max(...reports.map((r) => r.id)) + 1 : 1;
  const report = {
    id: reports.length + 1,
    name: data.name || "Custom Export",
    type: data.format || "CSV",
    status: "Completed",
    exportedAt: new Date().toISOString(),
  };

  reports.push(report);
  reportHistory.push(report);

  auditLogs.push({
    action: "Export Generated",
    report: report.name,
    timestamp: new Date().toISOString(),
  });

  return report;
};

// Schedule Report
export const scheduleReport = async (data) => ({
  id: Date.now(),
  schedule: data.schedule,
  format: data.format,
  status: "Scheduled",
});

// Generate Custom Report
export const generateCustomReport = async (data) => ({
  id: Date.now(),
  title: data.title || "Custom Report",
  filters: data.filters || {},
  generatedAt: new Date().toISOString(),
});

// Save Template
export const saveTemplate = async (data) => {
  const nextId =
    templates.length > 0 ? Math.max(...templates.map((t) => t.id)) + 1 : 1;
  const template = {
    id: nextId,
    ...data,
  };

  templates.push(template);

  return template;
};

// Get Templates
export const getTemplates = async () => templates;

// Email Report
export const emailReport = async (data) => ({
  email: data.email,
  report: data.report,
  status: "Sent",
  sentAt: new Date().toISOString(),
});

// Dashboard Summary
export const getDashboardSummary = async () => ({
  totalReports: reports.length,
  scheduledReports: scheduledReports.length,
  exportedToday: reportHistory.filter(
    (r) =>
      new Date(r.exportedAt || r.createdAt).toDateString() ===
      new Date().toDateString()
  ).length,
  totalDownloads: auditLogs.length,
});

// Report History
export const getReportHistory = async () => reportHistory;

// Audit Logs
export const getAuditLogs = async () => auditLogs;

// Filter Reports
export const filterReports = async (filters) => {
  let filtered = [...reports];

  if (filters.type) {
    filtered = filtered.filter(
      (report) => report.type.toLowerCase() === filters.type.toLowerCase()
    );
  }

  if (filters.status) {
    filtered = filtered.filter(
      (report) => report.status.toLowerCase() === filters.status.toLowerCase()
    );
  }

  return filtered;
};

// Export Permissions
export const getPermissions = async () => ({
  admin: true,
  organizer: true,
  faculty: false,
  student: false,
});
