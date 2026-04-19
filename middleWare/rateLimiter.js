// Rate Limiter Middleware (In-memory implementation)

const requestCounts = new Map();
const blockedIPs = new Set();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.lastReset > 60000) { // 1 minute window
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

// General rate limiter
export const rateLimiter = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const key = req.ip;

    if (blockedIPs.has(key)) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Try again later.",
        statusCode: 429,
      });
    }

    const now = Date.now();
    const userData = requestCounts.get(key) || { count: 0, lastReset: now };

    // Reset window if expired
    if (now - userData.lastReset > windowMs) {
      userData.count = 0;
      userData.lastReset = now;
    }

    userData.count++;
    requestCounts.set(key, userData);

    if (userData.count > maxRequests) {
      blockedIPs.add(key);
      setTimeout(() => blockedIPs.delete(key), windowMs);

      return res.status(429).json({
        success: false,
        message: "Rate limit exceeded",
        statusCode: 429,
      });
    }

    res.set({
      "X-RateLimit-Limit": maxRequests,
      "X-RateLimit-Remaining": maxRequests - userData.count,
    });

    next();
  };
};

// Strict rate limiter for auth endpoints
export const authRateLimiter = (maxRequests = 5, windowMs = 60000) => {
  return (req, res, next) => {
    const key = `auth-${req.ip}`;

    if (blockedIPs.has(key)) {
      return res.status(429).json({
        success: false,
        message: "Too many login attempts. Try again later.",
        statusCode: 429,
      });
    }

    const now = Date.now();
    const userData = requestCounts.get(key) || { count: 0, lastReset: now };

    if (now - userData.lastReset > windowMs) {
      userData.count = 0;
      userData.lastReset = now;
    }

    userData.count++;
    requestCounts.set(key, userData);

    if (userData.count > maxRequests) {
      blockedIPs.add(key);
      setTimeout(() => blockedIPs.delete(key), windowMs * 5);

      return res.status(429).json({
        success: false,
        message: "Too many login attempts. Account temporarily locked.",
        statusCode: 429,
      });
    }

    next();
  };
};

// Per-user rate limiter
export const userRateLimiter = (maxRequests = 30, windowMs = 60000) => {
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const key = `user-${req.user._id}`;

    const now = Date.now();
    const userData = requestCounts.get(key) || { count: 0, lastReset: now };

    if (now - userData.lastReset > windowMs) {
      userData.count = 0;
      userData.lastReset = now;
    }

    userData.count++;
    requestCounts.set(key, userData);

    if (userData.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
        statusCode: 429,
      });
    }

    next();
  };
};
