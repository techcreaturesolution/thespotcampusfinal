import rateLimit from "express-rate-limit";

// Rate limiting configuration
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: Math.ceil(15 * 60 * 1000 / 1000), // in seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiting for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes for auth routes
  message: {
    error: "Too many authentication attempts from this IP, please try again later.",
    retryAfter: Math.ceil(15 * 60 * 1000 / 1000), // in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
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
});
