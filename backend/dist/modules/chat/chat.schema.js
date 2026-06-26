"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitGad7Schema = exports.getLatestGad7Schema = exports.getSessionMessagesSchema = exports.sendMessageSchema = void 0;
const zod_1 = require("zod");
exports.sendMessageSchema = zod_1.z.object({
    body: zod_1.z.object({
        message: zod_1.z.string().min(1, 'Message is required').max(2000, 'Message too long'),
        sessionId: zod_1.z.string().min(1).max(128).optional(),
    }),
});
// sessionId can be any string — n8n uses user_id as session_id by default,
// so it's not always a UUID
exports.getSessionMessagesSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().min(1, 'Session ID is required'),
    }),
});
exports.getLatestGad7Schema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'User ID is required'),
    }),
});
exports.submitGad7Schema = zod_1.z.object({
    body: zod_1.z.object({
        sessionId: zod_1.z.string().min(1, 'Session ID is required'),
        answers: zod_1.z
            .array(zod_1.z.number().int().min(0).max(3))
            .length(7, 'GAD-7 requires exactly 7 answers (0–3 each)'),
    }),
});
