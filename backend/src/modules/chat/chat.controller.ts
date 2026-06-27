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
        const { message, sessionId } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const result = await ChatService.sendMessage(userId, message, sessionId);
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
        const { message, sessionId } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Setup SSE Headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const result = await ChatService.streamMessage(userId, message, sessionId, (chunk) => {
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
        const messages = history.map((row: any) => ({
            id: String(row.id),
            sessionId: row.session_id,
            sender: (row.role === 'human' || row.role === 'user') ? 'user' : 'ai',
            message: row.content ?? '',
            timestamp: row.created_at,
        }));
        res.json(messages);
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

        const rows = await ChatService.getSessionMessages(userId, sessionId);
        const messages = rows.map((row: any) => ({
            id: String(row.id),
            sessionId: row.session_id,
            sender: (row.role === 'human' || row.role === 'user') ? 'user' : 'ai',
            message: row.content ?? '',
            timestamp: row.created_at,
        }));
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

export const getLatestGad7ForUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const callerId = req.user?.userId;

        if (id !== callerId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const latest = await ChatService.getLatestGad7ForUser(id);
        if (!latest) {
            return res.status(404).json({ error: 'GAD-7 result not found' });
        }

        res.json({
            score: latest.score,
            severity: latest.severity,
            timestamp: latest.takenAt,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GAD-7
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /chat/gad7/status
 * Returns whether the authenticated user needs to retake the GAD-7 assessment.
 * Response: { needsGad7: boolean, lastTakenAt: string | null }
 */
export const checkGad7Status = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const status = await ChatService.checkGad7Status(userId);
        res.json(status);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

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
