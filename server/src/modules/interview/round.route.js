import { Router } from "express";
const router = Router();
import { authorizePermissions } from "../../middleware/authMiddleware.js";

import {
  addRoundsToJob,
  getJobRounds,
  updateRoundStatus,
  getRoundCandidates,
  advanceCandidates,
  updateCandidateRound,
  initializeFirstRound,
  getRoundProgress,
  getStudentRoundStatus,
} from "./round.controller.js";

// Job rounds management
router.route("/job/:id/rounds").get(getJobRounds).post(authorizePermissions("Admin", "Company"), addRoundsToJob);
router.route("/job/:jobId/round/:roundId/status").patch(authorizePermissions("Admin", "Company"), updateRoundStatus);
router.route("/job/:jobId/round/:roundNumber/candidates").get(authorizePermissions("Admin", "Company"), getRoundCandidates);
router.route("/job/:jobId/advance").post(authorizePermissions("Admin", "Company"), advanceCandidates);
router.route("/job/:jobId/initialize").post(authorizePermissions("Admin", "Company"), initializeFirstRound);
router.route("/job/:jobId/progress").get(authorizePermissions("Admin", "Company"), getRoundProgress);

// Candidate round management
router.route("/candidate/:id").patch(authorizePermissions("Admin", "Company"), updateCandidateRound);

// Student view
router.route("/student/job/:jobId").get(authorizePermissions("Admin", "Company", "Student"), getStudentRoundStatus);

export default router;
