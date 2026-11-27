import { Router } from "express";
const router = Router();
import upload from "../../middleware/multerMiddleware.js";
import { authenticateUser, authorizePermissions } from "../../middleware/authMiddleware.js";

import {
  getAllColleges,
  createCollege,
  getCollege,
  updateCollege,
  deleteCollege,
  updateStatus,
  getMyColleges,
} from "./college.controller.js";

router.route("/my-colleges").get(authenticateUser, getMyColleges);
router.route("/").get(getAllColleges).post(upload.single("college_logo"), createCollege);
router
  .route("/:id")
  .get(getCollege)
  .patch(authenticateUser, authorizePermissions("Admin", "University", "College"), upload.single("college_logo"), updateCollege)
  .delete(authenticateUser, authorizePermissions("Admin"), deleteCollege);
router.route("/:id/status/:status").patch(authenticateUser, authorizePermissions("Admin"), updateStatus);

export default router;
