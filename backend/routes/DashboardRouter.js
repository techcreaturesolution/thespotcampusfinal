import { Router } from "express";
const router = Router();

import { getDashboardStats } from "../controllers/DashboardController.js";

router.route("/").get(getDashboardStats);

export default router;
