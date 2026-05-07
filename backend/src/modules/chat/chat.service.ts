import { GoogleGenAI } from '@google/genai';
import { prisma } from '../../config/prisma';
import { getProfile } from '../profile/profile.service';

// Initialize Gemini API with new SDK
const API_KEY = process.env.GEMINI_API_KEY;
console.log('Chat Service API Key check:', API_KEY ? 'Set' : 'Not Set');

if (!API_KEY) {
    console.warn('GEMINI_API_KEY is not set in environment variables');
}

const ai = new GoogleGenAI({ apiKey: API_KEY || '' });

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

    // 5 & 6. Send request to n8n webhook instead of direct Gemini API
    let aiResponseText = '';
    try {
        console.log('Calling n8n Webhook...');
        const webhookUrl = 'https://n8n.alstore.space/webhook-test/pha-chat';
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                sessionId: session.id,
                message,
                history: chatHistory,
                profileContext
            }),
        });

        if (!response.ok) {
            throw new Error(`Webhook responded with status: ${response.status}`);
        }

        const rawText = await response.text();
        try {
            const data = JSON.parse(rawText);
            
            if (data.action === 'show_gad7') {
                aiResponseText = JSON.stringify(data);
            } else {
                aiResponseText = data.text || data.output || data.response || data.message || rawText;
                if (typeof aiResponseText !== 'string') {
                    aiResponseText = JSON.stringify(aiResponseText);
                }
            }
        } catch (e) {
            aiResponseText = rawText || 'Maaf, tidak ada respons.';
        }
        
        console.log('Webhook response received:', aiResponseText.substring(0, 100) + '...');
    } catch (error: any) {
        console.error('Webhook Error:', error.message || error);
        aiResponseText = 'Maaf, saya sedang mengalami gangguan komunikasi dengan server n8n. Bisa ulangi lagi?';
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

// Get all chat sessions for a user
export const getSessions = async (userId: string) => {
    const sessions = await prisma.chatSession.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        include: {
            messages: {
                take: 1,
                orderBy: { timestamp: 'asc' },
            },
        },
    });

    return sessions.map(s => ({
        id: s.id,
        startedAt: s.startedAt,
        preview: s.messages[0]?.message?.substring(0, 50) || 'Empty chat',
        messageCount: s.messages.length,
    }));
};

// Get messages for a specific session
export const getSessionMessages = async (userId: string, sessionId: string) => {
    // Verify session belongs to user
    const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
    });

    if (!session) return [];

    return await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
    });
};

// Stream message from AI
export const streamMessage = async (userId: string, message: string, onChunk: (text: string) => void) => {
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

    // 4. Get History
    const history = await prisma.chatMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { timestamp: 'asc' },
        take: 20,
    });

    const chatHistory = history
        .filter(m => m.id !== userMsg.id)
        .map((m: any) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.message }],
        }));

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

    // 5. Create chat
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: chatHistory,
    });

    // 6. Stream Response
    let aiResponseText = '';
    try {
        const result = await chat.sendMessageStream({ message });

        for await (const chunk of result) {
            const chunkText = chunk.text;
            if (chunkText) {
                aiResponseText += chunkText;
                onChunk(chunkText);
            }
        }
    } catch (error: any) {
        console.error('Gemini Stream Error:', error.message || error);
        aiResponseText += '\n[Terputus]';
        onChunk('\n[Maaf, koneksi terputus]');
    }

    // 7. Save AI Message
    const aiMsg = await prisma.chatMessage.create({
        data: {
            sessionId: session.id,
            sender: 'ai',
            message: aiResponseText,
        },
    });

    return { userMsg, aiMsg };
};

// Create a new chat session
export const createNewSession = async (userId: string) => {
    const session = await prisma.chatSession.create({
        data: { userId },
    });

    return session;
};

export const submitGad7 = async (userId: string, sessionId: string, answers: number[]) => {
    const webhookUrl = 'https://n8n.alstore.space/webhook-test/pha-gad7-submit';
    
    // Save user action "Terkirim" in DB for record if needed? 
    // Wait, the message containing the form is already in DB. 
    // The user sending answers is an action, but we can skip saving it as chat,
    // and just save the n8n response.
    
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, answers }),
    });

    if (!response.ok) {
        throw new Error('Failed to submit GAD-7 to webhook');
    }

    const data = await response.json();
    
    let aiResponseText = 'Terima kasih sudah menjawab.';
    if (data.data && data.data.message) {
        aiResponseText = data.data.message;
    } else if (data.message) {
        aiResponseText = data.message;
    }

    // Save AI response
    const aiMsg = await prisma.chatMessage.create({
        data: {
            sessionId,
            sender: 'ai',
            message: aiResponseText,
        },
    });

    return aiMsg;
};
