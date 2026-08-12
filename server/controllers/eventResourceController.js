const eventResourceService = require('../services/eventResourceService');
const { sendSuccess, sendError, sendNoContent } = require('../utils/responseHelper.js');

exports.createResource = (req, res) => {
  try {
    const resource = eventResourceService.createResource(req.body);

    return sendSuccess(res, { message: 'Resource created successfully.', data: resource }, 201);
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

exports.getAllResources = (req, res) => {
  try {
    const resources = eventResourceService.getAllResources();

    return sendSuccess(res, { total: resources.length, data: resources });
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

exports.getResourceById = (req, res) => {
  try {
    const resource = eventResourceService.getResourceById(req.params.id);

    if (!resource) {
      return sendError(req, res, 'Resource not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, { data: resource });
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

exports.updateResource = (req, res) => {
  try {
    const resource = eventResourceService.updateResource(req.params.id, req.body);

    if (!resource) {
      return sendError(req, res, 'Resource not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, { message: 'Resource updated successfully.', data: resource });
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

exports.deleteResource = (req, res) => {
  try {
    const deleted = eventResourceService.deleteResource(req.params.id);

    if (!deleted) {
      return sendError(req, res, 'Resource not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, { message: 'Resource deleted successfully.' });
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

exports.reserveResource = (req, res) => {
  try {
    const result = eventResourceService.reserveResource(
      req.params.id,
      req.body.userId,
      req.body.eventId
    );

    if (!result) {
      return sendError(req, res, 'Resource not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, result);
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

exports.returnResource = (req, res) => {
  try {
    const resource = eventResourceService.returnResource(req.params.id, req.body.userId);

    if (!resource) {
      return sendError(req, res, 'Resource not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, { message: 'Resource returned successfully.', data: resource });
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

exports.assignResource = (req, res) => {
  try {
    const resource = eventResourceService.assignResource(req.params.id, req.body.assignedTo);

    if (!resource) {
      return sendError(req, res, 'Resource not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, { message: 'Resource assigned successfully.', data: resource });
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

exports.reportDamage = (req, res) => {
  try {
    const resource = eventResourceService.reportDamage(req.params.id, req.body.report);

    if (!resource) {
      return sendError(req, res, 'Resource not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, { message: 'Damage report submitted.', data: resource });
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

exports.updateMaintenanceStatus = (req, res) => {
  try {
    const resource = eventResourceService.updateMaintenanceStatus(req.params.id, req.body.status);

    if (!resource) {
      return sendError(req, res, 'Resource not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, { message: 'Maintenance status updated.', data: resource });
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

exports.checkAvailability = (req, res) => {
  try {
    const availability = eventResourceService.checkAvailability(req.params.id);

    if (!availability) {
      return sendError(req, res, 'Resource not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, { data: availability });
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

exports.detectConflicts = (req, res) => {
  try {
    const conflicts = eventResourceService.detectConflicts();

    return sendSuccess(res, { total: conflicts.length, data: conflicts });
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

exports.getAvailabilityCalendar = (req, res) => {
  try {
    const calendar = eventResourceService.getAvailabilityCalendar();

    return sendSuccess(res, { data: calendar });
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

exports.generateQRCode = (req, res) => {
  try {
    const qr = eventResourceService.generateQRCode(req.params.id);

    if (!qr) {
      return sendError(req, res, 'Resource not found', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, { data: qr });
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

exports.getBorrowHistory = (req, res) => {
  try {
    const history = eventResourceService.getBorrowHistory(req.params.id);

    return sendSuccess(res, { data: history });
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

exports.getInventoryAnalytics = (req, res) => {
  try {
    const analytics = eventResourceService.getInventoryAnalytics();

    return sendSuccess(res, { data: analytics });
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};

exports.getUtilizationReport = (req, res) => {
  try {
    const report = eventResourceService.getUtilizationReport();

    return sendSuccess(res, { data: report });
  } catch (err) {
    return sendError(req, res, err.message, 500, 'INTERNAL_ERROR');
  }
};
