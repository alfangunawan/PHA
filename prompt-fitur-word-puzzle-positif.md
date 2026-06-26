# Prompt untuk Claude Code — Word Puzzle dengan Kata Positif Personalisasi dari Jurnal

> Cara pakai: paste seluruh isi file ini ke Claude Code di root project, idealnya SETELAH modul jurnal & rule-based anxiety detector (dari prompt sebelumnya) sudah ada di codebase, karena fitur ini reuse beberapa modul dari situ.

---

## Konteks

Modul gamifikasi PHA ini punya beberapa micro-game, salah satunya **Word Puzzle**. Bedanya dari word puzzle biasa: kata-kata yang muncul di puzzle bukan kata random, melainkan **kata-kata positif yang diekstrak dari jurnal pengguna sendiri**. Tujuannya supaya pengguna "ditemukan kembali" dengan kata-kata positif yang pernah mereka tulis sendiri (efek savoring/penguatan kosakata positif).

Dasar akademis pendekatan ini:
- Vine et al. (2020), *Nature Communications* — kosakata emosi positif yang lebih kaya/sering dipakai berkorelasi dengan wellbeing yang lebih tinggi.
- Linton et al. (2021), *JMIR* — penugasan menulis soal rasa syukur & kekuatan diri terbukti meningkatkan nada emosi positif pada jurnal mahasiswa.
- (Opsional, kalau diakses) Lomas (2017), *International Journal of Wellbeing* — taksonomi afek positif lintas budaya (peace/calm, contentment, savouring, joy, dst), bisa dipakai sebagai label kategori kalau mau lebih granular.

---

## 1. Pipeline yang harus dibangun

```
Jurnal pengguna (N entri terakhir, misal 5-10 entri)
   │
   ▼
[A] Reuse modul normalizer yang sudah ada (normalisasi singkatan/typo)
   │
   ▼
[B] Cocokkan ke LEXICON POSITIF (lihat tabel di bawah) — INI LEXICON BARU,
   │    terpisah total dari lexicon negatif/risiko yang sudah dibuat sebelumnya
   ▼
[C] Filter hasil ekstraksi:
     - Panjang kata 4–10 karakter (supaya pas buat grid puzzle)
     - Bukan stopword/kata fungsi (dan, di, yang, dst)
     - Valid sebagai kata kamus (cek ke wordlist Bahasa Indonesia)
     - Deduplikasi
   │
   ▼
[D] Simpan ke "bank kata positif personal" milik user (per user, append seiring waktu)
   │
   ▼
[E] Saat user membuka Word Puzzle:
     - Ambil kebutuhan kata (misal 8 kata per sesi)
     - Prioritaskan dari bank personal user, EXCLUDE kata yang dipakai di N sesi
       puzzle terakhir (biar gak monoton)
     - Kalau jumlah kata personal < kebutuhan → tambal kekurangannya dari
       BANK KATA DEFAULT (lihat bagian 3)
   │
   ▼
[F] Generate grid word search dari daftar kata final (horizontal/vertikal/diagonal,
   ukuran grid menyesuaikan jumlah & panjang kata terpanjang)
```

---

## 2. Lexicon positif (config-driven, terpisah file dari lexicon negatif)

| kategori_id | contoh kata | sumber |
|---|---|---|
| `syukur_kepuasan` | "bersyukur", "puas", "cukup", "berkecukupan" | Linton et al. (2021), *JMIR* |
| `ketenangan` | "tenang", "damai", "lega", "nyaman", "rileks" | Vine et al. (2020); (opsional) Lomas (2017) kategori peace/calm |
| `semangat_capaian` | "semangat", "berhasil", "mampu", "kuat", "usaha", "progres" | Vine et al. (2020) — kosakata emosi positif terkait kompetensi |
| `kebahagiaan` | "senang", "bahagia", "ceria", "gembira" | Vine et al. (2020); (opsional) Lomas (2017) kategori joy/euphoria |
| `koneksi_sosial_positif` | "dukungan", "bersama", "sayang", "peduli" | Linton et al. (2021) — kata sosial berkorelasi dengan nada emosi positif jurnal |

> **Wajib dipisah dari lexicon negatif/risiko.** Jangan pernah implementasikan ini sebagai "kata yang tidak ke-flag negatif" — itu beda dengan kata yang benar-benar positif. Lexicon ini harus whitelist eksplisit.

---

## 3. Bank kata default (fallback)

Siapkan daftar kata positif default (curated, statis, tidak bergantung jurnal user) untuk kondisi:
- User baru / belum pernah jurnal (cold start)
- Jumlah kata personal yang berhasil diekstrak kurang dari kebutuhan grid

Simpan di file konfigurasi terpisah, isi minimal 30-40 kata dari kategori yang sama seperti di atas, supaya bisa dicampur secara konsisten dengan kata personal.

Rasio campuran yang disarankan: prioritaskan kata personal dulu, baru tambal sisanya dari default — jangan 100% default kalau user sebenarnya sudah punya cukup kata personal (tujuannya tetap personalisasi).

---

## 4. Generator grid word puzzle

Implementasikan sebagai modul terpisah `wordPuzzleGenerator`, menerima input: daftar kata final (array of string) + ukuran grid (opsional, auto-calculate berdasar kata terpanjang kalau tidak diisi). Tanggung jawab:
- Menempatkan tiap kata di grid (horizontal, vertikal, diagonal — minimal horizontal & vertikal kalau mau simpel dulu)
- Mengisi sel kosong sisanya dengan huruf random
- Memastikan tidak ada kata yang tumpang tindih merusak kata lain
- Mengembalikan: grid huruf 2D + posisi/koordinat tiap kata (untuk validasi jawaban saat user main)

Ini bagian generic computer science, tidak perlu rujukan akademis — tapi tetap harus testable (unit test: kata muncul tepat sesuai posisi yang dikembalikan, grid tidak ada cell kosong yang seharusnya terisi, dst).

---

## 5. Yang saya minta dari kamu (Claude Code)

1. Cek dulu struktur modul jurnal & normalizer yang sudah ada di codebase ini (dari fitur sebelumnya), dan **reuse**, jangan duplikat logic normalisasi.
2. Buat modul/fungsi terpisah: `positiveLexiconMatcher`, `personalWordBank` (penyimpanan & retrieval per user), `wordPuzzleGenerator`.
3. File konfigurasi lexicon positif & bank kata default dipisah dari logic (format menyesuaikan konvensi project).
4. Tulis unit test untuk:
   - Ekstraksi kata positif dari contoh teks jurnal (termasuk yang mengandung campuran kata positif & netral — pastikan hanya yang match lexicon yang diambil)
   - Fallback bekerja saat bank personal user kosong/kurang
   - Tidak ada pengulangan kata dari sesi puzzle sebelumnya (kalau implementasi exclude-list sudah dibuat)
   - Generator grid: kata yang diminta benar-benar ada di grid pada koordinat yang dikembalikan
5. Pastikan secara arsitektur, lexicon positif ini **tidak pernah** mengimpor atau bergantung pada modul/lexicon negatif-risiko dari fitur jurnaling sebelumnya — keduanya harus independen.
6. Ajukan dulu struktur modul/foldernya sebelum mulai coding, supaya saya bisa review.
