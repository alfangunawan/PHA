import { Response } from 'express';
import { AuthRequest } from './auth.middleware';
import * as ChatService from './chat.service';

export const sendMessage = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { message } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!message) return res.status(400).json({ error: 'Message is required' });

        const newMessages = await ChatService.sendMessage(userId, message);
        res.json(newMessages);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

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
