import { Router } from "express";
import { authorizePermissions } from "../../middleware/authMiddleware.js";
import {
  validateStudentIdParam,
  validateHistoryIdParam,
  validateHistoryPagination,
  validateAcademicProfileUpdate,
  validateAcademicHistoryCreate,
  validateAcademicHistoryUpdate,
} from "./academicProfile.validator.js";
import {
  getMyAcademicProfile,
  updateMyAcademicProfile,
  getMyAcademicCompletion,
  getMyAcademicHistory,
  addMyAcademicHistory,
  updateMyAcademicHistory,
  deleteMyAcademicHistory,
  getStudentAcademicProfile,
  createStudentAcademicProfile,
  updateStudentAcademicProfile,
  getStudentAcademicCompletion,
  getStudentAcademicHistory,
  addStudentAcademicHistory,
  updateStudentAcademicHistory,
  deleteStudentAcademicHistory,
  getStudentAcademicAuditLogs,
} from "./academicProfile.controller.js";

const router = Router();

// Student self-service academic profile endpoints
router
  .route("/me")
  .get(authorizePermissions("Student"), getMyAcademicProfile)
  .patch(authorizePermissions("Student"), validateAcademicProfileUpdate, updateMyAcademicProfile);

router.get("/me/completion", authorizePermissions("Student"), getMyAcademicCompletion);

router
  .route("/me/history")
  .get(authorizePermissions("Student"), validateHistoryPagination, getMyAcademicHistory)
  .post(authorizePermissions("Student"), validateAcademicHistoryCreate, addMyAcademicHistory);

router
  .route("/me/history/:historyId")
  .patch(
    authorizePermissions("Student"),
    validateHistoryIdParam,
    validateAcademicHistoryUpdate,
    updateMyAcademicHistory,
  )
  .delete(authorizePermissions("Student"), validateHistoryIdParam, deleteMyAcademicHistory);

// Authorized student / staff endpoints (ownership and college/TPO/university scope enforced in service)
router
  .route("/student/:studentId")
  .get(
    authorizePermissions("Student", "College", "TPO", "University", "Admin"),
    validateStudentIdParam,
    getStudentAcademicProfile,
  )
  .post(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateAcademicProfileUpdate,
    createStudentAcademicProfile,
  )
  .patch(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateAcademicProfileUpdate,
    updateStudentAcademicProfile,
  );

router.get(
  "/student/:studentId/completion",
  authorizePermissions("Student", "College", "TPO", "University", "Admin"),
  validateStudentIdParam,
  getStudentAcademicCompletion,
);

router
  .route("/student/:studentId/history")
  .get(
    authorizePermissions("Student", "College", "TPO", "University", "Admin"),
    validateStudentIdParam,
    validateHistoryPagination,
    getStudentAcademicHistory,
  )
  .post(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateAcademicHistoryCreate,
    addStudentAcademicHistory,
  );

router
  .route("/student/:studentId/history/:historyId")
  .patch(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateHistoryIdParam,
    validateAcademicHistoryUpdate,
    updateStudentAcademicHistory,
  )
  .delete(
    authorizePermissions("Student", "College", "TPO", "Admin"),
    validateStudentIdParam,
    validateHistoryIdParam,
    deleteStudentAcademicHistory,
  );

router.get(
  "/student/:studentId/audit-logs",
  authorizePermissions("Student", "College", "TPO", "University", "Admin"),
  validateStudentIdParam,
  validateHistoryPagination,
  getStudentAcademicAuditLogs,
);

export default router;
