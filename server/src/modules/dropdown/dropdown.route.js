import { Router } from "express";
const router = Router();

import {
  getUniversities,
  getColleges,
  getDegrees,
  getBranches,
  getDegreeMasters,
} from "./dropdown.controller.js";

router.route("/universities").get(getUniversities);
router.route("/colleges").get(getColleges);
router.route("/degrees").get(getDegrees);
router.route("/branches").get(getBranches);
router.route("/degree-masters").get(getDegreeMasters);

export default router;
