import { Router } from "express";
const router = Router();

import {
  getAllDegreeMasters,
  createDegreeMaster,
  getDegreeMaster,
  updateDegreeMaster,
  deleteDegreeMaster,
} from "../controllers/DegreeMasterController.js";

router.route("/").get(getAllDegreeMasters).post(createDegreeMaster);
router.route("/:id").get(getDegreeMaster).patch(updateDegreeMaster).delete(deleteDegreeMaster);

export default router;
