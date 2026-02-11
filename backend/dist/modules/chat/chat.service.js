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
exports.createNewSession = exports.getSessionMessages = exports.getSessions = exports.getHistory = exports.sendMessage = void 0;
const genai_1 = require("@google/genai");
const client_1 = require("@prisma/client");
const profile_service_1 = require("../profile/profile.service");
// Initialize Gemini API with new SDK
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.warn('GEMINI_API_KEY is not set in environment variables');
}
const ai = new genai_1.GoogleGenAI({ apiKey: API_KEY || '' });
const prisma = new client_1.PrismaClient();
// System instruction for AI personality
const SYSTEM_INSTRUCTION = `Kamu adalah Personal Health Assistant (PHA), asisten AI yang suportif dan empatik untuk kesehatan mental ringan.

ATURAN PENTING:
- Kamu BUKAN dokter dan TIDAK BOLEH memberikan diagnosis medis.
- Selalu merespons dengan empati dan dukungan.
- Gunakan Bahasa Indonesia yang natural dan ramah.
- Jika pengguna dalam kondisi darurat, sarankan untuk menghubungi profesional.
- Jangan mengklaim sebagai tenaga kesehatan profesional.
- Berikan respons yang singkat dan mudah dipahami.`;
const sendMessage = (userId, message) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Get or Create Session
    let session = yield prisma.chatSession.findFirst({
        where: { userId },
        orderBy: { startedAt: 'desc' },
    });
    if (!session) {
        session = yield prisma.chatSession.create({
            data: { userId },
        });
    }
    // 2. Save User Message
    const userMsg = yield prisma.chatMessage.create({
        data: {
            sessionId: session.id,
            sender: 'user',
            message: message,
        },
    });
    // 3. Get Profile for context
    const profile = yield (0, profile_service_1.getProfile)(userId);
    const profileContext = profile
        ? `[Konteks Pengguna: Nama=${profile.displayName}, Usia=${profile.age || 'tidak diketahui'}]`
        : '';
    // 4. Get History in Gemini SDK format
    const history = yield prisma.chatMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { timestamp: 'asc' },
        take: 20,
    });
    // Format history for chat (exclude the just-saved user message)
    const chatHistory = history
        .filter(m => m.id !== userMsg.id)
        .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.message }],
    }));
    // Add system instruction as first message if no history
    if (chatHistory.length === 0) {
        chatHistory.push({
            role: 'user',
            parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${profileContext}` }],
        });
        chatHistory.push({
            role: 'model',
            parts: [{ text: 'Halo! Saya PHA, asisten kesehatan pribadimu. Ada yang bisa saya bantu hari ini?' }],
        });
    }
    // 5. Create chat with history using new SDK
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: chatHistory,
    });
    // 6. Generate AI Response
    let aiResponseText = '';
    try {
        console.log('Calling Gemini API with new SDK...');
        const result = yield chat.sendMessage({ message });
        aiResponseText = result.text || 'Maaf, tidak ada respons.';
        console.log('Gemini response received:', aiResponseText.substring(0, 100) + '...');
    }
    catch (error) {
        console.error('Gemini API Error:', error.message || error);
        aiResponseText = 'Maaf, saya sedang mengalami gangguan. Bisa ulangi lagi?';
    }
    // 7. Save AI Message
    const aiMsg = yield prisma.chatMessage.create({
        data: {
            sessionId: session.id,
            sender: 'ai',
            message: aiResponseText,
        },
    });
    return [userMsg, aiMsg];
});
exports.sendMessage = sendMessage;
const getHistory = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield prisma.chatSession.findFirst({
        where: { userId },
        orderBy: { startedAt: 'desc' },
    });
    if (!session)
        return [];
    return yield prisma.chatMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { timestamp: 'asc' },
    });
});
exports.getHistory = getHistory;
// Get all chat sessions for a user
const getSessions = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const sessions = yield prisma.chatSession.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        include: {
            messages: {
                take: 1,
                orderBy: { timestamp: 'asc' },
            },
        },
    });
    return sessions.map(s => {
        var _a, _b;
        return ({
            id: s.id,
            startedAt: s.startedAt,
            preview: ((_b = (_a = s.messages[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.substring(0, 50)) || 'Empty chat',
            messageCount: s.messages.length,
        });
    });
});
exports.getSessions = getSessions;
// Get messages for a specific session
const getSessionMessages = (userId, sessionId) => __awaiter(void 0, void 0, void 0, function* () {
    // Verify session belongs to user
    const session = yield prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
    });
    if (!session)
        return [];
    return yield prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
    });
});
exports.getSessionMessages = getSessionMessages;
// Create a new chat session
const createNewSession = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield prisma.chatSession.create({
        data: { userId },
    });
    return session;
});
exports.createNewSession = createNewSession;
