import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  // Login (returns requiresOTP for teachers)
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Verify OTP for teachers
  verifyOTP: async (data) => {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  },

  // Request OTP
  requestOTP: async (email) => {
    const response = await api.post('/auth/request-otp', { email });
    return response.data;
  },

  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return response.data;
  },
};

// User API calls
export const userAPI = {
  // Get all users with pagination
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete/deactivate user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Get teacher's students
  getMyStudents: async (params = {}) => {
    const response = await api.get('/users/my-students', { params });
    return response.data;
  },

  // Reset user password
  resetPassword: async (id) => {
    const response = await api.post(`/users/${id}/reset-password`);
    return response.data;
  },
};

// Exam API calls
export const examAPI = {
  // Get all exams
  getExams: async (params = {}) => {
    const response = await api.get('/exams', { params });
    return response.data;
  },

  // Get exam by ID
  getExamById: async (id) => {
    const response = await api.get(`/exams/${id}`);
    return response.data;
  },

  // Get exam by code (public preview)
  getExamByCode: async (code) => {
    const response = await api.get(`/exams/code/${code}`);
    return response.data;
  },

  // Create new exam
  createExam: async (examData) => {
    const response = await api.post('/exams', examData);
    return response.data;
  },

  // Update exam
  updateExam: async (id, examData) => {
    const response = await api.put(`/exams/${id}`, examData);
    return response.data;
  },

  // Delete exam
  deleteExam: async (id) => {
    const response = await api.delete(`/exams/${id}`);
    return response.data;
  },

  // Join exam with code
  joinExam: async (examCode) => {
    const response = await api.post('/exams/join', { examCode });
    return response.data;
  },

  // Get exam statistics
  getExamStatistics: async (id) => {
    const response = await api.get(`/exams/${id}/statistics`);
    return response.data;
  },
};

// Error handler utility
export const handleAPIError = (error) => {
  if (error.response) {
    // Server returned error response
    const data = error.response.data;
    let message = data?.message || 'An error occurred';
    
    // If there are validation errors, format them nicely
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const errorMessages = data.errors.map(err => `${err.field}: ${err.message}`).join('\n');
      message = errorMessages;
    }
    
    return {
      message,
      status: error.response.status,
      details: data?.details,
      errors: data?.errors,
    };
  } else if (error.request) {
    // Network error
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
    };
  } else {
    // Other error
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
    };
  }
};

export default api;