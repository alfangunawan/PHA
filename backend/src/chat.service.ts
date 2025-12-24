import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient, ChatSession, ChatMessage } from '@prisma/client';
import { getProfile } from './profile.service';

// Initialize Gemini API
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.warn('GEMINI_API_KEY is not set in environment variables');
}
const genAI = new GoogleGenerativeAI(API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const prisma = new PrismaClient();

export const sendMessage = async (userId: string, message: string): Promise<ChatMessage[]> => {
    // 1. Get or Create Session
    let session = await prisma.chatSession.findFirst({
        where: { userId },
        orderBy: { startedAt: 'desc' },
    });

    if (!session) {
        session = await prisma.chatSession.create({
            data: { userId },
        });
    }

    // 2. Save User Message
    const userMsg = await prisma.chatMessage.create({
        data: {
            sessionId: session.id,
            sender: 'user',
            message: message,
        },
    });

    // 3. Prepare Context
    const profile = await getProfile(userId);
    const history = await prisma.chatMessage.findMany({
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
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        aiResponseText = response.text();
    } catch (error) {
        console.error('Gemini API Error:', error);
        aiResponseText = 'Maaf, saya sedang mengalami gangguan. Bisa ulangi lagi?';
    }

    // 5. Save AI Message
    const aiMsg = await prisma.chatMessage.create({
        data: {
            sessionId: session.id,
            sender: 'ai',
            message: aiResponseText,
        },
    });

    return [userMsg, aiMsg];
};

export const getHistory = async (userId: string): Promise<ChatMessage[]> => {
    const session = await prisma.chatSession.findFirst({
        where: { userId },
        orderBy: { startedAt: 'desc' },
    });

    if (!session) return [];

    return await prisma.chatMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { timestamp: 'asc' },
    });
};
