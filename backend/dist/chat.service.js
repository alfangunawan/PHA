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
exports.getHistory = exports.sendMessage = void 0;
const generative_ai_1 = require("@google/generative-ai");
const client_1 = require("@prisma/client");
const profile_service_1 = require("./profile.service");
// Initialize Gemini API
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.warn('GEMINI_API_KEY is not set in environment variables');
}
const genAI = new generative_ai_1.GoogleGenerativeAI(API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const prisma = new client_1.PrismaClient();
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
    // 3. Prepare Context
    const profile = yield (0, profile_service_1.getProfile)(userId);
    const history = yield prisma.chatMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { timestamp: 'asc' },
        take: 10, // Limit context window
    });
    const profileContext = profile
        ? `Profile: Name=${profile.displayName}, Age=${profile.age}, Gender=${profile.gender}, Lang=${profile.language}. `
        : '';
    const historyContext = history.map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.message}`).join('\n');
    const systemPrompt = `You are a Personal Health Assistant (PHA), a supportive and empathetic AI companion. 
  You are NOT a doctor and cannot provide medical diagnosis.
  ${profileContext}
  Respond naturally in Bahasa Indonesia (unless user prefers otherwise).
  Current conversation history:
  ${historyContext}
  User: ${message}
  AI:`;
    // 4. Generate AI Response
    let aiResponseText = '';
    try {
        const result = yield model.generateContent(systemPrompt);
        const response = yield result.response;
        aiResponseText = response.text();
    }
    catch (error) {
        console.error('Gemini API Error:', error);
        aiResponseText = 'Maaf, saya sedang mengalami gangguan. Bisa ulangi lagi?';
    }
    // 5. Save AI Message
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
