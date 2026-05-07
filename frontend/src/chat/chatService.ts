import { api, getToken } from '../auth/useAuth';
import EventSource, { EventSourceListener } from 'react-native-sse';
import config from '../config';

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

export const streamMessage = async (
    message: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (err: any) => void
) => {
    const token = await getToken();
    const url = `${config.API_URL}/chat/stream`;

    const es = new EventSource(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ message }),
    });

    const listener: EventSourceListener = (event) => {
        if (event.type === 'open') {
            console.log('Open SSE connection.');
        } else if (event.type === 'message') {
            if (event.data) {
                try {
                    const data = JSON.parse(event.data);
                    if (data.chunk) {
                        onChunk(data.chunk);
                    }
                    if (data.done) {
                        es.close();
                        onComplete();
                    }
                } catch (e) {
                    console.error('JSON Parse error', e);
                }
            }
        } else if (event.type === 'error' || event.type === 'exception') {
            console.error('Connection error:', event.message);
            es.close();
            onError(event.message);
        }
    };

    es.addEventListener('open', listener);
    es.addEventListener('message', listener);
    es.addEventListener('error', listener);

    return () => {
        es.removeAllEventListeners();
        es.close();
    };
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
