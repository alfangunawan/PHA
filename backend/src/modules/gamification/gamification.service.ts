import { ActivityType, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

const defaultRewardRules: Array<{ activityType: ActivityType; xp: number; points: number }> = [
    { activityType: ActivityType.BREATHING, xp: 10, points: 5 },
    { activityType: ActivityType.MEDITATION, xp: 15, points: 8 },
    { activityType: ActivityType.EDUCATION_CONTENT, xp: 8, points: 4 },
    { activityType: ActivityType.AUDIO_CONTENT, xp: 8, points: 4 },
    { activityType: ActivityType.JOURNAL_ENTRY, xp: 12, points: 6 },
    { activityType: ActivityType.WORD_PUZZLE, xp: 10, points: 5 },
    { activityType: ActivityType.TETRIS, xp: 10, points: 5 },
];

const calculateLevel = (xp: number) => Math.floor(xp / 100) + 1;

export const ensureDefaultRewardRules = async () => {
    await Promise.all(defaultRewardRules.map(rule =>
        prisma.rewardRule.upsert({
            where: { activityType: rule.activityType },
            update: {},
            create: rule,
        }),
    ));
};

export const getRules = async () => {
    await ensureDefaultRewardRules();
    return prisma.rewardRule.findMany({ orderBy: { activityType: 'asc' } });
};

export const updateRule = async (activityType: ActivityType, data: { xp: number; points: number; isActive: boolean }, adminId?: string) => {
    return prisma.rewardRule.upsert({
        where: { activityType },
        update: { xp: data.xp, points: data.points, isActive: data.isActive, createdByAdminId: adminId },
        create: { activityType, xp: data.xp, points: data.points, isActive: data.isActive, createdByAdminId: adminId },
    });
};

export const getUserSummary = async (userId: string) => {
    const [summary, recentEvents] = await Promise.all([
        prisma.userGamification.upsert({
            where: { userId },
            update: {},
            create: { userId },
        }),
        prisma.rewardEvent.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
        }),
    ]);

    return { summary, recentEvents };
};

export const awardReward = async (
    userId: string,
    activityType: ActivityType,
    sourceId: string,
    metadata?: Prisma.InputJsonValue,
) => {
    await ensureDefaultRewardRules();
    const rule = await prisma.rewardRule.findUnique({ where: { activityType } });
    if (!rule || !rule.isActive || (rule.xp === 0 && rule.points === 0)) {
        const summary = await prisma.userGamification.upsert({ where: { userId }, update: {}, create: { userId } });
        return { awarded: false, duplicate: false, event: null, summary };
    }

    const idempotencyKey = `${userId}:${activityType}:${sourceId}`;

    try {
        const result = await prisma.$transaction(async tx => {
            const event = await tx.rewardEvent.create({
                data: { userId, activityType, sourceId, idempotencyKey, xp: rule.xp, points: rule.points, metadata },
            });

            const current = await tx.userGamification.upsert({
                where: { userId },
                update: {
                    xp: { increment: rule.xp },
                    points: { increment: rule.points },
                },
                create: {
                    userId,
                    xp: rule.xp,
                    points: rule.points,
                    level: calculateLevel(rule.xp),
                },
            });

            const level = calculateLevel(current.xp);
            const summary = current.level === level
                ? current
                : await tx.userGamification.update({ where: { userId }, data: { level } });

            return { event, summary };
        });

        return { awarded: true, duplicate: false, ...result };
    } catch (error: any) {
        if (error?.code === 'P2002') {
            const [event, summary] = await Promise.all([
                prisma.rewardEvent.findUnique({ where: { idempotencyKey } }),
                prisma.userGamification.upsert({ where: { userId }, update: {}, create: { userId } }),
            ]);
            return { awarded: false, duplicate: true, event, summary };
        }
        throw error;
    }
};
