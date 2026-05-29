import { Router } from "express";
const router = Router();

import {
  getAllApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  getStudentApplications,
} from "./application.controller.js";

router.route("/student").get(getStudentApplications);
router.route("/:id").get(getAllApplications).post(createApplication).patch(updateApplication).delete(deleteApplication);

export default router;
