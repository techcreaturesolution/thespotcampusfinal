import { Router } from "express";
const router = Router();

import {
  getAllContacts,
  createContact,
  deleteContact,
} from "./contact.controller.js";
import { contactValidation, mongoIdValidation } from "../../middleware/validationMiddleware.js";
import { authenticateUser, authorizePermissions } from "../../middleware/authMiddleware.js";

router
  .route("/")
  .get(authenticateUser, authorizePermissions("Admin"), getAllContacts)
  .post(contactValidation, createContact);
router
  .route("/:id")
  .delete(authenticateUser, authorizePermissions("Admin"), mongoIdValidation("id"), deleteContact);

export default router;
