import { Router } from "express";
import { authorizePermissions } from "../../middleware/authMiddleware.js";
import {
  uploadDocumentMiddleware,
  validateUploadedDocument,
} from "../../middleware/documentUploadMiddleware.js";
import {
  validateStudentIdParam,
  validateDocumentIdParam,
  validateDocumentListQuery,
  validateDocumentMetadataBody,
  validateAssociateResumeBody,
} from "./document.validator.js";
import {
  getDocumentMetadata,
  listMyDocuments,
  getMyDocument,
  uploadMyDocument,
  replaceMyDocument,
  updateMyDocumentMetadata,
  downloadMyDocument,
  deleteMyDocument,
  associateMyResumeDocument,
  listStudentDocuments,
  getStudentDocument,
  uploadStudentDocument,
  replaceStudentDocument,
  updateStudentDocumentMetadata,
  downloadStudentDocument,
  deleteStudentDocument,
} from "./document.controller.js";

const router = Router();

router.get(
  "/meta",
  authorizePermissions("Student", "College", "TPO", "University", "Admin"),
  getDocumentMetadata,
);

// Student self-service canonical document endpoints
router
  .route("/me")
  .get(authorizePermissions("Student"), validateDocumentListQuery, listMyDocuments)
  .post(
    authorizePermissions("Student"),
    uploadDocumentMiddleware,
    validateUploadedDocument,
    uploadMyDocument,
  );

router
  .route("/me/:docId")
  .get(authorizePermissions("Student"), validateDocumentIdParam, getMyDocument)
  .patch(
    authorizePermissions("Student"),
    validateDocumentIdParam,
    validateDocumentMetadataBody,
    updateMyDocumentMetadata,
  )
  .delete(authorizePermissions("Student"), validateDocumentIdParam, deleteMyDocument);

router.put(
  "/me/:docId/replace",
  authorizePermissions("Student"),
  validateDocumentIdParam,
  uploadDocumentMiddleware,
  validateUploadedDocument,
  replaceMyDocument,
);

router.get(
  "/me/:docId/download",
  authorizePermissions("Student"),
  validateDocumentIdParam,
  downloadMyDocument,
);

router.post(
  "/me/:docId/associate-resume",
  authorizePermissions("Student"),
  validateDocumentIdParam,
  validateAssociateResumeBody,
  associateMyResumeDocument,
);

// Scoped student endpoints (Student self, Institute/College, TPO, University read-only, Admin)
router
  .route("/student/:studentId")
  .get(
    authorizePermissions("Student", "College", "TPO", "University", "Admin"),
    validateStudentIdParam,
    validateDocumentListQuery,
    listStudentDocuments,
  )
  .post(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    uploadDocumentMiddleware,
    validateUploadedDocument,
    uploadStudentDocument,
  );

router
  .route("/student/:studentId/:docId")
  .get(
    authorizePermissions("Student", "College", "TPO", "University", "Admin"),
    validateStudentIdParam,
    validateDocumentIdParam,
    getStudentDocument,
  )
  .patch(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateDocumentIdParam,
    validateDocumentMetadataBody,
    updateStudentDocumentMetadata,
  )
  .delete(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateDocumentIdParam,
    deleteStudentDocument,
  );

router.put(
  "/student/:studentId/:docId/replace",
  authorizePermissions("Student", "College", "TPO", "Admin"),
  validateStudentIdParam,
  validateDocumentIdParam,
  uploadDocumentMiddleware,
  validateUploadedDocument,
  replaceStudentDocument,
);

router.get(
  "/student/:studentId/:docId/download",
  authorizePermissions("Student", "College", "TPO", "University", "Admin"),
  validateStudentIdParam,
  validateDocumentIdParam,
  downloadStudentDocument,
);

export default router;
