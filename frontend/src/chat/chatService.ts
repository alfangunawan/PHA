import EventSource, { EventSourceListener } from 'react-native-sse';
import { isInvalidAuthError } from '../api/authError';
import client from '../api/client';
import { notifyInvalidSession } from '../auth/sessionEvents';
import { getToken, removeToken, removeUser } from '../auth/storage';
import config from '../config';

export interface ChatMessage {
    id: string;
    sessionId?: string;
    sender: 'user' | 'ai';
    message: string;
    timestamp: string;
    // Final-event payload persisted onto the AI message (e.g. GAD-7 form trigger)
    action?: string;
    gad7Data?: any;
}

export interface ChatSession {
    id: string;
    startedAt: string;
    preview: string;
    messageCount: number;
}

export const sendMessage = async (message: string, sessionId?: string): Promise<ChatMessage[]> => {
    const response = await client.post('/chat/send', { message, sessionId });
    return response.data;
};

export const streamMessage = async (
    message: string,
    sessionId: string | undefined,
    onChunk: (chunk: string) => void,
    onComplete: (final: any) => void,
    onError: (err: any) => void
) => {
    const token = await getToken();
    if (!token) {
        onError('No auth token');
        return () => {};
    }
    const url = `${config.API_URL}/chat/stream`;

    const es = new EventSource(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({ message, sessionId }),
    });

    let completed = false;

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
                        completed = true;
                        es.close();
                        // Forward full final payload (action + data.gad7) to caller
                        onComplete(data);
                    }
                } catch (e) {
                    console.error('JSON Parse error', e);
                }
            }
        } else if (event.type === 'error' || event.type === 'exception') {
            if (completed) return;
            console.error('Connection error:', event.message);
            es.close();
            if (isInvalidAuthError(event.message)) {
                removeToken()
                    .then(removeUser)
                    .then(notifyInvalidSession)
                    .catch(() => {});
            }
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
    const response = await client.get('/chat/history');
    return response.data;
};

export const getSessions = async (): Promise<ChatSession[]> => {
    const response = await client.get('/chat/sessions');
    return response.data;
};

export const getSessionMessages = async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await client.get(`/chat/sessions/${sessionId}`);
    return response.data;
};

export const createNewSession = async (): Promise<{ id: string }> => {
    const response = await client.post('/chat/sessions/new');
    return response.data;
};

export const submitGad7 = async (sessionId: string, answers: number[]): Promise<{ action: string; data: { score: number; severity: string; message: string } }> => {
    const response = await client.post('/chat/gad7/submit', { sessionId, answers });
    return response.data;
};
