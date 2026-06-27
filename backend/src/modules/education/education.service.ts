import { ActivityType, ContentSource } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { awardReward } from '../gamification/gamification.service';

interface GetAllFilters {
    page?: number;
    limit?: number;
    category?: string;
    source?: ContentSource;
    format?: any;
}

export const getAll = async ({ page = 1, limit = 10, category, source, format }: GetAllFilters) => {
    const skip = (page - 1) * limit;
    const where = {
        isActive: true,
        ...(category ? { category } : {}),
        ...(source ? { source } : {}),
        ...(format ? { format } : {}),
    };

    const [contents, total] = await Promise.all([
        prisma.educationContent.findMany({
            where,
            include: {
                createdByAdmin: {
                    select: { profile: { select: { displayName: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.educationContent.count({ where }),
    ]);

    return { contents, total, page, totalPages: Math.ceil(total / limit) };
};

export const getById = (id: string) =>
    prisma.educationContent.findFirst({
        where: { id, isActive: true },
        include: {
            createdByAdmin: {
                select: { profile: { select: { displayName: true } } },
            },
        },
    });

export const create = (adminId: string, data: {
    title: string;
    description?: string;
    source: ContentSource;
    url: string;
    thumbnailUrl?: string;
    category?: string;
    tags?: string[];
    format?: any;
}) =>
    prisma.educationContent.create({
        data: { ...data, createdByAdminId: adminId },
    });

export const update = (id: string, data: {
    title?: string;
    description?: string;
    source?: ContentSource;
    url?: string;
    thumbnailUrl?: string;
    category?: string;
    tags?: string[];
    format?: any;
}) =>
    prisma.educationContent.update({
        where: { id },
        data,
    });

export const remove = (id: string) =>
    prisma.educationContent.update({
        where: { id },
        data: { isActive: false },
    });

export const completeContent = async (userId: string, id: string) => {
    const content = await getById(id);
    if (!content) throw new Error('Content not found');
    const reward = await awardReward(userId, ActivityType.EDUCATION_CONTENT, id, { title: content.title });
    return { content, reward };
};
