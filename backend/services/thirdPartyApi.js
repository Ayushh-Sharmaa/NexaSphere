const axios = require('axios');
const circuitBreakerService = require('./circuitBreaker');

/**
 * Example of integrating a 3rd-party API using the Circuit Breaker pattern.
 */
class ThirdPartyApiService {
  constructor() {
    this.breaker = null;
  }

  async init() {
    // The unstable 3rd-party call
    const sendEmailAction = async (payload) => {
      // Simulate external API call
      const response = await axios.post('https://api.example-email-provider.com/v1/send', payload);
      return response.data;
    };

    // The degraded state fallback
    const emailFallback = async (payload) => {
      console.log('External email provider is down. Falling back to local logging queue.');
      // Add to local database queue to be processed later when the circuit closes
      return { status: 'queued_locally', originalPayload: payload };
    };

    // Wrap the action in a distributed circuit breaker
    this.breaker = await circuitBreakerService.createBreaker(
      'email-provider-api',
      sendEmailAction,
      emailFallback
    );
  }

  async sendEmail(to, subject, body) {
    if (!this.breaker) await this.init();
    
    // Fire the request through the circuit breaker
    return await this.breaker.fire({ to, subject, body });
  }
}

module.exports = new ThirdPartyApiService();
