/**
 * Notification Campaign Service
 * Mock implementation for Intelligent Notification Scheduling &
 * Campaign Management.
 */

const campaigns = [
  {
    id: 1,
    title: 'Welcome Students',
    message: 'Welcome to NexaSphere!',
    channels: ['email', 'in-app'],
    audience: 'Students',
    scheduleTime: '2026-07-10T10:00:00Z',
    timezone: 'Asia/Kolkata',
    recurring: false,
    status: 'Scheduled',
    createdAt: new Date().toISOString(),
  },
];

const templates = [
  {
    id: 1,
    name: 'General Announcement',
    subject: 'Important Update',
    message: 'This is a notification template.',
  },
];

const history = [];

const analytics = {
  totalSent: 250,
  delivered: 242,
  opened: 198,
  clicked: 131,
  failed: 8,
};

// Get all campaigns
const getAllCampaigns = async () => campaigns;

// Get campaign by ID
const getCampaignById = async (id) => campaigns.find((campaign) => campaign.id === Number(id));

// Create campaign
const createCampaign = async (data) => {
  const nextId = campaigns.length > 0 ? Math.max(...campaigns.map((c) => c.id)) + 1 : 1;
  const campaign = {
    id: nextId,
    status: "Draft",
    createdAt: new Date().toISOString(),
    ...data,
  };

  campaigns.push(campaign);
  return campaign;
};

// Update campaign
const updateCampaign = async (id, data) => {
  const index = campaigns.findIndex((campaign) => campaign.id === Number(id));

  if (index === -1) return null;

  campaigns[index] = {
    ...campaigns[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  return campaigns[index];
};

// Delete campaign
const deleteCampaign = async (id) => {
  const index = campaigns.findIndex((campaign) => campaign.id === Number(id));

  if (index === -1) return null;

  return campaigns.splice(index, 1)[0];
};

// Schedule campaign
const scheduleCampaign = async (id, scheduleData) => {
  const campaign = campaigns.find((item) => item.id === Number(id));

  if (!campaign) return null;

  if (scheduleData.scheduleTime && new Date(scheduleData.scheduleTime).getTime() <= Date.now()) {
    throw new Error("Cannot schedule a campaign in the past");
  }

  campaign.scheduleTime = scheduleData.scheduleTime;
  campaign.timezone = scheduleData.timezone || 'UTC';
  campaign.recurring = scheduleData.recurring || false;
  campaign.status = 'Scheduled';

  return campaign;
};

// Send campaign immediately
const sendCampaign = async (id) => {
  const campaign = campaigns.find((item) => item.id === Number(id));

  if (!campaign) return null;

  campaign.status = 'Sent';
  campaign.sentAt = new Date().toISOString();

  history.push({
    campaignId: campaign.id,
    title: campaign.title,
    status: 'Sent',
    timestamp: campaign.sentAt,
  });

  return campaign;
};

// Pause campaign
const pauseCampaign = async (id) => {
  const campaign = campaigns.find((item) => item.id === Number(id));

  if (!campaign) return null;

  campaign.status = 'Paused';
  return campaign;
};

// Resume campaign
const resumeCampaign = async (id) => {
  const campaign = campaigns.find((item) => item.id === Number(id));

  if (!campaign) return null;

  campaign.status = 'Scheduled';
  return campaign;
};

// Campaign history
const getCampaignHistory = async () => history;

// Templates
const getTemplates = async () => templates;

const createTemplate = async (data) => {
  const nextId = templates.length > 0 ? Math.max(...templates.map((t) => t.id)) + 1 : 1;
  const template = {
    id: nextId,
    ...data,
  };

  templates.push(template);
  return template;
};

// Audience Segments
const getAudienceSegments = async () => [
  'Students',
  'Faculty',
  'Staff',
  'Parents',
  'Alumni',
  'Departments',
  'Clubs',
];

// Analytics
const getAnalytics = async () => analytics;

// A/B Test
const createABTest = async (data) => ({
  id: Date.now(),
  status: 'Created',
  ...data,
});

module.exports = {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  scheduleCampaign,
  sendCampaign,
  pauseCampaign,
  resumeCampaign,
  getCampaignHistory,
  getTemplates,
  createTemplate,
  getAudienceSegments,
  getAnalytics,
  createABTest,
};
