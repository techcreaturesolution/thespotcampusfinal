import { Router } from "express";
const router = Router();
import upload from "../../middleware/multerMiddleware.js";
import { authenticateUser } from "../../middleware/authMiddleware.js";
import {
  createTemplate,
  deleteTemplate,
  updateTemplate,
  getAllTemplates,
  compileResumeWithAi,
} from "./cvTemplate.controller.js";

// Common/Student endpoints
router.route("/").get(authenticateUser, getAllTemplates);
router.route("/compile").post(authenticateUser, compileResumeWithAi);

// Admin endpoints
router.route("/admin").post(authenticateUser, upload.single("thumbnail"), createTemplate);
router.route("/admin/:id")
  .delete(authenticateUser, deleteTemplate)
  .patch(authenticateUser, upload.single("thumbnail"), updateTemplate);

export default router;
