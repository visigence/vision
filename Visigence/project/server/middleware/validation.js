import { body, param, query, validationResult } from 'express-validator';
import { sanitizeHtml, sanitizeText } from '../utils/sanitizer.js';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Allowed fields for updates to prevent injection
const ALLOWED_USER_UPDATE_FIELDS = [
  'first_name', 'last_name', 'username', 'bio', 'avatar_url', 'role', 'status'
];

const ALLOWED_MESSAGE_UPDATE_FIELDS = [
  'title', 'content', 'excerpt', 'category_id', 'status', 'is_featured', 'is_pinned'
];

// Custom sanitization middleware
export const sanitizeMessageContent = (req, res, next) => {
  if (req.body.content) {
    req.body.content = sanitizeHtml(req.body.content);
  }
  if (req.body.excerpt) {
    req.body.excerpt = sanitizeText(req.body.excerpt);
  }
  if (req.body.title) {
    req.body.title = sanitizeText(req.body.title);
  }
  next();
};

// Whitelist update fields
export const whitelistUserFields = (req, res, next) => {
  if (req.body) {
    const sanitizedBody = {};
    for (const field of ALLOWED_USER_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        sanitizedBody[field] = req.body[field];
      }
    }
    req.body = sanitizedBody;
  }
  next();
};

export const whitelistMessageFields = (req, res, next) => {
  if (req.body) {
    const sanitizedBody = {};
    for (const field of ALLOWED_MESSAGE_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        sanitizedBody[field] = req.body[field];
      }
    }
    // Preserve tags array if present
    if (req.body.tags !== undefined) {
      sanitizedBody.tags = req.body.tags;
    }
    req.body = sanitizedBody;
  }
  next();
};

// User validation rules with enhanced sanitization
export const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .trim()
    .escape()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .trim()
    .escape()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
  body('lastName')
    .trim()
    .escape()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
  body('username')
    .trim()
    .escape()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
  handleValidationErrors
];

export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .trim()
    .escape()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

export const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .trim()
    .escape()
    .withMessage('Please provide a valid email address'),
  handleValidationErrors
];

export const validatePasswordUpdate = [
  body('token')
    .notEmpty()
    .trim()
    .escape()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
];

// Message validation rules with enhanced sanitization
export const validateMessage = [
  body('title')
    .trim()
    .escape()
    .isLength({ min: 5, max: 255 })
    .withMessage('Title must be between 5 and 255 characters')
    .matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/)
    .withMessage('Title contains invalid characters'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  body('excerpt')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 500 })
    .withMessage('Excerpt must not exceed 500 characters'),
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isUUID()
    .withMessage('Each tag must be a valid UUID'),
  body('status')
    .optional()
    .isIn(['active', 'hidden', 'flagged', 'deleted'])
    .withMessage('Invalid status value'),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),
  body('isPinned')
    .optional()
    .isBoolean()
    .withMessage('isPinned must be a boolean'),
  sanitizeMessageContent,
  handleValidationErrors
];

// Category validation rules
export const validateCategory = [
  body('name')
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_&]+$/)
    .withMessage('Category name contains invalid characters'),
  body('description')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code'),
  body('icon')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 50 })
    .withMessage('Icon name must not exceed 50 characters')
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage('Icon name contains invalid characters'),
  handleValidationErrors
];

// Tag validation rules
export const validateTag = [
  body('name')
    .trim()
    .escape()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tag name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Tag name contains invalid characters'),
  body('description')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code'),
  handleValidationErrors
];

// UUID parameter validation
export const validateUUID = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`),
  handleValidationErrors
];

// Pagination validation with whitelisted sort fields
const ALLOWED_SORT_FIELDS = ['created_at', 'updated_at', 'title', 'view_count', 'like_count', 'published_at'];

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(ALLOWED_SORT_FIELDS)
    .withMessage(`Sort field must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}`),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be either asc or desc'),
  query('search')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 100 })
    .withMessage('Search query must not exceed 100 characters'),
  query('category')
    .optional()
    .trim()
    .escape()
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage('Category slug contains invalid characters'),
  query('status')
    .optional()
    .isIn(['active', 'hidden', 'flagged', 'deleted'])
    .withMessage('Invalid status value'),
  query('author')
    .optional()
    .trim()
    .escape()
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Author username contains invalid characters'),
  handleValidationErrors
];

// Export allowed fields for use in controllers
export { ALLOWED_USER_UPDATE_FIELDS, ALLOWED_MESSAGE_UPDATE_FIELDS };