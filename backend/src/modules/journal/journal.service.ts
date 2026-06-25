import { ActivityType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { analyzeAnxiety } from './analysis/anxietyAnalyzer';
import { extractPositiveWords } from '../games/positiveLexiconMatcher';
import { upsertPersonalWords } from '../games/personalWordBank';
import { awardReward } from '../gamification/gamification.service';

export const getEntries = (userId: string) =>
    prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, content: true, anxietyLevel: true, highRisk: true, analysis: true, createdAt: true, updatedAt: true },
    });

export const getEntry = (userId: string, id: string) =>
    prisma.journalEntry.findFirst({ where: { id, userId } });

export const createEntry = async (userId: string, data: { title?: string; content: string }) => {
    const analysis = analyzeAnxiety(data.content);
    const entry = await prisma.journalEntry.create({
        data: {
            userId,
            title: data.title,
            content: data.content,
            normalizedText: analysis.normalizedText,
            anxietyLevel: analysis.level,
            highRisk: analysis.highRisk,
            analysis: analysis as any,
        },
    });

    const positiveWords = extractPositiveWords(data.content);
    await upsertPersonalWords(userId, entry.id, positiveWords);
    const reward = await awardReward(userId, ActivityType.JOURNAL_ENTRY, entry.id, { level: analysis.level, highRisk: analysis.highRisk });

    return { entry, analysis, positiveWords, reward };
};

export const updateEntry = async (userId: string, id: string, data: { title?: string; content: string }) => {
    const existing = await getEntry(userId, id);
    if (!existing) throw new Error('Journal entry not found');

    const analysis = analyzeAnxiety(data.content);
    const entry = await prisma.journalEntry.update({
        where: { id },
        data: {
            title: data.title,
            content: data.content,
            normalizedText: analysis.normalizedText,
            anxietyLevel: analysis.level,
            highRisk: analysis.highRisk,
            analysis: analysis as any,
        },
    });

    const positiveWords = extractPositiveWords(data.content);
    await upsertPersonalWords(userId, entry.id, positiveWords);

    return { entry, analysis, positiveWords };
};

export const deleteEntry = async (userId: string, id: string) => {
    const existing = await getEntry(userId, id);
    if (!existing) throw new Error('Journal entry not found');
    return prisma.journalEntry.delete({ where: { id } });
};
