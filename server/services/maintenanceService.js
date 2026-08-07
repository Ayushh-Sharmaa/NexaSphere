/**
 * Maintenance Management Service
 * Mock implementation for Platform-Wide Scheduled Maintenance Management
 */

const maintenanceList = [
  {
    id: 1,
    title: 'Database Upgrade',
    description: 'Scheduled database maintenance.',
    startTime: '2026-07-20T01:00:00Z',
    endTime: '2026-07-20T03:00:00Z',
    status: 'Scheduled',
    services: ['Authentication', 'Events'],
  },
];

const history = [];

const notifications = [];

const serviceImpact = ['Authentication', 'Events', 'Portfolio', 'Notifications'];

const banner = {
  active: false,
  message: 'No scheduled maintenance.',
};

// Get All
const getAllMaintenance = async () => maintenanceList;

// Get By ID
const getMaintenanceById = async (id) => maintenanceList.find((item) => item.id === Number(id));

// Create
const createMaintenance = async (data) => {
  if (data.startTime && data.endTime && new Date(data.startTime) >= new Date(data.endTime)) {
    throw new Error('Invalid maintenance window: startTime must be before endTime');
  }

  const nextId = maintenanceList.length > 0 ? Math.max(...maintenanceList.map((m) => m.id)) + 1 : 1;
  const maintenance = {
    id: maintenanceList.length + 1,
    status: 'Scheduled',
    createdAt: new Date().toISOString(),
    ...data,
  };

  maintenanceList.push(maintenance);
  return maintenance;
};

// Update
const updateMaintenance = async (id, data) => {
  const index = maintenanceList.findIndex((item) => item.id === Number(id));

  if (index === -1) return null;

  const startTime = data.startTime || maintenanceList[index].startTime;
  const endTime = data.endTime || maintenanceList[index].endTime;
  if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
    throw new Error('Invalid maintenance window: startTime must be before endTime');
  }

  maintenanceList[index] = {
    ...maintenanceList[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  return maintenanceList[index];
};

// Delete
const deleteMaintenance = async (id) => {
  const index = maintenanceList.findIndex((item) => item.id === Number(id));

  if (index === -1) return null;

  return maintenanceList.splice(index, 1)[0];
};

// Start
const startMaintenance = async (id) => {
  const maintenance = maintenanceList.find((item) => item.id === Number(id));

  if (!maintenance) return null;

  maintenance.status = 'In Progress';

  banner.active = true;
  banner.message = `${maintenance.title} is currently in progress.`;

  return maintenance;
};

// Complete
const completeMaintenance = async (id) => {
  const maintenance = maintenanceList.find((item) => item.id === Number(id));

  if (!maintenance) return null;

  maintenance.status = 'Completed';

  history.push(maintenance);

  banner.active = false;
  banner.message = 'No scheduled maintenance.';

  return maintenance;
};

// Emergency Maintenance
const emergencyMaintenance = async (data) => ({
  id: Date.now(),
  type: 'Emergency',
  status: 'Active',
  startedAt: new Date().toISOString(),
  ...data,
});

// Public Status
const getPublicStatus = async () => ({
  maintenance: maintenanceList,
  banner,
});

// History
const getHistory = async () => history;

// Countdown
const getCountdown = async (id) => {
  const maintenance = maintenanceList.find((item) => item.id === Number(id));

  if (!maintenance) return null;

  return {
    id,
    startsAt: maintenance.startTime,
    status: maintenance.status,
  };
};

// Notifications
const sendNotifications = async (data) => {
  const notification = {
    id: notifications.length + 1,
    sentAt: new Date().toISOString(),
    ...data,
  };

  notifications.push(notification);

  return notification;
};

// Approval
const approveMaintenance = async (id) => ({
  maintenanceId: id,
  approved: true,
  approvedAt: new Date().toISOString(),
});

// Banner
const getStatusBanner = async () => banner;

// Service Impact
const getServiceImpact = async () => serviceImpact;

module.exports = {
  getAllMaintenance,
  getMaintenanceById,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  startMaintenance,
  completeMaintenance,
  emergencyMaintenance,
  getPublicStatus,
  getHistory,
  getCountdown,
  sendNotifications,
  approveMaintenance,
  getStatusBanner,
  getServiceImpact,
};
