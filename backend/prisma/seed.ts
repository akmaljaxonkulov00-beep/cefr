import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Super Admin with user's specified credentials
  const adminPassword = await bcrypt.hash('akmal1221', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'akmaljaxonkulov00@gmail.com' },
    update: { password: adminPassword, role: Role.SUPER_ADMIN },
    create: {
      email: 'akmaljaxonkulov00@gmail.com',
      password: adminPassword,
      name: 'Super Admin',
      role: Role.SUPER_ADMIN,
      emailVerified: true,
    },
  });
  console.log('Super Admin created:', admin.email);

  // Create subscription and analytics for admin
  await prisma.subscription.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, plan: 'ENTERPRISE', status: 'ACTIVE' },
  });

  await prisma.analytics.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  // Create a sample center
  const center = await prisma.center.upsert({
    where: { id: 'default-center' },
    update: {},
    create: {
      id: 'default-center',
      name: 'Toshkent Ingliz Tili Markazi',
      address: 'Toshkent sh., Amir Temur ko\'chasi',
    },
  });
  console.log('Center created:', center.name);

  // Create center admin
  const centerAdminPassword = await bcrypt.hash('center123', 12);
  const centerAdmin = await prisma.user.upsert({
    where: { email: 'center@mockcefr.uz' },
    update: { centerId: center.id },
    create: {
      email: 'center@mockcefr.uz',
      password: centerAdminPassword,
      name: 'Center Admin',
      role: Role.CENTER_ADMIN,
      centerId: center.id,
      emailVerified: true,
    },
  });
  console.log('Center Admin created:', centerAdmin.email);

  // Create subscription and analytics for center admin
  await prisma.subscription.upsert({
    where: { userId: centerAdmin.id },
    update: {},
    create: { userId: centerAdmin.id, plan: 'FREE', status: 'ACTIVE' },
  });

  await prisma.analytics.upsert({
    where: { userId: centerAdmin.id },
    update: {},
    create: { userId: centerAdmin.id },
  });

  // Create a sample student
  const studentPassword = await bcrypt.hash('student123', 12);
  const student = await prisma.user.upsert({
    where: { email: 'student@mockcefr.uz' },
    update: {},
    create: {
      email: 'student@mockcefr.uz',
      password: studentPassword,
      name: 'Sample Student',
      role: Role.STUDENT,
      centerId: center.id,
      emailVerified: true,
    },
  });
  console.log('Student created:', student.email);

  // Create subscription and analytics for student
  await prisma.subscription.upsert({
    where: { userId: student.id },
    update: {},
    create: { userId: student.id, plan: 'FREE', status: 'ACTIVE' },
  });

  await prisma.analytics.upsert({
    where: { userId: student.id },
    update: {},
    create: { userId: student.id },
  });

  // Create payment card
  await prisma.paymentCard.upsert({
    where: { id: 'default-card' },
    update: {},
    create: {
      id: 'default-card',
      bankName: 'Kapitalbank',
      cardNumber: '8600 1234 5678 9012',
      cardHolderName: 'AKMAL JAXONQULOV',
      cardType: 'UZCARD',
      isActive: true,
    },
  });
  console.log('Payment Card created');

  console.log('Seeding completed successfully!');
  console.log('\n=== CREDENTIALS ===');
  console.log('Super Admin: akmaljaxonkulov00@gmail.com / akmal1221');
  console.log('Center Admin: center@mockcefr.uz / center123');
  console.log('Student: student@mockcefr.uz / student123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
