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

export const getOne = async (req: AuthRequest, res: Response) => {
    try {
        const audio = await AudioService.getById(req.params.id);
        if (!audio) return res.status(404).json({ error: 'Audio not found' });
        res.json({ audio });
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

/**
 * POST /api/audio-contents/:id/log
 * Body: { audioId, duration, completed }
 * Menyimpan log sesi audio. Reward hanya diberikan jika completed === true.
 */
export const saveLog = async (req: AuthRequest, res: Response) => {
    try {
        const result = await AudioService.saveLog(req.user!.userId, req.body);
        res.status(201).json({ log: result });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getHistory = async (req: AuthRequest, res: Response) => {
    try {
        const logs = await AudioService.getUserHistory(req.user!.userId);
        res.json({ logs });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
