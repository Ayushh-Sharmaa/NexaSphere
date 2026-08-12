const preferences = new Map();

export const notificationPreferenceService = {
  getPreferences(userId) {
    if (!preferences.has(userId)) {
      preferences.set(userId, {
        email: true,
        push: true,
        inApp: true,
        sms: false,
        digestMode: false,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '07:00',
        },
        categories: {
          events: true,
          clubs: true,
          portfolios: true,
          achievements: true,
          announcements: true,
        },
      });
    }

    return preferences.get(userId);
  },

  updatePreferences(userId, updates) {
    const current = this.getPreferences(userId);

    const updated = {
      ...current,
      ...updates,
    };

    preferences.set(userId, updated);

    return updated;
  },

  getHistory(userId) {
    return [
      {
        id: 1,
        title: 'Event Registration',
        date: new Date().toISOString(),
      },
      {
        id: 2,
        title: 'Portfolio Updated',
        date: new Date().toISOString(),
      },
    ];
  },
};
