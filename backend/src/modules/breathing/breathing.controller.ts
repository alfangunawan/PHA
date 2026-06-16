import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as BreathingService from './breathing.service';

export const getAll = async (_req: AuthRequest, res: Response) => {
    try {
        const techniques = await BreathingService.getAllTechniques();
        res.json({ techniques });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getOne = async (req: AuthRequest, res: Response) => {
    try {
        const technique = await BreathingService.getTechniqueById(req.params.id);
        if (!technique) return res.status(404).json({ error: 'Technique not found' });
        res.json({ technique });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const create = async (req: AuthRequest, res: Response) => {
    try {
        const technique = await BreathingService.createTechnique(req.body);
        res.status(201).json({ technique });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const update = async (req: AuthRequest, res: Response) => {
    try {
        const technique = await BreathingService.updateTechnique(req.params.id, req.body);
        res.json({ technique });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const remove = async (req: AuthRequest, res: Response) => {
    try {
        await BreathingService.deleteTechnique(req.params.id);
        res.json({ message: 'Technique deleted' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const saveLog = async (req: AuthRequest, res: Response) => {
    try {
        const log = await BreathingService.saveLog(req.user!.userId, req.body);
        res.status(201).json({ log });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getHistory = async (req: AuthRequest, res: Response) => {
    try {
        const logs = await BreathingService.getUserHistory(req.user!.userId);
        res.json({ logs });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
