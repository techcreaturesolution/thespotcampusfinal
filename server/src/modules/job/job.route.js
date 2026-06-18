import { Router } from "express";
const router = Router();

import {
  getAllJobs,
  getAllJobsClg,
  getJobs,
  createJob,
  getJob,
  updateJob,
  deleteJob,
  approveJobForCollege,
} from "./job.controller.js";
import { validateIdParam } from "../../middleware/validationMiddleware.js";

router.route("/").get(getAllJobs).post(createJob);
router.route("/college").get(getAllJobsClg);
router.route("/student").get(getJobs);
router.route("/:id/approve").patch(validateIdParam, approveJobForCollege);
router
  .route("/:id")
  .get(validateIdParam, getJob)
  .patch(validateIdParam, updateJob)
  .delete(validateIdParam, deleteJob);

export default router;
