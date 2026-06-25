import { describe, expect, it } from 'vitest';
import { normalizeText } from '../normalizer';
import { analyzeAnxiety } from '../anxietyAnalyzer';

// Tests mirror prompt-fitur-jurnaling-anxiety.md requirements.
describe('journal anxiety analyzer', () => {
    it('normalizes slang and typo abbreviations', () => {
        expect(normalizeText('bnuh mti cpek gk tdk')).toContain('bunuh');
        expect(normalizeText('bnuh mti cpek gk tdk')).toContain('mati');
        expect(normalizeText('bnuh mti cpek gk tdk')).toContain('capek');
        expect(normalizeText('bnuh mti cpek gk tdk')).toContain('gak');
        expect(normalizeText('bnuh mti cpek gk tdk')).toContain('tidak');
    });

    it('avoids false positives for positive absolute-word context', () => {
        const result = analyzeAnxiety('aku selalu bersyukur sama hidup ini');
        expect(result.highRisk).toBe(false);
        expect(result.totalScore).toBe(0);
        expect(result.kalimat_yang_terflag).toHaveLength(0);
    });

    it('flags category A and B terms in negative sentence context', () => {
        const result = analyzeAnxiety('Aku cemas dan khawatir kalau nanti gagal, jantung berdebar dan sulit bernapas.');
        expect(result.totalScore).toBeGreaterThan(3);
        expect(result.skor_per_kategori.antisipasi_khawatir).toBeGreaterThan(0);
        expect(result.skor_per_kategori.emosi_negatif).toBeGreaterThan(0);
        expect(result.kalimat_yang_terflag.length).toBeGreaterThan(0);
    });

    it('short-circuits explicit high-risk phrases regardless ordinary score', () => {
        const result = analyzeAnxiety('Aku capek hidup dan ingin mati saja.');
        expect(result.highRisk).toBe(true);
        expect(result.level).toBe('risiko_tinggi');
        expect(result.totalScore).toBe(999);
        expect(result.rekomendasi.join(' ')).toContain('hubungi');
    });

    it('flags direct death intent phrase mau mati as high risk', () => {
        const result = analyzeAnxiety('MAU MATI GUA');
        expect(result.highRisk).toBe(true);
        expect(result.level).toBe('risiko_tinggi');
        expect(result.totalScore).toBe(999);
        expect(result.riskPhrases.length).toBeGreaterThan(0);
    });

    it('flags profanity-prefixed death intent as high risk', () => {
        const result = analyzeAnxiety('ajg mau mati');
        expect(result.highRisk).toBe(true);
        expect(result.level).toBe('risiko_tinggi');
        expect(result.totalScore).toBe(999);
    });

    it('flags slang first-person death intent variants as high risk', () => {
        for (const text of ['gw mau mati', 'gw pengen mati', 'gue pingin mati', 'aku ingin mati']) {
            const result = analyzeAnxiety(text);
            expect(result.highRisk).toBe(true);
            expect(result.level).toBe('risiko_tinggi');
            expect(result.totalScore).toBe(999);
        }
    });

    it('flags broader death/self-harm intent patterns as high risk', () => {
        for (const text of ['rasanya mending mati aja', 'aku kepikiran bunuh diri', 'pengen mengakhiri hidup', 'tidak mau hidup lagi', 'mau nyakitin diri']) {
            const result = analyzeAnxiety(text);
            expect(result.highRisk).toBe(true);
            expect(result.level).toBe('risiko_tinggi');
            expect(result.totalScore).toBe(999);
        }
    });
});
