import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.gad7Result.deleteMany();
  console.log('✅ Semua data hasil tes GAD-7 telah berhasil dihapus!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
