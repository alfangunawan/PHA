import { normalizationDictionary } from '../config/normalizationDictionary';
import { anxietyKeywords, highRiskPhrases, negativePolarityTerms, positivePolarityTerms } from '../config/anxietyKeywords';

const allTargetTerms = Array.from(new Set([
    ...Object.values(anxietyKeywords).flatMap(entries => entries.flatMap(entry => entry.term.split(' '))),
    ...highRiskPhrases.flatMap(entry => entry.term.split(' ')),
    ...negativePolarityTerms,
    ...positivePolarityTerms,
])).filter(term => term.length > 3);

export const levenshteinDistance = (a: string, b: string): number => {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i += 1) {
        for (let j = 1; j <= b.length; j += 1) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost,
            );
        }
    }
    return matrix[a.length][b.length];
};

export const tokenize = (text: string): string[] =>
    text
        .toLowerCase()
        .replace(/[^a-zA-ZÀ-ÿÀ-ɏḀ-ỿ\p{L}\p{N}\s-]/gu, ' ')
        .split(/\s+/)
        .map(token => token.trim())
        .filter(Boolean);

const reduceRepeatedLetters = (word: string) => word.replace(/([a-z])\1{2,}/gi, '$1');

export const normalizeToken = (token: string): string => {
    const clean = reduceRepeatedLetters(token.toLowerCase().trim());
    if (!clean) return clean;
    if (normalizationDictionary[clean]) return normalizationDictionary[clean];

    let best = clean;
    let bestDistance = 3;
    for (const target of allTargetTerms) {
        if (Math.abs(target.length - clean.length) > 2) continue;
        const distance = levenshteinDistance(clean, target);
        if (distance <= 2 && distance < bestDistance) {
            best = target;
            bestDistance = distance;
        }
    }
    return best;
};

export const normalizeText = (text: string): string => {
    const spaced = text
        .toLowerCase()
        .replace(/[“”]/g, '"')
        .replace(/[’]/g, "'")
        .replace(/\s+/g, ' ')
        .trim();

    return spaced
        .split(/(\s+|[.!?\n]+)/)
        .map(part => {
            if (/^\s+$/.test(part) || /^[.!?\n]+$/.test(part)) return part;
            if (!part.trim()) return part;
            return normalizeToken(part.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''));
        })
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
};
