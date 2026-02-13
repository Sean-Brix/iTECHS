# 🎓 iTECHS Learning Platform

A comprehensive, role-based learning management system with secure authentication, interactive assessments, and real-time progress tracking. Built with modern technologies for scalability and security.

## 🌟 Project Overview

iTECHS is a full-stack learning platform designed for educational institutions, featuring:

- **Role-Based Access Control**: Student, Teacher, and Super Administrator roles
- **Secure Authentication**: JWT tokens with OTP verification for teachers
- **Interactive Assessments**: Exam creation, management, and automated scoring
- **Progress Tracking**: Real-time analytics and performance monitoring
- **Modern Architecture**: RESTful API backend with responsive React frontend

## 🏗️ Architecture

```
iTECHS Learning Platform
├── Backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Authentication & validation
│   │   ├── routes/         # API endpoints
│   │   ├── utils/          # Helpers & services
│   │   └── config/         # Database configuration
│   ├── prisma/             # Database schema & migrations
│   └── server.js           # Application entry point
│
└── Frontend/               # React + Vite SPA
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── pages/          # Route components
    │   ├── context/        # React context providers
    │   ├── utils/          # API client & helpers
    │   └── App.jsx         # Main application
    └── index.html          # HTML template
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MySQL with Prisma ORM
- **Authentication**: JSON Web Tokens (JWT)
- **Security**: bcrypt, Helmet, CORS, rate limiting
- **Validation**: express-validator
- **Email**: Nodemailer for OTP delivery

### Frontend  
- **Framework**: React 18 with hooks
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios with interceptors
- **Forms**: React Hook Form
- **UI**: Custom CSS with modern design system
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Security Features
- Password hashing with bcrypt (12 rounds)
- JWT tokens with configurable expiration
- Rate limiting (100 req/15min general, 5 req/15min auth)
- Input validation and sanitization
- CORS protection
- Helmet security headers
- OTP-based two-factor authentication for teachers

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn

### 1. Clone Repository
```bash
git clone <repository-url>
cd iTECHS
```

### 2. Backend Setup
```bash
cd Backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database and email settings

# Setup database
npm run db:generate
npm run db:push

# Start backend
npm run dev
```

### 3. Frontend Setup
```bash
cd Frontend
npm install

# Configure environment  
cp .env.example .env
# Edit .env with your API URL

# Start frontend
npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health

## 👤 Default Accounts

After initial setup, a default Super Admin account is created:

- **Email**: admin@itechs.edu
- **Password**: Admin@123
- **Role**: Super Administrator

⚠️ **Important**: Change the default password after first login!

## 🎯 User Roles & Permissions

### 🎓 Student (`STUDENT`)
- **Username Format**: `username@student.com`
- **Authentication**: Direct login
- **Permissions**:
  - Join exams using exam codes
  - View personal exam history
  - Take assessments
  - View results and feedback

### 👨‍🏫 Teacher (`TEACHER`) 
- **Username Format**: `username@teacher.com`
- **Authentication**: Login + Email OTP verification
- **Permissions**:
  - Create and manage exams
  - Register new students
  - View student performance analytics
  - Generate exam codes
  - Reset student passwords

### ⚙️ Super Admin (`SUPER_ADMIN`)
- **Username Format**: Regular email address
- **Authentication**: Direct login  
- **Permissions**:
  - Full system access
  - Create teacher accounts
  - Manage all users
  - System monitoring and configuration
  - Platform-wide analytics

## 📊 Database Schema

### Core Models

#### User
```sql
- id: Primary key
- username: Role-based format
- email: Actual email for OTP
- password: Hashed password
- role: STUDENT | TEACHER | SUPER_ADMIN
- isActive: Account status
- otpCode: Temporary OTP
- otpExpiry: OTP expiration time
```

#### Exam
```sql
- id: Primary key
- title: Exam title
- examCode: 6-character unique code
- timeLimit: Duration in minutes
- totalMarks: Maximum score
- teacherId: Creator reference
```

#### Score
```sql
- studentId: Student reference
- examId: Exam reference  
- obtainedMarks: Score achieved
- percentage: Calculated percentage
- completedAt: Submission time
```

## 🔐 API Documentation

### Authentication Endpoints
```
POST /api/auth/login              # User login
POST /api/auth/verify-otp         # OTP verification
POST /api/auth/request-otp        # Request new OTP
GET  /api/auth/profile            # Get user profile
PUT  /api/auth/profile            # Update profile
POST /api/auth/change-password    # Change password
```

### User Management
```
GET    /api/users                 # List users (paginated)
GET    /api/users/:id             # Get user by ID
POST   /api/users                 # Create user (role-based)
PUT    /api/users/:id             # Update user
DELETE /api/users/:id             # Deactivate user
POST   /api/users/:id/reset-password # Reset password
```

### Exam Management
```
GET  /api/exams                   # List exams (role-filtered)
GET  /api/exams/:id               # Get exam details
GET  /api/exams/code/:code        # Find exam by code
POST /api/exams                   # Create exam (teachers)
POST /api/exams/join              # Join exam (students)
GET  /api/exams/:id/statistics    # Exam analytics
```

## 🎮 Demo Features

### For Testing
The application includes demo data for immediate testing:

#### Student Demo Codes
- `DEMO01` - Basic Math Assessment
- `DEMO02` - Science Quiz
- `DEMO03` - Programming Logic  
- `DEMO04` - General Knowledge

#### Sample Data
- Mock student records
- Demo exam statistics
- Simulated score analytics
- Sample notifications

## 🔧 Development

### Backend Development
```bash
cd Backend
npm run dev          # Start with nodemon
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Run database migrations
```

### Frontend Development  
```bash
cd Frontend
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview build
```

### Database Management
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Create migration
npm run db:migrate

# Reset database (development only)
npx prisma migrate reset
```

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Run database migrations
3. Build and deploy to server
4. Configure reverse proxy (nginx)
5. Set up SSL certificates

### Frontend Deployment
1. Build production bundle
2. Deploy to CDN or static hosting
3. Configure routing for SPA
4. Set production API URLs

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL="mysql://user:pass@host:port/db"
JWT_SECRET="your-secret-key"
JWT_EXPIRE_TIME="7d"
EMAIL_HOST="smtp.gmail.com"
EMAIL_USER="your-email"
EMAIL_PASS="app-password"
NODE_ENV="production"
```

#### Frontend (.env)
```env
VITE_API_URL="https://api.yourdomain.com"
NODE_ENV="production"
```

## 🧪 Testing

### Manual Testing Flow
1. **Super Admin**: Create teacher accounts
2. **Teacher**: Login with OTP → Create students → Create exams
3. **Student**: Login → Join exam with code → Take assessment

### API Testing
- Use Postman collection (if available)
- Test authentication flows
- Verify role-based permissions
- Check rate limiting

## 📈 Monitoring & Analytics

### Application Metrics
- User registration and login rates
- Exam creation and completion statistics
- System performance indicators
- Error rates and response times

### Database Monitoring
- Connection pool status
- Query performance
- Storage utilization
- Backup status

## 🛡️ Security Considerations

### Production Security Checklist
- [ ] Change default admin password
- [ ] Configure strong JWT secret
- [ ] Set up HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Enable database SSL
- [ ] Set up monitoring and alerts
- [ ] Regular security audits
- [ ] Backup strategy implementation

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database status
mysql -u username -p -e "SELECT 1"

# Verify Prisma connection
npx prisma db pull
```

#### Email/OTP Issues
- Verify SMTP credentials
- Check email service configuration
- Test with development console output

#### Authentication Problems
- Clear browser storage
- Verify JWT secret consistency
- Check token expiration settings

## 📞 Support

### Getting Help
- Check README files in Backend/ and Frontend/
- Review error logs for specific issues
- Verify environment configurations
- Test with demo data first

### Contributing
1. Fork the repository
2. Create feature branch
3. Follow coding standards
4. Add tests for new features
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the individual component LICENSE files for details.

---

**Built with ❤️ by the iTECHS Development Team**