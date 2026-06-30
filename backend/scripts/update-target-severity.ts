import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Updating targetSeverity for Breathing Techniques...');
  await prisma.breathingTechnique.updateMany({ where: { name: 'Deep Breathing' }, data: { targetSeverity: 'minimal' } });
  await prisma.breathingTechnique.updateMany({ where: { name: '4-7-8 Breathing' }, data: { targetSeverity: 'mild' } });
  await prisma.breathingTechnique.updateMany({ where: { name: 'Resonance Breathing' }, data: { targetSeverity: 'moderate' } });
  await prisma.breathingTechnique.updateMany({ where: { name: 'Box Breathing' }, data: { targetSeverity: 'moderate' } });
  await prisma.breathingTechnique.updateMany({ where: { name: 'Brief Relief Breathing' }, data: { targetSeverity: 'severe' } });

  console.log('Updating targetSeverity for Meditation Sessions...');
  await prisma.meditationSession.updateMany({ where: { title: 'Meditasi Pernafasan' }, data: { targetSeverity: 'minimal' } });
  await prisma.meditationSession.updateMany({ where: { title: 'Meditasi Umum' }, data: { targetSeverity: 'minimal' } });
  await prisma.meditationSession.updateMany({ where: { title: 'MBSR Terpandu (Meredakan Overthinking & Stres Akademik)' }, data: { targetSeverity: 'mild' } });
  await prisma.meditationSession.updateMany({ where: { title: 'Relaksasi Tubuh Sebelum Tidur' }, data: { targetSeverity: 'moderate' } });
  await prisma.meditationSession.updateMany({ where: { title: 'Penenang Pikiran yang Berlari (Racing Thoughts)' }, data: { targetSeverity: 'severe' } });
  await prisma.meditationSession.updateMany({ where: { title: 'Tidur Nyenyak' }, data: { targetSeverity: 'minimal' } });
  await prisma.meditationSession.updateMany({ where: { title: 'Redakan Kecemasan' }, data: { targetSeverity: 'mild' } });

  console.log('Updating targetSeverity for Education Contents...');
  await prisma.educationContent.updateMany({ where: { title: 'Apa itu Anxiety? Memahami Kecemasan Dasar' }, data: { targetSeverity: 'minimal' } });
  await prisma.educationContent.updateMany({ where: { title: 'Penyebab dan Dampak Anxiety pada Tubuh' }, data: { targetSeverity: 'mild' } });
  await prisma.educationContent.updateMany({ where: { title: 'Mengenal Gejala Anxiety dengan Cepat' }, data: { targetSeverity: 'mild' } });
  await prisma.educationContent.updateMany({ where: { title: 'Cara Efektif Meredakan Kecemasan (Anxiety Relief)' }, data: { targetSeverity: 'moderate' } });
  await prisma.educationContent.updateMany({ where: { title: 'Tips Cepat Meredakan Cemas (Shorts)' }, data: { targetSeverity: 'moderate' } });
  await prisma.educationContent.updateMany({ where: { title: 'Kecemasan Berlebih: Kapan Harus ke Psikolog?' }, data: { targetSeverity: 'severe' } });

  // Update remaining videos with fallback targetSeverity so they show up somewhere
  await prisma.educationContent.updateMany({ where: { targetSeverity: null }, data: { targetSeverity: 'minimal' } });

  console.log('✅ Update targetSeverity berhasil!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
