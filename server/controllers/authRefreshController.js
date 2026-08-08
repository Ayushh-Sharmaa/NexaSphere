/**
 * authRefreshController.js
 *
 * HTTP handlers for refresh-token-based endpoints:
 *
 *  POST /api/auth/refresh          — rotate refresh token → new access + refresh pair
 *  POST /api/auth/local/login      — enhanced login (issues both tokens)
 *  POST /api/auth/logout           — revoke the current refresh token
 *  POST /api/auth/logout-all       — revoke all sessions for the authenticated user
 *  GET  /api/auth/sessions         — list active sessions (management UI)
 *
 * Refresh token cookie name  : ns_refresh_token
 * Access token cookie name   : ns_student_token
 */

import bcrypt from 'bcryptjs';
import { refreshTokenService } from '../services/refreshTokenService.js';
import { studentAuthService } from '../services/studentAuthService.js';
import { withDb } from '../repositories/db.js';
import logger from '../utils/logger.js';

// ── Cookie configuration helpers ──────────────────────────────────────────────

const ACCESS_TOKEN_COOKIE = 'ns_student_token';
const REFRESH_TOKEN_COOKIE = 'ns_refresh_token';

function refreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30) * 24 * 60 * 60 * 1000,
    path: '/api/auth', // scope cookie to auth routes only
  };
}

function accessTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  };
}

function extractMeta(req) {
  return {
    ip: req.ip ?? req.socket?.remoteAddress ?? null,
    userAgent: req.headers['user-agent'] ?? null,
    deviceId: req.headers['x-device-id'] ?? null,
  };
}

// ── Handlers ──────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/local/login
 *
 * Extended local-auth login that issues both access and refresh tokens.
 */
export const localLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await withDb(async (client) => {
      const { rows } = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      return rows[0];
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'Local login is not enabled for this account' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userPayload = {
      id: user.id,
      provider: 'local',
      email: user.email,
      full_name: user.display_name,
      role: user.role ?? 'user',
      scopes: studentAuthService.getScopesForRole(user.role),
    };

    const meta = extractMeta(req);
    const { accessToken, refreshToken, expiresIn } = await refreshTokenService.issueTokenPair(
      userPayload,
      meta
    );

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, accessTokenCookieOptions());
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenCookieOptions());

    return res.json({
      ok: true,
      user: userPayload,
      expiresIn,
    });
  } catch (err) {
    logger.error('[authRefreshController] localLogin error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/auth/refresh
 *
 * Accepts a refresh token (cookie or body), validates it, and returns a new
 * access token + rotated refresh token.
 *
 * On reuse detection all sessions are invalidated and a 401 is returned.
 */
export const refreshTokens = async (req, res) => {
  const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] ?? req.body?.refreshToken;

  if (!rawRefreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    // Resolve the user record from the stored token first so we can re-sign
    // the access token with up-to-date scopes and role.
    const { findByRawToken } = await import('../repositories/refreshTokenRepository.js');
    const tokenRow = await findByRawToken(rawRefreshToken);

    if (!tokenRow || tokenRow.is_revoked || new Date(tokenRow.expires_at) < new Date()) {
      // Clear stale cookies
      res.clearCookie(ACCESS_TOKEN_COOKIE);
      res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/auth' });

      // If we have a token row but it's revoked → potential reuse
      if (tokenRow?.is_revoked) {
        const { revokeFamilyById } = await import('../repositories/refreshTokenRepository.js');
        await revokeFamilyById(tokenRow.family_id, 'reuse_detected');
        logger.warn('[authRefreshController] Refresh token reuse detected', {
          userId: tokenRow.user_id,
          familyId: tokenRow.family_id,
          ip: req.ip,
        });
        return res.status(401).json({
          error: 'Refresh token reuse detected. All sessions have been revoked for your security.',
          reuseDetected: true,
        });
      }

      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Fetch fresh user record from student_users or local users table
    let user;
    try {
      user = await withDb(async (client) => {
        // Try student_users first (OAuth users)
        const { rows: studentRows } = await client.query(
          'SELECT * FROM student_users WHERE id = $1',
          [tokenRow.user_id]
        );
        if (studentRows[0]) return studentRows[0];

        // Fall back to local users table
        const { rows: localRows } = await client.query('SELECT * FROM users WHERE id = $1', [
          tokenRow.user_id,
        ]);
        return localRows[0] ?? null;
      });
    } catch (lookupErr) {
      logger.error('[authRefreshController] user lookup failed', { err: lookupErr.message });
      user = null;
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const userPayload = {
      id: user.id,
      provider: user.provider ?? 'local',
      email: user.email,
      full_name: user.full_name ?? user.display_name,
      role: user.role ?? 'user',
      scopes: studentAuthService.getScopesForRole(user.role),
    };

    const meta = extractMeta(req);
    const result = await refreshTokenService.rotate(rawRefreshToken, userPayload, meta);

    if (result.reuseDetected) {
      res.clearCookie(ACCESS_TOKEN_COOKIE);
      res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/auth' });
      return res.status(401).json({
        error: result.error,
        reuseDetected: true,
      });
    }

    if (result.error) {
      return res.status(401).json({ error: result.error });
    }

    res.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, accessTokenCookieOptions());
    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshTokenCookieOptions());

    return res.json({
      ok: true,
      expiresIn: result.expiresIn,
    });
  } catch (err) {
    logger.error('[authRefreshController] refreshTokens error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/auth/logout
 *
 * Revokes the current device's refresh token and clears cookies.
 */
export const logout = async (req, res) => {
  const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] ?? req.body?.refreshToken;

  try {
    if (rawRefreshToken) {
      await refreshTokenService.revokeRefreshToken(rawRefreshToken);
    }

    // Also invalidate the old access-token cookie
    const legacyToken = req.cookies?.[ACCESS_TOKEN_COOKIE];
    if (legacyToken) {
      await studentAuthService.logout(legacyToken);
    }

    res.clearCookie(ACCESS_TOKEN_COOKIE);
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/auth' });

    return res.json({ ok: true, message: 'Logged out successfully' });
  } catch (err) {
    logger.error('[authRefreshController] logout error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/auth/logout-all
 *
 * Revokes ALL refresh tokens for the authenticated user.
 * Requires a valid access token.
 */
export const logoutAll = async (req, res) => {
  if (!req.studentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const count = await refreshTokenService.revokeAllSessions(
      String(req.studentUser.sub ?? req.studentUser.id),
      'logout_all'
    );

    // Also clear the old access token blacklist entry
    const legacyToken = req.cookies?.[ACCESS_TOKEN_COOKIE];
    if (legacyToken) {
      await studentAuthService.logout(legacyToken);
    }

    res.clearCookie(ACCESS_TOKEN_COOKIE);
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/auth' });

    return res.json({
      ok: true,
      message: `All ${count} active session(s) have been revoked`,
    });
  } catch (err) {
    logger.error('[authRefreshController] logoutAll error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/auth/sessions
 *
 * Returns all active sessions for the current user (device management).
 * Requires a valid access token.
 */
export const listSessions = async (req, res) => {
  if (!req.studentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const sessions = await refreshTokenService.getActiveSessions(
      String(req.studentUser.sub ?? req.studentUser.id)
    );

    return res.json({ ok: true, sessions });
  } catch (err) {
    logger.error('[authRefreshController] listSessions error', { err: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
};
