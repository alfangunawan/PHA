import { levelThresholds } from '../config/anxietyKeywords';

export type AnxietyLevelValue = 'rendah' | 'sedang' | 'tinggi' | 'risiko_tinggi';

export const classifyLevel = (score: number, highRisk = false): AnxietyLevelValue => {
    if (highRisk) return 'risiko_tinggi';
    if (score <= levelThresholds.rendahMax) return 'rendah';
    if (score <= levelThresholds.sedangMax) return 'sedang';
    return 'tinggi';
};
