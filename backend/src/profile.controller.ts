import { Response } from 'express';
import { AuthRequest } from './auth.middleware';
import * as ProfileService from './profile.service';

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const profile = await ProfileService.getProfile(userId);
        res.json(profile);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const profile = await ProfileService.updateProfile(userId, req.body);
        res.json(profile);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
