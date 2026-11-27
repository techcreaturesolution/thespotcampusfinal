import { param } from "express-validator";
import { validateInput } from "../../middleware/validationMiddleware.js";

export const validateStudentIdParam = [
  param("studentId")
    .trim()
    .notEmpty()
    .withMessage("studentId parameter is required")
    .isMongoId()
    .withMessage("Invalid student ID format"),
  validateInput,
];
