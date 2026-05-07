import { z } from 'zod';

export const updateProfileSchema = z.object({
    body: z.object({
        displayName: z.string().min(1, 'Display name cannot be empty').optional(),
        age: z.number().int().positive('Age must be a positive integer').optional(),
        gender: z.enum(['Laki-laki', 'Perempuan', 'Lainnya']).optional(),
        bio: z.string().max(500, 'Bio too long').optional(),
    }),
});
