const { PrismaClient } = require('@prisma/client');
const { 
  hashPassword,
  successResponse,
  errorResponse,
  sanitizeUser,
  getPaginationData,
  generateUsername
} = require('../utils/helpers');
const { sendWelcomeEmail } = require('../utils/emailService');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Get all users (with pagination and filtering)
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, search, isActive } = req.query;
    
    const where = {};
    
    // Apply filters
    if (role) {
      where.role = role;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ];
    }

    // For teachers, only show their students
    if (req.user.role === 'TEACHER') {
      where.OR = [
        { teacherId: req.user.id },
        { id: req.user.id } // Include self
      ];
    }

    // Get total count
    const totalCount = await prisma.user.count({ where });
    
    // Get pagination data
    const paginationData = getPaginationData(page, limit, totalCount);
    
    // Get users
    const users = await prisma.user.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            createdStudents: true,
            exams: true,
            scores: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: paginationData.offset,
      take: paginationData.limit
    });

    const sanitizedUsers = users.map(user => sanitizeUser(user));

    res.status(200).json(
      successResponse(
        {
          users: sanitizedUsers,
          ...paginationData.pagination
        },
        'Users retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Get user by ID
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        createdStudents: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            exams: true,
            scores: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json(
        errorResponse('User not found')
      );
    }

    // Check access permissions
    if (req.user.role === 'TEACHER') {
      // Teachers can only view their own profile or their students
      if (user.id !== req.user.id && user.teacherId !== req.user.id) {
        return res.status(403).json(
          errorResponse('Insufficient permissions')
        );
      }
    } else if (req.user.role === 'STUDENT') {
      // Students can only view their own profile
      if (user.id !== req.user.id) {
        return res.status(403).json(
          errorResponse('Insufficient permissions')
        );
      }
    }

    const sanitizedUser = sanitizeUser(user);

    res.status(200).json(
      successResponse(
        sanitizedUser,
        'User retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Create student (by teacher) or teacher (by super admin)
const createUser = async (req, res, next) => {
  try {
    const { email, password, role, firstName, lastName, username: providedUsername } = req.body;
    
    // Check permissions
    if (req.user.role === 'TEACHER' && role !== 'STUDENT') {
      return res.status(403).json(
        errorResponse('Teachers can only create student accounts')
      );
    }
    
    if (req.user.role !== 'SUPER_ADMIN' && role === 'TEACHER') {
      return res.status(403).json(
        errorResponse('Only super admins can create teacher accounts')
      );
    }

    if (req.user.role !== 'SUPER_ADMIN' && role === 'SUPER_ADMIN') {
      return res.status(403).json(
        errorResponse('Only super admins can create admin accounts')
      );
    }

    // Determine username
    let username;
    if (providedUsername) {
      // Validate provided username format
      if (role === 'STUDENT' && !providedUsername.endsWith('@student.com')) {
        return res.status(400).json(
          errorResponse('Student username must end with @student.com')
        );
      }
      if (role === 'TEACHER' && !providedUsername.endsWith('@teacher.com')) {
        return res.status(400).json(
          errorResponse('Teacher username must end with @teacher.com')
        );
      }
      username = providedUsername;
    } else {
      // Generate username based on email and role if not provided
      username = generateUsername(email, role);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json(
        errorResponse('User with this username or email already exists')
      );
    }

    // Generate temporary password if not provided
    const userPassword = password || crypto.randomBytes(8).toString('hex') + 'A1!';
    const hashedPassword = await hashPassword(userPassword);

    // Create user data
    const userData = {
      username,
      email,
      password: hashedPassword,
      role,
      firstName: firstName || null,
      lastName: lastName || null,
      isVerified: true // Admin/teacher created accounts are pre-verified
    };

    // For students, set the teacher relationship
    if (role === 'STUDENT' && req.user.role === 'TEACHER') {
      userData.teacherId = req.user.id;
    }

    const newUser = await prisma.user.create({
      data: userData
    });

    // Send welcome email with credentials if password was auto-generated
    const sendPassword = !password;
    await sendWelcomeEmail(
      email,
      firstName || email.split('@')[0],
      role,
      sendPassword ? userPassword : null
    );

    const sanitizedUser = sanitizeUser(newUser);

    res.status(201).json(
      successResponse(
        {
          user: sanitizedUser,
          ...(sendPassword && { temporaryPassword: userPassword })
        },
        `${role.toLowerCase()} account created successfully`
      )
    );
  } catch (error) {
    next(error);
  }
};

// Update user
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, isActive } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json(
        errorResponse('User not found')
      );
    }

    // Check permissions
    if (req.user.role === 'TEACHER') {
      // Teachers can only update their students or their own profile
      if (user.id !== req.user.id && user.teacherId !== req.user.id) {
        return res.status(403).json(
          errorResponse('Insufficient permissions')
        );
      }
      
      // Teachers cannot change isActive status
      if (isActive !== undefined && user.id !== req.user.id) {
        return res.status(403).json(
          errorResponse('Teachers cannot activate/deactivate accounts')
        );
      }
    } else if (req.user.role === 'STUDENT') {
      // Students can only update their own profile
      if (user.id !== req.user.id) {
        return res.status(403).json(
          errorResponse('Insufficient permissions')
        );
      }
    }

    // Check if email already exists for another user
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id }
        }
      });

      if (existingUser) {
        return res.status(400).json(
          errorResponse('Email already in use by another account')
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email && { email }),
        ...(isActive !== undefined && 
            req.user.role === 'SUPER_ADMIN' && { isActive })
      }
    });

    const sanitizedUser = sanitizeUser(updatedUser);

    res.status(200).json(
      successResponse(
        sanitizedUser,
        'User updated successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Delete user (deactivate)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json(
        errorResponse('User not found')
      );
    }

    // Check permissions
    if (req.user.role === 'TEACHER') {
      // Teachers can only deactivate their students
      if (user.teacherId !== req.user.id) {
        return res.status(403).json(
          errorResponse('Teachers can only deactivate their own students')
        );
      }
    } else if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json(
        errorResponse('Insufficient permissions')
      );
    }

    // Prevent self-deletion
    if (user.id === req.user.id) {
      return res.status(400).json(
        errorResponse('Cannot deactivate your own account')
      );
    }

    // Deactivate user instead of hard delete
    const deactivatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    res.status(200).json(
      successResponse(
        null,
        'User deactivated successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Get students for a teacher
const getMyStudents = async (req, res, next) => {
  try {
    if (req.user.role !== 'TEACHER') {
      return res.status(403).json(
        errorResponse('Only teachers can view their students')
      );
    }

    const { page = 1, limit = 10, search, isActive } = req.query;
    
    const where = {
      teacherId: req.user.id
    };
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count
    const totalCount = await prisma.user.count({ where });
    
    // Get pagination data
    const paginationData = getPaginationData(page, limit, totalCount);
    
    // Get students
    const students = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            exams: true,
            scores: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: paginationData.offset,
      take: paginationData.limit
    });

    const sanitizedStudents = students.map(student => sanitizeUser(student));

    res.status(200).json(
      successResponse(
        {
          students: sanitizedStudents,
          ...paginationData.pagination
        },
        'Students retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Reset user password (generate new temporary password)
const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json(
        errorResponse('User not found')
      );
    }

    // Check permissions
    if (req.user.role === 'TEACHER' && user.teacherId !== req.user.id) {
      return res.status(403).json(
        errorResponse('Teachers can only reset passwords for their students')
      );
    } else if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'TEACHER') {
      return res.status(403).json(
        errorResponse('Insufficient permissions')
      );
    }

    // Generate new temporary password
    const temporaryPassword = crypto.randomBytes(8).toString('hex') + 'A1!';
    const hashedPassword = await hashPassword(temporaryPassword);

    // Update user password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    // Send email with new password
    await sendWelcomeEmail(
      user.email,
      user.firstName || user.username,
      user.role,
      temporaryPassword
    );

    res.status(200).json(
      successResponse(
        { temporaryPassword },
        'Password reset successfully. New temporary password sent to user email.'
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getMyStudents,
  resetUserPassword
};