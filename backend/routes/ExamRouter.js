import { Router } from "express";
const router = Router();

import {
  getAllExams,
  getExam,
  getExamById,
  createExam,
  createExamFromJD,
  updateExam,
  deleteExam,
  updateProctoringSettings,
} from "../controllers/ExamController.js";
import { validateExamParam } from "../middleware/validationMiddleware.js";

router.route("/").get(getAllExams).post(createExam);
router.route("/from-jd").post(createExamFromJD);
router
  .route("/:id")
  .get(getExam)
  .patch(validateExamParam, updateExam)
  .delete(validateExamParam, deleteExam);
router.route("/detail/:id").get(validateExamParam, getExamById);
router.route("/:id/proctoring").patch(validateExamParam, updateProctoringSettings);

export default router;
