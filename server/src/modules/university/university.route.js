import { Router } from "express";
const router = Router();
import upload from "../../middleware/multerMiddleware.js";

import {
  getAllUniversitys,
  createUniversity,
  getUniversity,
  updateUniversity,
  deleteUniversity,
} from "./university.controller.js";

router.route("/").get(getAllUniversitys).post(upload.single("university_logo"), createUniversity);
router
  .route("/:id")
  .get(getUniversity)
  .patch(upload.single("university_logo"), updateUniversity)
  .delete(deleteUniversity);

export default router;
