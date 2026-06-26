import { ActivityType, PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// createMany skipDuplicates is a no-op without a unique constraint, so guard
// inserts by natural key to keep the seed idempotent (re-runnable, no dupes).
async function seedMissing<T extends Record<string, any>>(
    rows: T[],
    key: keyof T,
    existing: () => Promise<{ [k: string]: any }[]>,
    create: (data: T[]) => Promise<unknown>,
) {
    const have = new Set((await existing()).map((r) => r[key as string]));
    const toCreate = rows.filter((r) => !have.has(r[key]));
    if (toCreate.length) await create(toCreate);
}

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@pha.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminHash = await bcrypt.hash(adminPassword, 10);

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            passwordHash: adminHash,
            role: Role.ADMIN,
            profile: {
                upsert: {
                    update: { displayName: 'Admin' },
                    create: { displayName: 'Admin', language: 'id' },
                },
            },
        },
        create: {
            email: adminEmail,
            passwordHash: adminHash,
            role: Role.ADMIN,
            profile: { create: { displayName: 'Admin', language: 'id' } },
        },
    });

    // Consolidate any legacy split-admin accounts to unified ADMIN role
    await prisma.user.updateMany({
        where: { role: { in: [Role.GAMIFICATION_ADMIN, Role.MINDFULNESS_ADMIN] } },
        data: { role: Role.ADMIN },
    });

    const rewardRules = [
        { activityType: ActivityType.BREATHING, xp: 10, points: 5 },
        { activityType: ActivityType.MEDITATION, xp: 15, points: 8 },
        { activityType: ActivityType.EDUCATION_CONTENT, xp: 8, points: 4 },
        { activityType: ActivityType.AUDIO_CONTENT, xp: 8, points: 4 },
        { activityType: ActivityType.JOURNAL_ENTRY, xp: 12, points: 6 },
        { activityType: ActivityType.WORD_PUZZLE, xp: 10, points: 5 },
        { activityType: ActivityType.TETRIS, xp: 10, points: 5 },
    ];

    for (const rule of rewardRules) {
        await prisma.rewardRule.upsert({
            where: { activityType: rule.activityType },
            update: {},
            create: rule,
        });
    }

    // Breathing techniques
    const breathingTechniques = [
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
    ];

    await seedMissing(
        breathingTechniques,
        'name',
        () => prisma.breathingTechnique.findMany({ select: { name: true } }),
        (data) => prisma.breathingTechnique.createMany({ data }),
    );

    // Meditation sessions. audioUrl stored as relative path; frontend resolves
    // against API base URL so it stays correct across LAN IP / ngrok hosts.
    const meditationSessions = [
        {
            title: 'Tidur Nyenyak',
            description: 'Meditasi 10 menit untuk membantu kamu tidur lebih cepat dan nyenyak.',
            category: 'sleep' as const,
            durationOptions: ['10', '15', '20'],
            colorTheme: '#1a1a2e',
            audioUrl: '/uploads/meditations/meditation1.mp3',
        },
        {
            title: 'Fokus Kerja',
            description: 'Tingkatkan konsentrasi dan produktivitas dengan meditasi singkat ini.',
            category: 'focus' as const,
            durationOptions: ['5', '10', '15'],
            colorTheme: '#2d4a7a',
            audioUrl: '/uploads/meditations/meditation2.mp3',
        },
        {
            title: 'Redakan Kecemasan',
            description: 'Teknik grounding untuk menenangkan pikiran yang cemas.',
            category: 'anxiety' as const,
            durationOptions: ['5', '10', '15'],
            colorTheme: '#4a7a5d',
            audioUrl: '/uploads/meditations/meditation3.mp3',
        },
        {
            title: 'Semangat Pagi',
            description: 'Mulai harimu dengan energi positif dan niat yang kuat.',
            category: 'morning' as const,
            durationOptions: ['5', '10'],
            colorTheme: '#7a5d2d',
            audioUrl: '/uploads/meditations/meditation4.wav',
        },
        {
            title: 'Meditasi Umum',
            description: 'Sesi meditasi fleksibel untuk kapan saja kamu membutuhkannya.',
            category: 'general' as const,
            durationOptions: ['5', '10', '15', '20'],
            colorTheme: '#5d2d7a',
            audioUrl: '/uploads/meditations/meditation1.mp3',
        },
    ];

    await seedMissing(
        meditationSessions,
        'title',
        () => prisma.meditationSession.findMany({ select: { title: true } }),
        (data) => prisma.meditationSession.createMany({ data }),
    );

    // Backfill audioUrl on sessions seeded before audio existed (idempotent).
    for (const s of meditationSessions) {
        await prisma.meditationSession.updateMany({
            where: { title: s.title },
            data: { audioUrl: s.audioUrl },
        });
    }

    const educationContents = [
        {
            title: 'Apa itu Anxiety? Memahami Kecemasan Dasar',
            description: 'Penjelasan komprehensif tentang pengertian anxiety, penyebab, dan bagaimana pengaruhnya terhadap kondisi mental.',
            source: 'youtube' as const,
            url: 'https://www.youtube.com/watch?v=A3uIr2F2Ono',
            category: 'anxiety',
            tags: ['pengertian', 'anxiety', 'dasar'],
        },
        {
            title: 'Mengenal Gejala Anxiety dengan Cepat',
            description: 'Video singkat untuk mengenali tanda-tanda dan gejala awal munculnya rasa cemas berlebih pada diri sendiri.',
            source: 'youtube' as const,
            url: 'https://www.youtube.com/shorts/HmXQmdwyoas',
            category: 'anxiety',
            tags: ['gejala', 'shorts', 'anxiety'],
        },
        {
            title: 'Penyebab dan Dampak Anxiety pada Tubuh',
            description: 'Mengulas lebih dalam mengenai faktor-faktor pemicu anxiety dan bagaimana dampaknya secara fisik maupun psikologis.',
            source: 'youtube' as const,
            url: 'https://www.youtube.com/watch?v=CexDxOtHvnY',
            category: 'anxiety',
            tags: ['penyebab', 'dampak', 'fisik'],
        },
        {
            title: 'Tips Cepat Meredakan Cemas (Shorts)',
            description: 'Trik dan metode singkat yang bisa langsung dipraktikkan ketika serangan rasa cemas mulai datang.',
            source: 'youtube' as const,
            url: 'https://www.youtube.com/shorts/aLmmR-Od7uk',
            category: 'mindfulness',
            tags: ['tips', 'shorts', 'meredakan'],
        },
        {
            title: 'Animasi: Hidup dengan Anxiety Disorder',
            description: 'Visualisasi animasi yang menggambarkan bagaimana rasanya hidup berdampingan dengan gangguan kecemasan setiap hari.',
            source: 'youtube' as const,
            url: 'https://www.youtube.com/watch?v=NYzowu-EaPY',
            category: 'anxiety',
            tags: ['animasi', 'hidup', 'disorder'],
        },
        {
            title: 'Animasi: Cara Pikiran Merespons Kecemasan',
            description: 'Memahami cara kerja otak dan pikiran dalam merespons ancaman atau kecemasan lewat ilustrasi animasi.',
            source: 'youtube' as const,
            url: 'https://www.youtube.com/watch?v=HaCLLNc9Ma4',
            category: 'edukasi',
            tags: ['animasi', 'otak', 'respons'],
        },
        {
            title: 'Animasi: Berdamai dengan Rasa Takut',
            description: 'Langkah-langkah berdamai dengan rasa takut dan cemas yang diilustrasikan secara emosional dan menyentuh.',
            source: 'youtube' as const,
            url: 'https://www.youtube.com/watch?v=43fyNh3Bk4c',
            category: 'mindfulness',
            tags: ['animasi', 'berdamai', 'takut'],
        },
        {
            title: 'Animasi: Memahami Serangan Panik (Panic Attack)',
            description: 'Penjelasan melalui animasi mengenai apa yang sebenarnya terjadi pada tubuh saat mengalami serangan panik.',
            source: 'youtube' as const,
            url: 'https://www.youtube.com/watch?v=sbtQp7C1MDs',
            category: 'anxiety',
            tags: ['animasi', 'panic attack', 'serangan panik'],
        },
        {
            title: 'Fakta Singkat Tentang Anxiety',
            description: 'Kumpulan fakta singkat yang wajib kamu tahu mengenai anxiety dan dampaknya pada tubuh.',
            source: 'youtube' as const,
            url: 'https://www.youtube.com/shorts/FJf25Kj1I9M',
            category: 'anxiety',
            tags: ['fakta', 'shorts', 'anxiety'],
        },
        {
            title: 'Mengenal Kecemasan: Penyebab dan Penanganannya',
            description: 'Pembahasan mendalam tentang apa itu kecemasan, apa saja pemicunya, serta bagaimana penanganan psikologisnya.',
            source: 'youtube' as const,
            url: 'https://www.youtube.com/watch?v=0xV-gpKYv3k',
            category: 'edukasi',
            tags: ['kecemasan', 'penyebab', 'penanganan'],
        },
        {
            title: 'Trik Cepat Menghilangkan Panik (Shorts)',
            description: 'Cobalah trik psikologis cepat ini saat kamu merasa serangan panik mulai datang.',
            source: 'youtube' as const,
            url: 'https://www.youtube.com/shorts/lgE18ir2DTI?feature=share',
            category: 'mindfulness',
            tags: ['trik', 'panik', 'shorts'],
        },
        {
            title: 'Apakah Kamu Mengalami Anxiety? Kenali Tanda Ini',
            description: 'Jangan abaikan! Ini adalah tanda-tanda kecil bahwa kamu mungkin sedang mengalami anxiety tersembunyi.',
            source: 'youtube' as const,
            url: 'https://www.youtube.com/shorts/PKZznhe2hl0',
            category: 'anxiety',
            tags: ['tanda', 'anxiety', 'shorts'],
        },
        {
            title: 'Kecemasan Berlebih: Kapan Harus ke Psikolog?',
            description: 'Mengetahui batasan antara kecemasan normal dan gangguan kecemasan yang memerlukan bantuan profesional.',
            source: 'youtube' as const,
            url: 'https://www.youtube.com/watch?v=PaiBtUZ0C3Y',
            category: 'psikologi',
            tags: ['psikolog', 'kecemasan', 'mental'],
        },
        {
            title: 'Cara Efektif Meredakan Kecemasan (Anxiety Relief)',
            description: 'Metode-metode yang terbukti efektif secara klinis untuk menurunkan tingkat kecemasan harian Anda.',
            source: 'youtube' as const,
            url: 'https://www.youtube.com/watch?v=abajYksqvJI',
            category: 'mindfulness',
            tags: ['meredakan', 'kecemasan', 'efektif'],
        },
        {
            title: 'Latihan Pernapasan Praktis Saat Cemas (Shorts)',
            description: 'Ikuti instruksi pernapasan singkat ini untuk langsung menurunkan detak jantung dan merasa lebih tenang.',
            source: 'youtube' as const,
            url: 'https://www.youtube.com/shorts/7ktizD_u7wk',
            category: 'napas',
            tags: ['napas', 'praktis', 'shorts'],
        },
    ];

    await seedMissing(
        educationContents,
        'title',
        () => prisma.educationContent.findMany({ select: { title: true } }),
        (data) => prisma.educationContent.createMany({ data }),
    );

    console.log('Seed complete.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
