import { Response } from 'express';
import { ContentSource } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as EducationService from './education.service';

export const getAll = async (req: AuthRequest, res: Response) => {
    try {
        const { page, limit, category, source } = req.query as any;
        const result = await EducationService.getAll({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            category,
            source: source as ContentSource | undefined,
        });
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getOne = async (req: AuthRequest, res: Response) => {
    try {
        const content = await EducationService.getById(req.params.id);
        if (!content) return res.status(404).json({ error: 'Content not found' });
        res.json({ content });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const create = async (req: AuthRequest, res: Response) => {
    try {
        const content = await EducationService.create(req.user!.userId, req.body);
        res.status(201).json({ content });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const update = async (req: AuthRequest, res: Response) => {
    try {
        const content = await EducationService.update(req.params.id, req.body);
        res.json({ content });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const remove = async (req: AuthRequest, res: Response) => {
    try {
        await EducationService.remove(req.params.id);
        res.json({ message: 'Content removed' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const complete = async (req: AuthRequest, res: Response) => {
    try {
        const result = await EducationService.completeContent(req.user!.userId, req.params.id);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
