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
    const { page = 1, limit = 10, role, search, isArchived } = req.query;
    
    const where = {};
    
    // Apply filters
    if (role) {
      where.role = role;
    }
    
    if (isArchived !== undefined) {
      where.isArchived = isArchived === 'true';
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
            isArchived: true,
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
    const { firstName, lastName, email, isArchived } = req.body;
    
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
      
      // Teachers cannot change isArchived status
      if (isArchived !== undefined && user.id !== req.user.id) {
        return res.status(403).json(
          errorResponse('Teachers cannot archive/unarchive accounts')
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
        ...(isArchived !== undefined && 
            req.user.role === 'SUPER_ADMIN' && { isArchived })
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

// Archive user (move to archive table)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Find user with all related data
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        teacher: true,
        createdStudents: true,
        exams: true,
        scores: true,
        createdExams: true
      }
    });

    if (!user) {
      return res.status(404).json(
        errorResponse('User not found')
      );
    }

    // Check permissions
    if (req.user.role === 'TEACHER') {
      // Teachers can only archive their students
      if (user.teacherId !== req.user.id) {
        return res.status(403).json(
          errorResponse('Teachers can only archive their own students')
        );
      }
    } else if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json(
        errorResponse('Insufficient permissions')
      );
    }

    // Prevent self-archiving
    if (user.id === req.user.id) {
      return res.status(400).json(
        errorResponse('Cannot archive your own account')
      );
    }

    // Start transaction to move user to archive table
    await prisma.$transaction(async (tx) => {
      // Create archived user record with complete data
      await tx.archivedUser.create({
        data: {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          teacherId: user.teacherId,
          archivedBy: req.user.id,
          archiveReason: reason || 'No reason provided',
          userData: JSON.stringify({
            ...user,
            scores: undefined, // Don't duplicate relational data
            exams: undefined,
            createdExams: undefined,
            createdStudents: undefined,
            teacher: undefined
          })
        }
      });

      // Mark user as archived in main table (soft delete)
      await tx.user.update({
        where: { id },
        data: { isArchived: true }
      });
    });

    res.status(200).json(
      successResponse(
        null,
        'User archived successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Restore archived user
const restoreUser = async (req, res, next) => {
  try {
    const { id } = req.params; // This is the userId of the archived user
    
    // Find archived user
    const archivedUser = await prisma.archivedUser.findUnique({
      where: { userId: id }
    });

    if (!archivedUser) {
      return res.status(404).json(
        errorResponse('Archived user not found')
      );
    }

    // Check permissions
    if (req.user.role === 'TEACHER') {
      // Teachers can only restore their students
      if (archivedUser.teacherId !== req.user.id) {
        return res.status(403).json(
          errorResponse('Teachers can only restore their own students')
        );
      }
    } else if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json(
        errorResponse('Insufficient permissions')
      );
    }

    // Start transaction to restore user
    await prisma.$transaction(async (tx) => {
      // Update user to mark as active
      await tx.user.update({
        where: { id },
        data: { isArchived: false }
      });

      // Remove from archive table
      await tx.archivedUser.delete({
        where: { userId: id }
      });
    });

    res.status(200).json(
      successResponse(
        null,
        'User restored successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Get archived users
const getArchivedUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    const where = {};
    
    // For teachers, only show their archived students
    if (req.user.role === 'TEACHER') {
      where.teacherId = req.user.id;
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
    const totalCount = await prisma.archivedUser.count({ where });
    
    // Get pagination data
    const paginationData = getPaginationData(page, limit, totalCount);
    
    // Get archived users
    const archivedUsers = await prisma.archivedUser.findMany({
      where,
      orderBy: { archivedAt: 'desc' },
      skip: paginationData.offset,
      take: paginationData.limit
    });

    res.status(200).json(
      successResponse(
        {
          archivedUsers,
          ...paginationData.pagination
        },
        'Archived users retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Get students for a teacher (active only by default)
const getMyStudents = async (req, res, next) => {
  try {
    if (req.user.role !== 'TEACHER') {
      return res.status(403).json(
        errorResponse('Only teachers can view their students')
      );
    }

    const { page = 1, limit = 10, search, isArchived } = req.query;
    
    const where = {
      teacherId: req.user.id,
      isArchived: isArchived === 'true' ? true : false // Default to active students
    };
    
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
  restoreUser,
  getArchivedUsers,
  getMyStudents,
  resetUserPassword
};