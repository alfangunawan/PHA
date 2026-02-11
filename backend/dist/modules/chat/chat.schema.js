"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionMessagesSchema = exports.sendMessageSchema = void 0;
const zod_1 = require("zod");
exports.sendMessageSchema = zod_1.z.object({
    body: zod_1.z.object({
        message: zod_1.z.string().min(1, 'Message is required'),
    }),
});
exports.getSessionMessagesSchema = zod_1.z.object({
    params: zod_1.z.object({
        sessionId: zod_1.z.string().uuid('Invalid session ID'),
    }),
});
