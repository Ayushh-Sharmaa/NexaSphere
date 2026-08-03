/**
 * Socket.IO Client Wrapper
 * Ensures exactly one active socket connection exists
 * and prevents reconnection leaks / duplicate listeners.
 */

import { captureHandledException } from './errorTracking';
import { getSocketServerUrl } from './runtimeConfig';

import {
  initializeSocket as initCoreSocket,
  getSocket as getCoreSocket,
  disconnectSocket as disconnectCoreSocket,
} from '../services/socket';

let warnedMissingSocketConfig = false;
let hasAttachedGlobalListeners = false;

const GLOBAL_EVENTS = ['connect', 'disconnect', 'connect_error', 'error', 'reconnect_failed'];

// Track current active socket instance
let activeSocket = null;

/**
 * Initialize Socket.IO singleton safely
 */
export function initializeSocket(serverUrl = getSocketServerUrl()) {
  const resolvedUrl = serverUrl || getSocketServerUrl();

  if (!resolvedUrl) {
    if (!warnedMissingSocketConfig) {
      warnedMissingSocketConfig = true;
      console.warn('Socket.IO disabled: no socket server URL configured.');
    }
    return null;
  }

  // If already connected to the same socket, return it
  if (activeSocket && activeSocket.connected) {
    return activeSocket;
  }

  // Create/get singleton socket
  const socket = initCoreSocket(resolvedUrl);

  if (activeSocket === socket) {
    return socket;
  }

  // Clean previous socket before reconnecting if URL changed or socket was recreated
  if (activeSocket) {
    activeSocket.removeAllListeners();
    activeSocket.disconnect();
    activeSocket = null;
    hasAttachedGlobalListeners = false;
  }

  activeSocket = socket;

  // Prevent duplicate listeners
  if (!hasAttachedGlobalListeners) {
    hasAttachedGlobalListeners = true;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      if (typeof identifyUser === 'function') {
        identifyUser();
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      captureHandledException(error, 'Socket.IO connect_error:');
    });

    socket.on('error', (error) => {
      captureHandledException(error, 'Socket.IO error:');
    });

    socket.on('reconnect_failed', () => {
      captureHandledException(
        new Error('Socket.IO reconnect attempts exhausted'),
        'Socket.IO reconnect failed:'
      );
    });
  }

  return socket;
}

/**
 * Get socket instance
 */
export function getSocket() {
  const socket = getCoreSocket();

  if (!socket) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }

  return socket;
}

/**
 * Identify current user
 */
export function identifyUser(userId, email) {
  let finalUserId = userId;
  let finalEmail = email;

  if (!finalUserId || !finalEmail) {
    const storedUser = localStorage.getItem('ns_user');

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        finalUserId = user.id || user.userId;
        finalEmail = user.email;
      } catch {
        // Ignore malformed user data
      }
    }
  }

  const socket = getCoreSocket();

  if (socket && finalUserId) {
    socket.emit('user:identify', {
      userId: finalUserId,
      email: finalEmail,
    });
  }
}

export function joinRoom(roomName) {
  const socket = getCoreSocket();
  if (socket) {
    socket.emit('room:join', roomName);
  }
}

export function leaveRoom(roomName) {
  const socket = getCoreSocket();
  if (socket) {
    socket.emit('room:leave', roomName);
  }
}

export function on(eventName, handler) {
  const socket = getCoreSocket();
  if (socket) {
    socket.on(eventName, handler);
  }
}

export function off(eventName, handler) {
  const socket = getCoreSocket();
  if (socket) {
    if (handler) {
      socket.off(eventName, handler);
    } else {
      socket.off(eventName);
    }
  }
}

export function emit(eventName, data) {
  const socket = getCoreSocket();
  if (socket) {
    socket.emit(eventName, data);
  }
}

/**
 * Safe disconnect cleanup
 */
export function disconnect() {
  if (activeSocket) {
    activeSocket.removeAllListeners();
    activeSocket.disconnect();
    activeSocket = null;
  }
  hasAttachedGlobalListeners = false;
  disconnectCoreSocket();
}

/**
 * Full socket destruction
 */
export function destroySocket() {
  if (activeSocket) {
    activeSocket.removeAllListeners();
    activeSocket.disconnect();
    activeSocket = null;
  }
  hasAttachedGlobalListeners = false;
  disconnectCoreSocket();
}

export function isConnected() {
  return activeSocket?.connected || false;
}

export function getSocketId() {
  return activeSocket?.id || null;
}

export default {
  initializeSocket,
  getSocket,
  identifyUser,
  joinRoom,
  leaveRoom,
  on,
  off,
  emit,
  disconnect,
  destroySocket,
  isConnected,
  getSocketId,
};
