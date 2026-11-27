import { Router } from "express";
import { authorizePermissions } from "../../middleware/authMiddleware.js";
import {
  validateStudentIdParam,
  validateInternshipIdParam,
  validateInternshipListQuery,
  validateCreateInternship,
  validateUpdateInternship,
  validateReorderInternships,
} from "./internship.validator.js";
import {
  getInternshipMetadata,
  listMyInternships,
  getMyInternship,
  createMyInternship,
  updateMyInternship,
  deleteMyInternship,
  reorderMyInternships,
  listStudentInternships,
  getStudentInternship,
  createStudentInternship,
  updateStudentInternship,
  deleteStudentInternship,
  reorderStudentInternships,
} from "./internship.controller.js";

const router = Router();

router.get(
  "/meta",
  authorizePermissions("Student", "College", "TPO", "University", "Admin"),
  getInternshipMetadata,
);

// Student self-service endpoints
router
  .route("/me")
  .get(authorizePermissions("Student"), validateInternshipListQuery, listMyInternships)
  .post(authorizePermissions("Student"), validateCreateInternship, createMyInternship);

router.patch(
  "/me/reorder",
  authorizePermissions("Student"),
  validateReorderInternships,
  reorderMyInternships,
);

router
  .route("/me/:internshipId")
  .get(authorizePermissions("Student"), validateInternshipIdParam, getMyInternship)
  .patch(
    authorizePermissions("Student"),
    validateInternshipIdParam,
    validateUpdateInternship,
    updateMyInternship,
  )
  .delete(authorizePermissions("Student"), validateInternshipIdParam, deleteMyInternship);

// Scoped student endpoints (Student self, Institute/College, TPO, University read-only, Admin)
router
  .route("/student/:studentId")
  .get(
    authorizePermissions("Student", "College", "TPO", "University", "Admin"),
    validateStudentIdParam,
    validateInternshipListQuery,
    listStudentInternships,
  )
  .post(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateCreateInternship,
    createStudentInternship,
  );

router.patch(
  "/student/:studentId/reorder",
  authorizePermissions("Student", "College", "TPO", "Admin"),
  validateStudentIdParam,
  validateReorderInternships,
  reorderStudentInternships,
);

router
  .route("/student/:studentId/:internshipId")
  .get(
    authorizePermissions("Student", "College", "TPO", "University", "Admin"),
    validateStudentIdParam,
    validateInternshipIdParam,
    getStudentInternship,
  )
  .patch(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateInternshipIdParam,
    validateUpdateInternship,
    updateStudentInternship,
  )
  .delete(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateInternshipIdParam,
    deleteStudentInternship,
  );

export default router;
