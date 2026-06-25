export type Direction = 'horizontal' | 'vertical' | 'diagonal';

export interface WordPosition {
    word: string;
    direction: Direction;
    coordinates: Array<{ row: number; col: number }>;
}

export interface WordPuzzleGrid {
    grid: string[][];
    positions: WordPosition[];
    size: number;
}

interface GenerateOptions {
    size?: number;
    seed?: number;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const directions: Record<Direction, { dr: number; dc: number }> = {
    horizontal: { dr: 0, dc: 1 },
    vertical: { dr: 1, dc: 0 },
    diagonal: { dr: 1, dc: 1 },
};

const createRandom = (seed = Date.now()) => {
    let value = seed % 2147483647;
    if (value <= 0) value += 2147483646;
    return () => {
        value = (value * 16807) % 2147483647;
        return (value - 1) / 2147483646;
    };
};

const canPlace = (grid: string[][], word: string, row: number, col: number, direction: Direction) => {
    const { dr, dc } = directions[direction];
    for (let i = 0; i < word.length; i += 1) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r < 0 || c < 0 || r >= grid.length || c >= grid.length) return false;
        if (grid[r][c] && grid[r][c] !== word[i]) return false;
    }
    return true;
};

const place = (grid: string[][], word: string, row: number, col: number, direction: Direction): WordPosition => {
    const { dr, dc } = directions[direction];
    const coordinates = [];
    for (let i = 0; i < word.length; i += 1) {
        const r = row + dr * i;
        const c = col + dc * i;
        grid[r][c] = word[i];
        coordinates.push({ row: r, col: c });
    }
    return { word, direction, coordinates };
};

export const generateWordPuzzle = (words: string[], options: GenerateOptions = {}): WordPuzzleGrid => {
    const cleanWords = Array.from(new Set(words.map(word => word.toUpperCase().replace(/[^A-Z]/g, '')).filter(Boolean)))
        .sort((a, b) => b.length - a.length);
    const longest = Math.max(...cleanWords.map(word => word.length), 8);
    const size = Math.max(options.size || 0, longest + 2, Math.ceil(Math.sqrt(cleanWords.join('').length)) + 4, 8);
    const grid = Array.from({ length: size }, () => Array(size).fill(''));
    const random = createRandom(options.seed);
    const positions: WordPosition[] = [];

    for (const word of cleanWords) {
        let placed = false;
        for (let attempt = 0; attempt < 120 && !placed; attempt += 1) {
            const direction = Object.keys(directions)[Math.floor(random() * 3)] as Direction;
            const row = Math.floor(random() * size);
            const col = Math.floor(random() * size);
            if (canPlace(grid, word, row, col, direction)) {
                positions.push(place(grid, word, row, col, direction));
                placed = true;
            }
        }
    }

    for (let r = 0; r < size; r += 1) {
        for (let c = 0; c < size; c += 1) {
            if (!grid[r][c]) grid[r][c] = LETTERS[Math.floor(random() * LETTERS.length)];
        }
    }

    return { grid, positions, size };
};
