class EventEmitter {
  constructor() { this.events = {}; }

  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
  }

  off(event, listenerToRemove) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listenerToRemove);
  }

  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(l => l(data));
  }
}

export const eventEmitter = new EventEmitter();

export const EVENTS = {
  EVENT_CREATED: 'event:created',
  EVENT_UPDATED: 'event:updated',
  EVENT_DELETED: 'event:deleted',
  ACTIVITY_EVENT_CREATED: 'activity-event:created',
  ACTIVITY_EVENT_DELETED: 'activity-event:deleted',
  CORE_TEAM_MEMBER_ADDED: 'core-team:added',
  CORE_TEAM_MEMBER_REMOVED: 'core-team:removed',
  AUTH_TOKEN_EXPIRED: 'auth:token-expired',
  NOTIFY: 'notify',
};
