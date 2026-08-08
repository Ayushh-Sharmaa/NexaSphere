const { createClient } = require('redis');

class RateLimitService {
  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.client.on('error', (err) => console.error('Redis Client Error', err));
    this.isReady = false;
  }

  async connect() {
    if (!this.isReady) {
      await this.client.connect();
      this.isReady = true;
    }
  }

  /**
   * Token Bucket implementation for rate limiting based on query cost
   * @param {string} userId - The authenticated user ID
   * @param {number} cost - The cost of the incoming query (default 1)
   * @param {number} maxTokens - Max tokens in the bucket
   * @param {number} refillRate - Tokens added per second
   */
  async consume(userId, cost = 1, maxTokens = 1000, refillRate = 10) {
    await this.connect();

    const key = `rate_limit:${userId}`;
    const now = Date.now();
    
    const record = await this.client.hGetAll(key);
    
    let tokens = maxTokens;
    let lastRefill = now;

    if (record && record.tokens) {
      tokens = parseFloat(record.tokens);
      lastRefill = parseInt(record.lastRefill, 10);
      
      const elapsedTime = (now - lastRefill) / 1000;
      const generatedTokens = elapsedTime * refillRate;
      
      tokens = Math.min(maxTokens, tokens + generatedTokens);
    }

    if (tokens >= cost) {
      tokens -= cost;
      lastRefill = now;
      
      await this.client.hSet(key, {
        tokens: tokens.toString(),
        lastRefill: lastRefill.toString()
      });
      // Set expiry to clean up inactive users
      await this.client.expire(key, Math.ceil(maxTokens / refillRate));
      
      return { allowed: true, remaining: tokens };
    } else {
      return { allowed: false, remaining: tokens };
    }
  }
}

module.exports = new RateLimitService();
