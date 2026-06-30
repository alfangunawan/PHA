import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock prisma before importing anything that uses it
vi.mock('../../../config/prisma', () => ({
    prisma: {
        gad7Result: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
    },
}));

import { checkGad7Status, submitGad7 } from '../chat.service';
import { prisma } from '../../../config/prisma';

const mockFindFirst = prisma.gad7Result.findFirst as ReturnType<typeof vi.fn>;
const mockCreate = prisma.gad7Result.create as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('checkGad7Status', () => {
    it('returns needsGad7: true when no results exist', async () => {
        mockFindFirst.mockResolvedValue(null);
        const result = await checkGad7Status('user-1');
        expect(result).toEqual({ needsGad7: true, lastTakenAt: null });
    });

    it('returns needsGad7: false when last result is 5 days ago', async () => {
        const takenAt = new Date(Date.now() - 5 * 86_400_000);
        mockFindFirst.mockResolvedValue({ takenAt });
        const result = await checkGad7Status('user-1');
        expect(result.needsGad7).toBe(false);
        expect(result.lastTakenAt).toBe(takenAt.toISOString());
    });

    it('returns needsGad7: true when last result is 15 days ago', async () => {
        const takenAt = new Date(Date.now() - 15 * 86_400_000);
        mockFindFirst.mockResolvedValue({ takenAt });
        const result = await checkGad7Status('user-1');
        expect(result.needsGad7).toBe(true);
    });

    it('returns needsGad7: true when last result is exactly 14 days ago', async () => {
        const takenAt = new Date(Date.now() - 14 * 86_400_000);
        mockFindFirst.mockResolvedValue({ takenAt });
        const result = await checkGad7Status('user-1');
        expect(result.needsGad7).toBe(true);
    });
});

describe('submitGad7', () => {
    const validAnswers = [1, 0, 2, 1, 0, 1, 2]; // score = 7, mild

    it('saves result and returns score + severity for valid answers', async () => {
        mockFindFirst.mockResolvedValue(null); // no previous result
        mockCreate.mockResolvedValue({});
        const result = await submitGad7('user-1', validAnswers);
        expect(result).toEqual({ score: 7, severity: 'mild' });
        expect(mockCreate).toHaveBeenCalledWith({
            data: expect.objectContaining({ userId: 'user-1', score: 7, severity: 'mild' }),
        });
    });

    it('throws INVALID_ANSWERS if answers length is not 7', async () => {
        await expect(submitGad7('user-1', [0, 1, 2])).rejects.toThrow('INVALID_ANSWERS');
    });

    it('throws INVALID_ANSWERS if any answer is out of range', async () => {
        await expect(submitGad7('user-1', [0, 1, 2, 3, 4, 0, 0])).rejects.toThrow('INVALID_ANSWERS');
    });

    it('throws INVALID_ANSWERS if any answer is not an integer', async () => {
        await expect(submitGad7('user-1', [0, 1.5, 2, 3, 0, 0, 0])).rejects.toThrow('INVALID_ANSWERS');
    });

    it('throws TOO_SOON if last result is 10 days ago', async () => {
        const takenAt = new Date(Date.now() - 10 * 86_400_000);
        mockFindFirst.mockResolvedValue({ takenAt });
        const err: any = await submitGad7('user-1', validAnswers).catch(e => e);
        expect(err.code).toBe('TOO_SOON');
    });

    it('allows submit if last result is 13 days ago (buffer zone)', async () => {
        const takenAt = new Date(Date.now() - 13 * 86_400_000);
        mockFindFirst.mockResolvedValue({ takenAt });
        mockCreate.mockResolvedValue({});
        await expect(submitGad7('user-1', validAnswers)).resolves.toBeDefined();
    });

    it('scores [0,0,0,0,0,0,0] as minimal', async () => {
        mockFindFirst.mockResolvedValue(null);
        mockCreate.mockResolvedValue({});
        expect((await submitGad7('user-1', [0,0,0,0,0,0,0])).severity).toBe('minimal');
    });

    it('scores sum=9 as mild', async () => {
        mockFindFirst.mockResolvedValue(null);
        mockCreate.mockResolvedValue({});
        expect((await submitGad7('user-1', [1,1,1,1,1,2,2])).severity).toBe('mild');
    });

    it('scores sum=14 as moderate', async () => {
        mockFindFirst.mockResolvedValue(null);
        mockCreate.mockResolvedValue({});
        expect((await submitGad7('user-1', [2,2,2,2,2,2,2])).severity).toBe('moderate');
    });

    it('scores sum=15 as severe', async () => {
        mockFindFirst.mockResolvedValue(null);
        mockCreate.mockResolvedValue({});
        expect((await submitGad7('user-1', [2,2,2,2,2,2,3])).severity).toBe('severe');
    });
});
