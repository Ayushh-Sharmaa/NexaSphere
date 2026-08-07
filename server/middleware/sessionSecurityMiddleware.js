import crypto from 'node:crypto';

/**
 * Generate a SHA-256 device fingerprint based on client request headers & IP subnet.
 * @param {import('express').Request} req
 * @returns {string} SHA-256 hex digest
 */
export function generateDeviceFingerprint(req) {
  const ua = String(req.headers['user-agent'] || 'unknown-agent').trim();
  const lang = String(req.headers['accept-language'] || 'unknown-lang').split(',')[0].trim();
  
  // Extract client IP & calculate subnet (IPv4 /24 or IPv6 /64)
  const rawIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  const ipStr = String(rawIp).split(',')[0].trim();
  let ipSubnet = ipStr;

  if (ipStr.includes('.')) {
    // IPv4 /24 subnet (e.g., 192.168.1.100 -> 192.168.1)
    ipSubnet = ipStr.split('.').slice(0, 3).join('.');
  } else if (ipStr.includes(':')) {
    // IPv6 /64 subnet
    ipSubnet = ipStr.split(':').slice(0, 4).join(':');
  }

  const rawFingerprint = `${ua}|${ipSubnet}|${lang}`;
  return crypto.createHash('sha256').update(rawFingerprint).digest('hex');
}

/**
 * Middleware to enforce session hijacking prevention by binding sessions to device fingerprints.
 */
export function validateSessionFingerprint(req, res, next) {
  const currentFingerprint = generateDeviceFingerprint(req);

  if (req.session) {
    if (req.session.deviceFingerprint) {
      // Compare current fingerprint with stored session fingerprint
      const isMatch = crypto.timingSafeEqual(
        Buffer.from(currentFingerprint),
        Buffer.from(req.session.deviceFingerprint)
      );

      if (!isMatch) {
        console.warn(
          `[SECURITY ALERT] Session hijacking attempt detected! Session ID: ${req.session.id}, Client IP: ${req.ip}`
        );

        if (typeof req.session.destroy === 'function') {
          req.session.destroy(() => {});
        }

        return res.status(401).json({
          error: 'SESSION_HIJACK_DETECTED',
          message: 'Invalid device fingerprint signature. Active session has been revoked for security.',
        });
      }
    } else {
      // Bind device fingerprint to newly established session
      req.session.deviceFingerprint = currentFingerprint;
    }
  }

  next();
}
