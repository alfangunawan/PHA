const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@admin.com' },
  });
  console.log(user);
  
  if (user) {
     const match = await bcrypt.compare('admin123', user.passwordHash);
     console.log('Password match test:', match);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
