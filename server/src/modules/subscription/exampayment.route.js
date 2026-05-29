import { Router } from "express";
const router = Router();

import {
  createExamOrder,
  verifyExamPayment,
  verifyExamAccess,
} from "./exampayment.controller.js";

router.route("/").post(createExamOrder);
router.route("/verify").post(verifyExamPayment);
router.route("/verify/:id").get(verifyExamAccess);

export default router;
