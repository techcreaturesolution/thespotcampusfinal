import { Router } from "express";
const router = Router();

import {
  getAllContacts,
  createContact,
  deleteContact,
} from "../controllers/ContactController.js";

router.route("/").get(getAllContacts).post(createContact);
router.route("/:id").delete(deleteContact);

export default router;
