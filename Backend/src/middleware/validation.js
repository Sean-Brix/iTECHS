const { body, validationResult, param, query } = require('express-validator');
const validator = require('validator');

// Custom validation function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

// Custom validator for role-based usernames
const validateRoleBasedUsername = (value, { req }) => {
  const { role } = req.body;
  
  if (role === 'STUDENT' && !value.endsWith('@student.com')) {
    throw new Error('Student username must end with @student.com');
  }
  
  if (role === 'TEACHER' && !value.endsWith('@teacher.com')) {
    throw new Error('Teacher username must end with @teacher.com');
  }
  
  if (role === 'SUPER_ADMIN') {
    // Super admin can have any valid email format
    if (!validator.isEmail(value)) {
      throw new Error('Super admin username must be a valid email');
    }
  }
  
  return true;
};

// Authentication validation rules
const registerValidation = () => [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .custom(validateRoleBasedUsername),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#-])[A-Za-z\d@$!%*?&_#-]+$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&_#-)'),
  
  body('role')
    .isIn(['STUDENT', 'TEACHER', 'SUPER_ADMIN'])
    .withMessage('Role must be either STUDENT, TEACHER, or SUPER_ADMIN'),
  
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 30 })
    .withMessage('First name must be between 2 and 30 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 30 })
    .withMessage('Last name must be between 2 and 30 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  handleValidationErrors
];

const loginValidation = () => [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ max: 50 })
    .withMessage('Username cannot exceed 50 characters'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('role')
    .optional()
    .isIn(['STUDENT', 'TEACHER', 'SUPER_ADMIN'])
    .withMessage('Role must be either STUDENT, TEACHER, or SUPER_ADMIN'),
  
  handleValidationErrors
];

const otpValidation = () => [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('otpCode')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  
  handleValidationErrors
];

const requestOtpValidation = () => [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  handleValidationErrors
];

const changePasswordValidation = () => [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#-])[A-Za-z\d@$!%*?&_#-]+$/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&_#-)'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Exam validation rules
const examValidation = () => [
  body('title')
    .isLength({ min: 3, max: 100 })
    .withMessage('Exam title must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('timeLimit')
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage('Time limit must be between 1 and 480 minutes'),
  
  body('totalMarks')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total marks must be a non-negative integer'),
  
  handleValidationErrors
];

// Generic ID validation
const idValidation = () => [
  param('id')
    .isLength({ min: 1 })
    .withMessage('ID is required')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

// Pagination validation
const paginationValidation = () => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  otpValidation,
  requestOtpValidation,
  changePasswordValidation,
  examValidation,
  idValidation,
  paginationValidation,
  handleValidationErrors
};