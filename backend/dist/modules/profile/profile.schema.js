"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        displayName: zod_1.z.string().min(1, 'Display name cannot be empty').optional(),
        age: zod_1.z.number().int().positive('Age must be a positive integer').optional(),
        gender: zod_1.z.enum(['Laki-laki', 'Perempuan', 'Lainnya']).optional(),
        bio: zod_1.z.string().max(500, 'Bio too long').optional(),
    }),
});
