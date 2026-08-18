import * as notificationCampaignService from "../services/notificationCampaignService.js";

// Get all campaigns
export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await notificationCampaignService.getAllCampaigns();
    res.status(200).json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch campaigns.",
      error: error.message,
    });
  }
};

// Get campaign by ID
export const getCampaignById = async (req, res) => {
  try {
    const campaign = await notificationCampaignService.getCampaignById(
      req.params.id
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch campaign.",
      error: error.message,
    });
  }
};

// Create campaign
export const createCampaign = async (req, res) => {
  try {
    const campaign = await notificationCampaignService.createCampaign(req.body);

    res.status(201).json({
      success: true,
      message: "Campaign created successfully.",
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create campaign.",
      error: error.message,
    });
  }
};

// Update campaign
export const updateCampaign = async (req, res) => {
  try {
    const campaign = await notificationCampaignService.updateCampaign(
      req.params.id,
      req.body
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Campaign updated successfully.",
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update campaign.",
      error: error.message,
    });
  }
};

// Delete campaign
export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await notificationCampaignService.deleteCampaign(
      req.params.id
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Campaign deleted successfully.",
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete campaign.",
      error: error.message,
    });
  }
};

// Schedule campaign
export const scheduleCampaign = async (req, res) => {
  try {
    const campaign = await notificationCampaignService.scheduleCampaign(
      req.params.id,
      req.body
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Campaign scheduled successfully.",
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to schedule campaign.",
      error: error.message,
    });
  }
};

// Send campaign immediately
export const sendCampaign = async (req, res) => {
  try {
    const campaign = await notificationCampaignService.sendCampaign(
      req.params.id
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Campaign sent successfully.",
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send campaign.",
      error: error.message,
    });
  }
};

// Pause campaign
export const pauseCampaign = async (req, res) => {
  try {
    const campaign = await notificationCampaignService.pauseCampaign(
      req.params.id
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Campaign paused successfully.",
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to pause campaign.",
      error: error.message,
    });
  }
};

// Resume campaign
export const resumeCampaign = async (req, res) => {
  try {
    const campaign = await notificationCampaignService.resumeCampaign(
      req.params.id
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Campaign resumed successfully.",
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to resume campaign.",
      error: error.message,
    });
  }
};

// Campaign history
export const getCampaignHistory = async (req, res) => {
  try {
    const history = await notificationCampaignService.getCampaignHistory();

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch campaign history.",
      error: error.message,
    });
  }
};

// Templates
export const getTemplates = async (req, res) => {
  try {
    const templates = await notificationCampaignService.getTemplates();

    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch templates.",
      error: error.message,
    });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const template = await notificationCampaignService.createTemplate(req.body);

    res.status(201).json({
      success: true,
      message: "Template created successfully.",
      data: template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create template.",
      error: error.message,
    });
  }
};

// Audience Segments
export const getAudienceSegments = async (req, res) => {
  try {
    const segments = await notificationCampaignService.getAudienceSegments();

    res.status(200).json({
      success: true,
      data: segments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch audience segments.",
      error: error.message,
    });
  }
};

// Analytics
export const getAnalytics = async (req, res) => {
  try {
    const analytics = await notificationCampaignService.getAnalytics(
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics.",
      error: error.message,
    });
  }
};

// A/B Testing
export const createABTest = async (req, res) => {
  try {
    const result = await notificationCampaignService.createABTest(req.body);

    res.status(201).json({
      success: true,
      message: "A/B test created successfully.",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create A/B test.",
      error: error.message,
    });
  }
};
