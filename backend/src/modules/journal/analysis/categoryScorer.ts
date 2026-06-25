import { anxietyKeywords, AnxietyCategoryId, KeywordEntry } from '../config/anxietyKeywords';
import { isExcludedByNegation } from './negationHandler';

export interface CategoryMatch {
    category: AnxietyCategoryId;
    term: string;
    sentence: string;
    weight: number;
    sumber: string;
    excluded?: boolean;
    exclusionTerms?: string[];
}

export interface CategoryScoreResult {
    scores: Record<string, number>;
    matches: CategoryMatch[];
}

const sentenceContains = (sentence: string, term: string) => {
    const normalizedSentence = ` ${sentence.toLowerCase()} `;
    const normalizedTerm = ` ${term.toLowerCase()} `;
    return normalizedSentence.includes(normalizedTerm) || sentence.toLowerCase().includes(term.toLowerCase());
};

const scoreEntries = (sentence: string, category: AnxietyCategoryId, entries: KeywordEntry[]): CategoryMatch[] =>
    entries
        .filter(entry => sentenceContains(sentence, entry.term))
        .map(entry => {
            const negation = isExcludedByNegation(sentence, entry.term);
            return {
                category,
                term: entry.term,
                sentence,
                weight: entry.weight,
                sumber: entry.sumber,
                excluded: negation.excluded,
                exclusionTerms: negation.matchedTerms,
            };
        });

export const scoreCategoriesForNegativeSentence = (sentence: string): CategoryScoreResult => {
    const rawMatches = Object.entries(anxietyKeywords).flatMap(([category, entries]) =>
        scoreEntries(sentence, category as AnxietyCategoryId, entries),
    );

    const acceptedNonAbsolute = rawMatches.filter(match =>
        !match.excluded && match.category !== 'kata_absolut',
    );

    const acceptedMatches = rawMatches.filter(match => {
        if (match.excluded) return false;
        // Al-Mosaiwi & Johnstone (2018): kata absolut only supports another negative/anxiety signal.
        if (match.category === 'kata_absolut') return acceptedNonAbsolute.length > 0;
        return true;
    });

    const scores = acceptedMatches.reduce<Record<string, number>>((acc, match) => {
        acc[match.category] = (acc[match.category] || 0) + match.weight;
        return acc;
    }, {});

    return { scores, matches: rawMatches };
};
