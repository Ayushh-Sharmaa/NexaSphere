/**
 * refreshTokenService.js
 *
 * Secure JWT Refresh Token Rotation Service.
 *
 * Implements:
 *  1. Short-lived access tokens (15 min default).
 *  2. Long-lived refresh tokens that rotate on every use.
 *  3. Token-family tracking: if a previously invalidated refresh token is
 *     presented, ALL tokens in that family are revoked (entire-family wipe).
 *  4. All refresh tokens are stored hashed (SHA-256); raw values never touch
 *     the database.
 *  5. Device/session metadata recorded per token.
 *  6. Security-event logging for auditing and incident investigation.
 *
 * Usage (controller layer):
 *
 *   // On login:
 *   const { accessToken, refreshToken } = await refreshTokenService.issueTokenPair(user, { ip, ua });
 *
 *   // On /auth/refresh:
 *   const result = await refreshTokenService.rotate(rawRefreshToken, { ip, ua });
 *   if (result.reuseDetected) { ... handle compromise ... }
 *
 *   // On logout:
 *   await refreshTokenService.revokeRefreshToken(rawRefreshToken);
 *
 *   // On logout-all / password change:
 *   await refreshTokenService.revokeAllSessions(userId);
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as refreshTokenRepository from '../repositories/refreshTokenRepository.js';
import logger from '../utils/logger.js';

// ── JWT helpers ───────────────────────────────────────────────────────────────

function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('FATAL: JWT_SECRET is not set');
  return s;
}

/** Access-token lifetime (default 15 min, overridable via ACCESS_TOKEN_EXPIRY). */
function getAccessTokenExpiry() {
  return process.env.ACCESS_TOKEN_EXPIRY || '15m';
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random opaque refresh-token string.
 * 48 bytes → 64 hex chars; functionally unguessable.
 */
function generateRawRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

/**
 * Build the JWT access-token payload and sign it.
 */
function signAccessToken(user) {
  const payload = {
    sub: user.id,
    provider: user.provider,
    email: user.email,
    name: user.full_name ?? user.name,
    role: user.role,
    scopes: user.scopes ?? [],
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getAccessTokenExpiry(),
    issuer: 'nexasphere',
    audience: 'nexasphere-client',
  });
}

function logSecurityEvent(event, data) {
  logger.warn(`[RefreshTokenService] SECURITY_EVENT=${event}`, data);
}

// ── Public API ────────────────────────────────────────────────────────────────

export const refreshTokenService = {
  /**
   * Issue a brand-new access + refresh token pair on login / initial auth.
   *
   * @param {object} user      - User record (must contain id, provider, email, role, …).
   * @param {object} [meta]    - Optional { ip, userAgent, deviceId } metadata.
   * @returns {{ accessToken: string, refreshToken: string, expiresIn: number }}
   */
  async issueTokenPair(user, { ip = null, userAgent = null, deviceId = null } = {}) {
    const accessToken = signAccessToken(user);
    const rawRefreshToken = generateRawRefreshToken();

    await refreshTokenRepository.createRefreshToken({
      rawToken: rawRefreshToken,
      userId: String(user.id),
      familyId: null, // starts a new family
      deviceId,
      ipAddress: ip,
      userAgent,
    });

    logSecurityEvent('TOKEN_ISSUED', { userId: user.id, ip, userAgent });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  },

  /**
   * Rotate a refresh token: validate → revoke old → issue new pair.
   *
   * Returns { accessToken, refreshToken, expiresIn } on success.
   * Returns { error, reuseDetected } on failure.
   *
   * @param {string} rawRefreshToken
   * @param {object} [meta] - { ip, userAgent, deviceId }
   * @param {object} user   - User record to re-sign (fetched by caller after token lookup).
   */
  async rotate(rawRefreshToken, user, { ip = null, userAgent = null, deviceId = null } = {}) {
    // 1. Look up the stored token row
    const tokenRow = await refreshTokenRepository.findByRawToken(rawRefreshToken);

    if (!tokenRow) {
      logSecurityEvent('ROTATE_UNKNOWN_TOKEN', { ip, userAgent });
      return { error: 'Invalid refresh token', reuseDetected: false };
    }

    // 2. Check expiry
    if (new Date(tokenRow.expires_at) < new Date()) {
      logSecurityEvent('ROTATE_EXPIRED_TOKEN', { userId: tokenRow.user_id, ip });
      return { error: 'Refresh token expired', reuseDetected: false };
    }

    // 3. Reuse detection — token already revoked
    if (tokenRow.is_revoked) {
      // Revoke the entire family to invalidate all active sessions from this lineage.
      const revokedCount = await refreshTokenRepository.revokeFamilyById(
        tokenRow.family_id,
        'reuse_detected'
      );

      logSecurityEvent('REFRESH_TOKEN_REUSE_DETECTED', {
        userId: tokenRow.user_id,
        familyId: tokenRow.family_id,
        revokedCount,
        ip,
        userAgent,
      });

      return {
        error: 'Refresh token reuse detected. All sessions have been revoked.',
        reuseDetected: true,
        userId: tokenRow.user_id,
      };
    }

    // 4. Revoke the consumed token
    await refreshTokenRepository.revokeToken(tokenRow.token_hash, 'rotated');

    // 5. Issue the new pair carrying the same family_id for lineage tracking
    const newRawRefreshToken = generateRawRefreshToken();
    const accessToken = signAccessToken(user);

    await refreshTokenRepository.createRefreshToken({
      rawToken: newRawRefreshToken,
      userId: tokenRow.user_id,
      familyId: tokenRow.family_id,
      deviceId: deviceId ?? tokenRow.device_id,
      ipAddress: ip ?? tokenRow.ip_address,
      userAgent: userAgent ?? tokenRow.user_agent,
    });

    logSecurityEvent('TOKEN_ROTATED', {
      userId: tokenRow.user_id,
      familyId: tokenRow.family_id,
      ip,
    });

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      expiresIn: 15 * 60,
    };
  },

  /**
   * Revoke a single refresh token (e.g. per-device logout).
   *
   * @param {string} rawRefreshToken
   */
  async revokeRefreshToken(rawRefreshToken) {
    const tokenRow = await refreshTokenRepository.findByRawToken(rawRefreshToken);
    if (!tokenRow) return;
    await refreshTokenRepository.revokeToken(tokenRow.token_hash, 'logout');
    logSecurityEvent('TOKEN_REVOKED', { userId: tokenRow.user_id });
  },

  /**
   * Revoke ALL active sessions for a user.
   * Call this on password change, account compromise, or admin-forced logout.
   *
   * @param {string} userId
   * @returns {Promise<number>} Number of sessions revoked.
   */
  async revokeAllSessions(userId, reason = 'user_requested') {
    const count = await refreshTokenRepository.revokeAllForUser(userId, reason);
    logSecurityEvent('ALL_SESSIONS_REVOKED', { userId, count, reason });
    return count;
  },

  /**
   * List all active sessions for a user (for account-management UI).
   *
   * @param {string} userId
   */
  async getActiveSessions(userId) {
    return refreshTokenRepository.getActiveSessionsForUser(userId);
  },

  /**
   * Verify an access token JWT.
   * Returns the decoded payload or null if invalid/expired.
   *
   * @param {string} accessToken
   * @returns {object|null}
   */
  verifyAccessToken(accessToken) {
    try {
      return jwt.verify(accessToken, getJwtSecret(), {
        issuer: 'nexasphere',
        audience: 'nexasphere-client',
      });
    } catch {
      return null;
    }
  },
};
