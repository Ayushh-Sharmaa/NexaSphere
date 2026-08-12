import { getRedisClient } from '../utils/redis.js';
import logger from '../utils/logger.js';
import notificationsService from './notificationsService.js';

// Threat severity scores
export const EVENT_TYPES = {
  AUTH_FAILURE: { score: 2, name: 'AUTH_FAILURE' },
  PRIVILEGE_ESCALATION: { score: 5, name: 'PRIVILEGE_ESCALATION' },
  ABNORMAL_API_REQUEST: { score: 3, name: 'ABNORMAL_API_REQUEST' },
  SUSPICIOUS_SESSION: { score: 4, name: 'SUSPICIOUS_SESSION' },
};

const THREAT_THRESHOLD = 20; // Score required to trigger a block
const BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour block
const CORRELATION_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window

class IntrusionDetectionService {
  constructor() {
    // In-memory cache for IP threat scores
    this.ipScores = new Map();
    // In-memory cache for blocked IPs
    this.blockedIps = new Map();

    // Clean up expired entries every 5 minutes
    setInterval(
      () => {
        const now = Date.now();
        for (const [ip, data] of this.ipScores.entries()) {
          if (now - data.updatedAt > CORRELATION_WINDOW_MS) {
            this.ipScores.delete(ip);
          }
        }
        for (const [ip, data] of this.blockedIps.entries()) {
          if (now - data.blockedAt > BLOCK_DURATION_MS) {
            this.blockedIps.delete(ip);
          }
        }
      },
      5 * 60 * 1000
    ).unref();
  }

  /**
   * Reports a security event to the correlation engine.
   * @param {Object} eventType - Type of event from EVENT_TYPES
   * @param {string} ip - The IP address of the requester
   * @param {string} userId - Optional user ID
   * @param {Object} metadata - Additional context
   */
  async reportEvent(eventType, ip, userId = null, metadata = {}) {
    if (!ip) return;

    // Ignore if already blocked locally
    if (this.blockedIps.has(ip)) {
      return;
    }

    const currentScore = this.ipScores.get(ip)?.score || 0;
    const newScore = currentScore + eventType.score;

    this.ipScores.set(ip, { score: newScore, updatedAt: Date.now() });

    logger.warn(
      `Security Event: ${eventType.name} from IP ${ip} (Score: ${newScore}/${THREAT_THRESHOLD})`,
      {
        userId,
        ...metadata,
      }
    );

    if (newScore >= THREAT_THRESHOLD) {
      await this.blockIp(ip, `Threat threshold exceeded (${newScore}) due to ${eventType.name}`);
    }
  }

  /**
   * Blocks an IP address and notifies admins.
   * @param {string} ip - IP to block
   * @param {string} reason - Reason for blocking
   */
  async blockIp(ip, reason) {
    if (this.blockedIps.has(ip)) return;

    this.blockedIps.set(ip, { reason, blockedAt: Date.now() });

    // Optional Redis backup for multi-instance synchronization
    try {
      const client = getRedisClient();
      if (client) {
        await client.set(`blocked_ip:${ip}`, reason, 'PX', BLOCK_DURATION_MS);
      }
    } catch (err) {
      logger.error('Redis error while blocking IP:', err);
    }

    logger.error(`🚨 INTRUSION DETECTION: IP ${ip} blocked. Reason: ${reason}`);

    // Attempt admin notification
    try {
      await notificationsService.sendAdminNotification({
        title: 'Security Alert: IP Blocked',
        message: `Intrusion detection system blocked IP ${ip}. Reason: ${reason}`,
        priority: 'high',
        type: 'SECURITY_ALERT',
      });
    } catch (err) {
      logger.error('Failed to send admin notification for IP block:', err);
    }
  }

  /**
   * Checks if an IP is currently blocked.
   * @param {string} ip - The IP address to check
   * @returns {boolean} True if blocked
   */
  async isBlocked(ip) {
    if (!ip) return false;

    // Check local memory first
    const localBlock = this.blockedIps.get(ip);
    if (localBlock) {
      if (Date.now() - localBlock.blockedAt <= BLOCK_DURATION_MS) {
        return true;
      } else {
        this.blockedIps.delete(ip);
      }
    }

    // Check Redis as fallback (e.g. blocked by another instance)
    try {
      const client = getRedisClient();
      if (client) {
        const blocked = await client.get(`blocked_ip:${ip}`);
        if (blocked) {
          // Sync to local memory
          this.blockedIps.set(ip, { reason: blocked, blockedAt: Date.now() });
          return true;
        }
      }
    } catch (err) {
      // Fail open if Redis is down
    }

    return false;
  }

  // For testing purposes
  _reset() {
    this.ipScores.clear();
    this.blockedIps.clear();
  }
}

export const intrusionDetectionService = new IntrusionDetectionService();
