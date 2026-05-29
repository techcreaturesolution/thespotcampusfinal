import { Router } from "express";
const router = Router();

import {
  createPaper,
  deletePaper,
  getAllPaper,
  recordViolation,
  saveCameraSnapshot,
  autoSubmitPaper,
  startExamSession,
  getPaperWithProctoring,
} from "./paper.controller.js";
import { validatePaperParam } from "../../middleware/validationMiddleware.js";

router.route("/:id").post(createPaper).get(getAllPaper);
router.route("/:id").delete(validatePaperParam, deletePaper);

// Proctoring endpoints
router.route("/session/:examId").post(startExamSession);
router.route("/:paperId/violation").post(recordViolation);
router.route("/:paperId/snapshot").post(saveCameraSnapshot);
router.route("/:paperId/auto-submit").post(autoSubmitPaper);
router.route("/:paperId/proctoring").get(getPaperWithProctoring);

export default router;
