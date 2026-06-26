# PHA Backend API

Dokumentasi ini menjelaskan cara menjalankan dan memakai API backend PHA.

Public base URL untuk testing saat ini:

```text
https://api.anxietypha.my.id
```

Local base URL saat backend dijalankan langsung di mesin lokal:

```text
http://localhost:3000
```

## Ringkasan Arsitektur

- Runtime: Node.js, Express, TypeScript.
- Database: PostgreSQL via Prisma.
- Public reverse proxy VPS: Nginx host.
- Docker services: `postgres` dan `backend`.
- Backend container hanya dipublish ke `127.0.0.1:3000`; akses publik lewat Nginx HTTPS.

## Menjalankan Backend

### VPS

Pastikan root `.env` dan `backend/.env` sudah dibuat:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Isi nilai production:

```env
POSTGRES_PASSWORD=...
JWT_SECRET=...
GEMINI_API_KEY=...
```

Jalankan stack:

```bash
docker compose up -d --build
```

Validasi:

```bash
docker ps
curl https://api.anxietypha.my.id/health
```

### Local Development

```bash
cd backend
npm install
npx prisma generate
npm run dev
```

Environment minimal untuk local:

```env
PORT=3000
DATABASE_URL=postgresql://pha_user:password@localhost:5432/pha_db?schema=public
JWT_SECRET=local-dev-secret
GEMINI_API_KEY=your-gemini-key
```

## Format Auth

Endpoint selain `/`, `/health`, `/auth/register`, dan `/auth/login` membutuhkan JWT.

Header:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Token didapat dari `POST /auth/login`.

Role:

- `USER`: akses fitur user seperti profile, chat, breathing, meditation, education list.
- `ADMIN`: akses tambahan untuk create/update/delete content dan upload audio.

## Public Endpoints

### Health Check

```http
GET /health
```

Contoh:

```bash
curl https://api.anxietypha.my.id/health
```

Response:

```json
{
  "status": "ok",
  "service": "pha-backend",
  "uptime": 277.17,
  "timestamp": "2026-06-24T14:35:42.282Z"
}
```

### Root

```http
GET /
```

Response:

```text
PHA Backend is running
```

## Auth API

### Register

```http
POST /auth/register
```

Body:

```json
{
  "name": "Alpan",
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "message": "User registered successfully",
  "userId": "uuid"
}
```

### Login

```http
POST /auth/login
```

Body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER",
    "name": "Alpan"
  }
}
```

Contoh curl:

```bash
curl -X POST https://api.anxietypha.my.id/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## Profile API

Semua endpoint profile membutuhkan token.

### Get Profile

```http
GET /profile
```

Response:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "displayName": "Alpan",
  "age": 22,
  "gender": "Laki-laki",
  "language": "id",
  "bio": "..."
}
```

### Update Profile

```http
PUT /profile
```

Body:

```json
{
  "displayName": "Alpan",
  "age": 22,
  "gender": "Laki-laki",
  "bio": "Bio singkat"
}
```

Valid `gender`: `Laki-laki`, `Perempuan`, `Lainnya`.

## Chat API

Semua endpoint chat membutuhkan token.

Backend meneruskan chat ke n8n webhook. History dan session mengambil data dari tabel conversation milik flow n8n.

### Send Message

```http
POST /chat/send
```

Body:

```json
{
  "message": "Saya sedang cemas hari ini"
}
```

Response:

```json
{
  "action": "chat_response",
  "data": {
    "message": "Respons AI",
    "cbt_phase": null,
    "is_crisis": false,
    "gad7": null
  }
}
```

### Stream Message

```http
POST /chat/stream
```

Header tambahan:

```http
Accept: text/event-stream
```

Body:

```json
{
  "message": "Saya butuh bantuan grounding"
}
```

SSE event dikirim dalam format:

```text
data: {"chunk":"kata "}

data: {"done":true,"action":"chat_response","data":{"message":"..."}}
```

### History

```http
GET /chat/history
GET /chat/sessions
GET /chat/sessions/:sessionId
POST /chat/sessions/new
```

### Submit GAD-7

```http
POST /chat/gad7/submit
```

Body:

```json
{
  "sessionId": "session-id",
  "answers": [0, 1, 2, 1, 0, 1, 2]
}
```

`answers` harus berisi 7 angka, masing-masing `0` sampai `3`.

Response:

```json
{
  "action": "gad7_saved",
  "data": {
    "score": 7,
    "severity": "mild",
    "message": "Terima kasih sudah menjawab."
  }
}
```

## Breathing API

Prefix:

```text
/api/breathing
```

Semua endpoint membutuhkan token.

| Method | Path | Role | Keterangan |
| --- | --- | --- | --- |
| GET | `/techniques` | USER | List teknik breathing aktif |
| GET | `/techniques/:id` | USER | Detail teknik |
| POST | `/techniques` | ADMIN | Buat teknik |
| PUT | `/techniques/:id` | ADMIN | Update teknik |
| DELETE | `/techniques/:id` | ADMIN | Hapus teknik |
| POST | `/logs` | USER | Simpan aktivitas breathing |
| GET | `/logs` | USER | Riwayat breathing user |

Create technique body:

```json
{
  "name": "Box Breathing",
  "description": "4-4-4-4 breathing",
  "inhaleDuration": 4,
  "holdDuration": 4,
  "exhaleDuration": 4,
  "holdAfterExhale": 4,
  "cycles": 4,
  "colorTheme": "#B8D8B8",
  "icon": "square"
}
```

Save log body:

```json
{
  "techniqueId": "uuid",
  "duration": 240,
  "cyclesCompleted": 4
}
```

## Meditation API

Prefix:

```text
/api/meditation
```

Semua endpoint membutuhkan token.

| Method | Path | Role | Keterangan |
| --- | --- | --- | --- |
| GET | `/sessions` | USER | List sesi meditation |
| GET | `/sessions?category=anxiety` | USER | Filter by category |
| GET | `/sessions/:id` | USER | Detail sesi |
| POST | `/sessions` | ADMIN | Buat sesi |
| PUT | `/sessions/:id` | ADMIN | Update sesi |
| DELETE | `/sessions/:id` | ADMIN | Hapus sesi |
| POST | `/logs` | USER | Simpan aktivitas meditation |
| GET | `/logs` | USER | Riwayat meditation user |

Valid category:

```text
sleep, focus, anxiety, morning, general
```

Create session body:

```json
{
  "title": "Redakan Kecemasan",
  "description": "Sesi grounding singkat",
  "category": "anxiety",
  "audioUrl": "https://example.com/audio.mp3",
  "thumbnailUrl": "https://example.com/thumb.jpg",
  "durationOptions": ["5", "10", "15"],
  "colorTheme": "#4a7a5d"
}
```

Save log body:

```json
{
  "sessionId": "uuid",
  "duration": 600,
  "completed": true
}
```

## Education Content API

Prefix:

```text
/api/education-contents
```

Semua endpoint membutuhkan token.

| Method | Path | Role | Keterangan |
| --- | --- | --- | --- |
| GET | `/` | USER | List content |
| GET | `/?page=1&limit=10&category=stress&source=youtube` | USER | List dengan filter |
| GET | `/:id` | USER | Detail content |
| POST | `/` | ADMIN | Buat content |
| PUT | `/:id` | ADMIN | Update content |
| DELETE | `/:id` | ADMIN | Soft delete content |

Valid `source`:

```text
youtube, tiktok, other
```

Create body:

```json
{
  "title": "Teknik Manajemen Stres",
  "description": "5 teknik efektif untuk mengelola stres",
  "source": "youtube",
  "url": "https://www.youtube.com/watch?v=example",
  "thumbnailUrl": "https://example.com/thumb.jpg",
  "category": "stres",
  "tags": ["stres", "mindfulness"]
}
```

List response:

```json
{
  "contents": [],
  "total": 0,
  "page": 1,
  "totalPages": 0
}
```

## Audio Content API

Prefix:

```text
/api/audio-contents
```

Semua endpoint audio saat ini membutuhkan role `ADMIN`.

| Method | Path | Role | Keterangan |
| --- | --- | --- | --- |
| GET | `/` | ADMIN | List audio |
| POST | `/` | ADMIN | Upload audio |
| DELETE | `/:id` | ADMIN | Hapus audio |

Upload memakai `multipart/form-data`.

Field:

- `audio`: file audio, wajib.
- `title`: string, wajib.
- `category`: string, opsional.
- `duration`: number/string, opsional.
- `description`: string, opsional.

MIME yang diterima:

```text
audio/mpeg, audio/mp3, audio/wav, audio/ogg, audio/aac
```

Contoh:

```bash
curl -X POST https://api.anxietypha.my.id/api/audio-contents \
  -H "Authorization: Bearer <admin-token>" \
  -F "audio=@meditation.mp3" \
  -F "title=Audio Relaksasi" \
  -F "category=relaxation" \
  -F "duration=300"
```

## Static Uploads

File upload dan asset audio disajikan dari:

```text
/uploads
```

Contoh URL:

```text
https://api.anxietypha.my.id/uploads/meditations/meditation1.mp3
```

## Error Format

Validation error:

```json
{
  "error": "Validation Error",
  "details": [
    {
      "path": "body.email",
      "message": "Invalid email format"
    }
  ]
}
```

Auth error:

```json
{
  "error": "Access token required"
}
```

Forbidden role:

```json
{
  "error": "Forbidden: insufficient role"
}
```

## Quick API Test

```bash
API_URL=https://api.anxietypha.my.id

curl "$API_URL/health"

TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"admin123"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).token")

curl "$API_URL/profile" \
  -H "Authorization: Bearer $TOKEN"
```

Catatan: akun admin di atas hanya tersedia jika seed/admin sudah dibuat di database environment tersebut.
