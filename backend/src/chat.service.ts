import { GoogleGenAI } from '@google/genai';
import { PrismaClient } from '@prisma/client';
import { getProfile } from './profile.service';

// Initialize Gemini API with new SDK
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.warn('GEMINI_API_KEY is not set in environment variables');
}

const ai = new GoogleGenAI({ apiKey: API_KEY || '' });

const prisma = new PrismaClient();

// System instruction for AI personality
const SYSTEM_INSTRUCTION = `Kamu adalah Personal Health Assistant (PHA), asisten AI yang suportif dan empatik untuk kesehatan mental ringan.

ATURAN PENTING:
- Kamu BUKAN dokter dan TIDAK BOLEH memberikan diagnosis medis.
- Selalu merespons dengan empati dan dukungan.
- Gunakan Bahasa Indonesia yang natural dan ramah.
- Jika pengguna dalam kondisi darurat, sarankan untuk menghubungi profesional.
- Jangan mengklaim sebagai tenaga kesehatan profesional.
- Berikan respons yang singkat dan mudah dipahami.`;

export const sendMessage = async (userId: string, message: string) => {
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

    // 3. Get Profile for context
    const profile = await getProfile(userId);
    const profileContext = profile
        ? `[Konteks Pengguna: Nama=${profile.displayName}, Usia=${profile.age || 'tidak diketahui'}]`
        : '';

    // 4. Get History in Gemini SDK format
    const history = await prisma.chatMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { timestamp: 'asc' },
        take: 20,
    });

    // Format history for chat (exclude the just-saved user message)
    const chatHistory = history
        .filter(m => m.id !== userMsg.id)
        .map((m: any) => ({
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
        const result = await chat.sendMessage({ message });
        aiResponseText = result.text || 'Maaf, tidak ada respons.';
        console.log('Gemini response received:', aiResponseText.substring(0, 100) + '...');
    } catch (error: any) {
        console.error('Gemini API Error:', error.message || error);
        aiResponseText = 'Maaf, saya sedang mengalami gangguan. Bisa ulangi lagi?';
    }

    // 7. Save AI Message
    const aiMsg = await prisma.chatMessage.create({
        data: {
            sessionId: session.id,
            sender: 'ai',
            message: aiResponseText,
        },
    });

    return [userMsg, aiMsg];
};

export const getHistory = async (userId: string) => {
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
