export const portfolioAnalyticsService = {
  async getAnalytics(username) {
    return {
      username,
      profileViews: 1543,
      engagement: 72,
      downloads: 89,
      recruiterVisits: 14,
      monthlyGrowth: "+18%",
      topProjects: [
        {
          name: "Smart Irrigation System",
          views: 420,
        },
        {
          name: "RFID Door Lock",
          views: 270,
        },
      ],
      visitorTrend: [25, 31, 42, 38, 55, 61, 74],
      monthlyGrowth: "+18%",
      topProjects: [
        {
          name: "Smart Irrigation System",
          views: 420,
        },
        {
          name: "RFID Door Lock",
          views: 270,
        },
      ],
      visitorTrend: [25, 31, 42, 38, 55, 61, 74],
    };
  },

  async recordVisit(username) {
    return {
      success: true,
      username,
      message: "Visit recorded successfully",
      message: "Visit recorded successfully",
    };
  },

  async getMonthlyReport(username) {
    return {
      username,
      month: "June 2026",
      profileViews: 810,
      downloads: 42,
      recruiterVisits: 8,
      engagement: "74%",
    };
  },
};
