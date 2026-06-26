import { negativePolarityTerms, positivePolarityTerms } from '../config/anxietyKeywords';
import { tokenize } from './normalizer';

export interface PolarityResult {
    score: number;
    label: 'negative' | 'neutral' | 'positive';
    positiveMatches: string[];
    negativeMatches: string[];
}

const countMatches = (tokens: string[], terms: string[]) =>
    terms.filter(term => tokens.includes(term) || tokens.join(' ').includes(term));

export const scoreBasePolarity = (sentence: string): PolarityResult => {
    const tokens = tokenize(sentence);
    const positiveMatches = countMatches(tokens, positivePolarityTerms);
    const negativeMatches = countMatches(tokens, negativePolarityTerms);
    const score = negativeMatches.length - positiveMatches.length;

    return {
        score,
        label: score > 0 ? 'negative' : score < 0 ? 'positive' : 'neutral',
        positiveMatches,
        negativeMatches,
    };
};
