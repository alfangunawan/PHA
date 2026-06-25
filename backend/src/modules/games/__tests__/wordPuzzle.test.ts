import { describe, expect, it } from 'vitest';
import { extractPositiveWords } from '../positiveLexiconMatcher';
import { generateWordPuzzle } from '../wordPuzzleGenerator';
import { defaultPositiveWords } from '../config/defaultPositiveWords';

// Tests mirror prompt-fitur-word-puzzle-positif.md requirements.
describe('positive word puzzle modules', () => {
    it('extracts only explicit positive lexicon words from mixed journal text', () => {
        const words = extractPositiveWords('Hari ini aku bersyukur dan tenang setelah kelas. Meja dan laptop biasa saja.');
        expect(words.map(w => w.word)).toEqual(expect.arrayContaining(['bersyukur', 'tenang']));
        expect(words.map(w => w.word)).not.toContain('meja');
        expect(words.map(w => w.word)).not.toContain('laptop');
    });

    it('has enough default fallback positive words', () => {
        expect(defaultPositiveWords.length).toBeGreaterThanOrEqual(30);
    });

    it('places requested words at returned coordinates', () => {
        const puzzle = generateWordPuzzle(['TENANG', 'DAMAI', 'KUAT'], { size: 10, seed: 123 });
        expect(puzzle.positions.length).toBe(3);
        for (const position of puzzle.positions) {
            const rebuilt = position.coordinates.map(coord => puzzle.grid[coord.row][coord.col]).join('');
            expect(rebuilt).toBe(position.word);
        }
    });
});
