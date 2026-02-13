const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getMyStudents,
  resetUserPassword
} = require('../controllers/userController');
const {
  registerValidation,
  idValidation,
  paginationValidation
} = require('../middleware/validation');
const { 
  authenticateToken, 
  requireSuperAdmin, 
  requireTeacher,
  requireStudent
} = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Super Admin sees all, Teachers see their students, Students see only themselves)
 */
router.get('/', paginationValidation(), getUsers);

/**
 * @route   GET /api/users/my-students
 * @desc    Get students created by the authenticated teacher
 * @access  Private (Teachers only)
 */
router.get('/my-students', requireTeacher, paginationValidation(), getMyStudents);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Role-based access control)
 */
router.get('/:id', idValidation(), getUserById);

/**
 * @route   POST /api/users
 * @desc    Create new user (Super Admin creates Teachers, Teachers create Students)
 * @access  Private (Super Admin for Teachers, Teachers for Students)
 */
router.post('/', registerValidation(), createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user by ID
 * @access  Private (Role-based access control)
 */
router.put('/:id', idValidation(), updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Deactivate user by ID
 * @access  Private (Super Admin or Teachers for their students)
 */
router.delete('/:id', idValidation(), deleteUser);

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Reset user password (generate new temporary password)
 * @access  Private (Super Admin or Teachers for their students)
 */
router.post('/:id/reset-password', idValidation(), resetUserPassword);

module.exports = router;