import { z } from 'zod';

export const createAudioSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title required'),
        category: z.string().default('general'),
        duration: z.number().int().positive().optional(),
        description: z.string().optional(),
    }),
});
