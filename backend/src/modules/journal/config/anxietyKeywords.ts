export type AnxietyCategoryId =
    | 'antisipasi_khawatir'
    | 'afiliasi_sosial'
    | 'kewaspadaan_tubuh'
    | 'penurunan_leisure'
    | 'emosi_negatif'
    | 'kata_absolut'
    | 'diferensiasi'
    | 'risiko_tinggi';

export interface KeywordEntry {
    term: string;
    weight: number;
    sumber: string;
}

export const anxietyKeywords: Record<Exclude<AnxietyCategoryId, 'risiko_tinggi'>, KeywordEntry[]> = {
    // Stamatis et al. (2022): bahasa antisipasi tetap berkorelasi unik dengan generalized anxiety.
    antisipasi_khawatir: [
        { term: 'gimana kalau', weight: 3, sumber: 'Stamatis et al. (2022), Depression and Anxiety' },
        { term: 'bagaimana kalau', weight: 3, sumber: 'Stamatis et al. (2022), Depression and Anxiety' },
        { term: 'takut terjadi', weight: 3, sumber: 'Stamatis et al. (2022), Depression and Anxiety' },
        { term: 'khawatir kalau', weight: 3, sumber: 'Stamatis et al. (2022), Depression and Anxiety' },
        { term: 'nanti gimana', weight: 3, sumber: 'Stamatis et al. (2022), Depression and Anxiety' },
    ],
    // Stamatis et al. (2022) dan Abutara et al. (2025): sinyal afiliasi/sosial.
    afiliasi_sosial: [
        { term: 'teman', weight: 2, sumber: 'Stamatis et al. (2022); Abutara et al. (2025), Frontiers in Psychology' },
        { term: 'bareng', weight: 2, sumber: 'Stamatis et al. (2022); Abutara et al. (2025), Frontiers in Psychology' },
        { term: 'keluarga', weight: 2, sumber: 'Stamatis et al. (2022); Abutara et al. (2025), Frontiers in Psychology' },
        { term: 'bersama', weight: 2, sumber: 'Stamatis et al. (2022); Abutara et al. (2025), Frontiers in Psychology' },
        { term: 'saling', weight: 2, sumber: 'Stamatis et al. (2022); Abutara et al. (2025), Frontiers in Psychology' },
        { term: 'sendirian', weight: 2, sumber: 'Stamatis et al. (2022); Abutara et al. (2025), Frontiers in Psychology' },
    ],
    // Peterson et al. (2024): marker linguistik health anxiety/kewaspadaan tubuh.
    kewaspadaan_tubuh: [
        { term: 'jantung berdebar', weight: 4, sumber: 'Peterson et al. (2024), PLOS ONE' },
        { term: 'sesak', weight: 4, sumber: 'Peterson et al. (2024), PLOS ONE' },
        { term: 'dada sesak', weight: 4, sumber: 'Peterson et al. (2024), PLOS ONE' },
        { term: 'gemetar', weight: 4, sumber: 'Peterson et al. (2024), PLOS ONE' },
        { term: 'pusing', weight: 3, sumber: 'Peterson et al. (2024), PLOS ONE' },
        { term: 'mual', weight: 3, sumber: 'Peterson et al. (2024), PLOS ONE' },
        { term: 'sulit bernapas', weight: 4, sumber: 'Peterson et al. (2024), PLOS ONE' },
        { term: 'deg-degan', weight: 4, sumber: 'Peterson et al. (2024), PLOS ONE' },
    ],
    penurunan_leisure: [
        { term: 'santai', weight: 1, sumber: 'Abutara et al. (2025), Frontiers in Psychology' },
        { term: 'liburan', weight: 1, sumber: 'Abutara et al. (2025), Frontiers in Psychology' },
        { term: 'main', weight: 1, sumber: 'Abutara et al. (2025), Frontiers in Psychology' },
        { term: 'uang', weight: 1, sumber: 'Abutara et al. (2025), Frontiers in Psychology' },
        { term: 'duit', weight: 1, sumber: 'Abutara et al. (2025), Frontiers in Psychology' },
    ],
    emosi_negatif: [
        { term: 'cemas', weight: 2, sumber: 'Avram et al. (2024), SAGE Open' },
        { term: 'khawatir', weight: 2, sumber: 'Avram et al. (2024), SAGE Open' },
        { term: 'gelisah', weight: 2, sumber: 'Avram et al. (2024), SAGE Open' },
        { term: 'panik', weight: 2, sumber: 'Avram et al. (2024), SAGE Open' },
        { term: 'takut', weight: 2, sumber: 'Avram et al. (2024), SAGE Open' },
        { term: 'tegang', weight: 2, sumber: 'Avram et al. (2024), SAGE Open' },
        { term: 'deg-degan', weight: 2, sumber: 'Avram et al. (2024), SAGE Open' },
        { term: 'capek', weight: 1, sumber: 'Avram et al. (2024), SAGE Open' },
        { term: 'lelah', weight: 1, sumber: 'Avram et al. (2024), SAGE Open' },
    ],
    // Al-Mosaiwi & Johnstone (2018): kata absolut hanya sinyal pendukung, bukan trigger tunggal.
    kata_absolut: [
        { term: 'selalu', weight: 1, sumber: 'Al-Mosaiwi & Johnstone (2018), Clinical Psychological Science' },
        { term: 'tidak pernah', weight: 1, sumber: 'Al-Mosaiwi & Johnstone (2018), Clinical Psychological Science' },
        { term: 'semua', weight: 1, sumber: 'Al-Mosaiwi & Johnstone (2018), Clinical Psychological Science' },
        { term: 'tidak ada', weight: 1, sumber: 'Al-Mosaiwi & Johnstone (2018), Clinical Psychological Science' },
        { term: 'harus', weight: 1, sumber: 'Al-Mosaiwi & Johnstone (2018), Clinical Psychological Science' },
        { term: 'pasti', weight: 1, sumber: 'Al-Mosaiwi & Johnstone (2018), Clinical Psychological Science' },
        { term: 'sama sekali', weight: 1, sumber: 'Al-Mosaiwi & Johnstone (2018), Clinical Psychological Science' },
    ],
    diferensiasi: [
        { term: 'tapi', weight: 1, sumber: 'Avram et al. (2024), SAGE Open' },
        { term: 'kecuali', weight: 1, sumber: 'Avram et al. (2024), SAGE Open' },
        { term: 'selain', weight: 1, sumber: 'Avram et al. (2024), SAGE Open' },
        { term: 'namun', weight: 1, sumber: 'Avram et al. (2024), SAGE Open' },
    ],
};

export const highRiskPhrases: KeywordEntry[] = [
    { term: 'mau mati', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
    { term: 'aku mau mati', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
    { term: 'gua mau mati', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
    { term: 'gw mau mati', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
    { term: 'gue mau mati', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
    { term: 'pengen mati', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
    { term: 'pingin mati', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
    { term: 'bunuh diri', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
    { term: 'mengakhiri hidup', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
    { term: 'mau bunuh diri', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
    { term: 'ingin mati', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
    { term: 'capek hidup', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
    { term: 'gak mau hidup lagi', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
    { term: 'tidak mau hidup lagi', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
    { term: 'pengen mati aja', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
    { term: 'ingin mati saja', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
    { term: 'udah gak kuat lagi', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
    { term: 'sudah gak kuat lagi', weight: 999, sumber: 'Bauer et al. (2024), JMIR Mental Health' },
];

export const negativePolarityTerms = ['cemas', 'khawatir', 'gelisah', 'panik', 'takut', 'tegang', 'capek', 'lelah', 'sesak', 'pusing', 'mual', 'sendirian', 'sulit', 'gagal', 'buruk', 'hancur', 'menangis'];
export const positivePolarityTerms = ['bersyukur', 'tenang', 'lega', 'nyaman', 'aman', 'mampu', 'semangat', 'baik', 'senang', 'bahagia', 'dukungan', 'peduli'];

export const levelThresholds = {
    rendahMax: 3,
    sedangMax: 8,
};
