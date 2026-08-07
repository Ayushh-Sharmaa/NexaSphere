const rateLimitService = require('../services/rateLimitService');

/**
 * Express middleware for token bucket rate limiting via Redis.
 * Falls back to IP if user is not authenticated.
 */
const dynamicRateLimiter = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.ip;
    // For REST endpoints we assume cost = 10. For GraphQL, cost is calculated dynamically.
    const cost = req.body?.query ? 0 : 10; 
    
    if (cost === 0) {
      // Let GraphQL gateway handle its own cost analysis via costAnalysis plugin
      return next();
    }

    const { allowed, remaining } = await rateLimitService.consume(userId, cost, 1000, 10);

    res.setHeader('X-RateLimit-Remaining', Math.floor(remaining));

    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please try again later.'
      });
    }

    next();
  } catch (err) {
    console.error('Rate limiting error:', err);
    // Fail open to avoid blocking valid traffic on Redis failure
    next();
  }
};

module.exports = dynamicRateLimiter;
