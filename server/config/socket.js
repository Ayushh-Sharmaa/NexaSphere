/**
 * Socket.IO Configuration
 * Handles WebSocket connections for real-time updates
 */

import { Server } from "socket.io";
import logger from "../utils/logger.js";
import { getAdminSession } from "../repositories/adminSessionsRepository.js";
import {
  resolveAdminPermissions,
  getRoomsForPermissions,
} from "./eventPermissions.js";
import { createAdapter } from "@socket.io/redis-adapter";
import { liveQaService } from "../services/liveQaService.js";
import { getRedisClient } from "../utils/redis.js";
import { waitingRoomService } from "../services/waitingRoomService.js";

let io = null;
const connectedUsers = new Map();
const rooms = {
  admin: "admin-room",
  notifications: "notifications-room",
  events: "events-room",
};
const PROTECTED_ROOMS = ["admin-room"];

// Tracks which socket IDs have joined which workspace rooms via join_room
const workspaceRoomMembers = new Map();

// Per-socket rate limiter for join_room events to prevent room enumeration
const joinRoomAttempts = new Map();
const MAX_JOIN_ROOM_ATTEMPTS = 20;
const JOIN_ROOM_WINDOW_MS = 60000;

/**
 * Parse Bearer token from auth header
 */
function parseBearer(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return "";
  return authHeader.slice(7).trim();
}

/**
 * Initialize Socket.IO
 * @param {Object} httpServer - HTTP server instance
 */
export function initializeSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  const pubClient = getRedisClient();
  if (pubClient) {
    try {
      const subClient = pubClient.duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      logger.info("Socket.IO using Redis adapter for horizontal scaling.");
    } catch (err) {
      logger.error("Failed to configure Socket.IO Redis adapter:", err);
      logger.info("Socket.IO falling back to in-memory adapter.");
    }
  } else {
    logger.info("Socket.IO using in-memory adapter (REDIS_URL not set).");
  }

  // Connection auth middleware — checks handshake auth token
  io.use(async (socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      parseBearer(socket.handshake.headers?.authorization);
    if (token) {
      try {
        const session = await getAdminSession(token);
        if (session) {
          socket.adminSession = session;
          socket.adminAuthenticated = true;
          socket.adminPermissions = resolveAdminPermissions(session);
        }
      } catch {
        // Auth check is best-effort at connection time
      }
    }
    next();
  });

  io.on("connection", (socket) => {
    _onConnection(socket);
  });

  liveQaService.setIO(io);

  return io;
}

/**
 * Socket.IO connection event handler (exposed for security validation)
 * @param {Object} socket - Socket.io socket instance
 */
export function _onConnection(socket) {
  logger.info("User connected", {
    socketId: socket.id,
    admin: !!socket.adminAuthenticated,
  });

  // Auto-join authenticated admin sockets to permission-scoped rooms
  if (socket.adminAuthenticated) {
    if (!socket.adminPermissions) {
      socket.adminPermissions = resolveAdminPermissions(socket.adminSession);
    }
    const adminRooms = getRoomsForPermissions(socket.adminPermissions);
    for (const room of adminRooms) {
      socket.join(room);
    }
    logger.info("Admin joined scoped rooms", {
      socketId: socket.id,
      username: socket.adminSession?.username,
      rooms: adminRooms,
    });
  }

  // Keep track of identify operations to rate limit floods per-socket (Max 3 events per lifetime)
  let identifyCount = 0;

  // Store connected user
  socket.on("user:identify", (userData) => {
    // 1. Enforce Per-Socket Identification Rate Limiting
    identifyCount++;
    if (identifyCount > 3) {
      logger.warn("Socket identification flood detected, forcing disconnect", {
        socketId: socket.id,
      });
      socket.disconnect(true);
      return;
    }

    // 2. Defensive Payload Structure & Type Validation
    if (!userData || typeof userData !== "object") {
      logger.warn("Invalid user identification payload type rejected", {
        socketId: socket.id,
      });
      return;
    }

    const { userId, email } = userData;

    // Validate fields exist and are strictly primitive strings
    if (typeof userId !== "string" || typeof email !== "string") {
      logger.warn(
        "User identification payload fields must be primitive strings",
        {
          socketId: socket.id,
        }
      );
      return;
    }

    // 3. Strict Size Bounds (128 char for IDs, 256 for Email)
    if (userId.length > 128 || email.length > 256) {
      logger.warn("Oversized user identification payload values rejected", {
        socketId: socket.id,
      });
      return;
    }

    // 4. Safe Deep Copy (Persist sanitized primitives)
    connectedUsers.set(socket.id, {
      id: String(userId),
      email: String(email),
      socketId: String(socket.id),
      connectedAt: new Date(),
    });

    logger.info("User identified successfully", {
      userId: String(userId),
      socketId: socket.id,
    });
  });

  // Approved public-facing rooms that standard users can join
  const ALLOWED_PUBLIC_ROOMS = [
    "notifications-room",
    "events-room",
    "admin-room",
  ];
  const MAX_ROOMS_PER_SOCKET = 10;

  // Join notification room
  socket.on("room:join", (roomName) => {
    // 1. Primitive Type Validation
    if (typeof roomName !== "string") {
      logger.warn("Socket room:join payload must be a string", {
        socketId: socket.id,
      });
      return;
    }

    // 2. Strict Allowlist Match
    if (!ALLOWED_PUBLIC_ROOMS.includes(roomName)) {
      logger.warn("Unapproved room:join attempt rejected", {
        socketId: socket.id,
        room: roomName,
      });
      return socket.emit("room:join:error", {
        error: "Invalid or unauthorized room name",
      });
    }

    // 3. Authorization Check for Protected Rooms
    if (PROTECTED_ROOMS.includes(roomName) && !socket.adminAuthenticated) {
      logger.warn("Unauthorized room join attempt", {
        socketId: socket.id,
        room: roomName,
      });
      return socket.emit("room:join:error", {
        error: "Authentication required to join this room",
      });
    }

    // 4. Per-Socket Bounded Active Rooms Cap (Set size check)
    const joinedCount = socket.rooms ? socket.rooms.size - 1 : 0;
    if (joinedCount >= MAX_ROOMS_PER_SOCKET) {
      logger.warn("Socket joined rooms limit exceeded", {
        socketId: socket.id,
      });
      return socket.emit("room:join:error", {
        error: "Maximum room subscription limit reached",
      });
    }

    socket.join(roomName);
    logger.info("User joined room", { socketId: socket.id, room: roomName });
  });

  // Leave room
  socket.on("room:leave", (roomName) => {
    if (typeof roomName !== "string") return;
    socket.leave(roomName);
    logger.info("User left room", { socketId: socket.id, room: roomName });
  });

  // Join workspace room (Issue #205)
  socket.on("join_room", (roomId, user) => {
    // 1. Primitive Type & Structure Regex Validation (UUID/ObjectId/Workspace Name)
    if (typeof roomId !== "string" || !/^[a-zA-Z0-9\-_]{1,100}$/.test(roomId)) {
      logger.warn("Malformed workspace roomId join attempt rejected", {
        socketId: socket.id,
        roomId,
      });
      return;
    }

    // 2. Per-Socket Bounded Active Rooms Cap
    const joinedCount = socket.rooms ? socket.rooms.size - 1 : 0;
    if (joinedCount >= MAX_ROOMS_PER_SOCKET) {
      logger.warn("Socket workspace joined rooms limit exceeded", {
        socketId: socket.id,
      });
      return;
    }

    // 3. Per-socket rate limit to prevent room enumeration
    const now = Date.now();
    let attempts = joinRoomAttempts.get(socket.id);
    if (!attempts || now > attempts.resetAt) {
      attempts = { count: 0, resetAt: now + JOIN_ROOM_WINDOW_MS };
      joinRoomAttempts.set(socket.id, attempts);
    }
    attempts.count += 1;
    if (attempts.count > MAX_JOIN_ROOM_ATTEMPTS) {
      logger.warn("Socket join_room rate limit exceeded", {
        socketId: socket.id,
      });
      return;
    }

    // 4. Track room membership for event relay authorization
    if (!workspaceRoomMembers.has(roomId)) {
      workspaceRoomMembers.set(roomId, new Set());
    }
    workspaceRoomMembers.get(roomId).add(socket.id);

    socket.join(roomId);
    logger.info("User joined workspace room", { socketId: socket.id, roomId });

    // Sanitize user details to prevent reference leaks / massive nested objects
    const sanitizedUser =
      user && typeof user === "object"
        ? {
            id: typeof user.id === "string" ? user.id.slice(0, 100) : undefined,
            name:
              typeof user.name === "string"
                ? user.name.slice(0, 100)
                : "Anonymous",
            email:
              typeof user.email === "string" ? user.email.slice(0, 150) : "",
            color:
              typeof user.color === "string" ? user.color.slice(0, 50) : "#888",
            initials:
              typeof user.initials === "string"
                ? user.initials.slice(0, 2)
                : "U",
          }
        : { name: "Anonymous", color: "#888", initials: "U" };

    socket.to(roomId).emit("user_joined", {
      socketId: socket.id,
      user: sanitizedUser,
      timestamp: Date.now(),
    });
  });

  // Leave workspace room
  socket.on("leave_room", (roomId) => {
    if (typeof roomId !== "string") return;
    _removeWorkspaceMember(roomId, socket.id);
    socket.leave(roomId);
    logger.info("User left workspace room", { socketId: socket.id, roomId });
    socket.to(roomId).emit("user_left", { socketId: socket.id });
  });

  // Workspace synchronization events — only relay if sender is a room member
  socket.on("workspace_update", (data) => {
    const { roomId, ...payload } = data;
    if (roomId && _isWorkspaceMember(roomId, socket.id)) {
      socket.to(roomId).emit("workspace_update", payload);
    }
  });

  // Event planning real-time collaboration
  socket.on("planning:join", (eventId) => {
    if (
      typeof eventId === "string" &&
      /^[a-zA-Z0-9\-_]{1,100}$/.test(eventId)
    ) {
      socket.join(`planning:${eventId}`);
    }
  });
  socket.on("planning:leave", (eventId) => {
    if (typeof eventId === "string") socket.leave(`planning:${eventId}`);
  });
  socket.on("planning:updated", (data) => {
    if (data && data.eventId) {
      socket.to(`planning:${data.eventId}`).emit("planning:updated", data);
    }
  });

  socket.on("document_change", (data) => {
    const { roomId, ...payload } = data;
    if (roomId && _isWorkspaceMember(roomId, socket.id)) {
      socket.to(roomId).emit("document_change", { roomId, ...payload });
    }
  });

  socket.on("cursor_moved", (data) => {
    const { roomId, ...payload } = data;
    if (roomId && _isWorkspaceMember(roomId, socket.id)) {
      socket
        .to(roomId)
        .emit("cursor_moved", { socketId: socket.id, ...payload });
    }
  });

  socket.on("typing_start", (data) => {
    const { roomId, user, ...payload } = data;
    if (roomId && _isWorkspaceMember(roomId, socket.id)) {
      socket
        .to(roomId)
        .emit("typing_start", { socketId: socket.id, user, ...payload });
    }
  });

  socket.on("typing_stop", (data) => {
    const { roomId, ...payload } = data;
    if (roomId && _isWorkspaceMember(roomId, socket.id)) {
      socket
        .to(roomId)
        .emit("typing_stop", { socketId: socket.id, ...payload });
    }
  });

  // Authenticate socket for admin rooms using admin token
  socket.on("admin:authenticate", async ({ token } = {}) => {
    if (!token) {
      return socket.emit("admin:authenticated", {
        success: false,
        error: "Token is required",
      });
    }
    try {
      const session = await getAdminSession(token);
      if (!session) {
        return socket.emit("admin:authenticated", {
          success: false,
          error: "Invalid or expired token",
        });
      }
      socket.adminSession = session;
      socket.adminAuthenticated = true;
      socket.adminPermissions = resolveAdminPermissions(session);
      const authRooms = getRoomsForPermissions(socket.adminPermissions);
      for (const room of authRooms) {
        socket.join(room);
      }
      logger.info("Admin authenticated via socket event", {
        socketId: socket.id,
        username: session.username,
        rooms: authRooms,
      });
      socket.emit("admin:authenticated", { success: true });
    } catch (e) {
      logger.error("Admin authentication error", {
        error: e.message,
        socketId: socket.id,
      });
      socket.emit("admin:authenticated", {
        success: false,
        error: "Authentication failed",
      });
    }
  });

  // Waiting room — join queue
  socket.on("waiting:join", ({ eventId, fullName, email, isPriority } = {}) => {
    if (!eventId || !email || !fullName) return;
    const userId = socket.id;
    const result = waitingRoomService.joinQueue(eventId, {
      userId,
      fullName,
      email,
      isPriority,
    });
    socket.join(`waiting:${eventId}`);
    socket.emit("waiting:joined", { eventId, ...result });
  });

  // Waiting room — get current queue status
  socket.on("waiting:status", ({ eventId } = {}) => {
    if (!eventId) return;
    const queue = waitingRoomService.getQueue(eventId);
    socket.emit("waiting:status:update", {
      eventId,
      queue,
      total: queue.length,
    });
  });

  // Waiting room — admin admit one
  socket.on("waiting:admit-one", ({ eventId } = {}) => {
    if (!socket.adminAuthenticated || !eventId) return;
    const entry = waitingRoomService.admitOne(eventId);
    if (entry) {
      socket.emit("waiting:admitted-entry", { eventId, entry });
    }
  });

  // Waiting room — admin admit all
  socket.on("waiting:admit-all", ({ eventId } = {}) => {
    if (!socket.adminAuthenticated || !eventId) return;
    const admitted = waitingRoomService.admitAll(eventId);
    socket.emit("waiting:admitted-entries", {
      eventId,
      count: admitted.length,
    });
  });

  // Waiting room — admin remove attendee
  socket.on("waiting:remove", ({ eventId, entryId } = {}) => {
    if (!socket.adminAuthenticated || !eventId || !entryId) return;
    waitingRoomService.removeFromQueue(eventId, entryId);
    socket.emit("waiting:removed-entry", { eventId, entryId });
  });

  // Waiting room — admin move to front
  socket.on("waiting:move-front", ({ eventId, entryId } = {}) => {
    if (!socket.adminAuthenticated || !eventId || !entryId) return;
    waitingRoomService.moveToFront(eventId, entryId);
    socket.emit("waiting:moved-front", { eventId, entryId });
  });

  // Waiting room — admin send message to waiting room
  socket.on("waiting:send-message", ({ eventId, message } = {}) => {
    if (!socket.adminAuthenticated || !eventId || !message) return;
    waitingRoomService.sendMessage(eventId, message);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    connectedUsers.delete(socket.id);
    _cleanupWorkspaceMembership(socket.id);
    joinRoomAttempts.delete(socket.id);
    logger.info("User disconnected", { socketId: socket.id });
  });

  // Error handling
  socket.on("error", (error) => {
    logger.error("Socket error", { error: error.message, socketId: socket.id });
  });
}

/**
 * Get Socket.IO instance
 */
export function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}

/**
 * Emit event to all connected clients
 */
export function broadcastEvent(eventName, data) {
  if (!io) return;
  io.emit(eventName, data);
  logger.debug("Broadcast event", { event: eventName });
}

/**
 * Emit event to specific room
 */
export function emitToRoom(roomName, eventName, data) {
  if (!io) return;
  io.to(roomName).emit(eventName, data);
  logger.debug("Emit to room", { room: roomName, event: eventName });
}

/**
 * Emit event to specific user
 */
export function emitToUser(userId, eventName, data) {
  if (!io) return;
  const user = Array.from(connectedUsers.values()).find((u) => u.id === userId);
  if (user) {
    io.to(user.socketId).emit(eventName, data);
    logger.debug("Emit to user", { userId, event: eventName });
  }
}

/**
 * Emit event to specific user by email
 */
export function emitToUserByEmail(email, eventName, data) {
  if (!io) return;
  io.to(`user-${String(email).toLowerCase()}`).emit(eventName, data);
  logger.debug("Emit to user by email room", { email, event: eventName });
}

/**
 * Get connected users count
 */
export function getConnectedUsersCount() {
  return connectedUsers.size;
}

/**
 * Get all connected users
 */
export function getConnectedUsers() {
  return Array.from(connectedUsers.values());
}

/**
 * Get room reference
 */
export function getRoom(roomType) {
  return rooms[roomType] || null;
}

export function _clearConnectedUsers() {
  connectedUsers.clear();
}

export function _clearWorkspaceRoomMembers() {
  workspaceRoomMembers.clear();
}

export function _clearJoinRoomAttempts() {
  joinRoomAttempts.clear();
}

function _isWorkspaceMember(roomId, socketId) {
  const members = workspaceRoomMembers.get(roomId);
  return members && members.has(socketId);
}

function _removeWorkspaceMember(roomId, socketId) {
  const members = workspaceRoomMembers.get(roomId);
  if (members) {
    members.delete(socketId);
    if (members.size === 0) workspaceRoomMembers.delete(roomId);
  }
}

function _cleanupWorkspaceMembership(socketId) {
  for (const [roomId, members] of workspaceRoomMembers) {
    if (members.has(socketId)) {
      members.delete(socketId);
      if (members.size === 0) workspaceRoomMembers.delete(roomId);
    }
  }
}

export function _setIOForTests(mockIo) {
  io = mockIo;
}

/**
 * Emit an event to the admin role-scoped room(s) that have permission
 * to receive it.  Falls back to the legacy shared `admin-room` for
 * `super_admin` so single-admin deployments continue working.
 *
 * @param {string|string[]} roles - Role name(s) (e.g. 'membership_admin')
 * @param {string} eventName - Event name
 * @param {Object} data - Payload
 */
export function emitToRole(roles, eventName, data) {
  if (!io) return;
  const list = Array.isArray(roles) ? roles : [roles];
  const targets = new Set();
  for (const role of list) {
    if (role === "admin" || role === "super_admin" || role === "SuperAdmin") {
      targets.add("admin-room");
      continue;
    }
    if (typeof role === "string" && role.length > 0) {
      targets.add(`admin-room:${role}`);
    }
  }
  for (const room of targets) {
    io.to(room).emit(eventName, data);
  }
  logger.debug("Emit to role rooms", { rooms: [...targets], event: eventName });
}

export default {
  initializeSocketIO,
  getIO,
  broadcastEvent,
  emitToRoom,
  emitToUser,
  emitToUserByEmail,
  emitToRole,
  _clearConnectedUsers,
  _clearWorkspaceRoomMembers,
  _clearJoinRoomAttempts,
  _onConnection,
  _setIOForTests,
};
