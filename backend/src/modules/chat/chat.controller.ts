import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as ChatService from './chat.service';

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
export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { message } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const result = await ChatService.sendMessage(userId, message);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /chat/stream
 * SSE stream endpoint — calls n8n and streams the response word-by-word.
 * Sends the full n8n payload (action, cbt_phase, is_crisis, gad7) as the final event.
 */
export const streamMessage = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { message } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Setup SSE Headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const result = await ChatService.streamMessage(userId, message, (chunk) => {
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        });

        // Final event carries the full structured payload (action, gad7, etc.)
        res.write(`data: ${JSON.stringify({ done: true, ...result })}\n\n`);
        res.end();
    } catch (error: any) {
        console.error('Stream Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        } else {
            res.end();
        }
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// History (from n8n's conversations table)
// ─────────────────────────────────────────────────────────────────────────────

export const getHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const history = await ChatService.getHistory(userId);
        res.json(history);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getSessions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const sessions = await ChatService.getSessions(userId);
        res.json(sessions);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getSessionMessages = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { sessionId } = req.params;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const messages = await ChatService.getSessionMessages(userId, sessionId);
        res.json(messages);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createNewSession = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const session = await ChatService.createNewSession(userId);
        res.json(session);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GAD-7
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /chat/gad7/submit
 * Forwards GAD-7 answers to n8n for scoring and persistence.
 * Returns: { action, data: { score, severity, message } }
 */
export const submitGad7 = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { sessionId, answers } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const result = await ChatService.submitGad7(userId, sessionId, answers);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
