import { body, param, query } from "express-validator";
import { validateInput } from "../../middleware/validationMiddleware.js";
import {
  ACADEMIC_STATUS,
  ACADEMIC_HISTORY_STAGE,
  ACADEMIC_HISTORY_STATUS,
  SCORE_TYPE,
} from "../../utils/constants.js";

const ACADEMIC_YEAR_REGEX = /^(19|20)\d{2}-(\d{2}|(19|20)\d{2})$/;
const BATCH_REGEX = /^((19|20)\d{2}-(19|20)\d{2}|(19|20)\d{2}-\d{2}|(19|20)\d{2})$/;

export const validateStudentIdParam = [
  param("studentId").isMongoId().withMessage("Invalid student ID format"),
  validateInput,
];

export const validateHistoryIdParam = [
  param("historyId").isMongoId().withMessage("Invalid academic history ID format"),
  validateInput,
];

export const validateHistoryPagination = [
  query("page")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  validateInput,
];

export const validateAcademicProfileUpdate = [
  body("university_id")
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid university ID format"),
  body("college_id")
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid college ID format"),
  body("degree_id")
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid degree ID format"),
  body("branch_id")
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage("Invalid branch ID format"),
  body("student_enrollment")
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Enrollment number must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9/\-\s]+$/)
    .withMessage("Enrollment number contains invalid characters"),
  body("student_current_sem")
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 16 })
    .withMessage("Current semester must be a valid integer between 1 and 16"),
  body("student_total_backlog")
    .optional({ checkFalsy: true })
    .isInt({ min: 0, max: 50 })
    .withMessage("Total backlogs must be an integer between 0 and 50"),
  body("academic_year")
    .optional({ checkFalsy: true })
    .trim()
    .matches(ACADEMIC_YEAR_REGEX)
    .withMessage("Academic year must follow YYYY-YY or YYYY-YYYY format (e.g. 2025-26)"),
  body("academic_batch")
    .optional({ checkFalsy: true })
    .trim()
    .matches(BATCH_REGEX)
    .withMessage("Academic batch must be a valid year or range (e.g. 2022-2026)"),
  body("academic_status")
    .optional({ checkFalsy: true })
    .isIn(Object.values(ACADEMIC_STATUS))
    .withMessage(`Academic status must be one of: ${Object.values(ACADEMIC_STATUS).join(", ")}`),
  body("cgpa")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0, max: 10 })
    .withMessage("CGPA must be between 0 and 10"),
  body("percentage")
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0, max: 100 })
    .withMessage("Percentage must be between 0 and 100"),
  body("admission_year")
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1990, max: 2100 })
    .withMessage("Admission year must be between 1990 and 2100"),
  body("expected_graduation_year")
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1990, max: 2100 })
    .withMessage("Expected graduation year must be between 1990 and 2100"),
  body("student_skills")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Skills summary must not exceed 1000 characters"),
  validateInput,
];

const historyBodyRules = (isCreate) => {
  const reqStr = (field, min, max, msg) =>
    isCreate
      ? body(field).trim().isLength({ min, max }).withMessage(msg)
      : body(field).optional().trim().isLength({ min, max }).withMessage(msg);

  return [
    isCreate
      ? body("stage_type")
          .isIn(Object.values(ACADEMIC_HISTORY_STAGE))
          .withMessage(`Stage type must be one of: ${Object.values(ACADEMIC_HISTORY_STAGE).join(", ")}`)
      : body("stage_type")
          .optional()
          .isIn(Object.values(ACADEMIC_HISTORY_STAGE))
          .withMessage(`Stage type must be one of: ${Object.values(ACADEMIC_HISTORY_STAGE).join(", ")}`),
    reqStr(
      "institution_name",
      2,
      200,
      "Institution name must be between 2 and 200 characters",
    ),
    body("board_or_university")
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage("Board/University must not exceed 200 characters"),
    body("program_name")
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 150 })
      .withMessage("Program name must not exceed 150 characters"),
    body("department_name")
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 150 })
      .withMessage("Department name must not exceed 150 characters"),
    body("academic_year")
      .optional({ checkFalsy: true })
      .trim()
      .matches(ACADEMIC_YEAR_REGEX)
      .withMessage("Academic year must follow YYYY-YY or YYYY-YYYY format"),
    body("semester_or_year")
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 30 })
      .withMessage("Semester/Year label must not exceed 30 characters"),
    isCreate
      ? body("start_year")
          .isInt({ min: 1970, max: 2100 })
          .withMessage("Start year must be between 1970 and 2100")
      : body("start_year")
          .optional()
          .isInt({ min: 1970, max: 2100 })
          .withMessage("Start year must be between 1970 and 2100"),
    body("end_year")
      .optional({ nullable: true, checkFalsy: true })
      .isInt({ min: 1970, max: 2100 })
      .withMessage("End year must be between 1970 and 2100"),
    body("score_type")
      .optional({ checkFalsy: true })
      .isIn(Object.values(SCORE_TYPE))
      .withMessage(`Score type must be one of: ${Object.values(SCORE_TYPE).join(", ")}`),
    body("score_value")
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 20 })
      .withMessage("Score value must not exceed 20 characters"),
    body("status")
      .optional({ checkFalsy: true })
      .isIn(Object.values(ACADEMIC_HISTORY_STATUS))
      .withMessage(`History status must be one of: ${Object.values(ACADEMIC_HISTORY_STATUS).join(", ")}`),
    body("remarks")
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage("Remarks must not exceed 500 characters"),
    validateInput,
  ];
};

export const validateAcademicHistoryCreate = historyBodyRules(true);
export const validateAcademicHistoryUpdate = historyBodyRules(false);
