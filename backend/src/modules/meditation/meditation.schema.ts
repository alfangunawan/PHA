import { z } from 'zod';

const categoryEnum = z.enum(['sleep', 'focus', 'anxiety', 'morning', 'general']);

export const saveMeditationLogSchema = z.object({
    body: z.object({
        sessionId: z.string().uuid('Invalid session ID'),
        duration: z.number().int().min(0),
        completed: z.boolean().default(false),
    }),
});

export const getMeditationSessionsSchema = z.object({
    query: z.object({
        category: categoryEnum.optional(),
    }),
});

export const createSessionSchema = z.object({
    body: z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        category: categoryEnum.default('general'),
        audioUrl: z.string().url().optional(),
        thumbnailUrl: z.string().url().optional(),
        durationOptions: z.array(z.string()),
        colorTheme: z.string().optional(),
    }),
});
