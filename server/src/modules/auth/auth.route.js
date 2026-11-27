import { Router } from "express";
const router = Router();

import { register, login, logout, forgotPassword, resetPassword } from "./auth.controller.js";
import { registerValidation, loginValidation } from "../../middleware/validationMiddleware.js";
import { authenticateUser, authorizePermissions } from "../../middleware/authMiddleware.js";

router.post("/register", authenticateUser, authorizePermissions("Admin"), registerValidation, register);
router.post("/login", loginValidation, login);
router.get("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
