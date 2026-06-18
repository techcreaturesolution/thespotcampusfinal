import { Router } from "express";
const router = Router();

import {
  createOrder,
  verifyPayment,
  getAllPayments,
  getUserPayments,
  checkStudentSubscription,
} from "./payment.controller.js";

router.route("/").post(createOrder).get(getAllPayments);
router.route("/verify").post(verifyPayment);
router.route("/check").get(checkStudentSubscription);
router.route("/my-payments").get(getUserPayments);

export default router;
