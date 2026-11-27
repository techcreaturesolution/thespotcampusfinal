import { Router } from "express";
import { authorizePermissions } from "../../middleware/authMiddleware.js";
import {
  uploadCertificateMiddleware,
  validateUploadedCertificate,
} from "../../middleware/certificationUploadMiddleware.js";
import {
  validateStudentIdParam,
  validateCertIdParam,
  validateCertificationListQuery,
  validateCreateCertification,
  validateUpdateCertification,
  validateReorderCertifications,
} from "./certification.validator.js";
import {
  getCertificationMetadata,
  listMyCertifications,
  getMyCertification,
  createMyCertification,
  updateMyCertification,
  deleteMyCertification,
  reorderMyCertifications,
  uploadMyCertificateFile,
  downloadMyCertificateFile,
  deleteMyCertificateFile,
  listStudentCertifications,
  getStudentCertification,
  createStudentCertification,
  updateStudentCertification,
  deleteStudentCertification,
  reorderStudentCertifications,
  uploadStudentCertificateFile,
  downloadStudentCertificateFile,
  deleteStudentCertificateFile,
} from "./certification.controller.js";

const router = Router();

router.get(
  "/meta",
  authorizePermissions("Student", "College", "TPO", "University", "Admin"),
  getCertificationMetadata,
);

// Student self-service endpoints
router
  .route("/me")
  .get(authorizePermissions("Student"), validateCertificationListQuery, listMyCertifications)
  .post(authorizePermissions("Student"), validateCreateCertification, createMyCertification);

router.patch(
  "/me/reorder",
  authorizePermissions("Student"),
  validateReorderCertifications,
  reorderMyCertifications,
);

router
  .route("/me/:certId")
  .get(authorizePermissions("Student"), validateCertIdParam, getMyCertification)
  .patch(
    authorizePermissions("Student"),
    validateCertIdParam,
    validateUpdateCertification,
    updateMyCertification,
  )
  .delete(authorizePermissions("Student"), validateCertIdParam, deleteMyCertification);

router
  .route("/me/:certId/certificate")
  .get(authorizePermissions("Student"), validateCertIdParam, downloadMyCertificateFile)
  .post(
    authorizePermissions("Student"),
    validateCertIdParam,
    uploadCertificateMiddleware,
    validateUploadedCertificate,
    uploadMyCertificateFile,
  )
  .delete(authorizePermissions("Student"), validateCertIdParam, deleteMyCertificateFile);

// Scoped student endpoints (Student, Institute/College, TPO, University read-only, Admin)
router
  .route("/student/:studentId")
  .get(
    authorizePermissions("Student", "College", "TPO", "University", "Admin"),
    validateStudentIdParam,
    validateCertificationListQuery,
    listStudentCertifications,
  )
  .post(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateCreateCertification,
    createStudentCertification,
  );

router.patch(
  "/student/:studentId/reorder",
  authorizePermissions("Student", "College", "TPO", "Admin"),
  validateStudentIdParam,
  validateReorderCertifications,
  reorderStudentCertifications,
);

router
  .route("/student/:studentId/:certId")
  .get(
    authorizePermissions("Student", "College", "TPO", "University", "Admin"),
    validateStudentIdParam,
    validateCertIdParam,
    getStudentCertification,
  )
  .patch(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateCertIdParam,
    validateUpdateCertification,
    updateStudentCertification,
  )
  .delete(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateCertIdParam,
    deleteStudentCertification,
  );

router
  .route("/student/:studentId/:certId/certificate")
  .get(
    authorizePermissions("Student", "College", "TPO", "University", "Admin"),
    validateStudentIdParam,
    validateCertIdParam,
    downloadStudentCertificateFile,
  )
  .post(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateCertIdParam,
    uploadCertificateMiddleware,
    validateUploadedCertificate,
    uploadStudentCertificateFile,
  )
  .delete(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateCertIdParam,
    deleteStudentCertificateFile,
  );

export default router;
