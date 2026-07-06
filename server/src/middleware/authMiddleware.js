import { UnauthenticatedError, UnauthorizedError } from "../errors/customErrors.js";
import { verifyJWT } from "../utils/tokenUtils.js";
import tbl_payment from "../modules/subscription/payment.model.js";

// Legacy authentication middleware (kept for compatibility)
export const authenticateUser = (req, res, next) => {
  let token = req.cookies.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) throw new UnauthenticatedError("authentication invalid");

  try {
    const { userId, role } = verifyJWT(token);
    req.user = { userId, role };
    next();
  } catch (error) {
    throw new UnauthenticatedError("authentication invalid");
  }
};

export const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new UnauthorizedError("Unauthorized to access this route");
    }
    next();
  };
};

// Enhanced authentication middleware with additional security features
export const enhancedAuthenticateUser = (req, res, next) => {
  let token = req.cookies.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  
  if (!token) {
    throw new UnauthenticatedError("No authentication token provided");
  }
  
  try {
    const decoded = verifyJWT(token);
    req.user = { 
      userId: decoded.userId, 
      role: decoded.role,
      email: decoded.email,
      tokenId: decoded.jti,
      sessionId: decoded.sessionId
    };
    
    // Additional session validation
    if (req.session) {
      // Validate session belongs to the same user
      if (req.session.userId && req.session.userId !== decoded.userId) {
        throw new UnauthenticatedError("Session user mismatch");
      }
      
      // Set session user ID if not set
      if (!req.session.userId) {
        req.session.userId = decoded.userId;
      }
    }
    
    next();
  } catch (error) {
    const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https" || process.env.NODE_ENV === "production";
    
    res.clearCookie('token', {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'none' : 'lax',
      partitioned: isSecure
    });
    
    if (req.session) {
      req.session.destroy((err) => {
        if (err) console.error('Session destruction error:', err);
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      throw new UnauthenticatedError("Token has expired");
    } else if (error.name === 'JsonWebTokenError') {
      throw new UnauthenticatedError("Invalid token");
    } else {
      throw new UnauthenticatedError("Authentication failed");
    }
  }
};

export const requireStudentSubscription = async (req, res, next) => {
  if (req.user && req.user.role === "Student") {
    try {
      const now = new Date();
      const payment = await tbl_payment.findOne({
        user_id: req.user.userId,
        status: "Paid",
        expires_at: { $gt: now },
      });

      if (!payment) {
        return res.status(403).json({
          msg: "Access denied. Active subscription required to access the preparation section.",
          requiresSubscription: true
        });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  next();
};
