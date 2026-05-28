import { Router } from "express";
const router = Router();

import {
  createPlan,
  getAllPlans,
  getActivePlans,
  updatePlan,
  deletePlan,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  checkSubscription,
  getCompanySubscriptions,
  getAllSubscriptions,
} from "../controllers/RecruitmentSubscriptionController.js";
import { authorizePermissions } from "../middleware/authMiddleware.js";

// Public: Active plans
router.route("/plans/active").get(getActivePlans);

// Admin: Plan management
router
  .route("/plans")
  .get(authorizePermissions("Admin"), getAllPlans)
  .post(authorizePermissions("Admin"), createPlan);
router
  .route("/plans/:id")
  .patch(authorizePermissions("Admin"), updatePlan)
  .delete(authorizePermissions("Admin"), deletePlan);

// Admin: All subscriptions
router.route("/all").get(authorizePermissions("Admin"), getAllSubscriptions);

// Company: Purchase and manage subscription
router.route("/order").post(authorizePermissions("Company"), createSubscriptionOrder);
router.route("/verify").post(authorizePermissions("Company"), verifySubscriptionPayment);
router.route("/check").get(checkSubscription);
router.route("/check/:id").get(checkSubscription);
router.route("/my").get(authorizePermissions("Company"), getCompanySubscriptions);

export default router;
