import { z } from 'zod';

export const sendMessageSchema = z.object({
    body: z.object({
        message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
    }),
});

// sessionId can be any string — n8n uses user_id as session_id by default,
// so it's not always a UUID
export const getSessionMessagesSchema = z.object({
    params: z.object({
        sessionId: z.string().min(1, 'Session ID is required'),
    }),
});

export const submitGad7Schema = z.object({
    body: z.object({
        sessionId: z.string().min(1, 'Session ID is required'),
        answers: z
            .array(z.number().int().min(0).max(3))
            .length(7, 'GAD-7 requires exactly 7 answers (0–3 each)'),
    }),
});
