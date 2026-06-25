import jwt from "jsonwebtoken";
import crypto from "crypto";

// Enhanced JWT creation with security features
export const createJWT = (payload) => {
  const tokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomBytes(16).toString('hex'), // Unique token ID for tracking
    tokenType: 'access',
    sessionId: crypto.randomBytes(8).toString('hex') // Session identifier
  };

  return jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    issuer: process.env.JWT_ISSUER || 'the-spot-campus',
    audience: process.env.JWT_AUDIENCE || 'the-spot-campus-users'
  });
};

// Enhanced JWT verification with security checks
export const verifyJWT = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: process.env.JWT_ISSUER || 'the-spot-campus',
      audience: process.env.JWT_AUDIENCE || 'the-spot-campus-users',
      clockTolerance: 60 // 60 seconds clock tolerance
    });

    // Additional security validations
    if (!decoded.jti || !decoded.userId || !decoded.role) {
      throw new Error('Invalid token structure');
    }

    if (decoded.tokenType !== 'access') {
      throw new Error('Invalid token type');
    }

    // Check token age (additional security layer)
    const tokenAge = Date.now() / 1000 - decoded.iat;
    const maxAge = 24 * 60 * 60; // 24 hours in seconds
    
    if (tokenAge > maxAge) {
      throw new Error('Token too old');
    }

    return decoded;
  } catch (error) {
    // Re-throw with more specific error types
    if (error.name === 'TokenExpiredError') {
      const expiredError = new Error('Token has expired');
      expiredError.name = 'TokenExpiredError';
      throw expiredError;
    } else if (error.name === 'JsonWebTokenError') {
      const invalidError = new Error('Invalid token');
      invalidError.name = 'JsonWebTokenError';
      throw invalidError;
    } else if (error.name === 'NotBeforeError') {
      const notBeforeError = new Error('Token not active yet');
      notBeforeError.name = 'NotBeforeError';
      throw notBeforeError;
    } else {
      throw error;
    }
  }
};

// Create refresh token (longer-lived, for token refresh)
export const createRefreshToken = (payload) => {
  const tokenPayload = {
    userId: payload.userId,
    email: payload.email,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomBytes(16).toString('hex'),
    tokenType: 'refresh'
  };

  return jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    issuer: process.env.JWT_ISSUER || 'the-spot-campus',
    audience: process.env.JWT_AUDIENCE || 'the-spot-campus-users'
  });
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: process.env.JWT_ISSUER || 'the-spot-campus',
      audience: process.env.JWT_AUDIENCE || 'the-spot-campus-users'
    });

    if (decoded.tokenType !== 'refresh') {
      throw new Error('Invalid refresh token type');
    }

    return decoded;
  } catch (error) {
    throw error;
  }
};

// Generate secure session ID
export const generateSessionId = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate secure API key
export const generateApiKey = () => {
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(24).toString('hex');
  return `${timestamp}-${randomBytes}`;
};
