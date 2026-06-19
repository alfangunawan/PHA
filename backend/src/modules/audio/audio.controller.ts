import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as AudioService from './audio.service';

export const getAll = async (_req: AuthRequest, res: Response) => {
    try {
        const audios = await AudioService.getAll();
        res.json({ audios });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const create = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Audio file required' });

        const { title, category, duration, description } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title required' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        const audio = await AudioService.create(req.user!.userId, {
            title,
            category,
            duration: duration ? Number(duration) : undefined,
            description,
        }, fileUrl);

        res.status(201).json({ audio });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const remove = async (req: AuthRequest, res: Response) => {
    try {
        await AudioService.remove(req.params.id);
        res.json({ message: 'Audio deleted' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
