import { Router } from "express";
const router = Router();
import upload from "../../middleware/multerMiddleware.js";

import {
  getAllTPOs,
  createTPO,
  getTPO,
  updateTPO,
  deleteTPO,
} from "./tpo.controller.js";

router.route("/").get(getAllTPOs).post(upload.single("tpo_image"), createTPO);
router
  .route("/:id")
  .get(getTPO)
  .patch(upload.single("tpo_image"), updateTPO)
  .delete(deleteTPO);

export default router;
