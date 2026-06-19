import { MeditationCategory } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const getAllSessions = (category?: MeditationCategory) =>
    prisma.meditationSession.findMany({
        where: { isActive: true, ...(category ? { category } : {}) },
        orderBy: { createdAt: 'asc' },
    });

export const getSessionById = (id: string) =>
    prisma.meditationSession.findFirst({
        where: { id, isActive: true },
    });

export const createSession = (data: {
    title: string;
    description?: string;
    category?: MeditationCategory;
    audioUrl?: string;
    thumbnailUrl?: string;
    durationOptions: string[];
    colorTheme?: string;
}) => prisma.meditationSession.create({ data });

export const updateSession = (id: string, data: Partial<{
    title: string;
    description?: string;
    category?: MeditationCategory;
    audioUrl?: string;
    thumbnailUrl?: string;
    durationOptions: number[];
    colorTheme?: string;
    isActive?: boolean;
}>) => prisma.meditationSession.update({ where: { id }, data });

export const deleteSession = (id: string) =>
    prisma.meditationSession.delete({ where: { id } });

export const saveLog = (userId: string, data: {
    sessionId: string;
    duration: number;
    completed?: boolean;
}) =>
    prisma.meditationLog.create({
        data: {
            userId,
            sessionId: data.sessionId,
            duration: data.duration,
            completed: data.completed ?? false,
        },
    });

export const getUserHistory = (userId: string) =>
    prisma.meditationLog.findMany({
        where: { userId },
        include: {
            session: { select: { title: true, category: true, colorTheme: true } },
        },
        orderBy: { completedAt: 'desc' },
        take: 20,
    });
