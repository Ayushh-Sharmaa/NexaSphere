/**
 * Analytics API Service
 * Handles API calls to analytics endpoints
 */

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

const analyticsAPI = {
  /**
   * Get all events metrics
   */
  async getAllEventsMetrics() {
    const response = await fetch(`${API_URL}/admin/analytics/events`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch events metrics");
    }

    const data = await response.json();
    return data.data || [];
  },

  /**
   * Get specific event metrics
   */
  async getEventMetrics(eventId) {
    const response = await fetch(
      `${API_URL}/admin/analytics/events/${eventId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch event metrics");
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Get registration trends
   */
  async getRegistrationTrends(eventId, timeWindow = "7 days") {
    const response = await fetch(
      `${API_URL}/admin/analytics/events/${eventId}/trends?timeWindow=${encodeURIComponent(timeWindow)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch registration trends");
    }

    const data = await response.json();
    return data.data || [];
  },

  /**
   * Get hourly registration trends
   */
  async getHourlyTrends(eventId, hours = 24) {
    const response = await fetch(
      `${API_URL}/admin/analytics/events/${eventId}/trends/hourly?hours=${hours}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch hourly trends");
    }

    const data = await response.json();
    return data.data || [];
  },

  /**
   * Get recent registrations
   */
  async getRecentRegistrations(eventId, limit = 20) {
    const response = await fetch(
      `${API_URL}/admin/analytics/events/${eventId}/registrations/recent?limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch recent registrations");
    }

    const data = await response.json();
    return data.data || [];
  },

  /**
   * Get check-in statistics
   */
  async getCheckInStats(eventId) {
    const response = await fetch(
      `${API_URL}/admin/analytics/events/${eventId}/checkin/stats`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch check-in stats");
    }

    const data = await response.json();
    return data.data || {};
  },

  /**
   * Register a user for an event
   */
  async registerForEvent(eventId, email, name = "") {
    const response = await fetch(
      `${API_URL}/admin/analytics/events/${eventId}/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, name }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to register user");
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Check in a user
   */
  async checkInUser(eventId, registrationId, email) {
    const response = await fetch(
      `${API_URL}/admin/analytics/events/${eventId}/checkin`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ registrationId, email }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to check in user");
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Export analytics data
   */
  async exportAnalytics(eventId, format = "csv") {
    const response = await fetch(
      `${API_URL}/admin/analytics/events/${eventId}/export?format=${format}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to export analytics");
    }

    if (format === "csv" || format === "json") {
      return await response.blob();
    }

    return await response.json();
  },

  /**
   * Clear cache
   */
  async clearCache(eventId = null) {
    const response = await fetch(`${API_URL}/admin/analytics/cache/clear`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ eventId }),
    });

    if (!response.ok) {
      throw new Error("Failed to clear cache");
    }

    const data = await response.json();
    return data;
  },
};

const analyticsAPI = {
  clearCache(eventId) {
    if (eventId) {
      for (const key of apiCache.keys()) {
        if (key.includes(eventId)) {
          apiCache.delete(key);
        }
      }
    } else {
      apiCache.clear();
    }
  },

  async getAllEventsMetrics() {
    return await fetchWithCache(`${API_URL}/admin/analytics/events`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
  },

  async getEventMetrics(eventId) {
    return await fetchWithCache(
      `${API_URL}/admin/analytics/events/${eventId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
  },

  async getRegistrationTrends(eventId, timeWindow = "7 days") {
    return await fetchWithCache(
      `${API_URL}/admin/analytics/events/${eventId}/trends?timeWindow=${encodeURIComponent(timeWindow)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
  },

  async getHourlyTrends(eventId, hours = 24) {
    return await fetchWithCache(
      `${API_URL}/admin/analytics/events/${eventId}/trends/hourly?hours=${encodeURIComponent(hours)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
  },

  async getRecentRegistrations(eventId, limit = 20) {
    return await fetchWithCache(
      `${API_URL}/admin/analytics/events/${eventId}/registrations/recent?limit=${encodeURIComponent(limit)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
  },

  async getCheckInStats(eventId) {
    return await fetchWithCache(
      `${API_URL}/admin/analytics/events/${eventId}/checkins/stats`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
  },
};
