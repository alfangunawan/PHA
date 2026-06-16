import { Response } from 'express';
import { MeditationCategory } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as MeditationService from './meditation.service';

export const getSessions = async (req: AuthRequest, res: Response) => {
    try {
        const category = req.query.category as MeditationCategory | undefined;
        const sessions = await MeditationService.getAllSessions(category);
        res.json({ sessions });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getSession = async (req: AuthRequest, res: Response) => {
    try {
        const session = await MeditationService.getSessionById(req.params.id);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json({ session });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createSession = async (req: AuthRequest, res: Response) => {
    try {
        const session = await MeditationService.createSession(req.body);
        res.status(201).json({ session });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateSession2 = async (req: AuthRequest, res: Response) => {
    try {
        const session = await MeditationService.updateSession(req.params.id, req.body);
        res.json({ session });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteSession = async (req: AuthRequest, res: Response) => {
    try {
        await MeditationService.deleteSession(req.params.id);
        res.json({ message: 'Session deleted' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const saveLog = async (req: AuthRequest, res: Response) => {
    try {
        const log = await MeditationService.saveLog(req.user!.userId, req.body);
        res.status(201).json({ log });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getHistory = async (req: AuthRequest, res: Response) => {
    try {
        const logs = await MeditationService.getUserHistory(req.user!.userId);
        res.json({ logs });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
