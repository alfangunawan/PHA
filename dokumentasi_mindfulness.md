# Dokumentasi Modul Mindfulness

Aplikasi **PHA (Personal Health Assistant)** memiliki **Modul Mindfulness** yang dirancang secara khusus untuk membantu pengguna mengelola kecemasan (*anxiety*), meningkatkan fokus, dan meraih relaksasi melalui intervensi berbasis psikologi. 

Modul Mindfulness ini secara garis besar terbagi menjadi dua fitur utama: **Latihan Pernapasan (Breathing Exercises)** dan **Meditasi Terpandu (Guided Meditation)**. Keduanya telah terintegrasi dengan sistem poin dan gamifikasi untuk memotivasi pengguna agar rutin menjaga kesehatan mental mereka.

---

## 1. Fitur Latihan Pernapasan (Breathing Exercises)
Fitur ini memandu pengguna untuk melakukan teknik pernapasan melalui bantuan animasi visual (SVG/Lottie) dan *timer* otomatis untuk fase Inhale (tarik napas), Hold (tahan), dan Exhale (hembuskan). 

### Daftar Konten Latihan Pernapasan:
1. **4-7-8 Breathing**
   - **Deskripsi:** Teknik pernapasan klasik untuk relaksasi mendalam. Terbukti efektif mengurangi kecemasan akut dan membantu pengguna tidur lebih cepat.
   - **Pola Pernapasan:** Tarik napas 4 detik ➔ Tahan 7 detik ➔ Hembuskan 8 detik.
   - **Siklus Default:** 4 kali pengulangan.
   - **Tema Warna:** Biru muda (menenangkan).

2. **Box Breathing**
   - **Deskripsi:** Teknik pernapasan kotak yang sering digunakan oleh prajurit *Navy SEALs* untuk menjaga ketenangan dan fokus di bawah tekanan tinggi/stres berat.
   - **Pola Pernapasan:** Tarik napas 4 detik ➔ Tahan 4 detik ➔ Hembuskan 4 detik ➔ Tahan 4 detik.
   - **Siklus Default:** 4 kali pengulangan.
   - **Tema Warna:** Hijau muda.

3. **Deep Breathing**
   - **Deskripsi:** Pernapasan perut (diafragma) sederhana untuk efek menenangkan yang instan. Sangat cocok bagi pemula yang baru mencoba *mindfulness*.
   - **Pola Pernapasan:** Tarik napas 5 detik ➔ Hembuskan 5 detik.
   - **Siklus Default:** 6 kali pengulangan.
   - **Tema Warna:** Ungu muda.

4. **Resonance Breathing**
   - **Deskripsi:** Pernapasan ritmis (5-5) pada kecepatan 6 napas per menit. Secara klinis memaksimalkan *Heart Rate Variability* (HRV) untuk mengembalikan keseimbangan saraf otonom.
   - **Pola Pernapasan:** Tarik napas 5 detik ➔ Hembuskan 5 detik.
   - **Siklus Default:** 6 kali pengulangan.
   - **Tema Warna:** Oranye lembut (hangat).

---

## 2. Fitur Meditasi Terpandu (Guided Meditation)
Fitur ini menyediakan sesi pemutaran audio meditasi yang menenangkan. Pengguna dapat memilih sesi sesuai dengan kebutuhan emosional atau target mereka saat itu. Fitur ini sangat adaptif karena pengguna dapat mengatur durasi (waktu) pemutaran sendiri.

### Daftar Konten Meditasi:
1. **Tidur Nyenyak (Sleep)**
   - **Deskripsi:** Meditasi terpandu untuk melepaskan ketegangan fisik dan mental sebelum tidur agar istirahat terasa lebih berkualitas.
   - **Pilihan Durasi:** 10, 15, atau 20 menit.
   - **Warna Aksen:** Biru Malam Malam gelap.

2. **Fokus Kerja (Focus)**
   - **Deskripsi:** Sesi singkat untuk menyingkirkan *brain fog* (kabut otak) dan mengembalikan tingkat konsentrasi penuh sebelum mulai belajar/bekerja.
   - **Pilihan Durasi:** 5, 10, atau 15 menit.

3. **Redakan Kecemasan (Anxiety Relief)**
   - **Deskripsi:** Menggunakan teknik *grounding* dan visualisasi khusus untuk menenangkan pikiran yang terus berlari (*racing thoughts*) akibat serangan kecemasan.
   - **Pilihan Durasi:** 5, 10, atau 15 menit.

4. **Semangat Pagi (Morning)**
   - **Deskripsi:** Afirmasi dan meditasi ringan untuk membangun niat (intention) serta mengumpulkan energi positif di pagi hari.
   - **Pilihan Durasi:** 5 atau 10 menit.

5. **Meditasi Umum (General)**
   - **Deskripsi:** Sesi meditasi kesadaran standar (*breath awareness*) yang bisa digunakan secara fleksibel kapan saja saat butuh menjauh dari stres.
   - **Pilihan Durasi:** 5, 10, 15, atau 20 menit.

---

## 3. Integrasi Gamifikasi (Sistem Reward)
Untuk mendorong konsistensi (*habit-building*), setiap aktivitas *mindfulness* yang diselesaikan akan memberikan imbalan (reward) berupa XP (Experience Points) dan *Points* (Mata Uang Aplikasi).

- **Menyelesaikan Latihan Pernapasan:** +10 XP | +5 Poin
- **Menyelesaikan Sesi Meditasi:** +15 XP | +8 Poin

Dengan kelengkapan konten dan fitur-fitur di atas, Modul Mindfulness ini tidak hanya sekadar alat bantu medis pasif, tetapi berhasil dikemas menjadi intervensi kesehatan yang modern, terstruktur, interaktif, dan *"rewarding"* (menyenangkan) bagi penggunanya.

---

## 4. Manajemen Admin untuk Mindfulness (CMS)
Aplikasi PHA memiliki panel Admin (*Content Management System*) yang memungkinkan pihak admin (seperti psikolog atau pengelola konten) untuk menambah, mengubah, dan menghapus konten Mindfulness secara dinamis tanpa perlu merilis ulang aplikasi (*no-code / real-time updates*).

**Fitur Admin Mindfulness:**
- **Manajemen Audio Meditasi:** Admin dapat mengunggah file rekaman audio MP3/WAV baru, memberikan judul, deskripsi, mengatur kategori (seperti *sleep, focus, anxiety*), serta mendefinisikan pilihan durasi (dalam menit) untuk pengguna.
- **Manajemen Latihan Pernapasan:** Admin dapat menambahkan pola teknik pernapasan baru dengan mengatur variabel durasi secara presisi: `Inhale` (detik), `Hold` (detik), `Exhale` (detik), dan *Cycles* (pengulangan). Admin juga bisa memilih *icon* dan tema warna kartu secara visual.


## 5. Fitur Edukasi Mental & Psikologi
Selain praktik langsung melalui Mindfulness, PHA menyediakan **Modul Edukasi** untuk memperluas pemahaman kognitif pengguna terhadap kondisi mental (*psikoedukasi*). Konten edukasi ini terintegrasi langsung dengan YouTube API untuk pemutaran video tanpa perlu keluar dari aplikasi.

### Format Konten Edukasi:
- **Video Landscape (Detail Screen):** Artikel video berdurasi panjang yang lebih edukatif/informatif. Dilengkapi dengan teks deskripsi lengkap yang bisa diperluas (*expandable*) dan daftar video rekomendasi lain di bawahnya (*carousel horizontal*).
- **Video Vertical (Reels / Shorts):** Dikhususkan untuk konten ringan dan tips cepat (*bite-sized learning*). Pengguna dapat melakukan *swipe* vertikal (atas-bawah) untuk pindah video layaknya TikTok atau Instagram Reels.

### Daftar Konten Edukasi yang Tersedia:
1. **Apa itu Anxiety? Memahami Kecemasan Dasar** *(Landscape)* – Pengertian komprehensif tentang apa itu *anxiety* dan penyebab utamanya.
2. **Mengenal Gejala Anxiety dengan Cepat** *(Vertical)* – Mengenali tanda-tanda awal munculnya rasa cemas berlebih pada diri sendiri.
3. **Penyebab dan Dampak Anxiety pada Tubuh** *(Landscape)* – Pembahasan efek psikologis dan respons fisik tubuh.
4. **Tips Cepat Meredakan Cemas** *(Vertical)* – Trik singkat yang bisa dilakukan saat kecemasan mulai datang.
5. **Animasi: Hidup dengan Anxiety Disorder** *(Landscape)* – Ilustrasi visual tentang bagaimana rasanya hidup berdampingan dengan kecemasan.
6. **Animasi: Cara Pikiran Merespons Kecemasan** *(Landscape)* – Cara otak merespons ancaman secara visual melalui animasi.
7. **Animasi: Berdamai dengan Rasa Takut** *(Landscape)* – Pendekatan emosional untuk menerima ketakutan.
8. **Animasi: Memahami Serangan Panik (Panic Attack)** *(Landscape)* – Penjelasan medis lewat animasi mengenai apa yang terjadi saat *panic attack*.
9. **Fakta Singkat Tentang Anxiety** *(Vertical)* – Kumpulan fakta medis singkat mengenai dampak kecemasan.
10. **Mengenal Kecemasan: Penyebab dan Penanganannya** *(Landscape)* – Pembahasan mendalam tentang pemicu dan penanganan profesional psikologis.
11. **Trik Cepat Menghilangkan Panik** *(Vertical)* – Trik psikologis cepat mengatasi serangan panik seketika.
12. **Apakah Kamu Mengalami Anxiety? Kenali Tanda Ini** *(Vertical)* – *Self-assessment* ringan mengenai tanda-tanda *hidden anxiety*.
13. **Kecemasan Berlebih: Kapan Harus ke Psikolog?** *(Landscape)* – Edukasi untuk mengetahui batasan normal dan kapan memerlukan bantuan tenaga ahli.
14. **Cara Efektif Meredakan Kecemasan (Anxiety Relief)** *(Landscape)* – Terapi yang teruji klinis untuk menurunkan tingkat kecemasan harian.
15. **Latihan Pernapasan Praktis Saat Cemas** *(Vertical)* – Panduan visual pernapasan berdurasi singkat kurang dari 1 menit.

Sama seperti Mindfulness, seluruh konten Edukasi (baik *Landscape* maupun *Reels*) dikendalikan sepenuhnya melalui **Dashboard Admin PHA**. Admin bebas memasukkan URL YouTube baru, dan sistem aplikasi akan secara otomatis membedakan apakah video tersebut harus masuk ke fitur **Reels** (jika URL mendeteksi format `/shorts/`) atau ke dalam daftar **Landscape**. Admin tidak perlu pusing memikirkan letak kodenya!
