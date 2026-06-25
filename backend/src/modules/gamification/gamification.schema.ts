import { z } from 'zod';
import { ActivityType } from '@prisma/client';

export const updateRewardRuleSchema = z.object({
    params: z.object({
        activityType: z.nativeEnum(ActivityType),
    }),
    body: z.object({
        xp: z.number().int().min(0).max(10000),
        points: z.number().int().min(0).max(10000),
        isActive: z.boolean(),
    }),
});
