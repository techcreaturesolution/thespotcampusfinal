import { Router } from "express";
const router = Router();

import {
  scheduleInterview,
  bulkScheduleInterviews,
  getJobInterviews,
  getStudentInterviews,
  getInterview,
  getInterviewByRoom,
  startInterview,
  endInterview,
  cancelInterview,
  getAllCompanyInterviews,
} from "./interview.controller.js";

// Company
router.route("/").post(scheduleInterview).get(getAllCompanyInterviews);
router.route("/bulk").post(bulkScheduleInterviews);
router.route("/job/:jobId").get(getJobInterviews);

// Student
router.route("/student").get(getStudentInterviews);

// Shared
router.route("/room/:roomId").get(getInterviewByRoom);
router.route("/:id").get(getInterview);
router.route("/:id/start").patch(startInterview);
router.route("/:id/end").patch(endInterview);
router.route("/:id/cancel").patch(cancelInterview);

export default router;
