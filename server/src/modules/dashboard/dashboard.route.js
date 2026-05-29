import { Router } from "express";
const router = Router();

import { getDashboardStats } from "./dashboard.controller.js";

router.route("/").get(getDashboardStats);

export default router;
