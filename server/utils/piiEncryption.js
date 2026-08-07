import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const DEFAULT_SECRET = 'nexa-sphere-default-pii-encryption-key-32b';

function getEncryptionKey(keyString) {
  const secret = keyString || process.env.PII_ENCRYPTION_KEY || DEFAULT_SECRET;
  return crypto.scryptSync(secret, 'nexa-pii-salt', 32);
}

/**
 * Encrypts a sensitive string value using AES-256-GCM authenticated encryption.
 * Returns base64 payload formatted as: iv:authTag:cipherText
 */
export function encryptPII(text, customKey = null) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  const key = getEncryptionKey(customKey);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag().toString('base64');

  return `${iv.toString('base64')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted payload formatted as: iv:authTag:cipherText
 */
export function decryptPII(cipherPayload, customKey = null) {
  if (!cipherPayload || typeof cipherPayload !== 'string') {
    return cipherPayload;
  }

  const parts = cipherPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid PII ciphertext format. Expected iv:authTag:encryptedData');
  }

  const [ivBase64, authTagBase64, encryptedText] = parts;
  const key = getEncryptionKey(customKey);
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
