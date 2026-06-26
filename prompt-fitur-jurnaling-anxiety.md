# Prompt untuk Claude Code — Fitur Jurnaling dengan Deteksi Anxiety Rule-Based

> Cara pakai: tinggal copy-paste seluruh isi file ini ke Claude Code di root project lo. Kalau project lo udah punya stack tertentu (Flutter/Node/Python/dst), Claude Code akan otomatis nyesuaiin ke stack itu — tapi kalau mau lebih spesifik, tambahin satu baris di awal prompt misal: "Stack project ini: Flutter + Dart, state management Provider, backend Firebase."

---

## Konteks

Saya sedang mengembangkan modul gamifikasi untuk aplikasi *Personal Health Assistant* (PHA) yang menyasar mahasiswa dengan kecemasan akademik (diukur dengan GAD-7). Salah satu fitur di modul ini adalah **jurnaling**: pengguna menulis catatan harian bebas, dan sistem menganalisis teks jurnal tersebut secara **rule-based** (bukan machine learning/LLM) untuk mendeteksi indikasi kecemasan, lalu memunculkan respons/rekomendasi yang sesuai (misalnya menyarankan aktivitas mindfulness, atau — kalau terdeteksi frasa risiko tinggi — menampilkan informasi dukungan/hotline).

Pendekatan ini sengaja dibuat rule-based (bukan ML) karena ini riset skripsi tingkat sarjana dengan keterbatasan waktu dan data, dan rule-based lebih mudah dipertanggungjawabkan secara akademis (setiap aturan punya rujukan literatur yang jelas).

**Tolong bangun fitur ini sebagai modul yang modular dan well-tested**, dengan struktur sebagai berikut.

---

## 1. Pipeline yang harus dibangun

```
Input teks jurnal
   │
   ▼
[A] Text Cleaning & Case Folding
   │
   ▼
[B] Normalisasi (kamus tidak baku → baku, + fuzzy fallback)
   │
   ▼
[C] Deteksi Frasa Risiko Eksplisit (cek duluan, sebelum scoring biasa)
   │       │
   │       └─ Kalau ketemu → langsung tandai "risiko tinggi", tampilkan info dukungan, SKIP ke luar pipeline (jangan diproses scoring biasa lagi)
   ▼
[D] Segmentasi per kalimat
   │
   ▼
[E] Untuk setiap kalimat:
     - Hitung polaritas dasar kalimat (pakai lexicon umum / set kata positif-negatif sederhana)
     - Kalau polaritas dasar kalimat NETRAL/POSITIF → kata kategori anxiety di kalimat itu TIDAK dihitung (kecuali frasa risiko eksplisit yang sudah ditangani di langkah C)
     - Kalau polaritas dasar kalimat NEGATIF →
         - Cek window ±3 kata di sekitar tiap keyword match untuk negator/exception ("gak", "tidak", "bukan", "jangan", "bersyukur", "untung", dst). Kalau ada → keyword itu di-exclude dari skor.
         - Kalau lolos negation check → tambahkan ke skor kategori terkait
   ▼
[F] Agregasi skor per kategori + skor total per entri jurnal
   │
   ▼
[G] Klasifikasi level (misal: rendah / sedang / tinggi) berdasarkan threshold yang bisa dikonfigurasi
   │
   ▼
Output: { level, skor_per_kategori, kalimat_yang_ter-flag, rekomendasi }
```

---

## 2. Daftar kategori keyword (config-driven, JANGAN di-hardcode)

Simpan sebagai file konfigurasi terpisah (JSON/YAML, terserah sesuai stack), bukan ditulis langsung di kode logic. Setiap entri keyword **wajib menyimpan field `sumber`** supaya saya bisa tunjukkan ke dosen dasar literaturnya kalau ditanya.

### Kategori A — Spesifik anxiety (bobot lebih tinggi)

| kategori_id | contoh kata/frasa | sumber |
|---|---|---|
| `antisipasi_khawatir` | "gimana kalau", "bagaimana kalau", "takut terjadi", "khawatir kalau", "nanti gimana" | Stamatis et al. (2022), *Depression and Anxiety* — bahasa antisipasi tetap berkorelasi unik dengan generalized anxiety setelah dikontrol gejala depresi |
| `afiliasi_sosial` | "teman", "bareng", "keluarga", "bersama", "saling" | Stamatis et al. (2022); Abutara et al. (2025), *Frontiers in Psychology* |
| `kewaspadaan_tubuh` | "jantung berdebar", "sesak", "dada sesak", "gemetar", "pusing", "mual", "sulit bernapas" | Peterson et al. (2024), *PLOS ONE* — linguistic markers of health anxiety |
| `penurunan_leisure` (fitur "ketidakhadiran kata") | indikator: kata "santai", "liburan", "main", "uang", "duit" SEDIKIT muncul relatif terhadap panjang teks | Abutara et al. (2025) |

### Kategori B — Pendukung distress umum (bobot lebih rendah, butuh kombinasi)

| kategori_id | contoh kata/frasa | sumber |
|---|---|---|
| `emosi_negatif` | "cemas", "khawatir", "gelisah", "panik", "takut", "tegang", "deg-degan" | Avram et al. (2024), *SAGE Open* (memakai GAD-7 langsung) |
| `kata_absolut` | "selalu", "tidak pernah", "semua", "tidak ada", "harus", "pasti", "sama sekali" | Al-Mosaiwi & Johnstone (2018), *Clinical Psychological Science* |
| `diferensiasi` | "tapi", "kecuali", "selain", "namun" | Avram et al. (2024) |

### Tier C — Frasa risiko eksplisit (selalu trigger, TIDAK butuh scoring/threshold)

| kategori_id | contoh frasa | catatan |
|---|---|---|
| `risiko_tinggi` | "mau bunuh diri", "ingin mati", "capek hidup", "gak mau hidup lagi", "pengen mati aja", "udah gak kuat lagi" | Begitu match (setelah normalisasi), **langsung** keluarkan flag risiko tinggi tanpa menunggu scoring kategori lain. Tema pendukung: disconnection, burdensomeness, hopelessness, desperation (Bauer et al., 2024, *JMIR Mental Health*) |

> Catatan penting: kata di `kata_absolut` JANGAN dipakai sebagai pemicu tunggal. Dia hanya valid sebagai sinyal kalau co-occur dengan kategori lain dalam kalimat yang polaritas dasarnya sudah negatif (lihat langkah [E] di pipeline).

---

## 3. Normalisasi kata tidak baku/singkatan

Bangun **kamus normalisasi** (mapping kata tidak baku → kata baku), contoh: `bnuh → bunuh`, `mti → mati`, `cpek → capek`, `gk → gak`, `tdk → tidak`. Simpan sebagai data terpisah (CSV/JSON), bukan hardcoded di logic, supaya saya bisa nambahin entri baru tanpa ubah kode.

Untuk kata yang TIDAK ada di kamus, tambahkan fallback **fuzzy matching** pakai Levenshtein distance terhadap kata target di kategori (threshold jarak ≤ 2). Tulis fungsi ini sebagai modul terpisah yang reusable, dan buat unit test yang membandingkan beberapa varian singkatan terhadap kata bakunya.

Dasar akademis pendekatan ini: Khomsah & Hidayatullah (2020) — normalisasi slang ke kata baku menaikkan akurasi sentiment analysis; Dyasputro (2025) — *indo-normalizer*, library rule-based khusus teks informal Bahasa Indonesia.

---

## 4. Penanganan negasi/exception (anti false-positive)

Ini bagian paling kritis. Tujuannya: kata seperti "selalu" yang muncul di kalimat **positif** ("saya selalu bersyukur") TIDAK boleh ikut menaikkan skor negatif.

Implementasikan sebagai modul terpisah `negationHandler` (atau nama sesuai konvensi stack lo) dengan tanggung jawab:
1. Menerima kalimat + posisi keyword yang match.
2. Mengecek window ±3 token di sekitar posisi tersebut.
3. Kalau ada token negator/exception (daftar dikonfigurasi, bukan hardcoded) → return `excluded = true`.
4. Kalau tidak → return `excluded = false`, keyword ikut dihitung.

Dasar akademis: Taboada et al. (2011), *Computational Linguistics* (SO-CAL) — lexicon-based sentiment **wajib** menggabungkan negasi & intensifier ke dalam skor, tidak bisa hitung kata mentah; Punetha & Saxena (2023) — masalah utama lexicon-based tradisional adalah gagal menentukan negation window yang tepat.

---

## 5. Yang saya minta dari kamu (Claude Code)

1. **Ajukan struktur folder/modul** yang sesuai dengan stack project ini sebelum mulai menulis kode (tanya saya kalau perlu konfirmasi).
2. Implementasikan pipeline di atas sebagai fungsi-fungsi/modul yang **terpisah dan testable** (jangan satu fungsi raksasa): `normalizer`, `riskPhraseDetector`, `sentenceSegmenter`, `basePolarityScorer`, `negationHandler`, `categoryScorer`, `levelClassifier`.
3. File konfigurasi keyword & kamus normalisasi dipisah dari logic (format JSON/YAML, sesuaikan konvensi stack).
4. Tulis **unit test** yang mencakup minimal:
   - Normalisasi singkatan (`bnuh`, `mti`, `cpek`, dan beberapa variasi typo lain)
   - Kasus false-positive yang harus LOLOS (tidak ter-flag): kalimat dengan kata absolut tapi konteks positif (contoh: "aku selalu bersyukur sama hidup ini")
   - Kasus true-positive yang harus ter-flag: kombinasi kata kategori A + B dalam kalimat negatif
   - Kasus frasa risiko eksplisit yang harus langsung trigger tier C terlepas dari skor kategori lain
5. Tambahkan komentar/dokumentasi inline yang merujuk ke `sumber` di tabel kategori, supaya kode ini bisa langsung jadi lampiran/bukti implementasi metode di skripsi saya.
6. **Jangan implementasikan ini sebagai pengganti diagnosis klinis** — ini adalah alat bantu screening sederhana. Pastikan setiap kali tier C (risiko tinggi) terdeteksi, output-nya mengarahkan ke informasi dukungan, bukan cuma logging diam-diam.

Tolong mulai dengan mengusulkan struktur modul dan file konfigurasi, baru lanjut ke implementasi pipeline.
