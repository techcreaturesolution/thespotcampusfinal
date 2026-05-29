import { Router } from "express";
const router = Router();

import { getCurrentUser } from "./user.controller.js";

router.route("/current-user").get(getCurrentUser);

export default router;
