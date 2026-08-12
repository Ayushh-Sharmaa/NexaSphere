const resources = [];

class EventResourceService {
  createResource(data) {
    const resource = {
      id: Date.now().toString(),
      name: data.name,
      category: data.category,
      quantity: data.quantity || 1,
      availableQuantity: data.quantity || 1,
      location: data.location || 'Storage',
      description: data.description || '',
      status: 'Available',
      maintenanceStatus: 'Good',
      qrCode: `QR-${Date.now()}`,
      assignedTo: null,
      borrowedBy: null,
      reservationHistory: [],
      borrowHistory: [],
      damageReports: [],
      maintenanceLogs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    resources.push(resource);
    return resource;
  }

  getAllResources() {
    return resources;
  }

  getResourceById(id) {
    return resources.find((r) => r.id === id);
  }

  updateResource(id, updates) {
    const resource = this.getResourceById(id);

    if (!resource) return null;

    Object.assign(resource, updates);
    if (typeof updates.quantity === 'number') {
      resource.availableQuantity = Math.min(resource.availableQuantity, resource.quantity);
    }
    resource.updatedAt = new Date();

    return resource;
  }

  deleteResource(id) {
    const index = resources.findIndex((r) => r.id === id);

    if (index === -1) return false;

    resources.splice(index, 1);
    return true;
  }

  reserveResource(id, userId, eventId) {
    const resource = this.getResourceById(id);

    if (!resource) return null;

    if (resource.availableQuantity <= 0) {
      return {
        success: false,
        message: 'Resource unavailable',
      };
    }

    resource.availableQuantity--;

    resource.reservationHistory.push({
      userId,
      eventId,
      reservedAt: new Date(),
    });

    return {
      success: true,
      resource,
    };
  }

  returnResource(id, userId) {
    const resource = this.getResourceById(id);

    if (!resource) return null;

    if (resource.availableQuantity >= resource.quantity) {
      return {
        success: false,
        message: "Resource available quantity is already at maximum capacity",
        resource,
      };
    }

    resource.availableQuantity++;

    resource.borrowHistory.push({
      userId,
      returnedAt: new Date(),
    });

    return {
      success: true,
      resource,
    };
  }

  assignResource(id, assignee) {
    const resource = this.getResourceById(id);

    if (!resource) return null;

    resource.assignedTo = assignee;
    resource.status = 'Assigned';
    resource.updatedAt = new Date();

    return resource;
  }

  reportDamage(id, report) {
    const resource = this.getResourceById(id);

    if (!resource) return null;

    resource.damageReports.push({
      report,
      reportedAt: new Date(),
    });

    resource.status = 'Damaged';

    return resource;
  }

  updateMaintenanceStatus(id, status) {
    const resource = this.getResourceById(id);

    if (!resource) return null;

    resource.maintenanceStatus = status;

    resource.maintenanceLogs.push({
      status,
      updatedAt: new Date(),
    });

    return resource;
  }

  checkAvailability(id) {
    const resource = this.getResourceById(id);

    if (!resource) return null;

    return {
      available: resource.availableQuantity > 0,
      quantity: resource.availableQuantity,
      total: resource.quantity,
    };
  }

  detectConflicts() {
    const conflicts = [];

    resources.forEach((resource) => {
      if (resource.availableQuantity === 0 && resource.quantity > 0) {
        conflicts.push({
          id: resource.id,
          name: resource.name,
          issue: 'Fully Reserved',
        });
      }
    });

    return conflicts;
  }

  getAvailabilityCalendar() {
    return resources.map((resource) => ({
      id: resource.id,
      resource: resource.name,
      available: resource.availableQuantity,
      total: resource.quantity,
      reservations: resource.reservationHistory.length,
    }));
  }

  generateQRCode(id) {
    const resource = this.getResourceById(id);

    if (!resource) return null;

    return {
      resourceId: resource.id,
      qrCode: resource.qrCode,
    };
  }

  getBorrowHistory(id) {
    const resource = this.getResourceById(id);

    if (!resource) return [];

    return resource.borrowHistory;
  }

  getInventoryAnalytics() {
    const totalResources = resources.length;

    const available = resources.filter((r) => r.availableQuantity > 0).length;

    const assigned = resources.filter((r) => r.assignedTo).length;

    const damaged = resources.filter((r) => r.status === 'Damaged').length;

    const reserved = resources.reduce((sum, r) => sum + r.reservationHistory.length, 0);

    return {
      totalResources,
      availableResources: available,
      assignedResources: assigned,
      damagedResources: damaged,
      totalReservations: reserved,
      utilizationRate: totalResources === 0 ? 0 : ((assigned + reserved) / totalResources) * 100,
    };
  }

  getUtilizationReport() {
    return resources.map((resource) => ({
      id: resource.id,
      name: resource.name,
      utilization: resource.reservationHistory.length + resource.borrowHistory.length,
      damageReports: resource.damageReports.length,
      maintenanceLogs: resource.maintenanceLogs.length,
    }));
  }
}

module.exports = new EventResourceService();
