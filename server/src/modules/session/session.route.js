import { Router } from "express";
const router = Router();

import {
  getUserSessions,
  terminateSession,
  terminateAllOtherSessions,
  getSessionInfo,
  updateSessionSettings,
  refreshToken
} from "./session.controller.js";

import { enhancedAuthenticateUser } from "../../middleware/authMiddleware.js";
import { 
  trackSessionActivity,
  concurrentSessionControl,
  validateSession 
} from "../../middleware/sessionSecurityMiddleware.js";

// Get all active sessions for the current user
router.get("/", 
  enhancedAuthenticateUser, 
  trackSessionActivity, 
  validateSession,
  getUserSessions
);

// Get current session info
router.get("/current", 
  enhancedAuthenticateUser, 
  trackSessionActivity,
  getSessionInfo
);

// Terminate a specific session
router.delete("/:sessionId", 
  enhancedAuthenticateUser, 
  trackSessionActivity, 
  validateSession,
  terminateSession
);

// Terminate all other sessions (keep current session active)
router.delete("/", 
  enhancedAuthenticateUser, 
  trackSessionActivity, 
  validateSession,
  terminateAllOtherSessions
);

// Update session security settings
router.patch("/settings", 
  enhancedAuthenticateUser, 
  trackSessionActivity,
  updateSessionSettings
);

// Refresh authentication token
router.post("/refresh", 
  enhancedAuthenticateUser,
  concurrentSessionControl,
  refreshToken
);

export default router;