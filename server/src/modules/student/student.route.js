import { Router } from "express";
const router = Router();
import { authenticateUser } from "../../middleware/authMiddleware.js";
import { 
  uploadProfileImage, 
  uploadResume, 
  validateUploadedFile 
} from "../../middleware/fileUploadMiddleware.js";
import { studentValidation } from "../../middleware/validationMiddleware.js";

import {
  getAllStudents,
  createStudent,
  getStudent,
  updateStudent,
  deleteStudent,
  verifyStudent,
} from "./student.controller.js";

import {
  getResume,
  saveResume,
  generateAiSummaries,
} from "./resume.controller.js";

// Student list & register
router.route("/")
  .get(getAllStudents)
  .post(uploadProfileImage, validateUploadedFile, studentValidation, createStudent);

router.patch("/:id/verify", authenticateUser, verifyStudent);

// Student Resume/CV builder endpoints  
router.route("/resume/me")
  .get(authenticateUser, getResume)
  .post(authenticateUser, uploadResume, validateUploadedFile, saveResume);
router.post("/resume/ai-summaries", authenticateUser, generateAiSummaries);

// Student CRUD by ID
router
  .route("/:id")
  .get(getStudent)
  .patch(authenticateUser, uploadProfileImage, validateUploadedFile, updateStudent)
  .delete(authenticateUser, deleteStudent);

export default router;
