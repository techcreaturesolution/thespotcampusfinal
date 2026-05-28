import { Router } from "express";
const router = Router();

import { getCurrentUser } from "../controllers/userController.js";

router.route("/current-user").get(getCurrentUser);

export default router;
