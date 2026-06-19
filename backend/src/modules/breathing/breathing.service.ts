import { prisma } from '../../config/prisma';

export const getAllTechniques = () =>
    prisma.breathingTechnique.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
    });

export const getTechniqueById = (id: string) =>
    prisma.breathingTechnique.findFirst({
        where: { id, isActive: true },
    });

export const createTechnique = (data: {
    name: string;
    description?: string;
    inhaleDuration: number;
    holdDuration?: number;
    exhaleDuration: number;
    holdAfterExhale?: number;
    cycles?: number;
    colorTheme?: string;
    icon?: string;
}) => prisma.breathingTechnique.create({ data });

export const updateTechnique = (id: string, data: Partial<{
    name: string;
    description?: string;
    inhaleDuration: number;
    holdDuration?: number;
    exhaleDuration: number;
    holdAfterExhale?: number;
    cycles?: number;
    colorTheme?: string;
    icon?: string;
    isActive?: boolean;
}>) => prisma.breathingTechnique.update({ where: { id }, data });

export const deleteTechnique = (id: string) =>
    prisma.breathingTechnique.delete({ where: { id } });

export const saveLog = (userId: string, data: {
    techniqueId: string;
    duration: number;
    cyclesCompleted?: number;
}) =>
    prisma.breathingLog.create({
        data: {
            userId,
            techniqueId: data.techniqueId,
            duration: data.duration,
            cyclesCompleted: data.cyclesCompleted ?? 0,
        },
    });

export const getUserHistory = (userId: string) =>
    prisma.breathingLog.findMany({
        where: { userId },
        include: { technique: { select: { name: true, colorTheme: true } } },
        orderBy: { completedAt: 'desc' },
        take: 20,
    });
