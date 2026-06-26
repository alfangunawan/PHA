"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitGad7 = exports.createNewSession = exports.getLatestGad7ForUser = exports.getSessionMessages = exports.getSessions = exports.getHistory = exports.streamMessage = exports.sendMessage = void 0;
const prisma_1 = require("../../config/prisma");
const profile_service_1 = require("../profile/profile.service");
const N8N_BASE_URL = 'https://n8n.alstore.space';
// ─────────────────────────────────────────────────────────────────────────────
// Chat (routed through n8n)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Sends a user message to n8n webhook.
 * n8n handles: user upsert, history fetch, GAD-7 signal tracking,
 * CBT phase routing, Gemini call, and conversation persistence.
 * The backend does NOT duplicate messages into Prisma — n8n owns the conversations table.
 */
const sendMessage = (userId, message, sessionId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const webhookUrl = `${N8N_BASE_URL}/webhook/pha-chat`;
    // Fetch display name so n8n uses the real name instead of the UUID
    const profile = yield (0, profile_service_1.getProfile)(userId).catch(() => null);
    const userName = (_a = profile === null || profile === void 0 ? void 0 : profile.displayName) !== null && _a !== void 0 ? _a : userId;
    try {
        console.log(`[n8n] Sending message for user ${userId} (${userName})`);
        const response = yield fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-PHA-Key': (_b = process.env.PHA_WEBHOOK_SECRET) !== null && _b !== void 0 ? _b : '',
            },
            // n8n Validasi Input node reads: body.user_id, body.message, body.name, body.session_id
            body: JSON.stringify(Object.assign({ user_id: userId, message, name: userName }, (sessionId ? { session_id: sessionId } : {}))),
        });
        if (!response.ok) {
            const errText = yield response.text();
            throw new Error(`n8n responded with ${response.status}: ${errText}`);
        }
        const raw = yield response.json();
        console.log(`[n8n] Response action: ${raw === null || raw === void 0 ? void 0 : raw.action}`);
        // n8n always returns: { status, action, data: { message, cbt_phase, is_crisis, gad7? } }
        return {
            action: (_c = raw === null || raw === void 0 ? void 0 : raw.action) !== null && _c !== void 0 ? _c : 'chat_response',
            data: {
                message: (_e = (_d = raw === null || raw === void 0 ? void 0 : raw.data) === null || _d === void 0 ? void 0 : _d.message) !== null && _e !== void 0 ? _e : 'Maaf, tidak ada respons.',
                cbt_phase: (_g = (_f = raw === null || raw === void 0 ? void 0 : raw.data) === null || _f === void 0 ? void 0 : _f.cbt_phase) !== null && _g !== void 0 ? _g : null,
                is_crisis: (_j = (_h = raw === null || raw === void 0 ? void 0 : raw.data) === null || _h === void 0 ? void 0 : _h.is_crisis) !== null && _j !== void 0 ? _j : false,
                gad7: (_l = (_k = raw === null || raw === void 0 ? void 0 : raw.data) === null || _k === void 0 ? void 0 : _k.gad7) !== null && _l !== void 0 ? _l : null,
            },
        };
    }
    catch (error) {
        console.error('[n8n] Webhook Error:', error.message);
        return {
            action: 'chat_response',
            data: {
                message: 'Maaf, saya sedang mengalami gangguan komunikasi. Bisa ulangi lagi?',
                cbt_phase: null,
                is_crisis: false,
                gad7: null,
            },
        };
    }
});
exports.sendMessage = sendMessage;
/**
 * Wraps sendMessage for SSE stream endpoints.
 * Since n8n doesn't support streaming, we call the full webhook
 * then emit the response word-by-word to simulate streaming.
 */
const streamMessage = (userId, message, sessionId, onChunk) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, exports.sendMessage)(userId, message, sessionId);
    const fullText = result.data.message;
    // Simulate streaming: emit word by word with small delay
    const words = fullText.split(' ');
    for (const word of words) {
        onChunk(word + ' ');
        yield new Promise(r => setTimeout(r, 25));
    }
    return result;
});
exports.streamMessage = streamMessage;
// ─────────────────────────────────────────────────────────────────────────────
// History — queries n8n's conversations table directly (raw SQL)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns the full conversation history for a user from n8n's conversations table.
 */
const getHistory = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rows = yield prisma_1.prisma.$queryRaw `
            SELECT id, user_id, session_id, role, content, cbt_phase, created_at
            FROM conversations
            WHERE user_id = ${userId}
            ORDER BY created_at ASC
            LIMIT 100
        `;
        return rows;
    }
    catch (e) {
        console.error('[getHistory] Raw query failed:', e.message);
        return [];
    }
});
exports.getHistory = getHistory;
/**
 * Returns distinct chat sessions for a user from the conversations table.
 */
const getSessions = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rows = yield prisma_1.prisma.$queryRaw `
            SELECT
                session_id,
                MIN(created_at) AS started_at,
                MAX(created_at) AS last_message_at,
                COUNT(*) AS message_count,
                (
                    SELECT content FROM conversations c2
                    WHERE c2.session_id = c1.session_id AND c2.user_id = ${userId}
                    ORDER BY created_at ASC LIMIT 1
                ) AS first_message
            FROM conversations c1
            WHERE user_id = ${userId}
            GROUP BY session_id
            ORDER BY last_message_at DESC
        `;
        return rows.map(r => {
            var _a;
            return ({
                id: r.session_id,
                startedAt: r.started_at,
                lastMessageAt: r.last_message_at,
                messageCount: Number(r.message_count),
                preview: ((_a = r.first_message) === null || _a === void 0 ? void 0 : _a.substring(0, 80)) || 'Empty chat',
            });
        });
    }
    catch (e) {
        console.error('[getSessions] Raw query failed:', e.message);
        return [];
    }
});
exports.getSessions = getSessions;
/**
 * Returns all messages for a specific session belonging to a user.
 */
const getSessionMessages = (userId, sessionId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rows = yield prisma_1.prisma.$queryRaw `
            SELECT id, user_id, session_id, role, content, cbt_phase, created_at
            FROM conversations
            WHERE user_id = ${userId} AND session_id = ${sessionId}
            ORDER BY created_at ASC
        `;
        return rows;
    }
    catch (e) {
        console.error('[getSessionMessages] Raw query failed:', e.message);
        return [];
    }
});
exports.getSessionMessages = getSessionMessages;
/**
 * Returns the latest GAD-7 screening result for a user from pha_db.
 */
const getLatestGad7ForUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const gad7Result = prisma_1.prisma.gad7Result;
    return gad7Result.findFirst({
        where: { userId },
        orderBy: { takenAt: 'desc' },
        select: {
            score: true,
            severity: true,
            takenAt: true,
        },
    });
});
exports.getLatestGad7ForUser = getLatestGad7ForUser;
/**
 * Creates a new session token. Since n8n manages sessions implicitly
 * (session_id = user_id by default, or provided by client), we just
 * return a new UUID the frontend can use as session_id in future messages.
 */
const createNewSession = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const sessionId = crypto.randomUUID();
    return { id: sessionId, userId, startedAt: new Date().toISOString() };
});
exports.createNewSession = createNewSession;
// ─────────────────────────────────────────────────────────────────────────────
// GAD-7 Submission
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Forwards GAD-7 answers to n8n for scoring and persistence.
 * n8n saves the result to the gad7_results table.
 */
const submitGad7 = (userId, _sessionId, answers) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const webhookUrl = `${N8N_BASE_URL}/webhook/pha-gad7-submit`;
    const response = yield fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-PHA-Key': (_a = process.env.PHA_WEBHOOK_SECRET) !== null && _a !== void 0 ? _a : '',
        },
        // n8n Hitung Skor GAD-7 reads: body.user_id and body.answers
        body: JSON.stringify({ user_id: userId, answers }),
    });
    if (!response.ok) {
        const errText = yield response.text();
        throw new Error(`n8n GAD-7 webhook failed (${response.status}): ${errText}`);
    }
    const data = yield response.json();
    return {
        action: (_b = data === null || data === void 0 ? void 0 : data.action) !== null && _b !== void 0 ? _b : 'gad7_saved',
        data: {
            score: (_d = (_c = data === null || data === void 0 ? void 0 : data.data) === null || _c === void 0 ? void 0 : _c.score) !== null && _d !== void 0 ? _d : 0,
            severity: (_f = (_e = data === null || data === void 0 ? void 0 : data.data) === null || _e === void 0 ? void 0 : _e.severity) !== null && _f !== void 0 ? _f : 'unknown',
            message: (_h = (_g = data === null || data === void 0 ? void 0 : data.data) === null || _g === void 0 ? void 0 : _g.message) !== null && _h !== void 0 ? _h : 'Terima kasih sudah menjawab.',
        },
    };
});
exports.submitGad7 = submitGad7;
