/**
 * Service to store and retrieve public keys for users.
 * Private keys are NEVER sent to the server.
 */
class KeyDistributionService {
  constructor() {
    // In-memory store for demo purposes. In production, use MongoDB/PostgreSQL.
    this.publicKeys = new Map(); 
  }

  setPublicKey(userId, publicKeyBase64) {
    this.publicKeys.set(userId, publicKeyBase64);
  }

  getPublicKey(userId) {
    return this.publicKeys.get(userId);
  }
}

module.exports = new KeyDistributionService();
