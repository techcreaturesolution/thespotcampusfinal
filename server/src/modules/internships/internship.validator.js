import { body, param, query } from "express-validator";
import { validateInput } from "../../middleware/validationMiddleware.js";
import {
  INTERNSHIP_LINK_TYPES,
  INTERNSHIP_STATUS,
  INTERNSHIP_VISIBILITY,
  JOB_TYPE,
  WORK_MODE,
} from "../../utils/constants.js";

export const validateStudentIdParam = [
  param("studentId").isMongoId().withMessage("Invalid student ID format"),
  validateInput,
];

export const validateInternshipIdParam = [
  param("internshipId").isMongoId().withMessage("Invalid internship ID format"),
  validateInput,
];

export const validateInternshipListQuery = [
  query("status")
    .optional({ checkFalsy: true })
    .isIn(Object.values(INTERNSHIP_STATUS))
    .withMessage(`Status filter must be one of: ${Object.values(INTERNSHIP_STATUS).join(", ")}`),
  query("work_mode")
    .optional({ checkFalsy: true })
    .isIn(Object.values(WORK_MODE))
    .withMessage(`Work mode filter must be one of: ${Object.values(WORK_MODE).join(", ")}`),
  query("search")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search query must not exceed 100 characters"),
  query("sort")
    .optional({ checkFalsy: true })
    .isIn(["display_order", "timeline"])
    .withMessage("sort must be display_order or timeline"),
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

const internshipBodyRules = (isCreate) => [
  isCreate
    ? body("role_title")
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage("Role / job title must be between 2 and 120 characters")
    : body("role_title")
        .optional()
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage("Role / job title must be between 2 and 120 characters"),
  isCreate
    ? body("organization_name")
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage("Company / organization name must be between 2 and 120 characters")
    : body("organization_name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage("Company / organization name must be between 2 and 120 characters"),
  body("employment_type")
    .optional({ checkFalsy: true })
    .isIn(Object.values(JOB_TYPE))
    .withMessage(`Employment type must be one of: ${Object.values(JOB_TYPE).join(", ")}`),
  body("work_mode")
    .optional({ checkFalsy: true })
    .isIn(Object.values(WORK_MODE))
    .withMessage(`Work mode must be one of: ${Object.values(WORK_MODE).join(", ")}`),
  body("location")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage("Location must not exceed 120 characters"),
  isCreate
    ? body("start_date")
        .notEmpty()
        .withMessage("start_date is required")
        .isISO8601()
        .withMessage("start_date must be a valid ISO date")
    : body("start_date")
        .optional({ nullable: false })
        .isISO8601()
        .withMessage("start_date must be a valid ISO date"),
  body("end_date")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("end_date must be a valid ISO date"),
  body("currently_working")
    .optional()
    .isBoolean()
    .withMessage("currently_working must be a boolean"),
  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must not exceed 2000 characters"),
  body("responsibilities")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Responsibilities must not exceed 2000 characters"),
  body("achievements")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1500 })
    .withMessage("Achievements must not exceed 1500 characters"),
  body("company_website")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Company website must not exceed 500 characters"),
  body("links")
    .optional()
    .isArray({ max: 10 })
    .withMessage("links must be an array of up to 10 items"),
  body("links.*.link_type")
    .optional()
    .isIn(Object.values(INTERNSHIP_LINK_TYPES))
    .withMessage("Invalid link_type in links"),
  body("links.*.url")
    .optional()
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage("Each link url must not exceed 500 characters"),
  body("links.*.label")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 80 })
    .withMessage("Each link label must not exceed 80 characters"),
  body("skill_ids")
    .optional()
    .isArray({ max: 30 })
    .withMessage("skill_ids must be an array of up to 30 skill IDs"),
  body("skill_ids.*")
    .optional()
    .isMongoId()
    .withMessage("Each skill_id must be a valid Mongo ID"),
  body("project_ids")
    .optional()
    .isArray({ max: 20 })
    .withMessage("project_ids must be an array of up to 20 project IDs"),
  body("project_ids.*")
    .optional()
    .isMongoId()
    .withMessage("Each project_id must be a valid Mongo ID"),
  body("visibility")
    .optional({ checkFalsy: true })
    .isIn(Object.values(INTERNSHIP_VISIBILITY))
    .withMessage(
      `Visibility must be one of: ${Object.values(INTERNSHIP_VISIBILITY).join(", ")}`,
    ),
  body("status")
    .optional({ checkFalsy: true })
    .isIn(Object.values(INTERNSHIP_STATUS))
    .withMessage(`Status must be one of: ${Object.values(INTERNSHIP_STATUS).join(", ")}`),
  validateInput,
];

export const validateCreateInternship = internshipBodyRules(true);
export const validateUpdateInternship = internshipBodyRules(false);

export const validateReorderInternships = [
  body("orders").isArray({ min: 1 }).withMessage("orders must be a non-empty array"),
  body("orders.*.internship_id")
    .isMongoId()
    .withMessage("Each order item requires a valid internship_id"),
  body("orders.*.display_order")
    .isInt({ min: 0 })
    .withMessage("display_order must be a non-negative integer"),
  validateInput,
];
