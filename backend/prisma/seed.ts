import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Breathing techniques
    await prisma.breathingTechnique.createMany({
        data: [
            {
                name: '4-7-8 Breathing',
                description: 'Inhale 4s, hold 7s, exhale 8s. Reduces anxiety and helps sleep.',
                inhaleDuration: 4,
                holdDuration: 7,
                exhaleDuration: 8,
                holdAfterExhale: 0,
                cycles: 4,
                colorTheme: '#A8C5DA',
                icon: 'moon',
            },
            {
                name: 'Box Breathing',
                description: 'Equal 4-count inhale, hold, exhale, hold. Used by Navy SEALs.',
                inhaleDuration: 4,
                holdDuration: 4,
                exhaleDuration: 4,
                holdAfterExhale: 4,
                cycles: 4,
                colorTheme: '#B8D8B8',
                icon: 'square',
            },
            {
                name: 'Deep Breathing',
                description: 'Simple deep belly breathing for immediate calm.',
                inhaleDuration: 5,
                holdDuration: 0,
                exhaleDuration: 5,
                holdAfterExhale: 0,
                cycles: 6,
                colorTheme: '#D4B8E0',
                icon: 'wind',
            },
            {
                name: 'Resonance Breathing',
                description: '5-5 breathing at 6 breaths/min. Maximizes heart rate variability.',
                inhaleDuration: 5,
                holdDuration: 0,
                exhaleDuration: 5,
                holdAfterExhale: 0,
                cycles: 6,
                colorTheme: '#F5C6A0',
                icon: 'heart',
            },
        ],
        skipDuplicates: true,
    });

    // Meditation sessions
    await prisma.meditationSession.createMany({
        data: [
            {
                title: 'Tidur Nyenyak',
                description: 'Meditasi 10 menit untuk membantu kamu tidur lebih cepat dan nyenyak.',
                category: 'sleep',
                durationOptions: ['10', '15', '20'],
                colorTheme: '#1a1a2e',
            },
            {
                title: 'Fokus Kerja',
                description: 'Tingkatkan konsentrasi dan produktivitas dengan meditasi singkat ini.',
                category: 'focus',
                durationOptions: ['5', '10', '15'],
                colorTheme: '#2d4a7a',
            },
            {
                title: 'Redakan Kecemasan',
                description: 'Teknik grounding untuk menenangkan pikiran yang cemas.',
                category: 'anxiety',
                durationOptions: ['5', '10', '15'],
                colorTheme: '#4a7a5d',
            },
            {
                title: 'Semangat Pagi',
                description: 'Mulai harimu dengan energi positif dan niat yang kuat.',
                category: 'morning',
                durationOptions: ['5', '10'],
                colorTheme: '#7a5d2d',
            },
            {
                title: 'Meditasi Umum',
                description: 'Sesi meditasi fleksibel untuk kapan saja kamu membutuhkannya.',
                category: 'general',
                durationOptions: ['5', '10', '15', '20'],
                colorTheme: '#5d2d7a',
            },
        ],
        skipDuplicates: true,
    });

    // Education contents
    await prisma.educationContent.createMany({
        data: [
            {
                title: 'Apa itu Kesehatan Mental?',
                description: 'Penjelasan dasar tentang kesehatan mental dan mengapa penting.',
                source: 'youtube',
                url: 'https://www.youtube.com/watch?v=example1',
                category: 'dasar',
                tags: ['kesehatan mental', 'dasar', 'edukasi'],
            },
            {
                title: 'Teknik Manajemen Stres',
                description: '5 teknik efektif untuk mengelola stres sehari-hari.',
                source: 'youtube',
                url: 'https://www.youtube.com/watch?v=example2',
                category: 'stres',
                tags: ['stres', 'manajemen', 'tips'],
            },
            {
                title: 'Mindfulness dalam 5 Menit',
                description: 'Praktik mindfulness singkat yang bisa dilakukan di mana saja.',
                source: 'youtube',
                url: 'https://www.youtube.com/watch?v=example3',
                category: 'mindfulness',
                tags: ['mindfulness', 'meditasi', 'singkat'],
            },
            {
                title: 'Tidur Berkualitas untuk Kesehatan Mental',
                description: 'Hubungan antara kualitas tidur dan kesehatan mental.',
                source: 'youtube',
                url: 'https://www.youtube.com/watch?v=example4',
                category: 'tidur',
                tags: ['tidur', 'kesehatan', 'mental'],
            },
            {
                title: 'Olahraga dan Kesehatan Mental',
                description: 'Bagaimana aktivitas fisik mempengaruhi mood dan kesehatan mental.',
                source: 'youtube',
                url: 'https://www.youtube.com/watch?v=example5',
                category: 'gaya hidup',
                tags: ['olahraga', 'mood', 'aktivitas fisik'],
            },
        ],
        skipDuplicates: true,
    });

    console.log('Seed complete.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
