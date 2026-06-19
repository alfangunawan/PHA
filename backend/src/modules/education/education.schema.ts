import { z } from 'zod';

const sourceEnum = z.enum(['youtube', 'tiktok', 'other']);

export const getEducationContentsSchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
        category: z.string().optional(),
        source: sourceEnum.optional(),
    }),
});

export const createEducationContentSchema = z.object({
    body: z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        source: sourceEnum,
        url: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        category: z.string().default('general'),
        tags: z.array(z.string()).optional(),
    }),
});

export const updateEducationContentSchema = z.object({
    body: z.object({
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        source: sourceEnum.optional(),
        url: z.string().url().optional(),
        thumbnailUrl: z.string().url().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
    }),
});
