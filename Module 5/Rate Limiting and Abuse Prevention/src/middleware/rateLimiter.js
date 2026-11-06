'use strict';

const rateLimit = require('express-rate-limit');

// In a multi-instance deployment, the default in-memory store is not enough because
// each app instance keeps its own request counter. Behind a load balancer, the same
// client may be spread across multiple nodes, so each node sees its own low count and
// the client can bypass the real limit. A Redis-backed store such as `rate-limit-redis`
// shares counters across instances, so all nodes enforce one consistent rate limit.
module.exports = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    );

    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.'
      }
    });
  }
});
