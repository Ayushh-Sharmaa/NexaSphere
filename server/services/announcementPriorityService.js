let announcements = [];

const priorityOrder = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export const announcementPriorityService = {
  getAnnouncements() {
    const now = new Date();

    return announcements
      .filter(
        (announcement) =>
          !announcement.expiresAt || new Date(announcement.expiresAt) > now
      )
      .sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return b.pinned - a.pinned;
        }

        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }

        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  },

  createAnnouncement(data) {
    const announcement = {
      id: Date.now().toString(),
      title: data.title,
      message: data.message,
      priority: data.priority || "Low",
      pinned: data.pinned || false,
      expiresAt: data.expiresAt || null,
      audience: data.audience || "All",
      readBy: [],
      views: 0,
      createdAt: new Date().toISOString(),
    };

    announcements.push(announcement);

    return announcement;
  },

  updatePriority(id, priority) {
    const announcement = announcements.find((item) => item.id === id);
    if (!announcement) return null;

    announcement.priority = priority;

    return announcement;
  },

  pinAnnouncement(id, pinned = true) {
    const announcement = announcements.find((item) => item.id === id);

    if (!announcement) return null;

    announcement.pinned = pinned;

    return announcement;
  },

  markAnnouncementRead(id, userId) {
    const announcement = announcements.find((item) => item.id === id);
    if (!announcement) return null;

    if (!announcement.readBy.includes(userId)) {
      announcement.readBy.push(userId);
    }

    announcement.views++;

    return announcement;
  },

  getAnalytics() {
    const total = announcements.length;

    const totalViews = announcements.reduce((sum, item) => sum + item.views, 0);

    const totalReads = announcements.reduce(
      (sum, item) => sum + item.readBy.length,
      0
    );

    return {
      totalAnnouncements: total,
      totalViews,
      totalReads,
      priorityBreakdown: {
        Critical: announcements.filter((a) => a.priority === "Critical").length,
        High: announcements.filter((a) => a.priority === "High").length,
        Medium: announcements.filter((a) => a.priority === "Medium").length,
        Low: announcements.filter((a) => a.priority === "Low").length,
      },
    };
  },
};
