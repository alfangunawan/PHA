import { exceptionTerms, negationTerms } from '../config/negationExceptions';
import { tokenize } from './normalizer';

export interface NegationResult {
    excluded: boolean;
    matchedTerms: string[];
}

export const isExcludedByNegation = (sentence: string, keyword: string, windowSize = 3): NegationResult => {
    const tokens = tokenize(sentence);
    const keywordTokens = tokenize(keyword);
    const text = tokens.join(' ');
    if (!text.includes(keywordTokens.join(' '))) return { excluded: false, matchedTerms: [] };

    const firstToken = keywordTokens[0];
    const index = tokens.findIndex(token => token === firstToken);
    if (index === -1) return { excluded: false, matchedTerms: [] };

    const start = Math.max(0, index - windowSize);
    const end = Math.min(tokens.length, index + keywordTokens.length + windowSize);
    const window = tokens.slice(start, end);
    const matchedTerms = [...negationTerms, ...exceptionTerms].filter(term => window.includes(term));
    return { excluded: matchedTerms.length > 0, matchedTerms };
};
