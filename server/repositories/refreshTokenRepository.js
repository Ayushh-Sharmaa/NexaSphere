/**
 * refreshTokenRepository.js
 *
 * Data-access layer for student JWT refresh tokens.
 *
 * Design notes:
 *  - Raw token bytes are NEVER stored; only the SHA-256 hex digest.
 *  - Every successful rotation creates a new row and revokes the old one so
 *    that the full token lineage (family) is auditable.
 *  - If a revoked token is presented again the entire family is revoked,
 *    which forces all active sessions for that family to re-authenticate.
 */

import crypto from 'crypto';
import { withDb } from './db.js';

const DEFAULT_REFRESH_TTL_DAYS = 30;

function getRefreshTtlDays() {
  const v = Number(process.env.REFRESH_TOKEN_TTL_DAYS);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : DEFAULT_REFRESH_TTL_DAYS;
}

/**
 * Returns a deterministic, fixed-length hex digest for the given raw token.
 * @param {string} rawToken
 * @returns {string}
 */
export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

/**
 * Ensure the schema exists (idempotent). Called lazily on first usage so the
 * server boots even when the migration runner hasn't executed yet.
 */
async function ensureSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS student_refresh_tokens (
      id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      token_hash      TEXT        NOT NULL UNIQUE,
      user_id         TEXT        NOT NULL,
      device_id       TEXT,
      ip_address      TEXT,
      user_agent      TEXT,
      family_id       UUID        NOT NULL DEFAULT gen_random_uuid(),
      is_revoked      BOOLEAN     NOT NULL DEFAULT FALSE,
      revoked_at      TIMESTAMPTZ,
      revoke_reason   TEXT,
      issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at      TIMESTAMPTZ NOT NULL,
      last_used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(
    'CREATE INDEX IF NOT EXISTS idx_srt_token_hash ON student_refresh_tokens (token_hash)'
  );
  await client.query(
    'CREATE INDEX IF NOT EXISTS idx_srt_family_id ON student_refresh_tokens (family_id)'
  );
  await client.query(
    'CREATE INDEX IF NOT EXISTS idx_srt_user_id ON student_refresh_tokens (user_id)'
  );
}

let _schemaReady = null;
async function ensureReady() {
  if (!_schemaReady) {
    _schemaReady = withDb(ensureSchema).catch((err) => {
      _schemaReady = null;
      throw err;
    });
  }
  return _schemaReady;
}

/**
 * Persist a new refresh token.
 *
 * @param {object} params
 * @param {string} params.rawToken       - The opaque token value (will be hashed).
 * @param {string} params.userId         - Owner user ID.
 * @param {string} [params.familyId]     - Existing family UUID; omit to start a new family.
 * @param {string} [params.deviceId]
 * @param {string} [params.ipAddress]
 * @param {string} [params.userAgent]
 * @returns {Promise<object>}            - The inserted row.
 */
export async function createRefreshToken({
  rawToken,
  userId,
  familyId = null,
  deviceId = null,
  ipAddress = null,
  userAgent = null,
}) {
  await ensureReady();

  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + getRefreshTtlDays() * 86_400_000);

  const { rows } = await withDb((client) =>
    client.query(
      `INSERT INTO student_refresh_tokens
         (token_hash, user_id, family_id, device_id, ip_address, user_agent, expires_at)
       VALUES
         ($1, $2, COALESCE($3::uuid, gen_random_uuid()), $4, $5, $6, $7)
       RETURNING *`,
      [tokenHash, userId, familyId, deviceId, ipAddress, userAgent, expiresAt]
    )
  );

  return rows[0];
}

/**
 * Look up a token by its raw value. Returns null when not found.
 *
 * @param {string} rawToken
 * @returns {Promise<object|null>}
 */
export async function findByRawToken(rawToken) {
  await ensureReady();

  const tokenHash = hashToken(rawToken);
  const { rows } = await withDb((client) =>
    client.query('SELECT * FROM student_refresh_tokens WHERE token_hash = $1', [tokenHash])
  );

  return rows[0] ?? null;
}

/**
 * Revoke a single token row.
 *
 * @param {string} tokenHash
 * @param {string} [reason]
 */
export async function revokeToken(tokenHash, reason = 'rotated') {
  await ensureReady();

  await withDb((client) =>
    client.query(
      `UPDATE student_refresh_tokens
         SET is_revoked = TRUE, revoked_at = NOW(), revoke_reason = $2
       WHERE token_hash = $1`,
      [tokenHash, reason]
    )
  );
}

/**
 * Revoke an entire token family (all tokens sharing the same family_id).
 * Used when refresh-token reuse is detected.
 *
 * @param {string} familyId
 * @param {string} [reason]
 * @returns {Promise<number>}  Number of rows revoked.
 */
export async function revokeFamilyById(familyId, reason = 'reuse_detected') {
  await ensureReady();

  const { rowCount } = await withDb((client) =>
    client.query(
      `UPDATE student_refresh_tokens
         SET is_revoked = TRUE, revoked_at = NOW(), revoke_reason = $2
       WHERE family_id = $1 AND is_revoked = FALSE`,
      [familyId, reason]
    )
  );

  return rowCount ?? 0;
}

/**
 * Revoke ALL active refresh tokens for a user.
 * Called on password change, suspicious activity, or explicit logout-all.
 *
 * @param {string} userId
 * @param {string} [reason]
 * @returns {Promise<number>}
 */
export async function revokeAllForUser(userId, reason = 'user_requested') {
  await ensureReady();

  const { rowCount } = await withDb((client) =>
    client.query(
      `UPDATE student_refresh_tokens
         SET is_revoked = TRUE, revoked_at = NOW(), revoke_reason = $2
       WHERE user_id = $1 AND is_revoked = FALSE`,
      [userId, reason]
    )
  );

  return rowCount ?? 0;
}

/**
 * Update the last_used_at timestamp for a token (by hash).
 *
 * @param {string} tokenHash
 */
export async function touchToken(tokenHash) {
  await ensureReady();

  await withDb((client) =>
    client.query('UPDATE student_refresh_tokens SET last_used_at = NOW() WHERE token_hash = $1', [
      tokenHash,
    ])
  );
}

/**
 * Delete all expired tokens from the table (housekeeping).
 *
 * @returns {Promise<number>} Number of rows deleted.
 */
export async function cleanupExpiredTokens() {
  await ensureReady();

  const { rowCount } = await withDb((client) =>
    client.query('DELETE FROM student_refresh_tokens WHERE expires_at < NOW()')
  );

  return rowCount ?? 0;
}

/**
 * Return all active (non-revoked, non-expired) sessions for a user.
 *
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function getActiveSessionsForUser(userId) {
  await ensureReady();

  const { rows } = await withDb((client) =>
    client.query(
      `SELECT id, family_id, device_id, ip_address, user_agent, issued_at, last_used_at, expires_at
         FROM student_refresh_tokens
        WHERE user_id = $1
          AND is_revoked = FALSE
          AND expires_at > NOW()
        ORDER BY last_used_at DESC`,
      [userId]
    )
  );

  return rows;
}
