import crypto from 'crypto';
import { cacheService } from '../services/cacheService.js';

const DEFAULT_TTL_SECONDS = 60 * 15;

function stableStringify(value) {
  if (value === undefined) return '';
  const type = typeof value;
  if (value === null || type === 'string' || type === 'number' || type === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  if (type === 'object') {
    const keys = Object.keys(value).sort((a, b) => a - b);
    return '{' + keys.map((k) => `${k}:${stableStringify(value[k])}`).join(',') + '}';
  }
  return String(value);
}

export function hashKeyParts(...parts) {
  const raw = parts.map((p) => stableStringify(p)).join('|');
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function buildEndpointKey(prefix, req, { extraParts = [] } = {}) {
  // include path + query + (optionally) auth-scoping
  const query = req.originalUrl || req.url || '';
  const id = hashKeyParts(prefix, query, extraParts);
  return `cache:endpoint:${prefix}:${id}`;
}

export async function getOrSet({ key, ttlSeconds, getValue }) {
  const cached = await cacheService.get(key);
  if (cached) return { data: cached, hit: true };
  const value = await getValue();
  // Cache only non-undefined values
  if (value !== undefined) await cacheService.set(key, value, ttlSeconds ?? DEFAULT_TTL_SECONDS);
  return { data: value, hit: false };
}

export async function invalidateByPrefix(prefix) {
  // Pattern must be glob-like for Redis KEYS: cache:endpoint:<prefix>:*
  return cacheService.delPattern(`cache:endpoint:${prefix}:*`);
}
