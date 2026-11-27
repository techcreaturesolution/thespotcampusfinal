import { Router } from "express";
import {
  authenticateUser,
  authorizePermissions,
} from "../../middleware/authMiddleware.js";
import {
  validateStudentIdParam,
  validateResumeIdParam,
  validateShareTokenParam,
  validateResumeListQuery,
  validateCreateResumeVersion,
  validateUpdateResumeVersion,
  validateShareConfig,
} from "./resumeVersion.validator.js";
import {
  getResumeVersionMetadata,
  listMyResumeVersions,
  getMyResumeVersion,
  createMyResumeVersion,
  updateMyResumeVersion,
  duplicateMyResumeVersion,
  setDefaultMyResumeVersion,
  deleteMyResumeVersion,
  updateMyResumeShare,
  previewMyResumeVersion,
  downloadMyResumePdf,
  listStudentResumeVersions,
  getStudentResumeVersion,
  previewStudentResumeVersion,
  downloadStudentResumePdf,
  getSharedResumePreview,
} from "./resumeVersion.controller.js";

const router = Router();

// Token-based read-only share endpoint (active non-revoked, non-expired token only)
router.get("/shared/:shareToken", validateShareTokenParam, getSharedResumePreview);

router.get(
  "/meta",
  authenticateUser,
  authorizePermissions("Student", "College", "TPO", "University", "Admin"),
  getResumeVersionMetadata,
);

// Student self-service resume version endpoints
router
  .route("/me")
  .get(
    authenticateUser,
    authorizePermissions("Student"),
    validateResumeListQuery,
    listMyResumeVersions,
  )
  .post(
    authenticateUser,
    authorizePermissions("Student"),
    validateCreateResumeVersion,
    createMyResumeVersion,
  );

router
  .route("/me/:resumeId")
  .get(
    authenticateUser,
    authorizePermissions("Student"),
    validateResumeIdParam,
    getMyResumeVersion,
  )
  .patch(
    authenticateUser,
    authorizePermissions("Student"),
    validateResumeIdParam,
    validateUpdateResumeVersion,
    updateMyResumeVersion,
  )
  .delete(
    authenticateUser,
    authorizePermissions("Student"),
    validateResumeIdParam,
    deleteMyResumeVersion,
  );

router.post(
  "/me/:resumeId/duplicate",
  authenticateUser,
  authorizePermissions("Student"),
  validateResumeIdParam,
  duplicateMyResumeVersion,
);

router.post(
  "/me/:resumeId/default",
  authenticateUser,
  authorizePermissions("Student"),
  validateResumeIdParam,
  setDefaultMyResumeVersion,
);

router.patch(
  "/me/:resumeId/share",
  authenticateUser,
  authorizePermissions("Student"),
  validateResumeIdParam,
  validateShareConfig,
  updateMyResumeShare,
);

router.post(
  "/me/:resumeId/preview",
  authenticateUser,
  authorizePermissions("Student"),
  validateResumeIdParam,
  previewMyResumeVersion,
);

router.get(
  "/me/:resumeId/download-pdf",
  authenticateUser,
  authorizePermissions("Student"),
  validateResumeIdParam,
  downloadMyResumePdf,
);

// Scoped student inspection endpoints
router.get(
  "/student/:studentId",
  authenticateUser,
  authorizePermissions("Student", "College", "TPO", "University", "Admin"),
  validateStudentIdParam,
  validateResumeListQuery,
  listStudentResumeVersions,
);

router.get(
  "/student/:studentId/:resumeId",
  authenticateUser,
  authorizePermissions("Student", "College", "TPO", "University", "Admin"),
  validateStudentIdParam,
  validateResumeIdParam,
  getStudentResumeVersion,
);

router.post(
  "/student/:studentId/:resumeId/preview",
  authenticateUser,
  authorizePermissions("Student", "College", "TPO", "University", "Admin"),
  validateStudentIdParam,
  validateResumeIdParam,
  previewStudentResumeVersion,
);

router.get(
  "/student/:studentId/:resumeId/download-pdf",
  authenticateUser,
  authorizePermissions("Student", "College", "TPO", "University", "Admin"),
  validateStudentIdParam,
  validateResumeIdParam,
  downloadStudentResumePdf,
);

export default router;
