# 🌿 Mindfulness App — Iterasi 1

Aplikasi mobile kesehatan mental dengan modul Mindfulness.
**Stack**: Node.js + Express + MySQL (Backend) | React Native + Expo (Frontend)

---

## 📁 Struktur Project

```
MINDFULNESS 2/
├── backend/         # Express API Server
└── frontend/        # React Native + Expo App
```

---

## ⚙️ Setup Backend

### 1. Install Dependencies
```powershell
cd backend
npm install
```

### 2. Setup Database MySQL
```powershell
# Login ke MySQL
mysql -u root -p

# Jalankan schema (dari dalam MySQL client)
source D:/KULIAH/TUGAS AKHIR (SKRIPSI) 2026/MINDFULNESS 2/backend/schema.sql
```

Atau via PowerShell:
```powershell
Get-Content schema.sql | mysql -u root -p
```
Atau via Command Prompt (CMD):
```cmd
mysql -u root -p < schema.sql
```

### 3. Konfigurasi Environment
```powershell
copy .env.example .env
# Edit .env sesuai konfigurasi MySQL kamu
```

Isi file `.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password_mysql_kamu
DB_NAME=mindfulness_db
JWT_SECRET=ganti_dengan_secret_panjang_dan_acak
JWT_EXPIRES_IN=7d
```

### 4. Jalankan Backend
```powershell
npm run dev    # Development (auto-reload)
# atau
npm start      # Production
```

Backend berjalan di: `http://localhost:5000`
Health check: `http://localhost:5000/api/health`

---

## 📱 Setup Frontend

### 1. Install Dependencies
```powershell
cd frontend
npm install
```

### 2. Konfigurasi API URL

Cari IP lokal komputer kamu:
```powershell
ipconfig
# Lihat IPv4 Address, misal: 192.168.1.100
```

Edit file `src/api/client.js`, ganti `BASE_URL`:
```js
const BASE_URL = 'http://192.168.1.100:5000/api'; // Ganti dengan IP kamu
```

> ⚠️ **Penting**: Jangan gunakan `localhost` di device fisik. Gunakan IP jaringan lokal.

### 3. Jalankan Frontend
```powershell
npm start
# atau
npx expo start
```

Scan QR Code menggunakan **Expo Go** (download dari Play Store / App Store).

---

## 🔑 Akun Demo

| Role | Email | Password |
|------|-------|----------|
| User | user@mindfulness.app | password |
| Admin | admin@mindfulness.app | password |

> ⚠️ Password default seed data adalah `password` (plain text di seed = bcrypt hash dari `password`)
> Untuk keamanan, ganti password setelah setup.

---

## 🗺️ API Endpoints

### Auth
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/register` | Daftar akun |
| POST | `/api/auth/login` | Login, dapat JWT |
| GET | `/api/auth/me` | Info user (JWT required) |

### Pernapasan
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/breathing/techniques` | User |
| GET | `/api/breathing/techniques/:id` | User |
| POST | `/api/breathing/logs` | User |
| GET | `/api/breathing/logs` | User |

### Meditasi
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/meditation/sessions` | User |
| GET | `/api/meditation/sessions/:id` | User |
| POST | `/api/meditation/logs` | User |
| GET | `/api/meditation/logs` | User |

### Konten Edukasi
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/education-contents` | User |
| POST | `/api/education-contents` | Admin |
| PUT | `/api/education-contents/:id` | Admin |
| DELETE | `/api/education-contents/:id` | Admin |

### Audio (Iterasi 2)
| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/api/audio-contents` | Admin |
| POST | `/api/audio-contents` | Admin |
| DELETE | `/api/audio-contents/:id` | Admin |

---

## 📱 Fitur Aplikasi

### 🫁 Latihan Pernapasan
- Daftar 4 teknik: 4-7-8, Box Breathing, Deep Breathing, Resonance
- Animasi lingkaran membesar/mengecil mengikuti ritme napas (Reanimated)
- Timer per fase (Tarik → Tahan → Hembus)
- Counter siklus, session log otomatis tersimpan ke DB

### 🧘 Meditasi
- 5 sesi meditasi dalam 5 kategori
- Filter berdasarkan kategori
- Timer dengan pilihan durasi (5/10/15/20 menit)
- Ambient animation (partikel + ring pulse)
- Progress bar + log otomatis ke DB

### 📚 Konten Edukasi
- TikTok-style vertical feed
- Lazy-load thumbnail (hanya visible card)
- Tap → buka YouTube/TikTok di browser
- Infinite scroll pagination

### ⚙️ Admin Panel
- CRUD konten edukasi
- Persiapan upload audio (Iterasi 2)
- Akses via role admin (route guard)

---

## 🐛 Troubleshooting

**"Network request failed"**
→ Pastikan IP di `client.js` sesuai dengan IP WiFi lokal kamu, dan HP & laptop dalam jaringan WiFi yang sama.

**"MySQL connection failed"**
→ Cek credentials di `.env` dan pastikan MySQL service berjalan.

**Reanimated error saat build**
→ Pastikan `babel.config.js` sudah ada plugin `react-native-reanimated/plugin`.

**Fonts tidak muncul**
→ Tunggu splash screen selesai, atau restart Expo.

---

## 📦 Dependensi Kunci

### Backend
- `express` — HTTP framework
- `mysql2` — MySQL driver
- `jsonwebtoken` — JWT auth
- `bcryptjs` — Password hashing
- `multer` — File upload (audio, Iterasi 2)

### Frontend
- `expo` — React Native toolchain
- `@react-navigation` — Navigasi
- `moti` + `react-native-reanimated` — Animasi
- `@expo-google-fonts` — Poppins + Inter
- `zustand` — State management (siap pakai, belum diaktifkan)
- `axios` — HTTP client
- `expo-av` — Audio player (Iterasi 2)

---

*Mindfulness App — Iterasi 1 | Tugas Akhir 2026*
