import { Router } from "express";
const router = Router();
import upload from "../../middleware/multerMiddleware.js";

import { getCurrentUser, updateUserProfile } from "./user.controller.js";

router.route("/current-user").get(getCurrentUser);
router.route("/update-profile").patch(upload.single("profile_image"), updateUserProfile);

export default router;
