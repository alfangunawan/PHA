import { prisma } from '../../config/prisma';
import { PositiveWordMatch } from './positiveLexiconMatcher';
import { defaultPositiveWords } from './config/defaultPositiveWords';

export const upsertPersonalWords = async (userId: string, journalId: string, matches: PositiveWordMatch[]) => {
    await Promise.all(matches.map(match =>
        prisma.personalPositiveWord.upsert({
            where: { userId_word: { userId, word: match.word } },
            update: { weight: { increment: match.count }, category: match.category, sourceJournalId: journalId },
            create: { userId, word: match.word, category: match.category, sourceJournalId: journalId, weight: match.count },
        }),
    ));
};

const normalizeWord = (word: string) => word.toLowerCase().replace(/[^a-z]/g, '');

const shuffle = <T,>(items: T[]) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const extractSessionWords = (payload: any): string[] => {
    if (Array.isArray(payload?.answers)) {
        return payload.answers.map((item: any) => normalizeWord(String(item.word || ''))).filter(Boolean);
    }
    if (Array.isArray(payload?.words)) {
        return payload.words.map((word: string) => normalizeWord(word)).filter(Boolean);
    }
    return [];
};

export const getRecentPuzzleWords = async (userId: string, take = 3): Promise<string[]> => {
    const sessions = await prisma.gameSession.findMany({
        where: { userId, gameType: 'WORD_PUZZLE', status: 'completed' },
        orderBy: { completedAt: 'desc' },
        take,
    });

    return Array.from(new Set(sessions.flatMap(session => extractSessionWords(session.payload as any))));
};

export const selectWordsForPuzzle = async (userId: string, maxWords = 6, recentWindow = 3) => {
    const recentWords = new Set(await getRecentPuzzleWords(userId, recentWindow));
    const chosen: Array<{ word: string; category: string; source: string }> = [];
    const chosenSet = new Set<string>();

    const pushIfNew = (item: { word: string; category?: string | null; source: string }, allowRecent = false) => {
        if (chosen.length >= maxWords) return;
        const word = normalizeWord(item.word);
        if (!word || chosenSet.has(word)) return;
        if (!allowRecent && recentWords.has(word)) return;
        chosen.push({ word, category: item.category || 'personal', source: item.source });
        chosenSet.add(word);
    };

    const personalWords = await prisma.personalPositiveWord.findMany({
        where: { userId },
        orderBy: [{ lastUsedAt: 'asc' }, { weight: 'desc' }, { createdAt: 'desc' }],
        take: Math.max(maxWords * 3, 12),
    });

    personalWords.forEach(item => pushIfNew({ word: item.word, category: item.category || 'personal', source: 'personal' }));
    shuffle(defaultPositiveWords).forEach(item => pushIfNew({ word: item.word, category: item.category, source: 'default' }));

    if (chosen.length < maxWords) {
        personalWords.forEach(item => pushIfNew({ word: item.word, category: item.category || 'personal', source: 'personal' }, true));
        shuffle(defaultPositiveWords).forEach(item => pushIfNew({ word: item.word, category: item.category, source: 'default' }, true));
    }

    return chosen.slice(0, maxWords);
};

export const markWordsUsed = async (userId: string, words: string[]) => {
    await Promise.all(words.map(word =>
        prisma.personalPositiveWord.updateMany({ where: { userId, word: normalizeWord(word) }, data: { lastUsedAt: new Date() } }),
    ));
};
