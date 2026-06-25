import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as JournalService from './journal.service';

export const getEntries = async (req: AuthRequest, res: Response) => {
    try {
        const entries = await JournalService.getEntries(req.user!.userId);
        res.json({ entries });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getEntry = async (req: AuthRequest, res: Response) => {
    try {
        const entry = await JournalService.getEntry(req.user!.userId, req.params.id);
        if (!entry) return res.status(404).json({ error: 'Journal entry not found' });
        res.json({ entry });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createEntry = async (req: AuthRequest, res: Response) => {
    try {
        const result = await JournalService.createEntry(req.user!.userId, req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateEntry = async (req: AuthRequest, res: Response) => {
    try {
        const result = await JournalService.updateEntry(req.user!.userId, req.params.id, req.body);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteEntry = async (req: AuthRequest, res: Response) => {
    try {
        await JournalService.deleteEntry(req.user!.userId, req.params.id);
        res.json({ message: 'Journal entry deleted' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
