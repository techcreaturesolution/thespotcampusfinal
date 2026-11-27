import { Router } from "express";
const router = Router();

import { getDashboardStats, getAdminReport, getAllTransactions } from "./dashboard.controller.js";
import { authorizePermissions } from "../../middleware/authMiddleware.js";

router.route("/").get(getDashboardStats);
router.route("/admin-report").get(authorizePermissions("Admin"), getAdminReport);
router.route("/transactions").get(authorizePermissions("Admin"), getAllTransactions);

export default router;
