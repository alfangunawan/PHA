import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as GamesService from './games.service';

export const startWordPuzzle = async (req: AuthRequest, res: Response) => {
    try {
        const result = await GamesService.startWordPuzzle(req.user!.userId, req.body || {});
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const completeWordPuzzle = async (req: AuthRequest, res: Response) => {
    try {
        const result = await GamesService.completeWordPuzzle(req.user!.userId, req.params.sessionId, req.body);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const startTetris = async (req: AuthRequest, res: Response) => {
    try {
        const result = await GamesService.startTetris(req.user!.userId);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const completeTetris = async (req: AuthRequest, res: Response) => {
    try {
        const result = await GamesService.completeTetris(req.user!.userId, req.params.sessionId, req.body);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
