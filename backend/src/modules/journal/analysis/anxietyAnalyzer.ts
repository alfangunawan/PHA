import { anxietyKeywords } from '../config/anxietyKeywords';
import { normalizeText } from './normalizer';
import { detectRiskPhrases } from './riskPhraseDetector';
import { segmentSentences } from './sentenceSegmenter';
import { scoreBasePolarity } from './basePolarityScorer';
import { scoreCategoriesForNegativeSentence, CategoryMatch } from './categoryScorer';
import { AnxietyLevelValue, classifyLevel } from './levelClassifier';

export interface AnxietyAnalysisResult {
    level: AnxietyLevelValue;
    skor_per_kategori: Record<string, number>;
    kalimat_yang_terflag: Array<{ sentence: string; matches: CategoryMatch[] }>;
    rekomendasi: string[];
    totalScore: number;
    normalizedText: string;
    highRisk: boolean;
    riskPhrases: Array<{ term: string; sumber: string }>;
    sentencePolarity: Array<{ sentence: string; label: string; score: number }>;
}

const SUPPORT_RECOMMENDATIONS = [
    'Kamu tidak sendirian. Segera hubungi orang tepercaya, keluarga, dosen wali, konselor kampus, atau layanan darurat setempat jika kamu merasa tidak aman.',
    'Jika ada dorongan menyakiti diri, jauhi benda berbahaya dan minta seseorang menemani sekarang juga.',
];

const recommendationsByLevel: Record<string, string[]> = {
    rendah: ['Terima kasih sudah menulis jurnal. Pertahankan kebiasaan refleksi dan coba latihan napas singkat bila dibutuhkan.'],
    sedang: ['Ada beberapa sinyal kecemasan. Coba pilih latihan pernapasan atau meditasi singkat dari modul mindfulness hari ini.'],
    tinggi: ['Sinyal kecemasan terlihat cukup kuat. Pertimbangkan berbagi cerita dengan orang tepercaya dan gunakan latihan grounding/pernapasan.'],
    risiko_tinggi: SUPPORT_RECOMMENDATIONS,
};

const countCategoryTermsInText = (text: string, category: keyof typeof anxietyKeywords) =>
    anxietyKeywords[category].filter(entry => text.includes(entry.term)).length;

export const analyzeAnxiety = (content: string): AnxietyAnalysisResult => {
    const normalizedText = normalizeText(content);
    const riskPhrases = detectRiskPhrases(normalizedText);

    if (riskPhrases.length > 0) {
        return {
            level: 'risiko_tinggi',
            skor_per_kategori: { risiko_tinggi: 999 },
            kalimat_yang_terflag: [{ sentence: normalizedText, matches: [] }],
            rekomendasi: recommendationsByLevel.risiko_tinggi,
            totalScore: 999,
            normalizedText,
            highRisk: true,
            riskPhrases,
            sentencePolarity: [],
        };
    }

    const sentences = segmentSentences(normalizedText);
    const skor_per_kategori: Record<string, number> = {};
    const kalimat_yang_terflag: AnxietyAnalysisResult['kalimat_yang_terflag'] = [];
    const sentencePolarity: AnxietyAnalysisResult['sentencePolarity'] = [];

    for (const sentence of sentences) {
        const polarity = scoreBasePolarity(sentence);
        sentencePolarity.push({ sentence, label: polarity.label, score: polarity.score });
        if (polarity.label !== 'negative') continue;

        const categoryResult = scoreCategoriesForNegativeSentence(sentence);
        const acceptedMatches = categoryResult.matches.filter(match => !match.excluded && (
            match.category !== 'kata_absolut' || categoryResult.scores.kata_absolut
        ));

        for (const [category, score] of Object.entries(categoryResult.scores)) {
            skor_per_kategori[category] = (skor_per_kategori[category] || 0) + score;
        }

        if (acceptedMatches.length > 0) {
            kalimat_yang_terflag.push({ sentence, matches: acceptedMatches });
        }
    }

    // Abutara et al. (2025): low leisure vocabulary can support distress scoring for longer negative entries.
    const hasNegativeSignal = Object.values(skor_per_kategori).some(score => score > 0);
    const wordCount = normalizedText.split(/\s+/).filter(Boolean).length;
    const leisureCount = countCategoryTermsInText(normalizedText, 'penurunan_leisure');
    if (hasNegativeSignal && wordCount >= 20 && leisureCount === 0) {
        skor_per_kategori.penurunan_leisure = (skor_per_kategori.penurunan_leisure || 0) + 1;
    }

    const totalScore = Object.values(skor_per_kategori).reduce((sum, score) => sum + score, 0);
    const level = classifyLevel(totalScore);

    return {
        level,
        skor_per_kategori,
        kalimat_yang_terflag,
        rekomendasi: recommendationsByLevel[level] || recommendationsByLevel.rendah,
        totalScore,
        normalizedText,
        highRisk: false,
        riskPhrases,
        sentencePolarity,
    };
};
