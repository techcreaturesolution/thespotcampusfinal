import { Router } from "express";
const router = Router();

import {
  getAllDegrees,
  createDegree,
  getDegree,
  updateDegree,
  deleteDegree,
} from "./degree.controller.js";

router.route("/").get(getAllDegrees).post(createDegree);
router.route("/:id").get(getDegree).patch(updateDegree).delete(deleteDegree);

export default router;
