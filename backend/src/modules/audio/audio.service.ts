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

export const completeAudio = async (userId: string, id: string) => {
    const audio = await prisma.audioContent.findFirst({ where: { id, isActive: true } });
    if (!audio) throw new Error('Audio not found');
    const reward = await awardReward(userId, ActivityType.AUDIO_CONTENT, id, { title: audio.title });
    return { audio, reward };
};
