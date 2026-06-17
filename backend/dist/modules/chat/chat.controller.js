"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.submitGad7 = exports.createNewSession = exports.getSessionMessages = exports.getSessions = exports.getHistory = exports.streamMessage = exports.sendMessage = void 0;
const ChatService = __importStar(require("./chat.service"));
// ─────────────────────────────────────────────────────────────────────────────
// Chat
// ─────────────────────────────────────────────────────────────────────────────
/**
 * POST /chat/send
 * Sends a message to n8n and returns the full response including:
 * - action: "chat_response" | "chat_with_gad7"
 * - data.message: AI reply text
 * - data.cbt_phase: current CBT phase
 * - data.is_crisis: crisis flag
 * - data.gad7: form data when GAD-7 should be shown (null otherwise)
 */
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { message } = req.body;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const result = yield ChatService.sendMessage(userId, message);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.sendMessage = sendMessage;
/**
 * POST /chat/stream
 * SSE stream endpoint — calls n8n and streams the response word-by-word.
 * Sends the full n8n payload (action, cbt_phase, is_crisis, gad7) as the final event.
 */
const streamMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { message } = req.body;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        // Setup SSE Headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const result = yield ChatService.streamMessage(userId, message, (chunk) => {
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        });
        // Final event carries the full structured payload (action, gad7, etc.)
        res.write(`data: ${JSON.stringify(Object.assign({ done: true }, result))}\n\n`);
        res.end();
    }
    catch (error) {
        console.error('Stream Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.end();
        }
    }
});
exports.streamMessage = streamMessage;
// ─────────────────────────────────────────────────────────────────────────────
// History (from n8n's conversations table)
// ─────────────────────────────────────────────────────────────────────────────
const getHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const history = yield ChatService.getHistory(userId);
        res.json(history);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getHistory = getHistory;
const getSessions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const sessions = yield ChatService.getSessions(userId);
        res.json(sessions);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getSessions = getSessions;
const getSessionMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { sessionId } = req.params;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const messages = yield ChatService.getSessionMessages(userId, sessionId);
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getSessionMessages = getSessionMessages;
const createNewSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const session = yield ChatService.createNewSession(userId);
        res.json(session);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.createNewSession = createNewSession;
// ─────────────────────────────────────────────────────────────────────────────
// GAD-7
// ─────────────────────────────────────────────────────────────────────────────
/**
 * POST /chat/gad7/submit
 * Forwards GAD-7 answers to n8n for scoring and persistence.
 * Returns: { action, data: { score, severity, message } }
 */
const submitGad7 = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { sessionId, answers } = req.body;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const result = yield ChatService.submitGad7(userId, sessionId, answers);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.submitGad7 = submitGad7;
