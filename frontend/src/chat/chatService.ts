import { api } from '../auth/useAuth';

export interface ChatMessage {
    id: string;
    sessionId: string;
    sender: 'user' | 'ai';
    message: string;
    timestamp: string;
}

export interface ChatSession {
    id: string;
    startedAt: string;
    preview: string;
    messageCount: number;
}

export const sendMessage = async (message: string): Promise<ChatMessage[]> => {
    const response = await api.post('/chat/send', { message });
    return response.data;
};

export const getHistory = async (): Promise<ChatMessage[]> => {
    const response = await api.get('/chat/history');
    return response.data;
};

export const getSessions = async (): Promise<ChatSession[]> => {
    const response = await api.get('/chat/sessions');
    return response.data;
};

export const getSessionMessages = async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await api.get(`/chat/sessions/${sessionId}`);
    return response.data;
};

export const createNewSession = async (): Promise<{ id: string }> => {
    const response = await api.post('/chat/sessions/new');
    return response.data;
};

export const submitGad7 = async (sessionId: string, answers: number[]): Promise<ChatMessage> => {
    const response = await api.post('/chat/gad7-submit', { sessionId, answers });
    return response.data;
};
