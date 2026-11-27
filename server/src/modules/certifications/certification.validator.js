import { body, param, query } from "express-validator";
import { validateInput } from "../../middleware/validationMiddleware.js";
import {
  CERTIFICATION_CATEGORIES,
  CERTIFICATION_STATUS,
  CERTIFICATION_VISIBILITY,
} from "../../utils/constants.js";

export const validateStudentIdParam = [
  param("studentId").isMongoId().withMessage("Invalid student ID format"),
  validateInput,
];

export const validateCertIdParam = [
  param("certId").isMongoId().withMessage("Invalid certification ID format"),
  validateInput,
];

export const validateCertificationListQuery = [
  query("status")
    .optional({ checkFalsy: true })
    .isIn(Object.values(CERTIFICATION_STATUS))
    .withMessage(`Status filter must be one of: ${Object.values(CERTIFICATION_STATUS).join(", ")}`),
  query("category")
    .optional({ checkFalsy: true })
    .isIn(CERTIFICATION_CATEGORIES)
    .withMessage(`Category filter must be one of: ${CERTIFICATION_CATEGORIES.join(", ")}`),
  query("search")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search query must not exceed 100 characters"),
  query("page")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  validateInput,
];

const certificationBodyRules = (isCreate) => [
  isCreate
    ? body("title")
        .trim()
        .isLength({ min: 2, max: 150 })
        .withMessage("Certification title must be between 2 and 150 characters")
    : body("title")
        .optional()
        .trim()
        .isLength({ min: 2, max: 150 })
        .withMessage("Certification title must be between 2 and 150 characters"),
  isCreate
    ? body("issuing_organization")
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage("Issuing organization must be between 2 and 120 characters")
    : body("issuing_organization")
        .optional()
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage("Issuing organization must be between 2 and 120 characters"),
  body("category")
    .optional({ checkFalsy: true })
    .isIn(CERTIFICATION_CATEGORIES)
    .withMessage(`Category must be one of: ${CERTIFICATION_CATEGORIES.join(", ")}`),
  body("credential_id")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage("Credential ID must not exceed 120 characters"),
  body("credential_url")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Credential URL must not exceed 500 characters"),
  isCreate
    ? body("issue_date")
        .notEmpty()
        .withMessage("issue_date is required")
        .isISO8601()
        .withMessage("issue_date must be a valid ISO date")
    : body("issue_date")
        .optional({ nullable: false })
        .isISO8601()
        .withMessage("issue_date must be a valid ISO date"),
  body("expiry_date")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("expiry_date must be a valid ISO date"),
  body("does_not_expire")
    .optional()
    .isBoolean()
    .withMessage("does_not_expire must be a boolean"),
  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
  body("visibility")
    .optional({ checkFalsy: true })
    .isIn(Object.values(CERTIFICATION_VISIBILITY))
    .withMessage(
      `Visibility must be one of: ${Object.values(CERTIFICATION_VISIBILITY).join(", ")}`,
    ),
  body("status")
    .optional({ checkFalsy: true })
    .isIn(Object.values(CERTIFICATION_STATUS))
    .withMessage(`Status must be one of: ${Object.values(CERTIFICATION_STATUS).join(", ")}`),
  validateInput,
];

export const validateCreateCertification = certificationBodyRules(true);
export const validateUpdateCertification = certificationBodyRules(false);

export const validateReorderCertifications = [
  body("orders").isArray({ min: 1 }).withMessage("orders must be a non-empty array"),
  body("orders.*.certification_id")
    .isMongoId()
    .withMessage("Each order item requires a valid certification_id"),
  body("orders.*.display_order")
    .isInt({ min: 0 })
    .withMessage("display_order must be a non-negative integer"),
  validateInput,
];
