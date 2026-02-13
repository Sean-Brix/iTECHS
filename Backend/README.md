# iTECHS Learning Platform - Backend API

A comprehensive role-based authentication and learning management backend API built with Node.js, Express.js, Prisma, and MySQL.

## 🚀 Features

- **Role-Based Authentication**: Student, Teacher, and Super Admin roles
- **Secure Login System**: JWT tokens with OTP verification for teachers
- **User Management**: CRUD operations with proper permission controls
- **Exam Management**: Create and manage interactive assessments
- **Email Integration**: OTP and welcome emails via Nodemailer
- **Security Features**: 
  - Password hashing with bcrypt
  - Rate limiting
  - Input validation
  - CORS protection
  - Helmet security headers
  - Express validator

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Prisma ORM
- **Authentication**: JSON Web Tokens (JWT)
- **Security**: bcrypt, Helmet, CORS, express-rate-limit
- **Validation**: express-validator
- **Email**: Nodemailer

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn

## ⚙️ Installation

1. **Clone and navigate to backend**
   ```bash
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL="mysql://username:password@localhost:3306/itechs_learning"

   # JWT
   JWT_SECRET="your-super-secure-jwt-secret-key"
   JWT_EXPIRE_TIME="7d"

   # Email (Gmail example)
   EMAIL_HOST="smtp.gmail.com"
   EMAIL_PORT=587
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASS="your-app-password"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🗄️ Database Schema

### User Roles
- **SUPER_ADMIN**: Manages teachers and system
- **TEACHER**: Creates students and exams
- **STUDENT**: Takes exams

### Username Format
- Students: `username@student.com`
- Teachers: `username@teacher.com`
- Super Admin: Regular email format

## 📚 API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - User login (OTP required for teachers)
- `POST /verify-otp` - OTP verification for teachers
- `POST /request-otp` - Request new OTP
- `POST /register` - Register new user (role-based)
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `POST /change-password` - Change password
- `POST /logout` - Logout user
- `POST /refresh-token` - Refresh JWT token

### User Management (`/api/users`)
- `GET /` - Get all users (paginated, filtered)
- `GET /my-students` - Get teacher's students
- `GET /:id` - Get user by ID
- `POST /` - Create new user
- `PUT /:id` - Update user
- `DELETE /:id` - Deactivate user
- `POST /:id/reset-password` - Reset user password

### Exam Management (`/api/exams`)
- `GET /` - Get all exams (role-based)
- `GET /code/:examCode` - Get exam by code (preview)
- `GET /:id` - Get exam details
- `GET /:id/statistics` - Get exam statistics
- `POST /` - Create new exam (teachers)
- `POST /join` - Join exam with code (students)
- `PUT /:id` - Update exam
- `DELETE /:id` - Delete exam

## 🔐 Security Features

### Authentication Flow
1. **Student Login**: Direct JWT token
2. **Teacher Login**: Password → OTP via email → JWT token
3. **Super Admin Login**: Direct JWT token

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter  
- At least 1 number
- At least 1 special character

### Rate Limiting
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes

## 🚀 Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=5000
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
EMAIL_HOST="your-smtp-host"
EMAIL_USER="your-email"
EMAIL_PASS="your-email-password"
```

### Database Migration
```bash
npm run db:migrate
```

### Start Production
```bash
npm start
```

## 🧪 Development Commands

```bash
# Start development server
npm run dev

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema changes
npm run db:migrate    # Run migrations
npm run db:studio     # Open Prisma Studio

# Production
npm start
```

## 📞 Support

For technical support, contact the iTECHS development team.

## 📄 License

This project is licensed under the MIT License.