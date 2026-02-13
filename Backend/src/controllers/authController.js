const { PrismaClient } = require('@prisma/client');
const { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  generateOTP, 
  generateOTPExpiry,
  successResponse,
  errorResponse,
  sanitizeUser,
  generateUsername
} = require('../utils/helpers');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

const prisma = new PrismaClient();

// Register new user (only for super admin to create teachers, teachers to create students)
const register = async (req, res, next) => {
  try {
    const { username, email, password, role, firstName, lastName } = req.body;
    
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

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
        firstName: firstName || null,
        lastName: lastName || null,
        // Students and teachers need OTP verification
        isVerified: role === 'SUPER_ADMIN'
      }
    });

    // Send welcome email
    const temporaryPassword = role === 'TEACHER' ? password : null;
    await sendWelcomeEmail(email, firstName || username, role, temporaryPassword);

    const sanitizedUser = sanitizeUser(newUser);
    
    res.status(201).json(
      successResponse(
        { 
          user: sanitizedUser,
          message: 'User registered successfully. Please verify your email to activate the account.'
        },
        'Registration successful'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Login user with OTP requirement for teachers
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json(
        errorResponse('Invalid credentials')
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json(
        errorResponse('Account has been deactivated')
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json(
        errorResponse('Invalid credentials')
      );
    }

    // For teachers, require OTP verification
    if (user.role === 'TEACHER') {
      // Generate OTP
      const otpCode = generateOTP();
      const otpExpiry = generateOTPExpiry(30); // 30 minutes

      console.log('📧 OTP Generated:', {
        email: user.email,
        otpCode,
        expiryTime: otpExpiry.toISOString(),
        minutesValid: 30
      });

      // Update user with OTP
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpCode,
          otpExpiry,
          otpVerified: false
        }
      });

      // Send OTP email
      await sendOTPEmail(user.email, otpCode, user.firstName || user.username);

      return res.status(200).json(
        successResponse(
          { 
            requiresOTP: true,
            userId: user.id,
            email: user.email, // Full email needed for OTP verification
            maskedEmail: user.email.replace(/(.{2}).*(@.*)/, '$1****$2') // For display only
          },
          'OTP sent to your email. Please verify to complete login.'
        )
      );
    }

    // For students and super admin, login directly
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    const sanitizedUser = sanitizeUser(user);

    res.status(200).json(
      successResponse(
        {
          token,
          user: sanitizedUser
        },
        'Login successful'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Verify OTP for teacher login
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;
    
    // First find user with email and OTP code (debug step)
    const userWithOTP = await prisma.user.findFirst({
      where: {
        email,
        otpCode
      }
    });

    if (!userWithOTP) {
      console.log('❌ No user found with email and OTP code:', { email, otpCode });
      return res.status(400).json(
        errorResponse('Invalid OTP code')
      );
    }

    // Check if OTP has expired
    const now = new Date();
    const expiry = new Date(userWithOTP.otpExpiry);
    
    console.log('🕐 OTP Time Check:', {
      email,
      currentTime: now.toISOString(),
      expiryTime: expiry.toISOString(),
      minutesRemaining: ((expiry - now) / 1000 / 60).toFixed(2),
      isExpired: now >= expiry
    });

    if (!userWithOTP.otpExpiry || now >= expiry) {
      return res.status(400).json(
        errorResponse('OTP has expired. Please request a new one.')
      );
    }

    const user = userWithOTP;

    // Clear OTP and mark as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpExpiry: null,
        otpVerified: true,
        isVerified: true,
        lastLogin: new Date()
      }
    });

    // Generate token
    const token = generateToken({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role
    });

    const sanitizedUser = sanitizeUser(updatedUser);

    res.status(200).json(
      successResponse(
        {
          token,
          user: sanitizedUser
        },
        'OTP verified successfully. Login complete.'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Request OTP (for password reset or re-authentication)
const requestOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not
      return res.status(200).json(
        successResponse(
          null,
          'If the email exists, an OTP will be sent.'
        )
      );
    }

    // Generate OTP
    const otpCode = generateOTP();
    const otpExpiry = generateOTPExpiry(30); // 30 minutes

    console.log('🔄 OTP Requested:', {
      email: user.email,
      otpCode,
      expiryTime: otpExpiry.toISOString(),
      minutesValid: 30
    });

    // Update user with OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode,
        otpExpiry,
        otpVerified: false
      }
    });

    // Send OTP email
    await sendOTPEmail(user.email, otpCode, user.firstName || user.username);

    res.status(200).json(
      successResponse(
        null,
        'OTP sent to your email if the account exists.'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            createdStudents: true,
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

    const sanitizedUser = sanitizeUser(user);

    res.status(200).json(
      successResponse(
        sanitizedUser,
        'Profile retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email } = req.body;
    
    // Check if email already exists for another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json(
          errorResponse('Email already in use by another account')
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email })
      }
    });

    const sanitizedUser = sanitizeUser(updatedUser);

    res.status(200).json(
      successResponse(
        sanitizedUser,
        'Profile updated successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json(
        errorResponse('Current password is incorrect')
      );
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.status(200).json(
      successResponse(
        null,
        'Password changed successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Logout (client-side handles token removal, this is for logging purposes)
const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Could implement token blacklisting here if needed
    // For now, just log the logout action
    console.log(`User ${userId} logged out at ${new Date()}`);
    
    res.status(200).json(
      successResponse(
        null,
        'Logged out successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// Refresh token (generate new token with extended expiry)
const refreshToken = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Generate new token
    const newToken = generateToken({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    });

    res.status(200).json(
      successResponse(
        { token: newToken },
        'Token refreshed successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyOTP,
  requestOTP,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  refreshToken
};