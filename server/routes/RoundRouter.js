import { Router } from "express";
const router = Router();

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
} from "../controllers/RoundController.js";

// Job rounds management
router.route("/job/:id/rounds").get(getJobRounds).post(addRoundsToJob);
router.route("/job/:jobId/round/:roundId/status").patch(updateRoundStatus);
router.route("/job/:jobId/round/:roundNumber/candidates").get(getRoundCandidates);
router.route("/job/:jobId/advance").post(advanceCandidates);
router.route("/job/:jobId/initialize").post(initializeFirstRound);
router.route("/job/:jobId/progress").get(getRoundProgress);

// Candidate round management
router.route("/candidate/:id").patch(updateCandidateRound);

// Student view
router.route("/student/job/:jobId").get(getStudentRoundStatus);

export default router;
