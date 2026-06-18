import { Router } from "express";
const router = Router();

import { getDashboardStats, getAdminReport, getAllTransactions } from "./dashboard.controller.js";

router.route("/").get(getDashboardStats);
router.route("/admin-report").get(getAdminReport);
router.route("/transactions").get(getAllTransactions);

export default router;
