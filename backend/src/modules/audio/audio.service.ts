import fs from 'fs';
import { ActivityType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { awardReward } from '../gamification/gamification.service';

export const getAll = () =>
    prisma.audioContent.findMany({
        where: { isActive: true },
        include: {
            createdByAdmin: {
                select: { profile: { select: { displayName: true } } },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

export const getById = (id: string) =>
    prisma.audioContent.findFirst({
        where: { id, isActive: true },
        include: {
            createdByAdmin: {
                select: { profile: { select: { displayName: true } } },
            },
        },
    });

export const create = (adminId: string, data: {
    title: string;
    category?: string;
    duration?: number;
    description?: string;
}, fileUrl: string) =>
    prisma.audioContent.create({
        data: { ...data, fileUrl, createdByAdminId: adminId },
    });

export const remove = async (id: string) => {
    const record = await prisma.audioContent.findUnique({ where: { id } });
    if (!record) throw new Error('Audio not found');

    const filePath = record.fileUrl.startsWith('/')
        ? record.fileUrl.slice(1)
        : record.fileUrl;

    try {
        fs.unlinkSync(filePath);
    } catch {
        // file may already be gone
    }

    return prisma.audioContent.delete({ where: { id } });
};

/**
 * Menyimpan hasil sesi mendengarkan audio.
 * Reward hanya diberikan jika completed === true (mengikuti pola MeditationLog).
 * Jika completed === false (audio berhenti di tengah), log tetap ditulis tapi reward tidak diberikan.
 */
export const saveLog = async (userId: string, data: {
    audioId: string;
    duration: number;
    completed?: boolean;
}) => {
    const audio = await prisma.audioContent.findFirst({ where: { id: data.audioId, isActive: true } });
    if (!audio) throw new Error('Audio not found');

    const log = await prisma.audioLog.create({
        data: {
            userId,
            audioId: data.audioId,
            duration: data.duration,
            completed: data.completed ?? false,
        },
    });

    const reward = data.completed
        ? await awardReward(userId, ActivityType.AUDIO_CONTENT, log.id, {
            audioId: data.audioId,
            title: audio.title,
            duration: data.duration,
        })
        : null;

    return { ...log, reward };
};

export const getUserHistory = (userId: string) =>
    prisma.audioLog.findMany({
        where: { userId },
        include: {
            audio: { select: { title: true, category: true, duration: true } },
        },
        orderBy: { completedAt: 'desc' },
        take: 20,
    });
