import crypto from 'crypto';
import { getIO, emitToRoom } from '../config/socket.js';
import logger from '../utils/logger.js';

const queues = new Map();

function getQueue(eventId) {
  if (!queues.has(eventId)) {
    queues.set(eventId, []);
  }
  return queues.get(eventId);
}

export const waitingRoomService = {
  joinQueue(eventId, { userId, fullName, email, isPriority = false }) {
    const queue = getQueue(eventId);
    const existing = queue.find((e) => e.email === email);
    if (existing) return { position: queue.indexOf(existing) + 1, total: queue.length };

    const entry = {
      id: `wr_${crypto.randomUUID()}`,
      userId: userId || null,
      fullName,
      email,
      isPriority,
      joinedAt: new Date().toISOString(),
    };

    if (isPriority) {
      const firstNonPriority = queue.findIndex((e) => !e.isPriority);
      if (firstNonPriority >= 0) {
        queue.splice(firstNonPriority, 0, entry);
      } else {
        queue.push(entry);
      }
    } else {
      queue.push(entry);
    }

    const position = queue.indexOf(entry) + 1;
    emitToRoom(`waiting:${eventId}`, 'waiting:queue-update', {
      eventId,
      position,
      total: queue.length,
    });

    logger.info('Attendee joined waiting room', { eventId, email, position });
    return { entry, position, total: queue.length };
  },

  getQueue(eventId) {
    const queue = getQueue(eventId);
    return queue.map((e, i) => ({ ...e, position: i + 1 }));
  },

  getQueueLength(eventId) {
    return getQueue(eventId).length;
  },

  admitOne(eventId) {
    const queue = getQueue(eventId);
    if (!queue.length) return null;
    const entry = queue.shift();
    emitToRoom(`waiting:${eventId}`, 'waiting:queue-update', {
      eventId,
      position: 0,
      total: queue.length,
    });
    const io = getIO();
    if (io && entry.userId) {
      io.to(`user-${entry.userId}`).emit('waiting:admitted', { eventId, fullName: entry.fullName });
    }
    logger.info('Attendee admitted from waiting room', { eventId, email: entry.email });
    return entry;
  },

  admitMultiple(eventId, count) {
    const admitted = [];
    for (let i = 0; i < count; i++) {
      const entry = waitingRoomService.admitOne(eventId);
      if (!entry) break;
      admitted.push(entry);
    }
    return admitted;
  },

  admitAll(eventId) {
    return waitingRoomService.admitMultiple(eventId, getQueue(eventId).length);
  },

  removeFromQueue(eventId, entryId) {
    const queue = getQueue(eventId);
    const idx = queue.findIndex((e) => e.id === entryId);
    if (idx < 0) return null;
    const removed = queue.splice(idx, 1)[0];
    emitToRoom(`waiting:${eventId}`, 'waiting:queue-update', {
      eventId,
      position: 0,
      total: queue.length,
    });
    return removed;
  },

  moveToFront(eventId, entryId) {
    const queue = getQueue(eventId);
    const idx = queue.findIndex((e) => e.id === entryId);
    if (idx < 0) return null;
    const [entry] = queue.splice(idx, 1);
    entry.isPriority = true;
    queue.unshift(entry);
    emitToRoom(`waiting:${eventId}`, 'waiting:queue-update', {
      eventId,
      position: 0,
      total: queue.length,
    });
    return entry;
  },

  sendMessage(eventId, message) {
    emitToRoom(`waiting:${eventId}`, 'waiting:message', {
      eventId,
      message,
      timestamp: new Date().toISOString(),
    });
  },

  clearQueue(eventId) {
    queues.delete(eventId);
  },
};
