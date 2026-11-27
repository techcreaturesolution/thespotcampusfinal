import { Router } from "express";
const router = Router();
import upload from "../../middleware/multerMiddleware.js";
import { authenticateUser, authorizePermissions } from "../../middleware/authMiddleware.js";

import {
  getAllUniversitys,
  createUniversity,
  getUniversity,
  updateUniversity,
  deleteUniversity,
  updateStatus,
} from "./university.controller.js";

router.route("/").get(getAllUniversitys).post(upload.single("university_logo"), createUniversity);
router
  .route("/:id")
  .get(getUniversity)
  .patch(authenticateUser, authorizePermissions("Admin", "University"), upload.single("university_logo"), updateUniversity)
  .delete(authenticateUser, authorizePermissions("Admin"), deleteUniversity);
router.route("/:id/status/:status").patch(authenticateUser, authorizePermissions("Admin"), updateStatus);

export default router;
