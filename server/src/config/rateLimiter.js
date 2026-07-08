import rateLimit from "express-rate-limit";

/**
 * Extracts a clean client IP address without any port number.
 * Supports IPv4 and IPv6 formats.
 */
const getClientIp = (req) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  if (!ip) return "";

  // If it's IPv4 with a port, e.g. "165.99.52.32:64135"
  if (ip.includes('.')) {
    return ip.split(':')[0];
  }

  // If it's a bracketed IPv6 with a port, e.g. "[::1]:64135" or "[2001:db8::1]:64135"
  if (ip.startsWith('[') && ip.includes(']')) {
    return ip.substring(1, ip.indexOf(']'));
  }

  // If it's plain IPv6 (multiple colons) without brackets, return as-is
  return ip;
};

// Rate limiting configuration
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Raised to 5,000 to accommodate multi-agent background sync & admin portal live feeds
  message: "Too many requests. Please try again later.",
  keyGenerator: getClientIp,
  validate: { ip: false },
});

// Strict rate limiting for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Increased to 30 attempts to avoid blocking users
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    success: false,
    message: "Too many login attempts. Try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
      retryAfter: req.rateLimit?.resetTime,
    });
  },
  keyGenerator: getClientIp,
  validate: { ip: false },
});

// Refresh token limiter
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Higher limit for token refreshes
  skipSuccessfulRequests: true,
  message: { success: false, message: "Too many refresh attempts." },
  keyGenerator: getClientIp,
  validate: { ip: false },
});

// Payment route limiter (more restrictive)
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 payment requests per 15 minutes
  message: {
    error: "Too many payment requests from this IP, please try again later.",
    retryAfter: Math.ceil(15 * 60 * 1000 / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  validate: { ip: false },
});

