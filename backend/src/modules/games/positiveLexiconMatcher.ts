import { normalizeText, tokenize } from '../journal/analysis/normalizer';
import { positiveLexicon, PositiveLexiconEntry } from './config/positiveLexicon';
import { defaultPositiveWords } from './config/defaultPositiveWords';

export interface PositiveWordMatch extends PositiveLexiconEntry {
    count: number;
}

const stopwords = new Set([
    'yang', 'dan', 'atau', 'dari', 'untuk', 'dengan', 'sama', 'aku', 'saya', 'kamu', 'dia', 'ini', 'itu', 'ada', 'jadi', 'akan', 'sudah', 'belum', 'karena', 'dalam', 'pada', 'ke', 'di', 'se', 'nya', 'hari', 'tadi', 'banget',
]);

const lexiconByWord = new Map([...positiveLexicon, ...defaultPositiveWords].map(entry => [entry.word, entry]));

export const isValidPuzzleWord = (word: string) =>
    word.length >= 4 && word.length <= 10 && !stopwords.has(word) && lexiconByWord.has(word);

export const extractPositiveWords = (text: string): PositiveWordMatch[] => {
    const normalized = normalizeText(text);
    const tokens = tokenize(normalized);
    const counts = new Map<string, number>();

    for (const token of tokens) {
        if (!isValidPuzzleWord(token)) continue;
        counts.set(token, (counts.get(token) || 0) + 1);
    }

    return Array.from(counts.entries()).map(([word, count]) => ({
        ...lexiconByWord.get(word)!,
        count,
    }));
};

export const getPositiveLexiconWords = () => Array.from(lexiconByWord.values());
