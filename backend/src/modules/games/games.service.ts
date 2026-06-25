import { ActivityType, GameStatus, GameType, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { awardReward } from '../gamification/gamification.service';
import { selectWordsForPuzzle, markWordsUsed } from './personalWordBank';

const toJson = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));
const WORD_PUZZLE_DAILY_LIMIT = 6;

type PuzzleAnswer = { id: string; answer: string };

const normalizeAnswer = (value: string) => value.trim().toLowerCase().replace(/[^a-z]/g, '');

const createRandom = (seed = Date.now()) => {
    let value = seed % 2147483647;
    if (value <= 0) value += 2147483646;
    return () => {
        value = (value * 16807) % 2147483647;
        return (value - 1) / 2147483646;
    };
};

const scrambleWord = (word: string, seed: number) => {
    const letters = word.toUpperCase().split('');
    const random = createRandom(seed);

    for (let attempt = 0; attempt < 8; attempt += 1) {
        const shuffled = [...letters];
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
            const j = Math.floor(random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const result = shuffled.join('');
        if (result !== word.toUpperCase() || letters.length <= 3) return result;
    }

    return [...letters.slice(1), letters[0]].join('');
};

const getDayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
};

const countSessionWords = (payload: any) => {
    if (Array.isArray(payload?.answers)) return payload.answers.length;
    if (Array.isArray(payload?.words)) return payload.words.length;
    return 0;
};

const getDailyWordPuzzleUsage = async (userId: string) => {
    const { start, end } = getDayRange();
    const sessions = await prisma.gameSession.findMany({
        where: {
            userId,
            gameType: GameType.WORD_PUZZLE,
            createdAt: { gte: start, lt: end },
        },
        select: { payload: true },
    });
    return sessions.reduce((sum, session) => sum + countSessionWords(session.payload as any), 0);
};

export const startWordPuzzle = async (userId: string, options: { maxWords?: number }) => {
    // Daily quota is intentionally disabled while the game flow is being tested.
    // Keep each session capped at 6 questions, but allow starting another session.
    const usedToday = 0;
    const remainingToday = WORD_PUZZLE_DAILY_LIMIT;
    const maxWords = Math.min(options.maxWords ?? WORD_PUZZLE_DAILY_LIMIT, WORD_PUZZLE_DAILY_LIMIT);
    const selected = await selectWordsForPuzzle(userId, maxWords);
    const seed = Date.now() % 1000000;
    const answers = selected.map((item, index) => {
        const word = normalizeAnswer(item.word);
        const upper = word.toUpperCase();
        return {
            id: `word-${index + 1}`,
            word,
            category: item.category,
            source: item.source,
            scrambled: scrambleWord(word, seed + index * 97),
            hintLetters: [upper[0] || '', upper[1] || ''].filter(Boolean),
        };
    }).filter(item => item.word.length > 0);

    const session = await prisma.gameSession.create({
        data: {
            userId,
            gameType: GameType.WORD_PUZZLE,
            status: GameStatus.started,
            payload: toJson({
                mode: 'scramble',
                answers,
                words: answers.map(item => item.word),
                startedAt: new Date().toISOString(),
            }),
        },
    });

    await markWordsUsed(userId, answers.map(item => item.word));

    return {
        sessionId: session.id,
        mode: 'scramble',
        items: answers.map(item => ({
            id: item.id,
            scrambled: item.scrambled,
            length: item.word.length,
            hintLetters: item.hintLetters,
            answer: item.word.toUpperCase(),
            source: item.source,
        })),
        dailyLimit: WORD_PUZZLE_DAILY_LIMIT,
        usedToday,
        remainingToday,
        limitReached: false,
    };
};

export const completeWordPuzzle = async (userId: string, sessionId: string, data: { answers: PuzzleAnswer[]; durationSec: number }) => {
    const session = await prisma.gameSession.findFirst({ where: { id: sessionId, userId, gameType: GameType.WORD_PUZZLE } });
    if (!session) throw new Error('Puzzle session not found');

    const payload = session.payload as any;
    const answerKey = new Map<string, string>((payload?.answers || []).map((item: any) => [item.id, normalizeAnswer(item.word)]));
    const submitted = new Map<string, string>((data.answers || []).map(item => [item.id, normalizeAnswer(item.answer)]));
    const results = Array.from(answerKey.entries()).map(([id, word]) => {
        const answer = submitted.get(id) || '';
        return { id, answer, correct: answer === word };
    });
    const correctCount = results.filter(item => item.correct).length;
    const totalWords = answerKey.size;
    const speedBonus = totalWords > 0 && correctCount === totalWords ? Math.max(0, 300 - Math.floor(data.durationSec / 2)) : 0;
    const score = correctCount * 100 + speedBonus;

    const updated = await prisma.gameSession.update({
        where: { id: sessionId },
        data: {
            status: GameStatus.completed,
            score,
            durationSec: data.durationSec,
            completedAt: new Date(),
            payload: toJson({ ...payload, submittedAnswers: results }),
        },
    });

    const reward = await awardReward(userId, ActivityType.WORD_PUZZLE, sessionId, { score, correctCount, totalWords });
    return { session: updated, correctCount, totalWords, score, reward };
};

export const startTetris = async (userId: string) => {
    const session = await prisma.gameSession.create({
        data: { userId, gameType: GameType.TETRIS, status: GameStatus.started, payload: toJson({ startedAt: new Date().toISOString() }) },
    });
    return { sessionId: session.id };
};

export const completeTetris = async (userId: string, sessionId: string, data: { score: number; lines: number; level: number; durationSec: number }) => {
    const session = await prisma.gameSession.findFirst({ where: { id: sessionId, userId, gameType: GameType.TETRIS } });
    if (!session) throw new Error('Tetris session not found');

    const updated = await prisma.gameSession.update({
        where: { id: sessionId },
        data: {
            status: GameStatus.completed,
            score: data.score,
            durationSec: data.durationSec,
            completedAt: new Date(),
            payload: toJson({ ...(session.payload as any), lines: data.lines, level: data.level }),
        },
    });

    const reward = await awardReward(userId, ActivityType.TETRIS, sessionId, data as any);
    return { session: updated, reward };
};
