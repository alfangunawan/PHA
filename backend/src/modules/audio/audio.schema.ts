import { z } from 'zod';

export const createAudioSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title required'),
        category: z.string().default('general'),
        duration: z.number().int().positive().optional(),
        description: z.string().optional(),
    }),
});

export const saveAudioLogSchema = z.object({
    body: z.object({
        audioId: z.string().uuid('Invalid audio ID'),
        duration: z.number().int().min(0, 'Duration must be >= 0'),
        completed: z.boolean().default(false),
    }),
});
