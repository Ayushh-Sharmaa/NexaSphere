import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ||
  (process.env.NODE_ENV === "test" ||
  process.env.NODE_ENV === "development" ||
  !process.env.NODE_ENV
    ? "12345678901234567890123456789012"
    : (() => {
        throw new Error(
          "FATAL: ENCRYPTION_KEY environment variable is not set."
        );
      })());

let auditLogs = [];

/**
 * Encrypt sensitive data
 */
const encryptData = (data) => {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    iv
  );

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  auditLogs.push({
    action: "ENCRYPT",
    timestamp: new Date().toISOString(),
  });

  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted,
  };
};

/**
 * Decrypt encrypted data
 */
const decryptData = (encryptedObject) => {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(encryptedObject.iv, "hex")
  );

  let decrypted = decipher.update(encryptedObject.encryptedData, "hex", "utf8");

  decrypted += decipher.final("utf8");

  auditLogs.push({
    action: "DECRYPT",
    timestamp: new Date().toISOString(),
  });

  return decrypted;
};

/**
 * Rotate encryption key
 */
const rotateEncryptionKey = () => {
  ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex").slice(0, 32);

  auditLogs.push({
    action: "KEY_ROTATION",
    timestamp: new Date().toISOString(),
  });

  return {
    message: "Encryption key rotated successfully",
    rotatedAt: new Date().toISOString(),
  };
};

/**
 * Get encryption audit history
 */
const getEncryptionAuditLogs = () => {
  return auditLogs;
};

/**
 * Check encryption compliance
 */
const getEncryptionStatus = () => {
  return {
    algorithm: ALGORITHM,
    keyConfigured: Boolean(ENCRYPTION_KEY),
    auditEvents: auditLogs.length,
    status: "SECURE",
  };
};

const encryptionManager = {
  encryptData,
  decryptData,
  rotateEncryptionKey,
  getEncryptionAuditLogs,
  getEncryptionStatus,
};

export default encryptionManager;
