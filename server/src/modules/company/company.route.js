import { Router } from "express";
const router = Router();
import upload from "../../middleware/multerMiddleware.js";
import { authenticateUser, authorizePermissions } from "../../middleware/authMiddleware.js";

import {
  getAllCompanys,
  createCompany,
  getCompany,
  updateCompany,
  deleteCompany,
  updateStatus,
} from "./company.controller.js";

router.route("/").get(getAllCompanys).post(upload.single("company_logo"), createCompany);
router
  .route("/:id")
  .get(getCompany)
  .patch(authenticateUser, upload.single("company_logo"), updateCompany)
  .delete(authenticateUser, authorizePermissions("Admin"), deleteCompany);
router.route("/:id/status/:status").patch(authenticateUser, authorizePermissions("Admin"), updateStatus);

export default router;
