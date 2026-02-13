const nodemailer = require('nodemailer');

let transporter;

// Initialize email transporter
const initializeEmailTransporter = () => {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  return transporter;
};

// Send OTP email
const sendOTPEmail = async (email, otpCode, userName = '') => {
  try {
    const emailTransporter = initializeEmailTransporter();
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('📧 Email credentials not configured. OTP:', otpCode);
      return true; // Return success for development
    }

    const mailOptions = {
      from: {
        name: 'iTECHS Learning Platform',
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER
      },
      to: email,
      subject: 'Your OTP Code - iTECHS Learning Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OTP Verification</title>
          <style>
            body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
            .content { padding: 40px 30px; text-align: center; }
            .otp-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin: 30px auto; display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; }
            .info { background-color: #f8f9fe; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #667eea; }
            .footer { background-color: #2c3e50; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .warning { color: #e74c3c; font-weight: bold; margin-top: 20px; }
            .button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 20px 0; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 iTECHS Learning Platform</h1>
            </div>
            
            <div class="content">
              <h2>Hello ${userName || 'User'}!</h2>
              <p>We received a request to access your account. Please use the following One-Time Password (OTP) to complete your authentication:</p>
              
              <div class="otp-box">
                ${otpCode}
              </div>
              
              <div class="info">
                <h3>🔐 Security Information:</h3>
                <ul style="text-align: left; margin: 0; padding-left: 20px;">
                  <li><strong>Valid for:</strong> 10 minutes only</li>
                  <li><strong>One-time use:</strong> This code will expire after use</li>
                  <li><strong>Keep private:</strong> Never share this code with anyone</li>
                </ul>
              </div>
              
              <p>If you didn't request this code, please ignore this email or contact support if you have concerns about your account security.</p>
              
              <div class="warning">
                ⚠️ This code will expire in 10 minutes for your security.
              </div>
            </div>
            
            <div class="footer">
              <p><strong>iTECHS Learning Platform</strong></p>
              <p>Empowering minds through interactive learning</p>
              <p style="font-size: 12px; margin-top: 15px; opacity: 0.8;">
                This is an automated message. Please do not reply to this email.
              </p>
              <p style="font-size: 12px; opacity: 0.8;">
                © ${new Date().getFullYear()} iTECHS Learning Platform. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        iTECHS Learning Platform - OTP Verification
        
        Hello ${userName || 'User'}!
        
        Your OTP code is: ${otpCode}
        
        This code is valid for 10 minutes only.
        
        If you didn't request this code, please ignore this email.
        
        Best regards,
        iTECHS Learning Platform Team
      `
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('📧 OTP email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    
    // In development, log the OTP code for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Development OTP for', email, ':', otpCode);
    }
    
    return false;
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, userName, role, temporaryPassword = null) => {
  try {
    const emailTransporter = initializeEmailTransporter();
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('📧 Email credentials not configured. Welcome email not sent.');
      return true;
    }

    const roleNames = {
      'STUDENT': 'Student',
      'TEACHER': 'Teacher',
      'SUPER_ADMIN': 'Administrator'
    };

    const mailOptions = {
      from: {
        name: 'iTECHS Learning Platform',
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER
      },
      to: email,
      subject: `Welcome to iTECHS Learning Platform - ${roleNames[role]} Account Created`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to iTECHS</title>
          <style>
            body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 40px 30px; }
            .welcome-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
            .credentials { background-color: #f8f9fe; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; }
            .footer { background-color: #2c3e50; color: white; padding: 20px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Welcome to iTECHS!</h1>
            </div>
            
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>Your ${roleNames[role]} account has been successfully created on the iTECHS Learning Platform.</p>
              
              <div class="welcome-box">
                <h3>🎉 Account Details</h3>
                <p><strong>Role:</strong> ${roleNames[role]}</p>
                <p><strong>Email:</strong> ${email}</p>
              </div>
              
              ${temporaryPassword ? `
              <div class="credentials">
                <h3>🔐 Temporary Login Credentials</h3>
                <p><strong>Temporary Password:</strong> <code>${temporaryPassword}</code></p>
                <p style="color: #e74c3c;"><strong>⚠️ Important:</strong> Please change your password after your first login for security.</p>
              </div>
              ` : ''}
              
              <h3>🚀 Next Steps:</h3>
              <ul>
                <li>Log in to the platform using your credentials</li>
                ${temporaryPassword ? '<li>Change your temporary password</li>' : ''}
                <li>Complete your profile information</li>
                <li>Start exploring the learning platform</li>
              </ul>
              
              <p>If you have any questions or need assistance, please contact our support team.</p>
            </div>
            
            <div class="footer">
              <p><strong>iTECHS Learning Platform</strong></p>
              <p>Empowering minds through interactive learning</p>
              <p style="font-size: 12px; margin-top: 15px;">
                © ${new Date().getFullYear()} iTECHS Learning Platform. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('📧 Welcome email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return false;
  }
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    const emailTransporter = initializeEmailTransporter();
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return { success: false, message: 'Email credentials not configured' };
    }

    await emailTransporter.verify();
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  testEmailConfiguration
};