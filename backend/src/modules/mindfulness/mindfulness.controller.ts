import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as MindfulnessService from './mindfulness.service';

export const getRecommendations = async (req: AuthRequest, res: Response) => {
    try {
        const result = await MindfulnessService.getRecommendations(req.user!.userId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const result = await MindfulnessService.getDashboard(req.user!.userId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
