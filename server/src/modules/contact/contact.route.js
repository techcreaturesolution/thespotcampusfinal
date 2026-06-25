import { Router } from "express";
const router = Router();

import {
  getAllContacts,
  createContact,
  deleteContact,
} from "./contact.controller.js";
import { contactValidation, mongoIdValidation } from "../../middleware/validationMiddleware.js";

router.route("/").get(getAllContacts).post(contactValidation, createContact);
router.route("/:id").delete(mongoIdValidation('id'), deleteContact);

export default router;
