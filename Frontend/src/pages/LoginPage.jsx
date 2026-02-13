import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { handleAPIError } from '../utils/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, verifyOTP, requiresOTP, otpEmail, isLoading, user } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Auto-redirect if already logged in
  useEffect(() => {
    if (user && user.role) {
      const redirectPaths = {
        TEACHER: '/teacher',
        SUPER_ADMIN: '/admin',
        STUDENT: '/student',
      };
      
      const redirectTo = redirectPaths[user.role] || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate]);
  
  // Helper function to mask email for display
  const maskEmail = (email) => {
    if (!email) return '';
    return email.replace(/(.{2}).*(@.*)/, '$1****$2');
  };
  
  // Form for login
  const loginForm = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Form for OTP
  const otpForm = useForm({
    defaultValues: {
      otpCode: '',
    },
  });

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Check if already in OTP state
  useEffect(() => {
    if (requiresOTP) {
      setOtpStep(true);
    }
  }, [requiresOTP]);

  // Handle login form submission
  const onLoginSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      const result = await login(data);
      
      if (result.requiresOTP) {
        setOtpStep(true);
        setCountdown(60); // 60 second countdown
        toast.success('OTP sent to your email');
      } else if (result.success) {
        toast.success('Login successful');
        
        // Redirect based on role
        const redirectPaths = {
          TEACHER: '/teacher',
          SUPER_ADMIN: '/admin',
          STUDENT: '/student',
        };
        
        const redirectTo = redirectPaths[result.user.role] || '/';
        navigate(redirectTo);
      }
    } catch (error) {
      const errorInfo = handleAPIError(error);
      toast.error(errorInfo.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP verification
  const onOtpSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      const result = await verifyOTP(otpEmail, data.otpCode);
      
      if (result.success) {
        toast.success('Verification successful');
        
        const redirectPaths = {
          TEACHER: '/teacher',
          SUPER_ADMIN: '/admin',
          STUDENT: '/student',
        };
        
        const redirectTo = redirectPaths[result.user.role] || '/';
        navigate(redirectTo);
      }
    } catch (error) {
      const errorInfo = handleAPIError(error);
      toast.error(errorInfo.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    try {
      // Re-submit login to trigger OTP resend
      const username = loginForm.getValues('username');
      const password = loginForm.getValues('password');
      await login({ username, password });
      
      setCountdown(60);
      toast.success('OTP resent successfully');
    } catch (error) {
      toast.error('Failed to resend OTP');
    }
  };

  // Show loading while checking auth status
  if (isLoading && !isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* 🎨 Left Side - Brand & Marketing (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-700 via-purple-700 to-indigo-800 relative overflow-hidden items-center justify-center p-12">
        {/* Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
           <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
           <div className="absolute bottom-10 right-10 w-80 h-80 bg-pink-500 rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative z-10 text-white max-w-lg">
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Empowering <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-pink-200">
              Future Innovators
            </span>
          </h1>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed font-light">
            iTECHS is the premier platform for academic excellence and seamless assessment management.
          </p>
          
          
          <div className="mt-12 text-sm text-blue-200 opacity-60">
            © 2024 iTECHS Education Systems. All rights reserved.
          </div>
        </div>
      </div>

      {/* 🔐 Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50/50">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          
          {/* Mobile Brand Header (Visible only on Mobile) */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-block p-3 bg-blue-600 rounded-xl mb-4 text-white text-3xl shadow-lg">
              🎓
            </div>
            <h1 className="text-2xl font-bold text-gray-900">iTECHS Platform</h1>
          </div>

          {!otpStep ? (
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
                <p className="text-gray-500 mt-2">Welcome back! Please enter your details.</p>
              </div>

              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email or Username
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 group-focus-within:text-blue-500 transition-colors">📧</span>
                      </div>
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
                        placeholder="username@school.edu"
                        {...loginForm.register('username', { required: 'Username is required' })}
                      />
                    </div>
                    {loginForm.formState.errors.username && (
                      <p className="text-red-500 text-xs mt-1 font-medium animate-pulse">
                        {loginForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 group-focus-within:text-blue-500 transition-colors">🔒</span>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
                        placeholder="••••••••"
                        {...loginForm.register('password', { required: 'Password is required' })}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-red-500 text-xs mt-1 font-medium animate-pulse">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                    <div className="flex justify-end mt-1">
                      <a href="#" className="text-xs text-blue-600 hover:text-blue-800 font-medium opacity-80 hover:opacity-100 transition-opacity">
                        Forgot Password?
                      </a>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <span>➜</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 text-center animate-fade-in">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📱</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h2>
              <p className="text-gray-500 mb-8">
                We sent a secure code to your email <br/>
                <span className="text-gray-900 font-medium bg-gray-100 px-2 py-0.5 rounded">{maskEmail(otpEmail)}</span>
              </p>

              <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
                <div>
                  <input
                    type="text"
                    className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none transition-colors bg-transparent placeholder-gray-200"
                    placeholder="000000"
                    maxLength={6}
                    autoComplete="one-time-code"
                    {...otpForm.register('otpCode', {
                      required: 'Code required',
                      minLength: { value: 6, message: 'Must be 6 digits' },
                      pattern: { value: /^[0-9]+$/, message: 'Numbers only' }
                    })}
                  />
                  {otpForm.formState.errors.otpCode && (
                    <p className="text-red-500 text-sm mt-2 font-medium">
                      {otpForm.formState.errors.otpCode.message}
                    </p>
                  )}
                </div>

                <div className="space-y-4 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all"
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify Code'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={countdown > 0}
                    className={`text-sm font-medium transition-colors ${
                      countdown > 0 ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'
                    }`}
                  >
                    {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Verification Code'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-8">
            Privacy Policy • Terms of Service • Help Center
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;