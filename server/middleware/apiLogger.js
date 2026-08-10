import logger from '../utils/logger.js';
// Patterns to identify sensitive tokens in paths
const SENSITIVE_PATH_PATTERNS = [
  { regex: /(\/api\/auth\/reset-password\/)([^/?]+)/g, replacement: '$1[REDACTED]' },
  { regex: /(\/api\/auth\/verify\/)([^/?]+)/g, replacement: '$1[REDACTED]' },
];

/**
 * Redacts sensitive tokens or passwords from the URL path.
 */
function redactPath(path) {
  let redacted = path;
  for (const pattern of SENSITIVE_PATH_PATTERNS) {
    redacted = redacted.replace(pattern.regex, pattern.replacement);
  }
  // Optional: Mask query parameters if they contain sensitive tokens
  redacted = redacted.replace(/(token|password|secret)=([^&]+)/gi, '$1=[REDACTED]');
  return redacted;
}

/**
 * Express middleware to log API requests via Winston.
 * Replaces both standard Morgan and the custom requestLogger.
 * Logs method, redacted path, status code, and response time.
 */
export function apiLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const { method, originalUrl, reqId } = req;

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

    const status = res.statusCode;

    const safePath = redactPath(originalUrl || req.path);

    // Prepare JSON payload for Winston (and subsequently ELK)
    const logPayload = {
      reqId,
      method,
      path: safePath,
      status,
      durationMs: Math.round(durationMs),
      ip: req.ip,
      // Note: We omit req.body, passwords, and headers to explicitly exclude sensitive data
    };

    const message = `${method} ${safePath} -> ${status} (${Math.round(durationMs)}ms)`;

    if (status >= 500) {
      logger.error(message, logPayload);
    } else if (status >= 400) {
      logger.warn(message, logPayload);
    } else {
      logger.http(message, logPayload);
    }
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'api-requests.log');

const SENSITIVE_FIELDS = new Set([
  'password', 'passkey', 'token', 'secret', 'authorization',
  'cookie', 'session', 'key', 'apiKey', 'apikey', 'accessToken',
  'refreshToken', 'jwt', 'auth',
]);

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

const logStream = (() => {
  ensureLogDir();
  return fs.createWriteStream(LOG_FILE, { flags: 'a' });
})();
