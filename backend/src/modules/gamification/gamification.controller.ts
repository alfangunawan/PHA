import { Response } from 'express';
import { ActivityType } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as GamificationService from './gamification.service';

export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const result = await GamificationService.getUserSummary(req.user!.userId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getRules = async (_req: AuthRequest, res: Response) => {
    try {
        const rules = await GamificationService.getRules();
        res.json({ rules });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateRule = async (req: AuthRequest, res: Response) => {
    try {
        const rule = await GamificationService.updateRule(req.params.activityType as ActivityType, req.body, req.user!.userId);
        res.json({ rule });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
