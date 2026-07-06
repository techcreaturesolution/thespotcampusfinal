import { body, param, query, validationResult } from 'express-validator';
import { BadRequestError } from '../errors/customErrors.js';

// Main validation middleware to check for errors
export const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    throw new BadRequestError(`Validation failed: ${errorMessages.map(e => e.message).join(', ')}`);
  }
  next();
};

// Common validation rules
export const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Please provide a valid email address');

export const passwordValidation = body('password')
  .isLength({ min: 6, max: 50 })
  .withMessage('Password must be between 6 and 50 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number');

export const nameValidation = (field) => body(field)
  .trim()
  .isLength({ min: 2, max: 50 })
  .withMessage(`${field} must be between 2 and 50 characters`)
  .matches(/^[a-zA-Z\s]+$/)
  .withMessage(`${field} can only contain letters and spaces`);

export const phoneValidation = body('phone')
  .optional()
  .isMobilePhone('any')
  .withMessage('Please provide a valid phone number');

export const mongoIdValidation = (field) => param(field)
  .isMongoId()
  .withMessage(`Invalid ${field} ID format`);

// Shorthand for ID parameter validation
export const validateIdParam = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  validateInput
];

// Specific parameter validations for different modules
export const validateExamParam = [
  param('id').isMongoId().withMessage('Invalid exam ID format'),
  validateInput
];

export const validatePaperParam = [
  param('id').isMongoId().withMessage('Invalid paper ID format'),
  validateInput
];

// Auth validation chains
export const registerValidation = [
  nameValidation('firstName'),
  nameValidation('lastName'),
  emailValidation,
  passwordValidation,
  phoneValidation,
  validateInput
];

export const loginValidation = [
  emailValidation,
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validateInput
];

// Job validation chains
export const jobValidation = [
  body('job_title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Job title must be between 3 and 100 characters'),
  body('job_desc')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Job description must be between 10 and 2000 characters'),
  body('job_location.city')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('job_location.state')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  body('job_location.country')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),
  body('job_salary')
    .optional(),
  validateInput
];

// Company validation
export const companyValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Company description must not exceed 1000 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  body('industry')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Industry must be between 2 and 50 characters'),
  validateInput
];

// Student validation
export const studentValidation = [
  body('student_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('student_email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('student_password')
    .isLength({ min: 6, max: 50 })
    .withMessage('Password must be between 6 and 50 characters'),
  body('student_contact')
    .trim()
    .isMobilePhone('any')
    .withMessage('Please provide a valid contact number'),
  body('student_enrollment')
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('Enrollment number must be between 5 and 20 characters')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Enrollment number can only contain letters and numbers'),
  validateInput
];

// College validation
export const collegeValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('College name must be between 3 and 200 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('establishedYear')
    .optional()
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage('Please provide a valid establishment year'),
  validateInput
];

// Contact form validation
export const contactValidation = [
  nameValidation('name'),
  emailValidation,
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),
  validateInput
];

// Exam validation
export const examValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Exam title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('duration')
    .isInt({ min: 1, max: 300 })
    .withMessage('Duration must be between 1 and 300 minutes'),
  body('totalQuestions')
    .isInt({ min: 1, max: 200 })
    .withMessage('Total questions must be between 1 and 200'),
  body('passingScore')
    .isInt({ min: 0, max: 100 })
    .withMessage('Passing score must be between 0 and 100 percent'),
  validateInput
];

// Question validation
export const questionValidation = [
  body('question')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Question must be between 10 and 1000 characters'),
  body('options')
    .isArray({ min: 2, max: 6 })
    .withMessage('Must have between 2 and 6 options'),
  body('correctAnswer')
    .isInt({ min: 0, max: 5 })
    .withMessage('Correct answer must be a valid option index'),
  body('explanation')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Explanation must not exceed 500 characters'),
  validateInput
];

// Search and pagination validation
export const searchValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validateInput
];

// File upload validation
export const fileValidation = [
  body('fileName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('File name must be between 1 and 255 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('File name contains invalid characters'),
  validateInput
];

// General sanitization middleware
export const sanitizeInput = (req, res, next) => {
  // Sanitize string inputs to prevent XSS
  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS characters
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]+>/g, '')
          .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};