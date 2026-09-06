require('dotenv').config();
const path = require('path');
const bcrypt = require('bcryptjs');
const prisma = require(path.join(__dirname, '..', 'src', 'config', 'db'));

const admins = [
  { username: 'RychAlpha', email: 'admin@debinyce.freedev.app', password: 'J377Rych', fullName: 'J-Ferson' },
  { username: 'NastyLex', email: 'admin2@debinyce.freedev.app', password: 'Teslie256', fullName: 'Laker Leslie' },
];

async function main() {
  for (const admin of admins) {
    const hashedPassword = await bcrypt.hash(admin.password, 12);
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: admin.username }, { email: admin.email }],
      },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: 'ADMIN',
          password: hashedPassword,
          fullName: admin.fullName,
          isVerified: true,
          isFirstLogin: false,
        },
      });
      console.log(`UPDATED admin: ${admin.username}`);
    } else {
      await prisma.user.create({
        data: {
          username: admin.username,
          email: admin.email,
          password: hashedPassword,
          fullName: admin.fullName,
          role: 'ADMIN',
          isVerified: true,
          isFirstLogin: false,
        },
      });
      console.log(`CREATED admin: ${admin.username}`);
    }
  }
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });