import { body, param, query } from "express-validator";
import { validateInput } from "../../middleware/validationMiddleware.js";
import {
  DOCUMENT_STATUS,
  DOCUMENT_TYPES,
  DOCUMENT_VISIBILITY,
} from "../../utils/constants.js";

export const validateStudentIdParam = [
  param("studentId").isMongoId().withMessage("Invalid student ID format"),
  validateInput,
];

export const validateDocumentIdParam = [
  param("docId").isMongoId().withMessage("Invalid document ID format"),
  validateInput,
];

export const validateDocumentListQuery = [
  query("document_type")
    .optional({ checkFalsy: true })
    .isIn(Object.values(DOCUMENT_TYPES))
    .withMessage("Invalid document_type filter"),
  query("status")
    .optional({ checkFalsy: true })
    .isIn(Object.values(DOCUMENT_STATUS))
    .withMessage("Invalid document status filter"),
  query("search")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search query must not exceed 100 characters"),
  validateInput,
];

export const validateDocumentMetadataBody = [
  body("title")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Title must not exceed 150 characters"),
  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  body("visibility")
    .optional({ checkFalsy: true })
    .isIn(Object.values(DOCUMENT_VISIBILITY))
    .withMessage("Invalid document visibility"),
  body("status")
    .optional({ checkFalsy: true })
    .isIn([DOCUMENT_STATUS.AVAILABLE, DOCUMENT_STATUS.ARCHIVED])
    .withMessage("Status can only be set to Available or Archived"),
  validateInput,
];

export const validateAssociateResumeBody = [
  body("resume_version_id")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("resume_version_id must be a valid Mongo ID"),
  validateInput,
];
