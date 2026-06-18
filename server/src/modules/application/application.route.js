import { Router } from "express";
const router = Router();

import {
  getAllApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  getStudentApplications,
  getCompanyApplications,
  getInstitutionApplications,
  getApplicationResume,
} from "./application.controller.js";

router.route("/student").get(getStudentApplications);
router.route("/company").get(getCompanyApplications);
router.route("/institution").get(getInstitutionApplications);
router.route("/:id/resume").get(getApplicationResume);
router.route("/:id").get(getAllApplications).post(createApplication).patch(updateApplication).delete(deleteApplication);

export default router;
