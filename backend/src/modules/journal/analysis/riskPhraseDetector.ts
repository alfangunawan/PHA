import { highRiskPhrases } from '../config/anxietyKeywords';

export interface RiskPhraseMatch {
    term: string;
    sumber: string;
}

const SOURCE = 'Bauer et al. (2024), JMIR Mental Health';
const GAP = '(?:\\s+\\p{L}+){0,3}\\s+';

const patternRules: Array<{ term: string; pattern: RegExp; sumber: string }> = [
    {
        term: 'intent mati',
        pattern: new RegExp(`\\b(?:aku\\s+|saya\\s+|gua\\s+|gue\\s+|gw\\s+)?(?:mau|ingin|pengen|pingin|kepengen|niat|berniat|rencana|berencana|terpikir|mending|lebih baik)${GAP}(?:mati|meninggal)\\b`, 'u'),
        sumber: SOURCE,
    },
    {
        term: 'intent bunuh diri',
        pattern: new RegExp(`\\b(?:aku\\s+|saya\\s+|gua\\s+|gue\\s+|gw\\s+)?(?:mau|ingin|pengen|pingin|kepengen|niat|berniat|rencana|berencana|terpikir|mending|lebih baik)?${GAP}?(?:bunuh diri|mengakhiri hidup|akhiri hidup)\\b`, 'u'),
        sumber: SOURCE,
    },
    {
        term: 'self harm method',
        pattern: /\b(?:gantung diri|minum racun|loncat dari|melukai diri|menyakiti diri|nyakitin diri|sakiti diri|lukai diri)\b/u,
        sumber: SOURCE,
    },
    {
        term: 'tidak mau hidup lagi',
        pattern: /\b(?:gak|tidak|nggak)\s+mau\s+hidup\s+lagi\b/u,
        sumber: SOURCE,
    },
    {
        term: 'hidup tidak kuat lagi',
        pattern: /\b(?:gak|tidak|nggak|sudah|udah)\s+(?:kuat|sanggup)\s+(?:hidup\s+)?lagi\b/u,
        sumber: SOURCE,
    },
];

export const detectRiskPhrases = (normalizedText: string): RiskPhraseMatch[] => {
    const matches = highRiskPhrases
        .filter(entry => normalizedText.includes(entry.term))
        .map(entry => ({ term: entry.term, sumber: entry.sumber }));

    for (const rule of patternRules) {
        if (rule.pattern.test(normalizedText) && !matches.some(match => match.term === rule.term)) {
            matches.push({ term: rule.term, sumber: rule.sumber });
        }
    }

    return matches;
};
