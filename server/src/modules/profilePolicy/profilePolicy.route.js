import { Router } from "express";
import { authenticateUser, authorizePermissions } from "../../middleware/authMiddleware.js";
import {
  validateAdminOverrideBody,
  validateDiscoverQuery,
  validatePreviewQuery,
  validatePublishBody,
  validateStudentIdParam,
  validateVisibilityBody,
} from "./profilePolicy.validator.js";
import {
  adminOverrideStudentVisibility,
  discoverPublicProfiles,
  getMyPolicyStatus,
  getPolicyMetadata,
  getPublicProfile,
  getStudentPolicyStatus,
  publishMyProfile,
  unpublishMyProfile,
  updateMyVisibility,
  viewProfileWithPolicy,
} from "./profilePolicy.controller.js";

const router = Router();

// Public safe endpoints (strict allowlist + active published/publishable checks enforced in service)
router.get("/meta", getPolicyMetadata);
router.get("/discover", validateDiscoverQuery, discoverPublicProfiles);
router.get("/public/:studentId", validateStudentIdParam, getPublicProfile);

// Student self-service validation, visibility, and publish lifecycle
router.get("/me", authenticateUser, authorizePermissions("Student"), getMyPolicyStatus);
router.post(
  "/me/publish",
  authenticateUser,
  authorizePermissions("Student"),
  validatePublishBody,
  publishMyProfile,
);
router.post("/me/unpublish", authenticateUser, authorizePermissions("Student"), unpublishMyProfile);
router.patch(
  "/me/visibility",
  authenticateUser,
  authorizePermissions("Student"),
  validateVisibilityBody,
  updateMyVisibility,
);

// Scoped student inspection & policy-filtered profile viewing
router.get(
  "/student/:studentId",
  authenticateUser,
  authorizePermissions("Student", "College", "TPO", "University", "Admin"),
  validateStudentIdParam,
  getStudentPolicyStatus,
);

router.get(
  "/view/:studentId",
  authenticateUser,
  authorizePermissions("Student", "College", "TPO", "University", "Company", "Admin"),
  validateStudentIdParam,
  validatePreviewQuery,
  viewProfileWithPolicy,
);

// Administrative override endpoint (strictly audited)
router.patch(
  "/admin/:studentId/override",
  authenticateUser,
  authorizePermissions("Admin"),
  validateStudentIdParam,
  validateAdminOverrideBody,
  adminOverrideStudentVisibility,
);

export default router;
