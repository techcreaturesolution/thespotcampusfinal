import { Router } from "express";
const router = Router();
import upload from "../../middleware/multerMiddleware.js";

import {
  getAllColleges,
  createCollege,
  getCollege,
  updateCollege,
  deleteCollege,
} from "./college.controller.js";

router.route("/").get(getAllColleges).post(upload.single("college_logo"), createCollege);
router
  .route("/:id")
  .get(getCollege)
  .patch(upload.single("college_logo"), updateCollege)
  .delete(deleteCollege);

export default router;
