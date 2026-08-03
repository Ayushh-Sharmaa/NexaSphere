// src/services/recommendation/userInterestTracker.js

const STORAGE_KEYS = {
  USER_INTERESTS: 'user_interests',
  USER_HISTORY: 'user_history',
  USER_PREFERENCES: 'user_preferences',
};

// Maximum number of interaction history entries to retain.
// Older entries beyond this cap are evicted to prevent localStorage quota overflow.
const MAX_HISTORY_ENTRIES = 100;

/**
 * Safely writes a value to localStorage.
 * Catches QuotaExceededError and logs a warning instead of silently
 * corrupting other keys (bookmarks, roadmap autosave) that share the quota.
 */
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      console.warn(
        `[UserInterestTracker] localStorage quota exceeded while saving "${key}". ` +
          'Oldest history entries have been trimmed — consider migrating to IndexedDB.'
      );
    } else {
      throw err;
    }
  }
}

class UserInterestTracker {
  constructor() {
    this.interests = this.loadInterests();
    this.history = this.loadHistory();
    this.preferences = this.loadPreferences();
  }

  loadInterests() {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_INTERESTS);
    const defaults = {
      categories: {},
      tags: {},
      events: {},
    };
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return defaults;
  }

  loadHistory() {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_HISTORY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return [];
  }

  loadPreferences() {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    const defaults = {
      preferredCategories: [],
      preferredTags: [],
      preferredTimeSlots: [],
      preferredLocations: [],
    };
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return defaults;
  }

  trackEventInteraction(eventId, action, metadata = {}) {
    const interaction = {
      eventId,
      action,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.history.push(interaction);

    // Evict oldest entries beyond the cap to prevent unbounded growth
    if (this.history.length > MAX_HISTORY_ENTRIES) {
      this.history = this.history.slice(-MAX_HISTORY_ENTRIES);
    }

    this.updateInterests(interaction);
    this.save();

    return interaction;
  }

  updateInterests(interaction) {
    if (interaction.metadata.category) {
      const cat = interaction.metadata.category;
      this.interests.categories[cat] = (this.interests.categories[cat] || 0) + 1;
    }

    if (interaction.metadata.tags && Array.isArray(interaction.metadata.tags)) {
      interaction.metadata.tags.forEach((tag) => {
        this.interests.tags[tag] = (this.interests.tags[tag] || 0) + 1;
      });
    }

    this.interests.events[interaction.eventId] =
      (this.interests.events[interaction.eventId] || 0) + 1;
  }

  setUserPreferences(categories, tags) {
    this.preferences.preferredCategories = categories;
    this.preferences.preferredTags = tags;
    this.save();
  }

  getUserInterests() {
    const topCategories = Object.entries(this.interests.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const topTags = Object.entries(this.interests.tags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name]) => name);

    return {
      topCategories,
      topTags,
      totalInteractions: this.history.length,
      preferences: this.preferences,
    };
  }

  getEventHistory() {
    return this.history;
  }

  save() {
    safeSetItem(STORAGE_KEYS.USER_INTERESTS, JSON.stringify(this.interests));
    safeSetItem(STORAGE_KEYS.USER_HISTORY, JSON.stringify(this.history));
    safeSetItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(this.preferences));
  }

  clearHistory() {
    this.interests = { categories: {}, tags: {}, events: {} };
    this.history = [];
    this.preferences = {
      preferredCategories: [],
      preferredTags: [],
      preferredTimeSlots: [],
      preferredLocations: [],
    };
    this.save();
  }
}

export const userInterestTracker = new UserInterestTracker();
