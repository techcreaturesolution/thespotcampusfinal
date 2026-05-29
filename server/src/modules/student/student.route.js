import { Router } from "express";
const router = Router();
import upload from "../../middleware/multerMiddleware.js";

import {
  getAllStudents,
  createStudent,
  getStudent,
  updateStudent,
  deleteStudent,
} from "./student.controller.js";

router.route("/").get(getAllStudents).post(upload.single("student_image"), createStudent);
router
  .route("/:id")
  .get(getStudent)
  .patch(upload.single("student_image"), updateStudent)
  .delete(deleteStudent);

export default router;
