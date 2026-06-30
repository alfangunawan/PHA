import { prisma } from '../../config/prisma';

// Severity values yang valid dari GAD-7
const VALID_SEVERITIES = ['Minimal', 'Ringan', 'Sedang', 'Berat'];

/**
 * Ambil hasil GAD-7 terakhir milik user.
 * Return null jika user belum pernah mengerjakan GAD-7.
 */
export const getLastGad7 = async (userId: string) => {
    return prisma.gad7Result.findFirst({
        where: { userId },
        orderBy: { takenAt: 'desc' },
    });
};

/**
 * Ambil rekomendasi konten mindfulness berdasarkan severity GAD-7 terakhir user.
 *
 * Logika filter (strict / exact match):
 *   - Jika user SUDAH pernah GAD-7 → hanya tampilkan konten dengan targetSeverity === severity user
 *   - Jika user BELUM pernah GAD-7 → kembalikan list kosong + flag hasTakenGad7: false
 *     agar frontend dapat menampilkan ajakan mengisi tes GAD-7
 */
export const getRecommendations = async (userId: string) => {
    const gad7 = await getLastGad7(userId);
    const severity = gad7?.severity ?? null;

    // Belum pernah tes — kembalikan kosong dengan flag
    if (!severity) {
        return {
            hasTakenGad7: false,
            severity: null,
            gad7LastTaken: null,
            breathing: [],
            meditation: [],
            audio: [],
            education: [],
        };
    }

    // Exact match: hanya konten yang memang ditujukan untuk severity ini
    const [breathing, meditation, audio, education] = await Promise.all([
        prisma.breathingTechnique.findMany({
            where: { isActive: true, targetSeverity: severity },
            orderBy: { createdAt: 'asc' },
            take: 5,
        }),
        prisma.meditationSession.findMany({
            where: { isActive: true, targetSeverity: severity },
            orderBy: { createdAt: 'asc' },
            take: 5,
        }),
        prisma.audioContent.findMany({
            where: { isActive: true, targetSeverity: severity },
            orderBy: { createdAt: 'desc' },
            take: 5,
        }),
        prisma.educationContent.findMany({
            where: { isActive: true, targetSeverity: severity },
            orderBy: { createdAt: 'desc' },
            take: 5,
        }),
    ]);

    return {
        hasTakenGad7: true,
        severity,
        gad7LastTaken: gad7?.takenAt ?? null,
        breathing,
        meditation,
        audio,
        education,
    };
};

/**
 * Aggregasi data dashboard progress mindfulness user.
 * Menggabungkan log dari 4 sumber: BreathingLog, MeditationLog, AudioLog, EducationContentLog.
 */
export const getDashboard = async (userId: string) => {
    const [breathingLogs, meditationLogs, audioLogs, educationLogs] = await Promise.all([
        prisma.breathingLog.findMany({
            where: { userId },
            include: { technique: { select: { name: true, colorTheme: true } } },
            orderBy: { completedAt: 'desc' },
        }),
        prisma.meditationLog.findMany({
            where: { userId },
            include: { session: { select: { title: true, category: true, colorTheme: true } } },
            orderBy: { completedAt: 'desc' },
        }),
        prisma.audioLog.findMany({
            where: { userId },
            include: { audio: { select: { title: true, category: true } } },
            orderBy: { completedAt: 'desc' },
        }),
        prisma.educationContentLog.findMany({
            where: { userId },
            include: { content: { select: { title: true, category: true } } },
            orderBy: { watchedAt: 'desc' },
        }),
    ]);

    // Normalisasi ke unified format
    const unifiedHistory = [
        ...breathingLogs.map(l => ({
            type: 'breathing' as const,
            title: l.technique?.name ?? 'Pernapasan',
            duration: l.duration,
            completed: true, // BreathingLog selalu dianggap completed
            timestamp: l.completedAt,
            meta: { colorTheme: l.technique?.colorTheme },
        })),
        ...meditationLogs.map(l => ({
            type: 'meditation' as const,
            title: l.session?.title ?? 'Meditasi',
            duration: l.duration,
            completed: l.completed,
            timestamp: l.completedAt,
            meta: { category: l.session?.category, colorTheme: l.session?.colorTheme },
        })),
        ...audioLogs.map(l => ({
            type: 'audio' as const,
            title: l.audio?.title ?? 'Audio',
            duration: l.duration,
            completed: l.completed,
            timestamp: l.completedAt,
            meta: { category: l.audio?.category },
        })),
        ...educationLogs.map(l => ({
            type: 'education' as const,
            title: l.content?.title ?? 'Edukasi',
            duration: 0,
            completed: l.completed,
            timestamp: l.watchedAt,
            meta: { category: l.content?.category },
        })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const totalSessions = unifiedHistory.length;
    const logsWithDuration = unifiedHistory.filter(l => l.duration > 0);
    const totalDurationSec = logsWithDuration.reduce((sum, l) => sum + l.duration, 0);
    const avgDurationSec = logsWithDuration.length > 0
        ? Math.round(totalDurationSec / logsWithDuration.length)
        : 0;

    // Agregat per hari (7 hari terakhir) untuk grafik
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().slice(0, 10); // YYYY-MM-DD
    });

    const sessionsByDay: Record<string, number> = {};
    last7Days.forEach(day => { sessionsByDay[day] = 0; });
    unifiedHistory.forEach(l => {
        const day = l.timestamp.toISOString().slice(0, 10);
        if (day in sessionsByDay) sessionsByDay[day]++;
    });

    const weeklyChart = last7Days.map(day => ({
        date: day,
        count: sessionsByDay[day],
    }));

    return {
        empty: totalSessions === 0,
        totalSessions,
        totalDurationSec,
        avgDurationSec,
        weeklyChart,
        recentHistory: unifiedHistory.slice(0, 30),
    };
};
