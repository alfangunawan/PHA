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
