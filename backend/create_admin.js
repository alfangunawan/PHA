const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {
      passwordHash,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@admin.com',
      passwordHash,
      role: 'ADMIN',
      profile: {
        create: {
          displayName: 'Administrator',
          language: 'id',
        }
      }
    }
  });
  console.log("Admin created/updated successfully:", admin.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
