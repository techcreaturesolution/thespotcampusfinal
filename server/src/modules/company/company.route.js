import { Router } from "express";
const router = Router();
import upload from "../../middleware/multerMiddleware.js";

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
  .patch(upload.single("company_logo"), updateCompany)
  .delete(deleteCompany);
router.route("/:id/status/:status").patch(updateStatus);

export default router;
