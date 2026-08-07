class EventEmitter {
  constructor() {
    this.events = {};

    // Track event timestamps
    this.eventTimestamps = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = new Set();
    }

    // Prevent duplicate listeners
    this.events[event].add(listener);
  }

  off(event, listenerToRemove) {
    if (!this.events[event]) return;

    this.events[event].delete(listenerToRemove);

    // Cleanup empty event buckets
    if (this.events[event].size === 0) {
      delete this.events[event];
    }
  }

  emit(event, data) {
    if (!this.events[event]) return;

    // Save latest event timestamp
    this.eventTimestamps[event] = Date.now();

    for (const listener of this.events[event]) {
      try {
        listener({
          ...data,
          emittedAt: this.eventTimestamps[event],
        });
      } catch (error) {
        console.error(`Event listener error for "${event}"`, error);
      }
    }
  }

  clear(event) {
    if (event) {
      delete this.events[event];
      delete this.eventTimestamps[event];
    } else {
      this.events = {};
      this.eventTimestamps = {};
    }
  }

  listenerCount(event) {
    return this.events[event] ? this.events[event].size : 0;
  }
}

export const eventEmitter = new EventEmitter();

export const EVENTS = {
  EVENT_CREATED: "event:created",

  EVENT_UPDATED: "event:updated",

  EVENT_DELETED: "event:deleted",

  ACTIVITY_EVENT_CREATED: "activity-event:created",

  ACTIVITY_EVENT_DELETED: "activity-event:deleted",

  CORE_TEAM_MEMBER_ADDED: "core-team:added",

  CORE_TEAM_MEMBER_UPDATED: "core-team:updated",

  CORE_TEAM_MEMBER_REMOVED: "core-team:removed",

  AUTH_TOKEN_EXPIRED: "auth:token-expired",
  AUTH_LOGOUT: "auth:logout",

  NOTIFY: "notify",

  ANNOUNCEMENT_CREATED: "announcement:created",

  ANNOUNCEMENT_UPDATED: "announcement:updated",

  ANNOUNCEMENT_DELETED: "announcement:deleted",

  WAITING_ROOM_UPDATED: "waiting-room:updated",

  // RBAC events
  ROLE_CREATED: "role:created",
  ROLE_UPDATED: "role:updated",
  ROLE_DELETED: "role:deleted",
  ROLE_ASSIGNED: "role:assigned",
  ROLE_REVOKED: "role:revoked",

  // Offline / reconnect events
  CACHE_STALE: "cache:stale",

  OFFLINE_MODE: "offline:enabled",

  ONLINE_RECONNECTED: "online:reconnected",

  QA_UPDATED: "qa:updated",
  POLL_UPDATED: "poll:updated",
};
