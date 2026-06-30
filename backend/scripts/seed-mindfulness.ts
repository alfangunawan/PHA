import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding mindfulness recommendations based on anxiety levels...');

    // 1. MINIMAL ANXIETY (Minimal)
    await prisma.breathingTechnique.create({
        data: {
            name: 'Deep Breathing (Pernapasan Diafragma)',
            description: 'Pernapasan perut dengan beban kognitif sangat rendah. Menurunkan hormon stres dan tekanan darah.',
            inhaleDuration: 4, holdDuration: 0, exhaleDuration: 4, holdAfterExhale: 0, cycles: 5,
            targetSeverity: 'Minimal', colorTheme: '#A8C5DA', icon: 'leaf'
        }
    });

    await prisma.meditationSession.create({
        data: {
            title: 'Morning Meditation (Mindfulness Dasar)',
            description: 'Latihan mindfulness 5-10 menit untuk memulai hari dengan tenang.',
            category: 'general', durationOptions: [5, 10],
            targetSeverity: 'Minimal', colorTheme: '#C9B8E8'
        }
    });

    await prisma.educationContent.create({
        data: {
            title: 'Apa itu Anxiety? Memahami Kecemasan Dasar',
            description: 'Psikoedukasi untuk meningkatkan literasi kesehatan mental dan pengenalan emosi.',
            source: 'youtube', url: 'https://www.youtube.com/watch?v=1',
            category: 'general', format: 'landscape',
            targetSeverity: 'Minimal'
        }
    });

    // 2. MILD ANXIETY (Ringan)
    await prisma.breathingTechnique.create({
        data: {
            name: '4-7-8 Breathing',
            description: 'Menstimulasi saraf vagus. Tarik napas 4d, Tahan 7d, Hembuskan 8d. Turunkan kecemasan secara nyata.',
            inhaleDuration: 4, holdDuration: 7, exhaleDuration: 8, holdAfterExhale: 0, cycles: 4,
            targetSeverity: 'Ringan', colorTheme: '#81C784', icon: 'wind'
        }
    });

    await prisma.meditationSession.create({
        data: {
            title: 'Guided MBSR Meditation',
            description: 'Meditasi berbasis MBSR untuk mereduksi stres kognitif dan akademik.',
            category: 'focus', durationOptions: [10, 15],
            targetSeverity: 'Ringan', colorTheme: '#9575CD'
        }
    });

    await prisma.audioContent.create({
        data: {
            title: 'Terapi Audio Musik Lo-Fi & Instrumental',
            description: 'Musik Lo-Fi untuk memperbaiki kualitas tidur dan meredakan kecemasan emosional.',
            fileUrl: '/uploads/dummy-lofi.mp3', category: 'sleep',
            targetSeverity: 'Ringan'
        }
    });

    await prisma.educationContent.createMany({
        data: [
            {
                title: 'Penyebab dan Dampak Anxiety pada Tubuh',
                description: 'Memahami bagaimana kecemasan memengaruhi fisik kita.',
                source: 'youtube', url: 'https://www.youtube.com/watch?v=2',
                category: 'general', format: 'landscape', targetSeverity: 'Ringan'
            },
            {
                title: 'Mengenal Gejala Anxiety dengan Cepat',
                description: 'Ciri-ciri fisik dan psikologis saat cemas melanda.',
                source: 'youtube', url: 'https://www.youtube.com/watch?v=3',
                category: 'general', format: 'vertical', targetSeverity: 'Ringan'
            }
        ]
    });

    // 3. MODERATE ANXIETY (Sedang)
    await prisma.breathingTechnique.create({
        data: {
            name: 'Resonance Breathing (6x per menit)',
            description: 'Tarik 5 detik, hembuskan 5 detik. Menyeimbangkan sistem saraf otonom dan meningkatkan Heart Rate Variability (HRV).',
            inhaleDuration: 5, holdDuration: 0, exhaleDuration: 5, holdAfterExhale: 0, cycles: 6,
            targetSeverity: 'Sedang', colorTheme: '#FFB74D', icon: 'pulse'
        }
    });

    await prisma.meditationSession.create({
        data: {
            title: 'Body Scan Meditation (Night Session)',
            description: 'Menurunkan kecemasan somatik dan ketegangan otot. Sangat direkomendasikan meredakan overthinking malam hari.',
            category: 'sleep', durationOptions: [15, 20],
            targetSeverity: 'Sedang', colorTheme: '#4DB6AC'
        }
    });

    await prisma.audioContent.create({
        data: {
            title: 'Audio Spiritual Murottal',
            description: 'Terapi murottal Al-Quran untuk menurunkan ketegangan psikofisiologis.',
            fileUrl: '/uploads/dummy-murottal.mp3', category: 'nature',
            targetSeverity: 'Sedang'
        }
    });

    await prisma.educationContent.createMany({
        data: [
            {
                title: 'Cara Efektif Meredakan Kecemasan',
                description: 'Langkah praktis meredakan serangan kecemasan sedang.',
                source: 'youtube', url: 'https://www.youtube.com/watch?v=4',
                category: 'general', format: 'landscape', targetSeverity: 'Sedang'
            },
            {
                title: 'Tips Cepat Meredakan Cemas',
                description: 'Tips singkat menghadapi rasa cemas berlebih.',
                source: 'youtube', url: 'https://www.youtube.com/watch?v=5',
                category: 'general', format: 'vertical', targetSeverity: 'Sedang'
            }
        ]
    });

    // 4. SEVERE ANXIETY (Berat)
    await prisma.breathingTechnique.create({
        data: {
            name: 'Box Breathing',
            description: 'Tarik 4s, Tahan 4s, Keluar 4s, Tahan 4s. Melatih konsentrasi kognitif dan meredakan ketegangan ekstrem.',
            inhaleDuration: 4, holdDuration: 4, exhaleDuration: 4, holdAfterExhale: 4, cycles: 5,
            targetSeverity: 'Berat', colorTheme: '#E57373', icon: 'square'
        }
    });
    
    await prisma.breathingTechnique.create({
        data: {
            name: 'Brief Breathing Intervention',
            description: 'Intervensi sangat singkat (1-3 menit) untuk meredakan state anxiety secara instan.',
            inhaleDuration: 3, holdDuration: 0, exhaleDuration: 3, holdAfterExhale: 0, cycles: 10,
            targetSeverity: 'Berat', colorTheme: '#F06292', icon: 'flash'
        }
    });

    await prisma.meditationSession.create({
        data: {
            title: 'CBT-Based Meditation for Racing Thoughts',
            description: 'Meditasi berbasis CBT untuk meredakan pikiran berpacu (racing thoughts) dan keparahan kecemasan.',
            category: 'anxiety', durationOptions: [5, 10],
            targetSeverity: 'Berat', colorTheme: '#F44336'
        }
    });

    await prisma.educationContent.create({
        data: {
            title: 'Kecemasan Berlebih: Kapan Harus ke Psikolog?',
            description: 'PANDUAN DARURAT: Memahami tanda-tanda kapan Anda wajib berkonsultasi dengan psikolog atau tenaga medis profesional demi keselamatan.',
            source: 'youtube', url: 'https://www.youtube.com/watch?v=6',
            category: 'anxiety', format: 'landscape',
            targetSeverity: 'Berat'
        }
    });

    console.log('Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
