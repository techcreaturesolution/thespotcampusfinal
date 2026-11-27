import { body, param, query } from "express-validator";
import { validateInput } from "../../middleware/validationMiddleware.js";
import {
  PROFILE_VISIBILITY,
  PROFILE_VISIBILITY_OVERRIDE,
} from "../../utils/constants.js";

export const validateStudentIdParam = [
  param("studentId").trim().isMongoId().withMessage("Invalid student ID format"),
  validateInput,
];

export const validateVisibilityBody = [
  body("visibility")
    .trim()
    .isIn(Object.values(PROFILE_VISIBILITY))
    .withMessage("Visibility must be Private, Institute Only, or Public"),
  validateInput,
];

export const validatePublishBody = [
  body("visibility")
    .optional()
    .trim()
    .isIn([PROFILE_VISIBILITY.INSTITUTE_ONLY, PROFILE_VISIBILITY.PUBLIC])
    .withMessage("Publish visibility must be Institute Only or Public"),
  validateInput,
];

export const validatePreviewQuery = [
  query("preview")
    .optional({ checkFalsy: true })
    .trim()
    .isIn(["OWNER", "INSTITUTE", "PUBLIC"])
    .withMessage("Preview audience must be OWNER, INSTITUTE, or PUBLIC"),
  validateInput,
];

export const validateDiscoverQuery = [
  query("page").optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage("Invalid page"),
  query("limit")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  query("search").optional({ checkFalsy: true }).isString().isLength({ max: 80 }),
  validateInput,
];

export const validateAdminOverrideBody = [
  body("visibility_override")
    .trim()
    .isIn(Object.values(PROFILE_VISIBILITY_OVERRIDE))
    .withMessage("Invalid visibility_override state"),
  body("reason").optional({ checkFalsy: true }).isString().isLength({ max: 300 }),
  validateInput,
];
