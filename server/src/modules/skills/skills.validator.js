import { body, param, query } from "express-validator";
import { validateInput } from "../../middleware/validationMiddleware.js";
import { SKILL_CATEGORIES, SKILL_PROFICIENCY } from "../../utils/constants.js";

export const validateSkillIdParam = [
  param("skillId").isMongoId().withMessage("Invalid skill ID format"),
  validateInput,
];

export const validateStudentIdParam = [
  param("studentId").isMongoId().withMessage("Invalid student ID format"),
  validateInput,
];

export const validateUserSkillIdParam = [
  param("userSkillId").isMongoId().withMessage("Invalid user skill ID format"),
  validateInput,
];

export const validateUserSkillsQuery = [
  query("proficiency")
    .optional({ checkFalsy: true })
    .isIn(Object.values(SKILL_PROFICIENCY))
    .withMessage(`Proficiency filter must be one of: ${Object.values(SKILL_PROFICIENCY).join(", ")}`),
  query("sort")
    .optional({ checkFalsy: true })
    .isIn(["display_order", "proficiency_desc", "proficiency_asc"])
    .withMessage("Sort must be one of: display_order, proficiency_desc, proficiency_asc"),
  validateInput,
];

export const validateSkillSearchQuery = [
  query("q")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("Search query must not exceed 80 characters"),
  query("category")
    .optional({ checkFalsy: true })
    .isIn(SKILL_CATEGORIES)
    .withMessage(`Category must be one of: ${SKILL_CATEGORIES.join(", ")}`),
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

export const validateCreateMasterSkill = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage("Skill name must be between 1 and 80 characters"),
  body("category")
    .optional({ checkFalsy: true })
    .isIn(SKILL_CATEGORIES)
    .withMessage(`Category must be one of: ${SKILL_CATEGORIES.join(", ")}`),
  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Description must not exceed 300 characters"),
  validateInput,
];

export const validateUpdateMasterSkill = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage("Skill name must be between 1 and 80 characters"),
  body("category")
    .optional()
    .isIn(SKILL_CATEGORIES)
    .withMessage(`Category must be one of: ${SKILL_CATEGORIES.join(", ")}`),
  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Description must not exceed 300 characters"),
  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active must be a boolean"),
  validateInput,
];

export const validateAddUserSkill = [
  body("skill_id").isMongoId().withMessage("Valid canonical skill_id is required"),
  body("proficiency")
    .optional({ checkFalsy: true })
    .isIn(Object.values(SKILL_PROFICIENCY))
    .withMessage(`Proficiency must be one of: ${Object.values(SKILL_PROFICIENCY).join(", ")}`),
  body("years_of_experience")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0, max: 50 })
    .withMessage("Years of experience must be between 0 and 50"),
  body("display_order")
    .optional({ nullable: true })
    .isInt({ min: 0, max: 500 })
    .withMessage("Display order must be a non-negative integer"),
  validateInput,
];

export const validateUpdateUserSkill = [
  body("proficiency")
    .optional()
    .isIn(Object.values(SKILL_PROFICIENCY))
    .withMessage(`Proficiency must be one of: ${Object.values(SKILL_PROFICIENCY).join(", ")}`),
  body("years_of_experience")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0, max: 50 })
    .withMessage("Years of experience must be between 0 and 50"),
  body("display_order")
    .optional()
    .isInt({ min: 0, max: 500 })
    .withMessage("Display order must be a non-negative integer"),
  validateInput,
];

export const validateReorderUserSkills = [
  body("orders")
    .isArray({ min: 1, max: 200 })
    .withMessage("orders must be a non-empty array"),
  body("orders.*.user_skill_id")
    .isMongoId()
    .withMessage("Each item must include a valid user_skill_id"),
  body("orders.*.display_order")
    .isInt({ min: 0, max: 500 })
    .withMessage("Each item must include a valid display_order"),
  validateInput,
];
