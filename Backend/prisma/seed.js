const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');
  const defaultPassword = '123456';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Clean up existing test users
  console.log('Cleaning up existing test users...');
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['admin@itechs.com', 'john@teacher.com', 'jane@student.com']
      }
    }
  });

  // Create Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@itechs.com',
      username: 'admin@itechs.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isArchived: false,
      isVerified: true,
    },
  });

  console.log('\n✅ Created Super Admin:');
  console.log('   Email:', superAdmin.email);
  console.log('   Username:', superAdmin.username);
  console.log('   Password:', defaultPassword);

  // Create Teacher
  const teacher = await prisma.user.create({
    data: {
      email: 'john@teacher.com',
      username: 'john@teacher.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'TEACHER',
      isArchived: false,
      isVerified: true,
    },
  });

  console.log('\n✅ Created Teacher:');
  console.log('   Email:', teacher.email);
  console.log('   Username:', teacher.username);
  console.log('   Password:', defaultPassword);

  // Create Student
  const student = await prisma.user.create({
    data: {
      email: 'jane@student.com',
      username: 'jane@student.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'STUDENT',
      isArchived: false,
      isVerified: true,
      teacherId: teacher.id, // Assign to the teacher
    },
  });

  console.log('\n✅ Created Student:');
  console.log('   Email:', student.email);
  console.log('   Username:', student.username);
  console.log('   Password:', defaultPassword);

  // Create Exam
  const exam = await prisma.exam.upsert({
    where: { examCode: 'EXAM101' },
    update: {},
    create: {
      title: 'Introduction to Computer Science',
      description: 'Basic concepts of computing',
      examCode: 'EXAM101',
      isActive: true,
      timeLimit: 60,
      totalMarks: 100,
      teacherId: teacher.id,
      questions: {
        create: [
          {
            question: 'What is the binary representation of 5?',
            options: JSON.stringify(['101', '110', '111', '100']),
            correctAnswer: '101',
            marks: 10,
            type: 'multiple_choice',
          },
          {
            question: 'What does CPU stand for?',
            options: JSON.stringify(['Central Process Unit', 'Central Processing Unit', 'Computer Personal Unit', 'Central Processor Unit']),
            correctAnswer: 'Central Processing Unit',
            marks: 10,
            type: 'multiple_choice',
          },
        ],
      },
    },
  });

  console.log('\n✅ Created Exam:', exam.title);
  console.log('\n========================================');
  console.log('🎉 Seeding finished successfully!');
  console.log('========================================');
  console.log('\n📝 Default Credentials:');
  console.log('   Password for all accounts: 123456');
  console.log('\n   Super Admin: admin@itechs.com');
  console.log('   Teacher: john@teacher.com');
  console.log('   Student: jane@student.com');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
