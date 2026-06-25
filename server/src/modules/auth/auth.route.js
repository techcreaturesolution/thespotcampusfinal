import { Router } from "express";
const router = Router();

import { register, login, logout } from "./auth.controller.js";
import { registerValidation, loginValidation } from "../../middleware/validationMiddleware.js";

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.get("/logout", logout);

export default router;
