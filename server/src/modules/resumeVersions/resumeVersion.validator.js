import { body, param, query } from "express-validator";
import { validateInput } from "../../middleware/validationMiddleware.js";
import {
  RESUME_FONT_FAMILIES,
  RESUME_LAYOUT_COLUMNS,
  RESUME_PAGE_MARGINS,
  RESUME_SECTION_KEYS,
  RESUME_VERSION_STATUS,
  RESUME_VERSION_VISIBILITY,
} from "../../utils/constants.js";

export const validateStudentIdParam = [
  param("studentId").isMongoId().withMessage("Invalid student ID format"),
  validateInput,
];

export const validateResumeIdParam = [
  param("resumeId").isMongoId().withMessage("Invalid resume version ID format"),
  validateInput,
];

export const validateShareTokenParam = [
  param("shareToken")
    .isString()
    .isLength({ min: 32, max: 128 })
    .matches(/^[a-fA-F0-9]+$/)
    .withMessage("Invalid share token format"),
  validateInput,
];

export const validateResumeListQuery = [
  query("status")
    .optional({ checkFalsy: true })
    .isIn(Object.values(RESUME_VERSION_STATUS))
    .withMessage("Invalid status filter"),
  query("search")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search query must not exceed 100 characters"),
  validateInput,
];

const mongoIdArrayRule = (field, max = 50) => [
  body(field)
    .optional()
    .isArray({ max })
    .withMessage(`${field} must be an array of at most ${max} IDs`),
  body(`${field}.*`)
    .optional()
    .isMongoId()
    .withMessage(`Each entry in ${field} must be a valid Mongo ID`),
];

const resumeVersionBodyRules = (isCreate) => [
  isCreate
    ? body("name")
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage("Resume name must be between 2 and 120 characters")
    : body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage("Resume name must be between 2 and 120 characters"),
  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  body("target_role")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage("Target role / headline must not exceed 120 characters"),
  body("summary")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Summary must not exceed 2000 characters"),
  body("template_id")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("template_id must be a valid Mongo ID"),
  body("font_family")
    .optional({ checkFalsy: true })
    .isIn(RESUME_FONT_FAMILIES)
    .withMessage(`font_family must be one of: ${RESUME_FONT_FAMILIES.join(", ")}`),
  body("color_theme")
    .optional({ checkFalsy: true })
    .matches(/^#[0-9a-fA-F]{6}$/)
    .withMessage("color_theme must be a valid 6-digit hex color (e.g., #3730a3)"),
  body("layout_columns")
    .optional({ checkFalsy: true })
    .isIn(RESUME_LAYOUT_COLUMNS)
    .withMessage(`layout_columns must be one of: ${RESUME_LAYOUT_COLUMNS.join(", ")}`),
  body("page_margin")
    .optional({ checkFalsy: true })
    .isIn(RESUME_PAGE_MARGINS)
    .withMessage(`page_margin must be one of: ${RESUME_PAGE_MARGINS.join(", ")}`),
  body("section_config")
    .optional()
    .isArray({ min: 1, max: RESUME_SECTION_KEYS.length })
    .withMessage("section_config must be a non-empty array of valid sections"),
  body("section_config.*.section_key")
    .optional()
    .isIn(RESUME_SECTION_KEYS)
    .withMessage("Invalid section_key in section_config"),
  body("section_config.*.enabled")
    .optional()
    .isBoolean()
    .withMessage("enabled must be a boolean"),
  body("section_config.*.order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("order must be a non-negative integer"),
  ...mongoIdArrayRule("selected_skill_ids", 50),
  ...mongoIdArrayRule("selected_project_ids", 25),
  ...mongoIdArrayRule("selected_certification_ids", 25),
  ...mongoIdArrayRule("selected_internship_ids", 20),
  ...mongoIdArrayRule("selected_education_ids", 20),
  body("uploaded_document_id")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("uploaded_document_id must be a valid Mongo ID"),
  body("include_academic_summary").optional().isBoolean(),
  body("include_skill_proficiency").optional().isBoolean(),
  body("include_project_links").optional().isBoolean(),
  body("status")
    .optional({ checkFalsy: true })
    .isIn(Object.values(RESUME_VERSION_STATUS))
    .withMessage("Invalid status"),
  body("visibility")
    .optional({ checkFalsy: true })
    .isIn(Object.values(RESUME_VERSION_VISIBILITY))
    .withMessage("Invalid visibility"),
  body("is_default").optional().isBoolean(),
  validateInput,
];

export const validateCreateResumeVersion = resumeVersionBodyRules(true);
export const validateUpdateResumeVersion = resumeVersionBodyRules(false);

export const validateShareConfig = [
  body("share_enabled").isBoolean().withMessage("share_enabled must be a boolean"),
  body("regenerate_token").optional().isBoolean(),
  body("expires_in_days")
    .optional({ nullable: true })
    .isInt({ min: 1, max: 365 })
    .withMessage("expires_in_days must be between 1 and 365"),
  validateInput,
];
