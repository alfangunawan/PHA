import { z } from 'zod';

export const startWordPuzzleSchema = z.object({
    body: z.object({
        maxWords: z.number().int().min(1).max(6).optional(),
    }).optional().default({}),
});

export const completeWordPuzzleSchema = z.object({
    params: z.object({ sessionId: z.string().uuid() }),
    body: z.object({
        answers: z.array(z.object({
            id: z.string().min(1),
            answer: z.string().default(''),
        })).default([]),
        durationSec: z.number().int().min(0).max(86400),
    }),
});

export const gameSessionParamSchema = z.object({
    params: z.object({ sessionId: z.string().uuid() }),
});

export const completeTetrisSchema = z.object({
    params: z.object({ sessionId: z.string().uuid() }),
    body: z.object({
        score: z.number().int().min(0).max(1000000),
        lines: z.number().int().min(0).max(10000),
        level: z.number().int().min(1).max(1000),
        durationSec: z.number().int().min(0).max(86400),
    }),
});
