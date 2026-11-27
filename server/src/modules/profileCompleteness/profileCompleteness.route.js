import { Router } from "express";
import { authorizePermissions } from "../../middleware/authMiddleware.js";
import { validateStudentIdParam } from "./profileCompleteness.validator.js";
import {
  getMyProfileCompleteness,
  getProfileCompletenessRules,
  getStudentProfileCompleteness,
} from "./profileCompleteness.controller.js";

const router = Router();

router.get("/rules", getProfileCompletenessRules);

router.get(
  "/me",
  authorizePermissions("Student", "College", "TPO", "University", "Company", "Admin"),
  getMyProfileCompleteness,
);

router.get(
  "/student/:studentId",
  authorizePermissions("Student", "College", "TPO", "University", "Admin"),
  validateStudentIdParam,
  getStudentProfileCompleteness,
);

export default router;
