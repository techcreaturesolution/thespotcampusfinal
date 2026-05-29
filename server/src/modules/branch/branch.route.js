import { Router } from "express";
const router = Router();

import {
  getAllBranches,
  createBranch,
  getBranch,
  updateBranch,
  deleteBranch,
} from "./branch.controller.js";

router.route("/").get(getAllBranches).post(createBranch);
router.route("/:id").get(getBranch).patch(updateBranch).delete(deleteBranch);

export default router;
