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

import { checkGad7Status } from '../chat.service';
import { prisma } from '../../../config/prisma';

const mockFindFirst = prisma.gad7Result.findFirst as ReturnType<typeof vi.fn>;

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
