import { Router } from "express";
const router = Router();

import { login, logout, getCurrentUser } from "./login.controller.js";
import { authenticateUser } from "../../middleware/authMiddleware.js";

router.post("/", login);
router.get("/logout", logout);
router.get("/current-user", authenticateUser, getCurrentUser);

export default router;
