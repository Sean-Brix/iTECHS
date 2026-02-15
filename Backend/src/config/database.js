const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../utils/helpers');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Initialize database with default super admin
const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');

    // Check if super admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (!existingSuperAdmin) {
      console.log('📝 Creating default Super Admin account...');
      
      const defaultEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@itechs.edu';
      const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123';
      
      const hashedPassword = await hashPassword(defaultPassword);
      
      await prisma.user.create({
        data: {
          username: defaultEmail,
          email: defaultEmail,
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          firstName: 'Super',
          lastName: 'Admin',
          isArchived: false,
          isVerified: true
        }
      });

      console.log(`✅ Super Admin created successfully!`);
      console.log(`📧 Email: ${defaultEmail}`);
      console.log(`🔑 Password: ${defaultPassword}`);
      console.log(`⚠️  Please change the default password after first login!`);
    } else {
      console.log('✅ Super Admin account already exists');
    }

    console.log('🎉 Database initialization completed successfully!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Graceful shutdown
const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database connection closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

// Health check
const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
};

module.exports = {
  prisma,
  initializeDatabase,
  disconnectDatabase,
  checkDatabaseHealth
};