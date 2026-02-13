# iTECHS Learning Platform - Frontend

A modern, responsive React frontend application for the iTECHS Learning Platform with role-based authentication and interactive user interfaces.

## 🚀 Features

- **Role-Based Interface**: Different dashboards for Students, Teachers, and Super Administrators
- **Secure Authentication**: JWT-based authentication with OTP support for teachers  
- **Responsive Design**: Mobile-first design that works on all devices
- **Real-time Feedback**: Toast notifications and loading states
- **Modern UI/UX**: Clean, intuitive interface with accessibility considerations
- **Form Validation**: Comprehensive client-side validation with react-hook-form

## 🛠️ Tech Stack

- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **React Router DOM**: Client-side routing and navigation
- **Axios**: HTTP client for API communication
- **React Hook Form**: Form management and validation
- **React Hot Toast**: Beautiful toast notifications
- **Lucide React**: Modern icon library
- **CSS3**: Custom styling with CSS Grid and Flexbox

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Running backend API (see Backend README)

## ⚙️ Installation

1. **Navigate to frontend directory**
   ```bash
   cd Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   VITE_API_URL=http://localhost:5000/api
   NODE_ENV=development
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The application will be available at `http://localhost:3000`

## 📱 Application Structure

### Pages Overview

#### Entry Page (`/`)
- **Purpose**: Role selection landing page
- **Features**: 
  - Interactive role selection (Student, Teacher, Administrator)
  - Platform overview and features highlight
  - Modern gradient design with animations

#### Student Dashboard (`/student`)
- **Purpose**: Student learning interface
- **Features**:
  - Exam code input for joining assessments
  - View joined exams and progress
  - Demo exam codes for testing
  - Student performance tracking

#### Teacher Dashboard (`/teacher`) 
- **Purpose**: Teacher management interface
- **Features**:
  - Create and manage exams
  - Student management and enrollment
  - View student scores and analytics
  - Exam statistics and performance data

#### Super Admin Panel (`/admin`)
- **Purpose**: System administration
- **Features**:
  - Create and manage teacher accounts
  - System-wide user management
  - Platform statistics and monitoring
  - Security and system health status

#### Login Page (`/login`)
- **Purpose**: Secure authentication
- **Features**:
  - Role-specific login forms
  - OTP verification for teachers
  - Password visibility toggle
  - Security notifications

## 🔐 Authentication System

### User Roles & Access

1. **Student (`STUDENT`)**
   - Access: Student dashboard only
   - Username format: `username@student.com`
   - Direct login (no OTP required)

2. **Teacher (`TEACHER`)**
   - Access: Teacher dashboard
   - Username format: `username@teacher.com`  
   - Two-factor authentication with email OTP

3. **Super Admin (`SUPER_ADMIN`)**
   - Access: All areas of the platform
   - Username format: Regular email
   - Direct login (no OTP required)

### Authentication Flow

```
Login → Role Detection → OTP (if Teacher) → Dashboard Redirect
```

## 🎨 UI/UX Features

### Design System
- **Colors**: Purple/blue gradient theme with semantic colors
- **Typography**: Clean, readable font stack
- **Layout**: CSS Grid and Flexbox for responsive design
- **Components**: Modular, reusable components

### Responsive Breakpoints
- Mobile: `< 768px`
- Tablet: `768px - 1024px` 
- Desktop: `> 1024px`

### Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliance
- Focus management

## 📦 Component Architecture

```
src/
├── components/           # Reusable components
│   ├── Layout.jsx       # Page layout wrapper
│   ├── LoadingSpinner.jsx # Loading states
│   └── ProtectedRoute.jsx # Route protection
├── context/             # React context providers
│   └── AuthContext.jsx  # Authentication state
├── pages/               # Route components
│   ├── EntryPage.jsx    # Landing page
│   ├── LoginPage.jsx    # Authentication
│   ├── StudentPage.jsx  # Student dashboard
│   ├── TeacherPage.jsx  # Teacher dashboard
│   └── SuperAdminPage.jsx # Admin panel
├── utils/               # Utilities
│   └── api.js          # API client and helpers
├── App.jsx             # Main app component
└── main.jsx           # React entry point
```

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🚀 Building for Production

1. **Create production build**
   ```bash
   npm run build
   ```

2. **Environment Variables**
   ```env
   VITE_API_URL=https://your-api-domain.com/api
   NODE_ENV=production
   ```

3. **Deploy**
   - Upload `dist/` folder to your web server
   - Configure web server for SPA routing
   - Ensure HTTPS for security

## 🔒 Security Features

- **Secure Authentication**: JWT tokens with automatic refresh
- **Route Protection**: Role-based access control
- **Input Validation**: Client-side form validation
- **XSS Prevention**: Sanitized user inputs
- **HTTPS Ready**: Production security headers

## 📑 Demo Accounts

For testing purposes, the application includes demo data:

### Demo Exam Codes (for Students)
- `DEMO01` - Basic Math Assessment
- `DEMO02` - Science Quiz  
- `DEMO03` - Programming Logic
- `DEMO04` - General Knowledge

### Demo Features
- Sample exam data
- Mock student records
- Simulated score analytics
- Demo notifications and activities

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Ensure backend server is running
   - Check `VITE_API_URL` in `.env`
   - Verify network connectivity

2. **Authentication Loops**
   - Clear browser localStorage
   - Check JWT token expiration
   - Verify API authentication endpoints

3. **Build Errors**
   - Delete `node_modules` and reinstall
   - Clear Vite cache: `rm -rf .vite`
   - Check Node.js version compatibility

### Browser Support
- Chrome (latest)
- Firefox (latest)  
- Safari (latest)
- Edge (latest)

## 📞 Support

For technical support and questions, contact the iTECHS development team.

## 📄 License

This project is licensed under the MIT License.