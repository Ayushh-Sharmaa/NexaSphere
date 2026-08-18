import * as maintenanceService from "../services/maintenanceService.js";

// Get All Maintenance
export const getAllMaintenance = async (req, res) => {
  try {
    const maintenance = await maintenanceService.getAllMaintenance();

    res.status(200).json({
      success: true,
      data: maintenance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance schedules.",
      error: error.message,
    });
  }
};

// Get Maintenance By ID
export const getMaintenanceById = async (req, res) => {
  try {
    const maintenance = await maintenanceService.getMaintenanceById(
      req.params.id
    );

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance schedule not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: maintenance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance schedule.",
      error: error.message,
    });
  }
};

// Create Maintenance
export const createMaintenance = async (req, res) => {
  try {
    const maintenance = await maintenanceService.createMaintenance(req.body);

    res.status(201).json({
      success: true,
      message: "Maintenance scheduled successfully.",
      data: maintenance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create maintenance schedule.",
      error: error.message,
    });
  }
};

// Update Maintenance
export const updateMaintenance = async (req, res) => {
  try {
    const maintenance = await maintenanceService.updateMaintenance(
      req.params.id,
      req.body
    );

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance schedule not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Maintenance updated successfully.",
      data: maintenance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update maintenance schedule.",
      error: error.message,
    });
  }
};

// Delete Maintenance
export const deleteMaintenance = async (req, res) => {
  try {
    const maintenance = await maintenanceService.deleteMaintenance(
      req.params.id
    );

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: "Maintenance schedule not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Maintenance deleted successfully.",
      data: maintenance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete maintenance schedule.",
      error: error.message,
    });
  }
};

// Start Maintenance
export const startMaintenance = async (req, res) => {
  try {
    const maintenance = await maintenanceService.startMaintenance(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Maintenance started successfully.",
      data: maintenance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to start maintenance.",
      error: error.message,
    });
  }
};

// Complete Maintenance
export const completeMaintenance = async (req, res) => {
  try {
    const maintenance = await maintenanceService.completeMaintenance(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Maintenance completed successfully.",
      data: maintenance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to complete maintenance.",
      error: error.message,
    });
  }
};

// Emergency Maintenance
export const emergencyMaintenance = async (req, res) => {
  try {
    const maintenance = await maintenanceService.emergencyMaintenance(req.body);

    res.status(201).json({
      success: true,
      message: "Emergency maintenance activated.",
      data: maintenance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to activate emergency maintenance.",
      error: error.message,
    });
  }
};

// Public Status
export const getPublicStatus = async (req, res) => {
  try {
    const status = await maintenanceService.getPublicStatus();

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch public maintenance status.",
      error: error.message,
    });
  }
};

// History
export const getHistory = async (req, res) => {
  try {
    const history = await maintenanceService.getHistory();

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance history.",
      error: error.message,
    });
  }
};

// Countdown
export const getCountdown = async (req, res) => {
  try {
    const countdown = await maintenanceService.getCountdown(req.params.id);

    res.status(200).json({
      success: true,
      data: countdown,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch countdown.",
      error: error.message,
    });
  }
};

// Notifications
export const sendNotifications = async (req, res) => {
  try {
    const notification = await maintenanceService.sendNotifications(req.body);

    res.status(200).json({
      success: true,
      message: "Notifications sent successfully.",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send notifications.",
      error: error.message,
    });
  }
};

// Admin Approval
export const approveMaintenance = async (req, res) => {
  try {
    const approval = await maintenanceService.approveMaintenance(req.params.id);

    res.status(200).json({
      success: true,
      message: "Maintenance approved successfully.",
      data: approval,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to approve maintenance.",
      error: error.message,
    });
  }
};

// Status Banner
export const getStatusBanner = async (req, res) => {
  try {
    const banner = await maintenanceService.getStatusBanner();

    res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch status banner.",
      error: error.message,
    });
  }
};

// Service Impact
export const getServiceImpact = async (req, res) => {
  try {
    const services = await maintenanceService.getServiceImpact();

    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch service impact.",
      error: error.message,
    });
  }
};
