/**
 * Socket.IO Client for Admin Dashboard
 * Uses singleton pattern with proper lifecycle management.
 * Emits content:updated events to the Node.js server when admin
 * creates, updates, or deletes events, activity events, or team members.
 * Falls back gracefully when the socket server is unreachable.
 */

import io from "socket.io-client";

let socket = null;
let hasAttachedGlobalListeners = false;
let reconnectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 10;

const SOCKET_SERVER =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE?.replace(/\/api\/?.*$/, "") ||
  "http://localhost:8787";

/**
 * Initialize socket connection — called once on admin dashboard mount.
 * Returns the socket instance or null if the server is unreachable.
 */
export function initAdminSocket() {
  if (socket?.connected) return socket;

  try {
    socket = io(SOCKET_SERVER, {
      path: import.meta.env.VITE_SOCKET_PATH || "/socket.io",
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
      transports: ["websocket", "polling"],
      timeout: 5000,
      autoConnect: false,
    });

    // Prevent duplicate global listeners
    if (!hasAttachedGlobalListeners) {
      hasAttachedGlobalListeners = true;

      socket.on("connect", () => {
        console.log("[Admin Socket] Connected:", socket.id);
        reconnectionAttempts = 0;
      });

      socket.on("disconnect", (reason) => {
        console.log("[Admin Socket] Disconnected:", reason);
      });

      socket.on("connect_error", (err) => {
        reconnectionAttempts++;
        console.warn("[Admin Socket] Connection failed:", err.message);
      });

      socket.on("reconnect", (attemptNumber) => {
        console.log(
          "[Admin Socket] Reconnected after",
          attemptNumber,
          "attempts"
        );
        reconnectionAttempts = 0;
      });

      socket.on("reconnect_attempt", (attemptNumber) => {
        console.log("[Admin Socket] Reconnection attempt:", attemptNumber);
      });

      socket.on("reconnect_failed", () => {
        console.warn(
          "[Admin Socket] Reconnection failed — admin will work without real-time sync."
        );
      });
    }

    socket.connect();
    return socket;
  } catch (err) {
    console.warn("[Admin Socket] Init failed:", err.message);
    return null;
  }
}

/**
 * Broadcast a content update to all connected website clients.
 * @param {"events"|"team"|"activities"} type — which content changed
 */
export function broadcastContentUpdate(type) {
  if (!socket?.connected) return;
  socket.emit("content:updated", { type });
}

/**
 * Get the current socket instance (may be null).
 */
export function getSocket() {
  return socket;
}

/**
 * Register a socket event listener
 */
export function on(eventName, handler) {
  if (socket) {
    socket.on(eventName, handler);
  }
}

/**
 * Unregister a socket event listener
 */
export function off(eventName, handler) {
  if (socket) {
    if (handler) {
      socket.off(eventName, handler);
    } else {
      socket.off(eventName);
    }
  }
}

/**
 * Emit a socket event
 */
export function emit(eventName, data) {
  if (socket) {
    socket.emit(eventName, data);
  }
}

/**
 * Disconnect and cleanup socket
 */
export function disconnect() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    hasAttachedGlobalListeners = false;
  }
}

/**
 * Get connection status
 */
export function isConnected() {
  return socket?.connected || false;
}

export default {
  initAdminSocket,
  broadcastContentUpdate,
  getSocket,
  on,
  off,
  emit,
  disconnect,
  isConnected,
};
