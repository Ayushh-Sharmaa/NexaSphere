const CircuitBreaker = require('opossum');
const { createClient } = require('redis');

/**
 * Circuit Breaker Service with Centralized Redis State.
 * Prevents cascading failures when 3rd-party APIs go down.
 */
class DistributedCircuitBreaker {
  constructor() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.redisClient.on('error', (err) => console.error('Redis Error', err));
    this.isReady = false;
  }

  async connect() {
    if (!this.isReady) {
      await this.redisClient.connect();
      this.isReady = true;
    }
  }

  /**
   * Wrap an async function (like an HTTP request) in a Circuit Breaker.
   * @param {string} name - Unique name for this circuit (e.g., 'email-provider')
   * @param {Function} action - The async function to execute
   * @param {Function} fallback - Function to execute if circuit is open or action fails
   */
  async createBreaker(name, action, fallback) {
    await this.connect();

    const options = {
      timeout: 3000, // If action takes longer than 3s, trigger a failure
      errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
      resetTimeout: 10000 // After 10 seconds, try one request to see if it recovered (Half-Open)
    };

    const breaker = new CircuitBreaker(action, options);

    // Sync state with Redis to coordinate across microservice instances
    const stateKey = `circuit-state:${name}`;

    // On open, broadcast to Redis
    breaker.on('open', async () => {
      console.warn(`[CircuitBreaker] ${name} circuit OPENED! Failing fast.`);
      await this.redisClient.set(stateKey, 'OPEN', { EX: 10 });
    });

    // Check Redis state before firing
    const originalFire = breaker.fire.bind(breaker);
    breaker.fire = async (...args) => {
      const globalState = await this.redisClient.get(stateKey);
      if (globalState === 'OPEN') {
        // Force the circuit open if another instance detected failure
        if (!breaker.opened) breaker.open(); 
        console.warn(`[CircuitBreaker] ${name} is globally OPEN. Triggering fallback.`);
        return fallback(...args);
      }
      
      try {
        return await originalFire(...args);
      } catch (err) {
        return fallback(...args);
      }
    };

    return breaker;
  }
}

module.exports = new DistributedCircuitBreaker();
