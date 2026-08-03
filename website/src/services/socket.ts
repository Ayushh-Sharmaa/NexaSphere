import logger from '../utils/logger.js';
import { io, Socket } from 'socket.io-client';
import { getSocketServerUrl } from '../utils/runtimeConfig';

/** Type-safe listener signature matching Socket.IO's internal contract. */
type SocketListener = (...args: unknown[]) => void;

// Keep a singleton instance
let socketInstance: Socket | null = null;
let connectionUrl: string = '';

export const initializeSocket = (url: string = getSocketServerUrl()): Socket => {
  if (!socketInstance || (connectionUrl && connectionUrl !== url)) {
    if (socketInstance) {
      if (import.meta.env.DEV) {
        logger.info(`[Socket.IO] Disconnecting existing socket due to URL change.`);
      }
      socketInstance.disconnect();
    }

    if (import.meta.env.DEV) {
      logger.info(`[Socket.IO] Initializing new socket connection to: ${url}`);
    }
    connectionUrl = url;

    const isE2E =
      typeof window !== 'undefined' && window.navigator?.userAgent?.includes('Playwright-E2E');

    socketInstance = io(url, {
      reconnection: !isE2E,
      reconnectionAttempts: isE2E ? 1 : 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      timeout: isE2E ? 2000 : 20000,
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    // Offline message queue implementation
    const originalEmit = socketInstance.emit.bind(socketInstance);
    let offlineQueue: any[][] = [];

    // Monkey-patch emit to queue messages when disconnected
    socketInstance.emit = function (event: string, ...args: any[]) {
      if (this.connected) {
        return originalEmit(event, ...args);
      } else {
        if (import.meta.env.DEV) {
          console.log(`[Socket.IO] Offline, queuing event: ${event}`);
        }
        offlineQueue.push([event, ...args]);
        return this;
      }
    };

    socketInstance.on('connect', () => {
      if (import.meta.env.DEV) {
        logger.info(`[Socket.IO] Connected with ID: ${socketInstance?.id}`);
      }

      // Flush offline queue upon reconnection
      if (offlineQueue.length > 0) {
        if (import.meta.env.DEV) {
          console.log(`[Socket.IO] Flushing ${offlineQueue.length} queued events`);
        }
        offlineQueue.forEach((args) => {
          originalEmit(args[0], ...args.slice(1));
        });
        offlineQueue = [];
      }
    });

    socketInstance.on('disconnect', (reason) => {
      if (import.meta.env.DEV) {
        logger.info(`[Socket.IO] Disconnected. Reason: ${reason}`);
      }
    });

    // connect_error is always logged regardless of environment — it indicates
    // a real connectivity problem that should be visible in production logs.
    socketInstance.on('connect_error', (err) => {
      console.error(`[Socket.IO] Connection Error:`, err);
    });

    // Monkey-patch on/off for event listener observability — DEV only.
    if (import.meta.env.DEV) {
      const originalOn = socketInstance.on.bind(socketInstance);
      socketInstance.on = (event: string, listener: SocketListener) => {
        if (event !== 'connect' && event !== 'disconnect') {
          logger.info(`[Socket.IO] Listener registered for event: ${event}`);
        }
        return originalOn(event, listener);
      };

      const originalOff = socketInstance.off.bind(socketInstance);
      socketInstance.off = (event: string, listener?: SocketListener) => {
        if (event !== 'connect' && event !== 'disconnect') {
          logger.info(`[Socket.IO] Listener removed for event: ${event}`);
        }
        return originalOff(event, listener);
      };
    }
  }

  return socketInstance;
};

export const getSocket = (): Socket => {
  if (!socketInstance) {
    return initializeSocket();
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    if (import.meta.env.DEV) {
      logger.info(`[Socket.IO] Manually destroying socket instance.`);
    }
    socketInstance.disconnect();
    socketInstance = null;
    connectionUrl = '';
  }
};
