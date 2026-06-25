import { z } from 'zod';

export const journalIdParamSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
});

export const createJournalSchema = z.object({
    body: z.object({
        title: z.string().max(120).optional(),
        content: z.string().min(1).max(5000),
    }),
});

export const updateJournalSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        title: z.string().max(120).optional(),
        content: z.string().min(1).max(5000),
    }),
});
