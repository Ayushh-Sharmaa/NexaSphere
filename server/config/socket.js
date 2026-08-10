/**
 * Socket.IO Configuration
 * Handles WebSocket connections for real-time updates
 */

import { Server } from 'socket.io';
import logger from '../utils/logger.js';
import { getAdminSession } from '../repositories/adminSessionsRepository.js';
import { resolveAdminPermissions, getRoomsForPermissions } from './eventPermissions.js';
import { createAdapter } from '@socket.io/redis-adapter';
import { liveQaService } from '../services/liveQaService.js';
import { validationMiddleware } from '../sockets/validationMiddleware.js';
import { handleYjsUpdate, getOrCreateDoc } from '../utils/yjsSyncHandler.js';
import * as Y from 'yjs';

import { getRedisClient } from '../utils/redis.js';
import { waitingRoomService } from '../services/waitingRoomService.js';
import { getWorkspaceDocument, saveWorkspaceDocument } from '../repositories/workspaceRepository.js';

let io = null;
const connectedUsers = new Map();
const rooms = {
  admin: "admin-room",
  notifications: "notifications-room",
  events: "events-room",
};
const PROTECTED_ROOMS = ["admin-room"];

const workspaceRoomMembers = new Map();

// Tracks the current document version per workspace room for conflict detection
const workspaceVersions = new Map();

// Per-socket rate limiter for join_room events to prevent room enumeration
const joinRoomAttempts = new Map();
const MAX_JOIN_ROOM_ATTEMPTS = 20;
const JOIN_ROOM_WINDOW_MS = 60000;

// Periodic cleanup timer for joinRoomAttempts map
let joinRoomCleanupTimer = null;
const JOIN_ROOM_CLEANUP_INTERVAL_MS = 300000; // 5 minutes

/**
 * Remove stale entries from joinRoomAttempts map.
 * Called periodically to prevent unbounded memory growth.
 */
function cleanupJoinRoomAttempts() {
  const now = Date.now();
  let cleaned = 0;
  for (const [socketId, attempts] of joinRoomAttempts) {
    if (now > attempts.resetAt) {
      joinRoomAttempts.delete(socketId);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    logger.debug('joinRoomAttempts cleanup', { cleaned, remaining: joinRoomAttempts.size });
  }
}

// ===================================// WEBSOCKET BACKPRESSURE & THROTTLING CONFIG
const MAX_CURSOR_X = 5000;
const MAX_CURSOR_Y = 5000;
// ===================================// WEBSOCKET BACKPRESSURE & THROTTLING CONFIG
// ===================================const MAX_PENDING_PACKETS = parseInt(process.env.WS_MAX_PENDING_PACKETS) || 100;
const SLOW_CONSUMER_TIMEOUT_MS = parseInt(process.env.WS_SLOW_CONSUMER_TIMEOUT_MS) || 5000;

const EVENT_POLICIES = {
  cursor_moved: {
    throttleMs: 50, // Max 20 updates per second
    coalesce: true,
  },
  workspace_update: {
    throttleMs: 100, // Max 10 updates per second
    coalesce: true,
  },
  document_change: {
    throttleMs: 100,
    coalesce: true,
  },
  'admin:new-registration': {
    throttleMs: 200, // Max 5 updates per second
    coalesce: true,
  },
  'registration-confirmed': {
    throttleMs: 500,
    coalesce: true,
  },
};

/**
 * Parse Socket.IO packet payload from raw Engine.IO transport string
 */
function parseSocketPacket(packetStr) {
  if (typeof packetStr !== 'string') return null;
  // Match Socket.IO message format: optional engine.io type (4) + socket.io message type (2) + JSON array
  // E.g. "42[...]" or "2[...]"
  const match = packetStr.match(/^(?:4)?2(\[.*\])$/);
  if (!match) return null;
  try {
    const arr = JSON.parse(match[1]);
    if (Array.isArray(arr) && arr.length >= 1) {
      return {
        event: arr[0],
        payload: arr[1],
      };
    }
  } catch (e) {
    // Silent fail for bad JSON
  }
  return null;
}

/**
 * Generate a unique qualifier to isolate event states (e.g. per-room or per-user)
 */
function getEventQualifier(event, payload) {
  if (!payload || typeof payload !== 'object') return '';
  let parts = [];
  if (payload.roomId) parts.push(`room:${payload.roomId}`);
  if (payload.teamRoomId) parts.push(`team:${payload.teamRoomId}`);
  if (payload.taskId) parts.push(`task:${payload.taskId}`);
  if (payload.socketId) parts.push(`socket:${payload.socketId}`);
  if (payload.userId) parts.push(`user:${payload.userId}`);
  return parts.join('|');
}

/**
 * Apply real-time websocket backpressure, slow consumer protection and emit throttling
 */
export function applyBackpressureProtection(socket) {
  if (!socket.conn) return;

  socket.data ||= {};
  if (socket.data.backpressureApplied) return;
  socket.data.backpressureApplied = true;

  socket.data.lastEmitTimes ||= {};
  socket.data.firstQueuedTime = null;

  // Listen to the transport drain event to clear the queued time
  const onDrain = () => {
    socket.data.firstQueuedTime = null;
  };
  socket.conn.on('drain', onDrain);
  socket.data.drainListener = onDrain;

  const origWrite = socket.conn.write;
  socket.conn.write = function (packet, options) {
    const pendingCount = socket.conn.writeBuffer ? socket.conn.writeBuffer.length : 0;

    // A. Bounded Websocket Buffering (Hard Queue Limits)
    if (pendingCount >= MAX_PENDING_PACKETS) {
      logger.warn('WebSocket backpressure limit exceeded. Force disconnecting slow consumer.', {
        socketId: socket.id,
        pendingCount,
        maxAllowed: MAX_PENDING_PACKETS,
      });
      socket.disconnect(true);
      return;
    }

    // B. Slow Consumer Detection via time-stalled queues
    const now = Date.now();
    if (!socket.data.firstQueuedTime) {
      socket.data.firstQueuedTime = now;
    } else if (now - socket.data.firstQueuedTime > SLOW_CONSUMER_TIMEOUT_MS) {
      logger.warn('WebSocket consumer queue stalled. Force disconnecting slow consumer.', {
        socketId: socket.id,
        pendingCount,
        queuedDurationMs: now - socket.data.firstQueuedTime,
      });
      socket.disconnect(true);
      return;
    }

    // C. Parser, Throttling & Coalescing
    const parsed = parseSocketPacket(packet);
    if (parsed) {
      const { event, payload } = parsed;
      const policy = EVENT_POLICIES[event];
      if (policy) {
        const lastEmit = socket.data.lastEmitTimes[event] || 0;

        if (policy.coalesce && now - lastEmit < policy.throttleMs) {
          const qualifier = getEventQualifier(event, payload);

          if (socket.conn.writeBuffer) {
            const existingIdx = socket.conn.writeBuffer.findIndex((item) => {
              const itemParsed = parseSocketPacket(item.data);
              return (
                itemParsed &&
                itemParsed.event === event &&
                getEventQualifier(event, itemParsed.payload) === qualifier
              );
            });

            if (existingIdx !== -1) {
              // Replace the old packet with the latest state (coalescing)
              socket.conn.writeBuffer[existingIdx].data = packet;
              return;
            }
          }
        }

        socket.data.lastEmitTimes[event] = now;
      }
    }

    return origWrite.call(socket.conn, packet, options);
  };
}

/**
 * Retrieve queue pressure and active websocket backpressure statistics
 */
export function getQueuePressureMetrics() {
  if (!io) return [];
  const metrics = [];
  for (const [id, socket] of io.sockets.sockets) {
    metrics.push({
      socketId: id,
      pendingPackets: socket.conn && socket.conn.writeBuffer ? socket.conn.writeBuffer.length : 0,
      firstQueuedTime: socket.data ? socket.data.firstQueuedTime : null,
      adminAuthenticated: !!socket.adminAuthenticated,
    });
  }
  return metrics;
}

let socketValidationTimer = null;

/**
 * Start periodic verification of active admin sockets against the database
 */
export function startSocketValidation() {
  if (socketValidationTimer) return socketValidationTimer;

  const ADMIN_SESSION_VALIDATION_INTERVAL_MS = 5000;
  socketValidationTimer = setInterval(async () => {
    if (!io) return;
    try {
      const activeSockets = io.sockets?.sockets;
      if (!activeSockets) return;

      for (const [id, s] of activeSockets.entries()) {
        if (s.adminAuthenticated && s.adminSessionToken) {
          const session = await getAdminSession(s.adminSessionToken);
          if (!session) {
            logger.warn('Distributed admin session revocation detected. Force disconnecting socket.', { socketId: s.id });
            try {
              s.emit('admin:revoked', { error: 'Session has been revoked or expired' });
            } catch (e) {
              // Socket might already be closed
            }
            s.disconnect(true);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to validate active admin socket sessions', { error: error.message });
    }
  }, ADMIN_SESSION_VALIDATION_INTERVAL_MS);

  if (socketValidationTimer && typeof socketValidationTimer.unref === 'function') {
    socketValidationTimer.unref();
  }
  return socketValidationTimer;
}

/**
 * Stop periodic verification of active admin sockets
 */
export function stopSocketValidation() {
  if (socketValidationTimer) {
    clearInterval(socketValidationTimer);
    socketValidationTimer = null;
  }
  if (joinRoomCleanupTimer) {
    clearInterval(joinRoomCleanupTimer);
    joinRoomCleanupTimer = null;
  }
}


/**
 * Parse Bearer token from auth header
 */

// ── Heartbeat / stale-connection detection ──────────────────────────────────
// Sockets that drop without a clean close (e.g. network failure, mobile sleep)
// leave their entries in connectedUsers and workspaceRoomMembers forever.
// A periodic ping-pong cycle marks each socket as "awaiting pong" and forcibly
// disconnects any that have not responded by the next tick, preventing the
// unbounded memory growth described in issue #3845.
const HEARTBEAT_INTERVAL_MS = 30_000; // emit ping every 30 s
const HEARTBEAT_TIMEOUT_MS = 10_000; // allow 10 s for pong before evicting
const MAX_CONNECTED_USERS = 10_000; // safety cap on the connectedUsers map

let heartbeatInterval = null;

function parseBearer(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return "";
  return authHeader.slice(7).trim();
}

/**
 * Initialize Socket.IO
 * @param {Object} httpServer - HTTP server instance
 */
export function resolveSocketCorsOrigin(env = process.env) {
  if (env.FRONTEND_URL) return env.FRONTEND_URL;
  if (env.NODE_ENV === 'production') {
    throw new Error('FRONTEND_URL must be set in production for Socket.IO CORS');
  }
  return 'http://localhost:5173';
}
export function initializeSocketIO(httpServer) {
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : 'http://localhost:5173';
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
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
      logger.info('Socket.IO using Redis adapter for horizontal scaling.');
    } catch (err) {
      logger.error('Failed to configure Socket.IO Redis adapter:', err);
      logger.info('Socket.IO falling back to in-memory adapter.');
    }
  } else {
    logger.info('Socket.IO using in-memory adapter (REDIS_URL not set).');

  if (process.env.REDIS_URL) {
    const pubClient = getRedisClient();
    const subClient = pubClient.duplicate();
    subClient.on('error', (err) => {
      logger.error('Redis subClient connection error:', err);
    });
    // Ensure both pub/sub clients are connected before wiring the adapter
    const connectIfNeeded = async (client) => {
      if (client && client.status === 'wait') {
        try {
          await client.connect();
        } catch (err) {
          if (err.message !== 'Redis is already connecting/connected') {
            throw err;
          }
        }
      }
    };
    Promise.all([connectIfNeeded(pubClient), connectIfNeeded(subClient)]).then(() => {
      io.adapter(createAdapter(pubClient, subClient));
    });
  } else {
    logger.info('Skipping Redis adapter in test environment');
    logger.info('REDIS_URL not configured. Socket.IO falling back to in-memory adapter.');
  }

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || parseBearer(socket.handshake.headers?.authorization);
    if (token) {
      try {
        const session = await getAdminSession(token);
        if (session) {
          socket.adminSession = session;
          socket.adminSessionToken = token;
          socket.adminAuthenticated = true;
        }
      } catch (err) {
        logger.warn('Socket auth middleware error:', err.message);
        return next(new Error('Authentication failed'));
      }
    }
    next();
  });

  io.on("connection", (socket) => {
    _onConnection(socket);
  });

  liveQaService.setIO(io);
  // Start distributed revocation checks for admin WebSocket clients
  startSocketValidation();

  // Start periodic cleanup of joinRoomAttempts map to prevent memory leaks
  if (!joinRoomCleanupTimer) {
    joinRoomCleanupTimer = setInterval(cleanupJoinRoomAttempts, JOIN_ROOM_CLEANUP_INTERVAL_MS);
    if (typeof joinRoomCleanupTimer.unref === 'function') {
      joinRoomCleanupTimer.unref();
    }
  }

  return io;
}
}

export function _onConnection(socket) {
  logger.info("User connected", {
    socketId: socket.id,
    admin: !!socket.adminAuthenticated,
  });

  // Auto-join authenticated admin sockets to admin room
  if (socket.adminAuthenticated) {
    socket.join('admin-room');
    const role = socket.adminSession?.metadata?.role;
    if (role && typeof role === 'string') {
      socket.join(`admin-room:${role}`);
    }
    const adminRooms = getRoomsForPermissions(socket.adminPermissions);
    for (const room of adminRooms) {
      socket.join(room);
    }
    logger.info('Admin joined scoped rooms', {
      socketId: socket.id,
      username: socket.adminSession?.username,
      rooms: adminRooms,
    });
  }

  // Auto-join workspace room from handshake auth/query (consolidated from workspaceSocket.js)
  const handshakeRoomId = socket.handshake.auth?.roomId || socket.handshake.query?.roomId || null;
  if (handshakeRoomId && /^[a-zA-Z0-9\-_]{1,100}$/.test(handshakeRoomId)) {
    socket.join(handshakeRoomId);
  }

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

    if (typeof userId !== 'string' || typeof email !== 'string') {
      logger.warn('User identification payload fields must be primitive strings', {
        socketId: socket.id,
      });
      return;
    }

    // 4. Safe Deep Copy (Persist sanitized primitives)
    if (userId.length > 128 || email.length > 256) {
      logger.warn('Oversized user identification payload values rejected', { socketId: socket.id });
      return;
    }

    if (connectedUsers.size >= MAX_CONNECTED_USERS) {
      logger.warn('Max connected users cap reached, rejecting identification', {
        socketId: socket.id,
        cap: MAX_CONNECTED_USERS,
      });
      socket.emit('error', { message: 'Server at capacity, please retry later.' });
      return;
    }

    connectedUsers.set(socket.id, {
      id: String(userId),
      email: String(email),
      socketId: String(socket.id),
      connectedAt: new Date(),
    });

    socket.join(`user-${String(email).toLowerCase()}`);

    logger.info('User identified successfully', { userId: String(userId), socketId: socket.id });
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

    // Support mentorship review rooms prefixed with 'review-'
    const isReviewRoom = roomName.startsWith("review-");

    // 2. Strict Allowlist Match
    if (!isReviewRoom && !ALLOWED_PUBLIC_ROOMS.includes(roomName)) {
      logger.warn("Unapproved room:join attempt rejected", {
        socketId: socket.id,
        room: roomName,
      });
      return socket.emit("room:join:error", {
        error: "Invalid or unauthorized room name",
      });
    }

    if (PROTECTED_ROOMS.includes(roomName) && !socket.adminAuthenticated) {
      logger.warn("Unauthorized room join attempt", {
        socketId: socket.id,
        room: roomName,
      });
      return socket.emit("room:join:error", {
        error: "Authentication required to join this room",
      });
    }

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

    const joinedCount = socket.rooms ? socket.rooms.size - 1 : 0;
    if (joinedCount >= MAX_ROOMS_PER_SOCKET) {
      logger.warn("Socket workspace joined rooms limit exceeded", {
        socketId: socket.id,
      });
      return;
    }

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

    // 4. Idempotency — skip if already a member to prevent phantom user entries
    if (workspaceRoomMembers.get(roomId)?.has(socket.id)) {
      return;
    }

    // 5. Track room membership for event relay authorization
    if (!workspaceRoomMembers.has(roomId)) {
      workspaceRoomMembers.set(roomId, new Set());
    }
    workspaceRoomMembers.get(roomId).add(socket.id);

    socket.join(roomId);
    logger.info("User joined workspace room", { socketId: socket.id, roomId });

    // Sanitize user details to prevent reference leaks / massive nested objects
    const sanitizedUser =
      user && typeof user === 'object'
        ? {
            id: typeof user.id === 'string' ? user.id.slice(0, 100) : undefined,
            name: typeof user.name === 'string' ? user.name.slice(0, 100) : 'Anonymous',
            email: typeof user.email === 'string' ? user.email.slice(0, 150) : '',
            color: typeof user.color === 'string' ? user.color.slice(0, 50) : '#888',
            initials: typeof user.initials === 'string' ? user.initials.slice(0, 2) : 'U',
          }
        : { name: 'Anonymous', color: '#888', initials: 'U' };

    // 6. Load current document from DB and send to the joining socket
    getWorkspaceDocument(roomId).then((doc) => {
      if (doc) {
        workspaceVersions.set(roomId, doc.version);
        socket.emit('document_state', { content: doc.content, version: doc.version });
      }
    }).catch(() => {});

    socket
      .to(roomId)
      .emit('user_joined', { socketId: socket.id, user: sanitizedUser, timestamp: Date.now() });
  });

  socket.on('leave_room', (roomId) => {
    if (typeof roomId !== 'string') return;
    _removeWorkspaceMember(roomId, socket.id);
    // Sanitize user details to prevent reference leaks / massive nested objects
    const sanitizedUser =
      user && typeof user === "object"
        ? {
            name:
              typeof user.name === "string"
                ? user.name.slice(0, 100)
                : "Anonymous",
            email:
              typeof user.email === "string" ? user.email.slice(0, 150) : "",
          }
        : {};

    socket
      .to(roomId)
      .emit("user_joined", {
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

  socket.on('planning:join', (eventId) => {
    if (typeof eventId === 'string' && /^[a-zA-Z0-9\-_]{1,100}$/.test(eventId)) {
      socket.join(`planning:${eventId}`);
    }
  });

  socket.on('document_change', async (data) => {
    const { roomId, content, version } = data;
    if (!roomId || !_isWorkspaceMember(roomId, socket.id)) return;

    if (typeof content !== 'string') return;
    if (content.length > 1048576) return;

    // Reject stale versions to prevent silent overwrites
    const currentVersion = workspaceVersions.get(roomId) ?? 0;
    if (version !== currentVersion) {
      const doc = await getWorkspaceDocument(roomId).catch(() => null);
      socket.emit('document_state', {
        content: doc?.content || '',
        version: currentVersion,
      });
      return;
    }
    
    // Accept valid update
    workspaceVersions.set(roomId, version);
    
    socket.to(roomId).emit("document_change", { content, version });
  });

  socket.on("cursor_moved", (data) => {
    const { roomId, ...payload } = data;
    if (roomId)
      socket
        .to(roomId)
        .emit("cursor_moved", { socketId: socket.id, ...payload });
  });

  socket.on("typing_start", (data) => {
    const { roomId, ...payload } = data;
    if (roomId)
      socket
        .to(roomId)
        .emit("typing_start", { socketId: socket.id, ...payload });
  });

  socket.on("typing_stop", (data) => {
    const { roomId, ...payload } = data;
    if (roomId)
      socket
        .to(roomId)
        .emit("typing_stop", { socketId: socket.id, ...payload });
  });

  // Mentorship Review Events
  socket.on("review:join_room", (roomId, user) => {
    if (
      typeof roomId !== "string" ||
      !/^review-[a-zA-Z0-9\-_]{1,100}$/.test(roomId)
    )
      return;

    socket.join(roomId);

    const sanitizedUser =
      user && typeof user === "object"
        ? {
            id: user.id || socket.id,
            name:
              typeof user.name === "string"
                ? user.name.slice(0, 100)
                : "Anonymous",
            color: typeof user.color === "string" ? user.color : "#000",
          }
        : {};

    socket
      .to(roomId)
      .emit("review:user_joined", { socketId: socket.id, user: sanitizedUser });
  });

  socket.on("review:annotation_add", (data) => {
    const { roomId, ...payload } = data;
    if (roomId && typeof roomId === "string") {
      // payload expects { line, text, author, timestamp, id }
      socket
        .to(roomId)
        .emit("review:annotation_added", { socketId: socket.id, ...payload });
    }
  });

  socket.on("review:annotation_resolve", (data) => {
    const { roomId, annotationId } = data;
    if (roomId && annotationId) {
      socket.to(roomId).emit("review:annotation_resolved", { annotationId });
    }

    const newVersion = currentVersion + 1;
    workspaceVersions.set(roomId, newVersion);

    // Persist best-effort — DB may be unavailable during local dev
    saveWorkspaceDocument(roomId, content, newVersion).catch(() => {});

    socket.to(roomId).emit('document_change', { content, version: newVersion });
  });
  socket.on('planning:leave', (eventId) => {
    if (typeof eventId === 'string') socket.leave(`planning:${eventId}`);
  });
  socket.on('planning:updated', (data) => {
    if (data && data.eventId) {
      socket.to(`planning:${data.eventId}`).emit('planning:updated', data);
    }
  });

  socket.on('cursor_moved', (data) => {
    const { roomId, cursor } = data;
    if (!roomId || !_isWorkspaceMember(roomId, socket.id)) return;

    // Validate cursor coordinates before broadcasting
    if (!cursor || typeof cursor.x !== 'number' || typeof cursor.y !== 'number') return;
    if (!Number.isFinite(cursor.x) || !Number.isFinite(cursor.y)) return;
    if (cursor.x < 0 || cursor.x > MAX_CURSOR_X || cursor.y < 0 || cursor.y > MAX_CURSOR_Y) return;

    socket.to(roomId).emit('cursor_moved', {
      socketId: socket.id,
      cursor: { x: Math.round(cursor.x), y: Math.round(cursor.y) },
    });
  });

  socket.on('typing_start', (data) => {
    const { roomId, user, ...payload } = data;
    if (roomId && _isWorkspaceMember(roomId, socket.id)) {
      socket.to(roomId).emit('typing_start', { socketId: socket.id, user, ...payload });
    }
  });

  socket.on("typing_stop", (data) => {
    const { roomId, ...payload } = data;
    if (roomId && _isWorkspaceMember(roomId, socket.id)) {
      socket.to(roomId).emit("typing_stop", { socketId: socket.id, ...payload });
    }
  });

  // Mentorship Review Events
  socket.on("review:join_room", (roomId, user) => {
    if (
      typeof roomId !== "string" ||
      !/^review-[a-zA-Z0-9\-_]{1,100}$/.test(roomId)
    )
      return;

    socket.join(roomId);

    const sanitizedUser =
      user && typeof user === "object"
        ? {
            id: user.id || socket.id,
            name:
              typeof user.name === "string"
                ? user.name.slice(0, 100)
                : "Anonymous",
            color: typeof user.color === "string" ? user.color : "#000",
          }
        : {};

    socket
      .to(roomId)
      .emit("review:user_joined", { socketId: socket.id, user: sanitizedUser });
  });

  socket.on("review:annotation_add", (data) => {
    const { roomId, ...payload } = data;
    if (roomId && typeof roomId === "string") {
      // payload expects { line, text, author, timestamp, id }
      socket
        .to(roomId)
        .emit("review:annotation_added", { socketId: socket.id, ...payload });
    }
  });

  socket.on("review:annotation_resolve", (data) => {
    const { roomId, annotationId } = data;
    if (roomId && annotationId) {
      socket.to(roomId).emit("review:annotation_resolved", { annotationId });
    }
  });

  socket.on("review:cursor_sync", (data) => {
    const { roomId, line, col } = data;
    if (roomId) {
      socket
        .to(roomId)
        .emit("review:cursor_synced", { socketId: socket.id, line, col });
    }
  });

  // --- Task management events (consolidated from workspaceSocket.js / roomHandler.js) ---

  socket.on('task_create', async (data, ack) => {
    try {
      const { roomId, task } = data || {};

      if (typeof roomId !== 'string' || !/^[a-zA-Z0-9\-_]{1,100}$/.test(roomId)) {
        if (typeof ack === 'function') ack({ success: false, error: 'Invalid roomId' });
        return;
      }

      if (!task || !task.title) {
        if (typeof ack === 'function') ack({ success: false, error: 'Task title is required' });
        return;
      }

      const payload = {
        ...task,
        roomId,
        _id: task._id || undefined,
        createdAt: task.createdAt || new Date().toISOString(),
      };

      socket.to(roomId).emit('task_created', payload);

      if (typeof ack === 'function') ack({ success: true, task: payload });
    } catch (err) {
      logger.error('task_create error', { error: err.message, socketId: socket.id });
      if (typeof ack === 'function') ack({ success: false, error: err.message });
    }
  });

  socket.on('task_update_status', async (data, ack) => {
    try {
      const { roomId, taskId, status, previousStatus, updatedBy } = data || {};

      if (typeof roomId !== 'string' || !/^[a-zA-Z0-9\-_]{1,100}$/.test(roomId)) {
        if (typeof ack === 'function') ack({ success: false, error: 'Invalid roomId' });
        return;
      }

      if (!taskId || !['Todo', 'In_Progress', 'Review', 'Done'].includes(status)) {
        if (typeof ack === 'function') ack({ success: false, error: 'taskId and valid status are required' });
        return;
      }

      const payload = {
        taskId,
        roomId,
        status,
        previousStatus: previousStatus || null,
        updatedBy: updatedBy || null,
        timestamp: Date.now(),
      };

      socket.to(roomId).emit('task_updated', payload);

      if (typeof ack === 'function') ack({ success: true, task: payload });
    } catch (err) {
      logger.error('task_update_status error', { error: err.message, socketId: socket.id });
      if (typeof ack === 'function') ack({ success: false, error: err.message });
    }
  });

  socket.on('task_status_update', async (data, ack) => {
    try {
      const { teamRoomId, taskId, newStatus, previousStatus, updatedBy } = data || {};

      if (typeof teamRoomId !== 'string' || !/^[a-zA-Z0-9\-_]{1,100}$/.test(teamRoomId)) {
        if (typeof ack === 'function') ack({ success: false, error: 'Invalid teamRoomId' });
        return;
      }

      if (!taskId || !newStatus) {
        if (typeof ack === 'function') ack({ success: false, error: 'taskId and newStatus required' });
        return;
      }

      if (!['Todo', 'In_Progress', 'Review', 'Done'].includes(newStatus)) {
        if (typeof ack === 'function') ack({ success: false, error: `Invalid status: ${newStatus}` });
        return;
      }

      const payload = {
        taskId,
        teamRoomId,
        newStatus,
        previousStatus: previousStatus || null,
        updatedBy: updatedBy || null,
        timestamp: Date.now(),
      };

      socket.to(teamRoomId).emit('task_updated', payload);

      if (typeof ack === 'function') ack({ success: true, task: payload });
    } catch (err) {
      logger.error('task_status_update error', { error: err.message, socketId: socket.id });
      if (typeof ack === 'function') ack({ success: false, error: err.message });
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
      socket.adminSessionToken = token;
      socket.adminAuthenticated = true;
      socket.adminPermissions = resolveAdminPermissions(session);
      const authRooms = getRoomsForPermissions(socket.adminPermissions);
      for (const room of authRooms) {
        socket.join(room);
      }
      socket.join('admin-room');
      const role = session.metadata?.role;
      if (role && typeof role === 'string') {
        socket.join(`admin-room:${role}`);
      }
      logger.info('Admin authenticated via socket event', {
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

  socket.on('waiting:join', ({ eventId, fullName, email, isPriority } = {}) => {
    if (!eventId || !email || !fullName) return;
    const userId = socket.id;
    const result = waitingRoomService.joinQueue(eventId, { userId, fullName, email, isPriority });
    socket.join(`waiting:${eventId}`);
    socket.emit('waiting:joined', { eventId, ...result });
  });

  /**
   * Yjs real-time CRDT synchronization handlers
   * Manages binary document updates, syncing state, and user awareness protocols.
   */

  /**
   * Receives binary CRDT state updates from clients, applies them to the in-memory
   * server-side document, and relays them to all other sockets joined to that room.
   */
  socket.on('yjs_update', (roomId, update) => {
    if (typeof roomId !== 'string' || !/^[a-zA-Z0-9\-_]{1,100}$/.test(roomId)) {
      logger.warn('Malformed workspace roomId join attempt rejected', {
        socketId: socket.id,
        roomId,
      });
      return;
    }

    if (!socket.rooms.has(roomId)) {
      logger.warn('Unauthorized yjs_update attempt: socket not in room', {
        socketId: socket.id,
        roomId,
      });
      return;
    }

    try {
      const updateBuffer = Buffer.isBuffer(update) ? update : Buffer.from(update);
      handleYjsUpdate(roomId, updateBuffer);
      socket.to(roomId).emit('yjs_update', updateBuffer);
    } catch (err) {
      logger.error('Error handling yjs_update', {
        error: err.message,
        socketId: socket.id,
      });
    }
  });

  /**
   * Generates and transmits the full in-memory document state to a newly joined client
   * upon their synchronization request.
   */
  socket.on('yjs_sync_request', ({ roomId }) => {
    if (typeof roomId !== 'string' || !/^[a-zA-Z0-9\-_]{1,100}$/.test(roomId)) {
      return;
    }

    if (!socket.rooms.has(roomId)) {
      return;
    }

    try {
      const doc = getOrCreateDoc(roomId);
      const stateVector = Y.encodeStateAsUpdate(doc);
      socket.emit('yjs_update', Buffer.from(stateVector));
    } catch (err) {
      logger.error('Error handling yjs_sync_request', {
        error: err.message,
        socketId: socket.id,
      });
    }
  });

  /**
   * Relays awareness/presence protocol updates (e.g. cursor positions, user colors)
   * to all other connected clients in the corresponding workspace.
   */
  socket.on('yjs_awareness', (roomId, update) => {
    if (typeof roomId !== 'string' || !/^[a-zA-Z0-9\-_]{1,100}$/.test(roomId)) {
      return;
    }

    if (!socket.rooms.has(roomId)) {
      return;
    }

    const updateBuffer = Buffer.isBuffer(update) ? update : Buffer.from(update);
    socket.to(roomId).emit('yjs_awareness', updateBuffer);
  });

  // Handles abrupt disconnects (crash, sleep, network drop)
  socket.on('disconnecting', (reason) => {
    logger.info('Socket disconnecting', { socketId: socket.id, reason });
    connectedUsers.delete(socket.id);
    joinRoomAttempts.delete(socket.id);
    _cleanupWorkspaceMembership(socket.id);
  });

  socket.on('waiting:status', ({ eventId } = {}) => {
    if (!eventId) return;
    const queue = waitingRoomService.getQueue(eventId);
    socket.emit('waiting:status:update', { eventId, queue, total: queue.length });
  });

  socket.on('waiting:admit-one', ({ eventId } = {}) => {
    if (!socket.adminAuthenticated || !eventId) return;
    const entry = waitingRoomService.admitOne(eventId);
    if (entry) {
      socket.emit('waiting:admitted-entry', { eventId, entry });
    }
  });

  socket.on('waiting:admit-all', ({ eventId } = {}) => {
    if (!socket.adminAuthenticated || !eventId) return;
    const admitted = waitingRoomService.admitAll(eventId);
    socket.emit('waiting:admitted-entries', { eventId, count: admitted.length });
  });

  socket.on('waiting:remove', ({ eventId, entryId } = {}) => {
    if (!socket.adminAuthenticated || !eventId || !entryId) return;
    waitingRoomService.removeFromQueue(eventId, entryId);
    socket.emit('waiting:removed-entry', { eventId, entryId });
  });

  socket.on('waiting:move-front', ({ eventId, entryId } = {}) => {
    if (!socket.adminAuthenticated || !eventId || !entryId) return;
    waitingRoomService.moveToFront(eventId, entryId);
    socket.emit('waiting:moved-front', { eventId, entryId });
  });

  socket.on('waiting:send-message', ({ eventId, message } = {}) => {
    if (!socket.adminAuthenticated || !eventId || !message) return;
    waitingRoomService.sendMessage(eventId, message);
  });

  // ── Heartbeat pong handler ─────────────────────────────────────────────────
  // The server sends a 'ping' event periodically (see startHeartbeat).
  // Clients must respond with 'pong'.  If no pong arrives before the next
  // heartbeat tick the socket is forcibly disconnected, releasing all memory.
  socket.on('pong', () => {
    socket._heartbeatAlive = true;
  });

  // Mark the socket as alive on initial connection so the first heartbeat
  // cycle does not immediately evict it.
  socket._heartbeatAlive = true;

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    connectedUsers.delete(socket.id);
    _cleanupWorkspaceMembership(socket.id);
    joinRoomAttempts.delete(socket.id);

    if (socket.data) {
      socket.data.firstQueuedTime = null;
      socket.data.lastEmitTimes = null;
      if (socket.data.drainListener && socket.conn) {
        socket.conn.off("drain", socket.data.drainListener);
      }
    }
    logger.info("User disconnected", { socketId: socket.id, reason });
  });

  // Error handling
  socket.on("error", (error) => {
    logger.error("Socket error", { error: error.message, socketId: socket.id });
  });
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}

export function broadcastEvent(eventName, data) {
  if (!io) return;
  io.emit(eventName, data);
  logger.debug("Broadcast event", { event: eventName });
}

export let emitToRoomOverride = null;

export function setEmitToRoomOverride(fn) {
  emitToRoomOverride = fn;
}


/**
 * Emit event to specific room
 */
export function emitToRoom(roomName, eventName, data) {
  if (emitToRoomOverride) {
    return emitToRoomOverride(roomName, eventName, data);
  }
  if (!io) return;
  io.to(roomName).emit(eventName, data);
  logger.debug("Emit to room", { room: roomName, event: eventName });
}

export function emitToUser(userId, eventName, data) {
  if (!io) return;
  const user = Array.from(connectedUsers.values()).find((u) => u.id === userId);
  if (user) {
    io.to(user.socketId).emit(eventName, data);
    logger.debug("Emit to user", { userId, event: eventName });
  }
}

export function emitToUserByEmail(email, eventName, data) {
  if (!io) return;
  io.to(`user-${String(email).toLowerCase()}`).emit(eventName, data);
  logger.debug('Emit to user by email room', { email, event: eventName });
}

export function getConnectedUsersCount() {
  return connectedUsers.size;
}

export function getConnectedUsers() {
  return Array.from(connectedUsers.values());
}

export function getRoom(roomType) {
  return rooms[roomType] || null;
}


/**
 * Emit event to specific role
 */
export function emitToRole(roles, eventName, data) {
  if (!io) return;
  const list = Array.isArray(roles) ? roles : [roles];
  const targets = new Set();
  for (const role of list) {
    if (role === 'admin' || role === 'super_admin' || role === 'SuperAdmin') {
      targets.add('admin-room');
      continue;
    }
    if (typeof role === 'string' && role.length > 0) {
      targets.add(`admin-room:${role}`);
    }
  }
  targets.add('admin-room:SuperAdmin');
  targets.add('admin-room:super_admin');

  for (const room of targets) {
    io.to(room).emit(eventName, data);
  }
  logger.debug('Emit to role rooms', { rooms: [...targets], event: eventName });
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
 * Starts (or restarts) the server-side heartbeat that detects stale sockets.
 *
 * Every HEARTBEAT_INTERVAL_MS milliseconds the server:
 *   1. Emits a 'ping' event to every connected socket.
 *   2. Marks each socket as NOT alive (_heartbeatAlive = false).
 *   3. After HEARTBEAT_TIMEOUT_MS, any socket still marked NOT alive has not
 *      responded with 'pong' and is forcibly disconnected.
 *
 * On disconnect the existing handler removes the socket from connectedUsers,
 * workspaceRoomMembers, and joinRoomAttempts, so no manual cleanup is needed
 * here — the disconnect event does all the work.
 */
export function startHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  heartbeatInterval = setInterval(() => {
    if (!io) return;

    io.sockets.sockets.forEach((socket) => {
      if (!socket._heartbeatAlive) {
        // Did not respond to last ping — evict immediately.
        logger.warn('Evicting unresponsive socket (missed heartbeat pong)', {
          socketId: socket.id,
        });
        socket.disconnect(true);
        return;
      }

      // Mark as NOT alive; the 'pong' handler will flip it back to true.
      socket._heartbeatAlive = false;
      socket.emit('ping');
    });
  }, HEARTBEAT_INTERVAL_MS);

  // Avoid keeping the process alive solely for the heartbeat in test/CLI envs.
  if (heartbeatInterval.unref) heartbeatInterval.unref();

  logger.info('Socket heartbeat started', {
    intervalMs: HEARTBEAT_INTERVAL_MS,
    timeoutMs: HEARTBEAT_TIMEOUT_MS,
  });
}

/**
 * Stops the heartbeat interval.  Call this during graceful server shutdown
 * or in test teardown to prevent open handle warnings.
 */
export function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    logger.info('Socket heartbeat stopped.');
  }
}

export default {
  initializeSocketIO,
  getIO,
  broadcastEvent,
  emitToRoom,
  emitToUser,
  emitToUserByEmail,
  emitToRole,
  startHeartbeat,
  stopHeartbeat,
  _clearConnectedUsers,
  _clearWorkspaceRoomMembers,
  _clearJoinRoomAttempts,
  _onConnection,
  _setIOForTests,
  setEmitToRoomOverride,
  applyBackpressureProtection,
  getQueuePressureMetrics,
};
