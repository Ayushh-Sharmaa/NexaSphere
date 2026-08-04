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
      .filter((announcement) => !announcement.expiresAt || new Date(announcement.expiresAt) > now)
      .sort((a, b) => {
        const isAPinned = Boolean(a.pinned === true || a.pinned === 'true');
        const isBPinned = Boolean(b.pinned === true || b.pinned === 'true');

        if (isAPinned !== isBPinned) {
          return isBPinned ? 1 : -1;
        }

        const getPriorityScore = (p) => {
          if (!p) return 1;
          const normalized = String(p).trim();
          const capitalized = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
          return priorityOrder[capitalized] || 1;
        };

        const scoreA = getPriorityScore(a.priority);
        const scoreB = getPriorityScore(b.priority);

        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }

        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
  },

  createAnnouncement(data) {
    const announcement = {
      id: Date.now().toString(),
      title: data.title,
      message: data.message,
      priority: data.priority || 'Low',
      pinned: data.pinned || false,
      expiresAt: data.expiresAt || null,
      audience: data.audience || 'All',
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

    const totalReads = announcements.reduce((sum, item) => sum + item.readBy.length, 0);

    return {
      totalAnnouncements: total,
      totalViews,
      totalReads,
      priorityBreakdown: {
        Critical: announcements.filter((a) => a.priority === 'Critical').length,
        High: announcements.filter((a) => a.priority === 'High').length,
        Medium: announcements.filter((a) => a.priority === 'Medium').length,
        Low: announcements.filter((a) => a.priority === 'Low').length,
      },
    };
  },
};

