import session from 'express-session';
import MongoStore from 'connect-mongo';
import ExpressBrute from 'express-brute';
import MongooseStore from 'express-brute-mongo';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UnauthenticatedError, UnauthorizedError } from '../errors/customErrors.js';

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  name: 'sessionId', // Don't use default 'connect.sid'
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS access to cookies
    maxAge: parseInt(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000, // 24 hours default
    sameSite: 'strict' // CSRF protection
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    touchAfter: 24 * 3600, // Lazy session update
    crypto: {
      secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex')
    },
    collectionName: 'sessions',
    ttl: parseInt(process.env.SESSION_TIMEOUT) / 1000 || 24 * 60 * 60, // TTL in seconds
    autoRemove: 'native' // Use MongoDB's TTL
  })
};

// Brute force protection configuration
const bruteForceStore = new MongooseStore(function (ready) {
  mongoose.connection.on('open', ready);
});

// Different brute force settings for different endpoints
export const loginBruteForce = new ExpressBrute(bruteForceStore, {
  freeRetries: 3, // Allow 3 failed attempts
  minWait: 5 * 60 * 1000, // 5 minutes initial wait
  maxWait: 60 * 60 * 1000, // 1 hour maximum wait
  lifetime: 24 * 60 * 60, // 24 hours lifetime
  failCallback: function (req, res, next, nextValidRequestDate) {
    res.status(429).json({
      error: 'Too many failed login attempts',
      message: `Account temporarily locked. Try again after ${new Date(nextValidRequestDate)}`,
      nextValidRequestDate: nextValidRequestDate
    });
  },
  handleStoreError: function (error) {
    console.error('Brute force store error:', error);
  }
});

export const globalBruteForce = new ExpressBrute(bruteForceStore, {
  freeRetries: 10, // Allow 10 requests
  minWait: 2 * 60 * 1000, // 2 minutes wait
  maxWait: 15 * 60 * 1000, // 15 minutes maximum
  lifetime: 60 * 60, // 1 hour lifetime
  attachResetToRequest: true,
  refreshTimeoutOnRequest: false,
  failCallback: function (req, res, next, nextValidRequestDate) {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP',
      nextValidRequestDate: nextValidRequestDate
    });
  }
});

// Session store configuration
export const sessionStore = session(sessionConfig);

// JWT Security enhancements
export const jwtSecurityConfig = {
  algorithm: 'HS256',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  issuer: process.env.JWT_ISSUER || 'the-spot-campus',
  audience: process.env.JWT_AUDIENCE || 'the-spot-campus-users',
  clockTolerance: 60, // 60 seconds clock tolerance
  ignoreExpiration: false,
  ignoreNotBefore: false
};

// Enhanced JWT token creation
export const createSecureJWT = (payload) => {
  const tokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomBytes(16).toString('hex'), // Unique token ID
    tokenType: 'access'
  };

  return jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    algorithm: jwtSecurityConfig.algorithm,
    expiresIn: jwtSecurityConfig.expiresIn,
    issuer: jwtSecurityConfig.issuer,
    audience: jwtSecurityConfig.audience
  });
};

// Enhanced JWT verification
export const verifySecureJWT = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: [jwtSecurityConfig.algorithm],
      issuer: jwtSecurityConfig.issuer,
      audience: jwtSecurityConfig.audience,
      clockTolerance: jwtSecurityConfig.clockTolerance
    });

    // Additional security checks
    if (!decoded.jti || !decoded.userId || !decoded.role) {
      throw new Error('Invalid token structure');
    }

    if (decoded.tokenType !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthenticatedError('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new UnauthenticatedError('Invalid token');
    } else if (error.name === 'NotBeforeError') {
      throw new UnauthenticatedError('Token not active yet');
    } else {
      throw new UnauthenticatedError('Token verification failed');
    }
  }
};

// Session activity tracking
export const trackSessionActivity = (req, res, next) => {
  if (req.session && req.user) {
    // Update last activity
    req.session.lastActivity = Date.now();
    req.session.ipAddress = req.clientIP || req.ip;
    req.session.userAgent = req.get('User-Agent');
    
    // Track session statistics
    if (!req.session.stats) {
      req.session.stats = {
        loginTime: Date.now(),
        requestCount: 0,
        lastIpAddress: req.session.ipAddress
      };
    }
    
    req.session.stats.requestCount += 1;
    
    // Detect suspicious activity
    if (req.session.stats.lastIpAddress !== req.session.ipAddress) {
      console.warn(`IP address change detected for user ${req.user.userId}: ${req.session.stats.lastIpAddress} -> ${req.session.ipAddress}`);
      req.session.stats.lastIpAddress = req.session.ipAddress;
      req.session.stats.ipChangeCount = (req.session.stats.ipChangeCount || 0) + 1;
      
      // Too many IP changes might indicate account compromise
      if (req.session.stats.ipChangeCount > 3) {
        console.error(`Multiple IP changes detected for user ${req.user.userId}, potential security issue`);
      }
    }
  }
  
  next();
};

// Session timeout middleware
export const sessionTimeoutCheck = (req, res, next) => {
  if (req.session && req.session.lastActivity) {
    const inactivityPeriod = Date.now() - req.session.lastActivity;
    const maxInactivity = parseInt(process.env.SESSION_INACTIVITY_TIMEOUT) || 30 * 60 * 1000; // 30 minutes default
    
    if (inactivityPeriod > maxInactivity) {
      req.session.destroy((err) => {
        if (err) console.error('Session destruction error:', err);
      });
      
      // Clear JWT cookie as well
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      return res.status(401).json({
        error: 'Session expired',
        message: 'Your session has expired due to inactivity',
        code: 'SESSION_TIMEOUT'
      });
    }
  }
  
  next();
};

// Enhanced authentication middleware with session security
export const enhancedAuthenticateUser = (req, res, next) => {
  const { token } = req.cookies;
  
  if (!token) {
    throw new UnauthenticatedError('No authentication token provided');
  }
  
  try {
    const decoded = verifySecureJWT(token);
    req.user = { 
      userId: decoded.userId, 
      role: decoded.role,
      tokenId: decoded.jti,
      email: decoded.email
    };
    
    // Additional session validation
    if (req.session) {
      // Validate session belongs to the same user
      if (req.session.userId && req.session.userId !== decoded.userId) {
        throw new UnauthenticatedError('Session user mismatch');
      }
      
      // Set session user ID if not set
      if (!req.session.userId) {
        req.session.userId = decoded.userId;
      }
    }
    
    next();
  } catch (error) {
    // Clear invalid cookies
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    if (req.session) {
      req.session.destroy((err) => {
        if (err) console.error('Session destruction error:', err);
      });
    }
    
    throw error;
  }
};

// Device fingerprinting for session security
export const deviceFingerprinting = (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const acceptLanguage = req.get('Accept-Language') || '';
  const acceptEncoding = req.get('Accept-Encoding') || '';
  
  // Create device fingerprint
  const deviceInfo = {
    userAgent: userAgent.substring(0, 200), // Limit length
    acceptLanguage,
    acceptEncoding,
    ip: req.clientIP || req.ip
  };
  
  const fingerprint = crypto
    .createHash('sha256')
    .update(JSON.stringify(deviceInfo))
    .digest('hex');
  
  req.deviceFingerprint = fingerprint;
  
  // Store in session for comparison
  if (req.session && req.user) {
    if (req.session.deviceFingerprint) {
      // Check if device has changed
      if (req.session.deviceFingerprint !== fingerprint) {
        console.warn(`Device fingerprint change detected for user ${req.user.userId}`);
        
        // Optionally force re-authentication on device change
        if (process.env.STRICT_DEVICE_CHECKING === 'true') {
          return res.status(401).json({
            error: 'Device change detected',
            message: 'Please log in again from this device',
            code: 'DEVICE_CHANGED'
          });
        }
      }
    } else {
      req.session.deviceFingerprint = fingerprint;
    }
  }
  
  next();
};

// Concurrent session management
export const concurrentSessionControl = async (req, res, next) => {
  if (!req.user || !req.session) {
    return next();
  }
  
  const maxConcurrentSessions = parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 3;
  
  try {
    // Get all sessions for this user from MongoDB
    const sessionCollection = mongoose.connection.db.collection('sessions');
    const userSessions = await sessionCollection.find({
      'session.userId': req.user.userId
    }).toArray();
    
    if (userSessions.length > maxConcurrentSessions) {
      // Sort by last activity and remove oldest sessions
      userSessions.sort((a, b) => {
        const aActivity = a.session?.lastActivity || 0;
        const bActivity = b.session?.lastActivity || 0;
        return aActivity - bActivity;
      });
      
      // Remove excess sessions
      const sessionsToRemove = userSessions.slice(0, userSessions.length - maxConcurrentSessions);
      
      for (const session of sessionsToRemove) {
        await sessionCollection.deleteOne({ _id: session._id });
      }
      
      console.log(`Removed ${sessionsToRemove.length} excess sessions for user ${req.user.userId}`);
    }
    
    next();
  } catch (error) {
    console.error('Concurrent session control error:', error);
    next(); // Continue even if session cleanup fails
  }
};

// Session security headers
export const sessionSecurityHeaders = (req, res, next) => {
  // Add session-related security headers
  if (req.session && req.user) {
    res.setHeader('X-Session-Active', 'true');
    res.setHeader('X-Session-Timeout', sessionConfig.cookie.maxAge / 1000);
  }
  
  // Prevent session fixation
  if (req.path === '/api/login' && req.method === 'POST') {
    if (req.session) {
      req.session.regenerate((err) => {
        if (err) console.error('Session regeneration error:', err);
      });
    }
  }
  
  next();
};

// Logout security middleware
export const secureLogout = (req, res, next) => {
  // Clear all authentication data
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  
  // Destroy session
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
    });
  }
  
  // Add logout security headers
  res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage", "executionContexts"');
  res.setHeader('X-Logout-Success', 'true');
  
  next();
};

// Session validation middleware
export const validateSession = (req, res, next) => {
  if (!req.session || !req.user) {
    return next();
  }
  
  // Validate session integrity
  const requiredSessionFields = ['userId', 'lastActivity'];
  const missingFields = requiredSessionFields.filter(field => !req.session[field]);
  
  if (missingFields.length > 0) {
    console.warn(`Invalid session for user ${req.user.userId}, missing fields: ${missingFields.join(', ')}`);
    
    req.session.destroy((err) => {
      if (err) console.error('Session destruction error:', err);
    });
    
    return res.status(401).json({
      error: 'Invalid session',
      message: 'Session validation failed',
      code: 'INVALID_SESSION'
    });
  }
  
  next();
};

// Export session middleware function
export const createSessionMiddleware = () => {
  return sessionStore;
};