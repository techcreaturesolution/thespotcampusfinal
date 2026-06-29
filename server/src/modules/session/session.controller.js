import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { createJWT, createRefreshToken } from '../../utils/tokenUtils.js';
import { BadRequestError, NotFoundError } from '../../errors/customErrors.js';

// Get all active sessions for the current user
export const getUserSessions = async (req, res) => {
  try {
    const sessionCollection = mongoose.connection.db.collection('sessions');
    
    // Find all sessions for the current user
    const userSessions = await sessionCollection.find({
      'session.userId': req.user.userId
    }).toArray();
    
    // Format session data for response (remove sensitive information)
    const sessions = userSessions.map(session => {
      const sessionData = session.session || {};
      
      return {
        id: session._id,
        createdAt: session._id.getTimestamp(),
        lastActivity: sessionData.lastActivity ? new Date(sessionData.lastActivity) : null,
        ipAddress: sessionData.ipAddress || 'Unknown',
        userAgent: sessionData.userAgent ? sessionData.userAgent.substring(0, 100) + '...' : 'Unknown',
        deviceFingerprint: sessionData.deviceFingerprint ? sessionData.deviceFingerprint.substring(0, 8) + '...' : null,
        isCurrentSession: session._id.toString() === req.sessionID,
        stats: {
          requestCount: sessionData.stats?.requestCount || 0,
          loginTime: sessionData.stats?.loginTime ? new Date(sessionData.stats.loginTime) : null,
          ipChangeCount: sessionData.stats?.ipChangeCount || 0
        }
      };
    });
    
    // Sort by last activity (most recent first)
    sessions.sort((a, b) => {
      const aTime = a.lastActivity || a.createdAt;
      const bTime = b.lastActivity || b.createdAt;
      return new Date(bTime) - new Date(aTime);
    });
    
    res.status(StatusCodes.OK).json({
      sessions,
      total: sessions.length,
      currentSessionId: req.sessionID
    });
    
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch sessions',
      message: error.message
    });
  }
};

// Get current session information
export const getSessionInfo = (req, res) => {
  const sessionData = req.session || {};
  
  const sessionInfo = {
    sessionId: req.sessionID,
    userId: req.user.userId,
    email: req.user.email,
    role: req.user.role,
    lastActivity: sessionData.lastActivity ? new Date(sessionData.lastActivity) : null,
    createdAt: sessionData.cookie?.originalMaxAge ? 
      new Date(Date.now() - (sessionData.cookie.originalMaxAge - sessionData.cookie.maxAge)) : null,
    expiresAt: sessionData.cookie ? new Date(Date.now() + sessionData.cookie.maxAge) : null,
    ipAddress: sessionData.ipAddress || req.clientIP || req.ip,
    userAgent: req.get('User-Agent'),
    deviceFingerprint: req.deviceFingerprint,
    stats: sessionData.stats || {
      loginTime: null,
      requestCount: 0,
      ipChangeCount: 0
    },
    security: {
      bruteForceProtection: true,
      sessionTimeout: process.env.SESSION_TIMEOUT || '24 hours',
      maxConcurrentSessions: process.env.MAX_CONCURRENT_SESSIONS || '3',
      deviceTracking: true,
      ipTracking: true
    }
  };
  
  res.status(StatusCodes.OK).json(sessionInfo);
};

// Terminate a specific session
export const terminateSession = async (req, res) => {
  const { sessionId } = req.params;
  
  if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
    throw new BadRequestError('Invalid session ID');
  }
  
  try {
    const sessionCollection = mongoose.connection.db.collection('sessions');
    
    // Find the session to ensure it belongs to the current user
    const session = await sessionCollection.findOne({
      _id: new mongoose.Types.ObjectId(sessionId),
      'session.userId': req.user.userId
    });
    
    if (!session) {
      throw new NotFoundError('Session not found or does not belong to you');
    }
    
    // Don't allow terminating the current session via this endpoint
    if (sessionId === req.sessionID) {
      throw new BadRequestError('Cannot terminate current session. Use logout instead.');
    }
    
    // Delete the session
    await sessionCollection.deleteOne({
      _id: new mongoose.Types.ObjectId(sessionId)
    });
    
    res.status(StatusCodes.OK).json({
      message: 'Session terminated successfully',
      terminatedSessionId: sessionId
    });
    
  } catch (error) {
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      throw error;
    }
    
    console.error('Error terminating session:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to terminate session',
      message: error.message
    });
  }
};

// Terminate all other sessions (keep current session active)
export const terminateAllOtherSessions = async (req, res) => {
  try {
    const sessionCollection = mongoose.connection.db.collection('sessions');
    
    // Find all sessions for the user except the current one
    const result = await sessionCollection.deleteMany({
      'session.userId': req.user.userId,
      _id: { $ne: req.sessionID }
    });
    
    res.status(StatusCodes.OK).json({
      message: 'All other sessions terminated successfully',
      terminatedCount: result.deletedCount,
      currentSessionId: req.sessionID
    });
    
  } catch (error) {
    console.error('Error terminating other sessions:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to terminate other sessions',
      message: error.message
    });
  }
};

// Update session security settings
export const updateSessionSettings = (req, res) => {
  const { 
    enableNotifications, 
    sessionTimeout, 
    requireReauthForSensitive,
    enableDeviceTracking 
  } = req.body;
  
  // Update session settings (stored in session)
  if (!req.session.settings) {
    req.session.settings = {};
  }
  
  if (typeof enableNotifications === 'boolean') {
    req.session.settings.enableNotifications = enableNotifications;
  }
  
  if (typeof requireReauthForSensitive === 'boolean') {
    req.session.settings.requireReauthForSensitive = requireReauthForSensitive;
  }
  
  if (typeof enableDeviceTracking === 'boolean') {
    req.session.settings.enableDeviceTracking = enableDeviceTracking;
  }
  
  // Session timeout can only be shortened, not extended (security measure)
  if (sessionTimeout && typeof sessionTimeout === 'number') {
    const maxTimeout = parseInt(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000;
    if (sessionTimeout > 0 && sessionTimeout <= maxTimeout) {
      req.session.cookie.maxAge = sessionTimeout;
    }
  }
  
  res.status(StatusCodes.OK).json({
    message: 'Session settings updated successfully',
    settings: req.session.settings,
    sessionTimeout: req.session.cookie.maxAge
  });
};

// Refresh authentication token
export const refreshToken = (req, res) => {
  try {
    // Create new JWT with current user data
    const tokenPayload = {
      userId: req.user.userId,
      role: req.user.role,
      email: req.user.email
    };
    
    const newToken = createJWT(tokenPayload);
    
    // Create refresh token (optional, for future use)
    const refreshToken = createRefreshToken(tokenPayload);
    
    const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https" || process.env.NODE_ENV === "production";

    res.cookie('token', newToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      partitioned: isSecure
    });
    
    // Update session with new token info
    if (req.session) {
      req.session.lastTokenRefresh = Date.now();
      req.session.tokenRefreshCount = (req.session.tokenRefreshCount || 0) + 1;
    }
    
    res.status(StatusCodes.OK).json({
      message: 'Token refreshed successfully',
      token: newToken,
      tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      refreshCount: req.session?.tokenRefreshCount || 1
    });
    
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to refresh token',
      message: error.message
    });
  }
};

// Get session security analytics (admin only)
export const getSessionAnalytics = async (req, res) => {
  // This would typically be restricted to admin users
  if (req.user.role !== 'admin') {
    throw new UnauthorizedError('Admin access required');
  }
  
  try {
    const sessionCollection = mongoose.connection.db.collection('sessions');
    
    // Get session statistics
    const totalSessions = await sessionCollection.countDocuments();
    const activeSessions = await sessionCollection.countDocuments({
      expires: { $gt: new Date() }
    });
    
    // Get unique users with active sessions
    const uniqueUsers = await sessionCollection.distinct('session.userId', {
      expires: { $gt: new Date() }
    });
    
    // Get recent login activity
    const recentSessions = await sessionCollection.find({
      expires: { $gt: new Date() }
    })
    .sort({ _id: -1 })
    .limit(10)
    .toArray();
    
    const analytics = {
      totalSessions,
      activeSessions,
      uniqueActiveUsers: uniqueUsers.length,
      averageSessionsPerUser: uniqueUsers.length > 0 ? activeSessions / uniqueUsers.length : 0,
      recentActivity: recentSessions.map(session => ({
        userId: session.session?.userId,
        loginTime: session._id.getTimestamp(),
        lastActivity: session.session?.lastActivity,
        ipAddress: session.session?.ipAddress,
        requestCount: session.session?.stats?.requestCount || 0
      }))
    };
    
    res.status(StatusCodes.OK).json(analytics);
    
  } catch (error) {
    console.error('Error fetching session analytics:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch session analytics',
      message: error.message
    });
  }
};