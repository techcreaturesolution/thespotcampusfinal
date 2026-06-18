import { Router } from "express";
const router = Router();
import upload from "../../middleware/multerMiddleware.js";
import { authenticateUser } from "../../middleware/authMiddleware.js";

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
router.route("/").get(getAllStudents).post(upload.single("student_image"), createStudent);
router.patch("/:id/verify", verifyStudent);

// Student Resume/CV builder endpoints
router.route("/resume/me")
  .get(authenticateUser, getResume)
  .post(authenticateUser, saveResume);
router.post("/resume/ai-summaries", authenticateUser, generateAiSummaries);

// Student CRUD by ID
router
  .route("/:id")
  .get(getStudent)
  .patch(upload.single("student_image"), updateStudent)
  .delete(deleteStudent);

export default router;
