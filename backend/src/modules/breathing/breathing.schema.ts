import { z } from 'zod';

export const saveBreathingLogSchema = z.object({
    body: z.object({
        techniqueId: z.string().uuid('Invalid technique ID'),
        duration: z.number().int().positive('Duration must be positive'),
        cyclesCompleted: z.number().int().min(0).optional(),
    }),
});

export const createTechniqueSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name required'),
        description: z.string().optional(),
        inhaleDuration: z.number().int().positive(),
        holdDuration: z.number().int().min(0).default(0),
        exhaleDuration: z.number().int().positive(),
        holdAfterExhale: z.number().int().min(0).default(0),
        cycles: z.number().int().positive().default(4),
        colorTheme: z.string().optional(),
        icon: z.string().optional(),
    }),
});
