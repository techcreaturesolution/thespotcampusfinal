import { Router } from "express";
const router = Router();
import upload from "../../middleware/multerMiddleware.js";
import { authenticateUser } from "../../middleware/authMiddleware.js";

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
  .patch(upload.single("college_logo"), updateCollege)
  .delete(deleteCollege);
router.route("/:id/status/:status").patch(updateStatus);

export default router;
