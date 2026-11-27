import { body, param, query } from "express-validator";
import { validateInput } from "../../middleware/validationMiddleware.js";
import { PROJECT_STATUS, PROJECT_VISIBILITY, PROJECT_LINK_TYPES } from "../../utils/constants.js";

export const validateStudentIdParam = [
  param("studentId").isMongoId().withMessage("Invalid student ID format"),
  validateInput,
];

export const validateProjectIdParam = [
  param("projectId").isMongoId().withMessage("Invalid project ID format"),
  validateInput,
];

export const validateSkillIdParam = [
  param("skillId").isMongoId().withMessage("Invalid skill ID format"),
  validateInput,
];

export const validateLinkIdParam = [
  param("linkId").isMongoId().withMessage("Invalid project link ID format"),
  validateInput,
];

export const validateProjectListQuery = [
  query("status")
    .optional({ checkFalsy: true })
    .isIn(Object.values(PROJECT_STATUS))
    .withMessage(`Status filter must be one of: ${Object.values(PROJECT_STATUS).join(", ")}`),
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

const projectBodyRules = (isCreate) => [
  isCreate
    ? body("title")
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage("Project title must be between 2 and 120 characters")
    : body("title")
        .optional()
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage("Project title must be between 2 and 120 characters"),
  isCreate
    ? body("description")
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage("Project description must be between 10 and 2000 characters")
    : body("description")
        .optional()
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage("Project description must be between 10 and 2000 characters"),
  body("role")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("Project role must not exceed 80 characters"),
  body("status")
    .optional({ checkFalsy: true })
    .isIn(Object.values(PROJECT_STATUS))
    .withMessage(`Status must be one of: ${Object.values(PROJECT_STATUS).join(", ")}`),
  body("visibility")
    .optional({ checkFalsy: true })
    .isIn(Object.values(PROJECT_VISIBILITY))
    .withMessage(`Visibility must be one of: ${Object.values(PROJECT_VISIBILITY).join(", ")}`),
  body("is_ongoing")
    .optional()
    .isBoolean()
    .withMessage("is_ongoing must be a boolean"),
  body("start_date")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("start_date must be a valid ISO date"),
  body("end_date")
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage("end_date must be a valid ISO date"),
  body("team_size")
    .optional({ nullable: true })
    .isInt({ min: 1, max: 100 })
    .withMessage("team_size must be between 1 and 100"),
  body("project_url")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("project_url must not exceed 500 characters"),
  body("repository_url")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("repository_url must not exceed 500 characters"),
  body("live_demo_url")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("live_demo_url must not exceed 500 characters"),
  body("skill_ids")
    .optional()
    .isArray({ max: 30 })
    .withMessage("skill_ids must be an array of up to 30 skill IDs"),
  body("skill_ids.*")
    .optional()
    .isMongoId()
    .withMessage("Each skill_id must be a valid Mongo ID"),
  body("links")
    .optional()
    .isArray({ max: 20 })
    .withMessage("links must be an array of up to 20 project links"),
  body("links.*.link_type")
    .optional()
    .isIn(Object.values(PROJECT_LINK_TYPES))
    .withMessage(`Link type must be one of: ${Object.values(PROJECT_LINK_TYPES).join(", ")}`),
  body("links.*.url")
    .optional()
    .trim()
    .isLength({ min: 8, max: 500 })
    .withMessage("Link URL must be between 8 and 500 characters"),
  body("links.*.label")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("Link label must not exceed 80 characters"),
  validateInput,
];

export const validateCreateProject = projectBodyRules(true);
export const validateUpdateProject = projectBodyRules(false);

export const validateAddProjectSkill = [
  body("skill_id").isMongoId().withMessage("Valid canonical skill_id is required"),
  validateInput,
];

export const validateCreateProjectLink = [
  body("link_type")
    .isIn(Object.values(PROJECT_LINK_TYPES))
    .withMessage(`link_type must be one of: ${Object.values(PROJECT_LINK_TYPES).join(", ")}`),
  body("url")
    .trim()
    .isLength({ min: 8, max: 500 })
    .withMessage("url must be between 8 and 500 characters"),
  body("label")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("label must not exceed 80 characters"),
  validateInput,
];

export const validateUpdateProjectLink = [
  body("link_type")
    .optional()
    .isIn(Object.values(PROJECT_LINK_TYPES))
    .withMessage(`link_type must be one of: ${Object.values(PROJECT_LINK_TYPES).join(", ")}`),
  body("url")
    .optional()
    .trim()
    .isLength({ min: 8, max: 500 })
    .withMessage("url must be between 8 and 500 characters"),
  body("label")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("label must not exceed 80 characters"),
  validateInput,
];

export const validateReorderProjectLinks = [
  body("orders").isArray({ min: 1, max: 50 }).withMessage("orders must be a non-empty array"),
  body("orders.*.link_id").isMongoId().withMessage("Each item must include a valid link_id"),
  body("orders.*.display_order")
    .isInt({ min: 0, max: 500 })
    .withMessage("Each item must include a valid display_order"),
  validateInput,
];

export const validateReorderProjects = [
  body("orders").isArray({ min: 1, max: 100 }).withMessage("orders must be a non-empty array"),
  body("orders.*.project_id").isMongoId().withMessage("Each item must include a valid project_id"),
  body("orders.*.display_order")
    .isInt({ min: 0, max: 500 })
    .withMessage("Each item must include a valid display_order"),
  validateInput,
];
