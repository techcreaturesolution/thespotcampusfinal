import { Router } from "express";
const router = Router();
import upload from "../../middleware/multerMiddleware.js";
import { authenticateUser, authorizePermissions } from "../../middleware/authMiddleware.js";
import {
  createTemplate,
  deleteTemplate,
  updateTemplate,
  getAllTemplates,
  compileResumeWithAi,
  downloadResumePdf,
} from "./cvTemplate.controller.js";

// Common/Student endpoints
router.route("/").get(authenticateUser, getAllTemplates);
router.route("/compile").post(authenticateUser, compileResumeWithAi);
router.route("/download-pdf").get(authenticateUser, downloadResumePdf);

// Admin endpoints
router.route("/admin").post(authenticateUser, authorizePermissions("Admin"), upload.single("thumbnail"), createTemplate);
router.route("/admin/:id")
  .delete(authenticateUser, authorizePermissions("Admin"), deleteTemplate)
  .patch(authenticateUser, authorizePermissions("Admin"), upload.single("thumbnail"), updateTemplate);

export default router;
