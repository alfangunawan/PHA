export interface PositiveLexiconEntry {
    word: string;
    category: 'syukur_kepuasan' | 'ketenangan' | 'semangat_capaian' | 'kebahagiaan' | 'koneksi_sosial_positif';
    sumber: string;
}

export const positiveLexicon: PositiveLexiconEntry[] = [
    { word: 'bersyukur', category: 'syukur_kepuasan', sumber: 'Linton et al. (2021), JMIR' },
    { word: 'puas', category: 'syukur_kepuasan', sumber: 'Linton et al. (2021), JMIR' },
    { word: 'cukup', category: 'syukur_kepuasan', sumber: 'Linton et al. (2021), JMIR' },
    { word: 'berkecukupan', category: 'syukur_kepuasan', sumber: 'Linton et al. (2021), JMIR' },
    { word: 'tenang', category: 'ketenangan', sumber: 'Vine et al. (2020), Nature Communications; Lomas (2017)' },
    { word: 'damai', category: 'ketenangan', sumber: 'Vine et al. (2020), Nature Communications; Lomas (2017)' },
    { word: 'lega', category: 'ketenangan', sumber: 'Vine et al. (2020), Nature Communications; Lomas (2017)' },
    { word: 'nyaman', category: 'ketenangan', sumber: 'Vine et al. (2020), Nature Communications; Lomas (2017)' },
    { word: 'rileks', category: 'ketenangan', sumber: 'Vine et al. (2020), Nature Communications; Lomas (2017)' },
    { word: 'semangat', category: 'semangat_capaian', sumber: 'Vine et al. (2020), Nature Communications' },
    { word: 'berhasil', category: 'semangat_capaian', sumber: 'Vine et al. (2020), Nature Communications' },
    { word: 'mampu', category: 'semangat_capaian', sumber: 'Vine et al. (2020), Nature Communications' },
    { word: 'kuat', category: 'semangat_capaian', sumber: 'Vine et al. (2020), Nature Communications' },
    { word: 'usaha', category: 'semangat_capaian', sumber: 'Vine et al. (2020), Nature Communications' },
    { word: 'progres', category: 'semangat_capaian', sumber: 'Vine et al. (2020), Nature Communications' },
    { word: 'senang', category: 'kebahagiaan', sumber: 'Vine et al. (2020), Nature Communications; Lomas (2017)' },
    { word: 'bahagia', category: 'kebahagiaan', sumber: 'Vine et al. (2020), Nature Communications; Lomas (2017)' },
    { word: 'ceria', category: 'kebahagiaan', sumber: 'Vine et al. (2020), Nature Communications; Lomas (2017)' },
    { word: 'gembira', category: 'kebahagiaan', sumber: 'Vine et al. (2020), Nature Communications; Lomas (2017)' },
    { word: 'dukungan', category: 'koneksi_sosial_positif', sumber: 'Linton et al. (2021), JMIR' },
    { word: 'bersama', category: 'koneksi_sosial_positif', sumber: 'Linton et al. (2021), JMIR' },
    { word: 'sayang', category: 'koneksi_sosial_positif', sumber: 'Linton et al. (2021), JMIR' },
    { word: 'peduli', category: 'koneksi_sosial_positif', sumber: 'Linton et al. (2021), JMIR' },
];
