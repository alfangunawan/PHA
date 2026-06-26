# PHA Frontend API Usage

Dokumentasi ini menjelaskan cara frontend Expo memakai backend PHA.

Backend public untuk testing:

```text
https://api.anxietypha.my.id
```

## Cara Testing dengan Expo Go

Rekomendasi arsitektur testing:

- Backend dan database berjalan di VPS.
- Frontend Expo dijalankan dari laptop/development machine.
- Expo Go tester scan QR dari `npx expo start --tunnel`.
- Semua request API dari app diarahkan ke `https://api.anxietypha.my.id`.

Langkah di laptop:

```bash
cd frontend
cp .env.example .env
```

Pastikan isi `frontend/.env`:

```env
EXPO_PUBLIC_API_URL=https://api.anxietypha.my.id
```

Install dependency dan jalankan Expo:

```bash
npm install
npx expo start --tunnel --clear
```

Scan QR dari Expo Go. Untuk tester beda jaringan, gunakan mode `--tunnel`.

## Konfigurasi Base URL

Base URL dibaca dari:

```ts
process.env.EXPO_PUBLIC_API_URL
```

File terkait:

- `src/config.ts`
- `src/api/client.ts`
- `src/auth/useAuth.ts`

Default fallback di `src/config.ts` sudah mengarah ke:

```text
https://api.anxietypha.my.id
```

Tetap disarankan memakai `.env` supaya jelas environment mana yang digunakan.

Setiap perubahan `.env` butuh restart Expo:

```bash
npx expo start --tunnel --clear
```

## API Client

Client utama:

```ts
import client from './src/api/client';
```

`client` otomatis:

- memakai `baseURL` dari `src/config.ts`;
- mengambil JWT dari secure storage;
- menambahkan header `Authorization: Bearer <token>`;
- menghapus token dan user lokal saat menerima response `401`.

Contoh:

```ts
import client from './src/api/client';

const response = await client.get('/profile');
console.log(response.data);
```

## Auth Flow

File auth:

```text
src/auth/useAuth.ts
```

Login:

```ts
import { login } from './src/auth/useAuth';

await login('user@example.com', 'password123');
```

Saat login berhasil:

- token disimpan dengan `expo-secure-store` di Android/iOS;
- token disimpan ke `localStorage` saat web;
- user object disimpan untuk state lokal.

Register:

```ts
import { register } from './src/auth/useAuth';

await register('user@example.com', 'password123', 'Nama User');
```

Ambil token manual:

```ts
import { getToken } from './src/auth/useAuth';

const token = await getToken();
```

Logout lokal:

```ts
import { removeToken, removeUser } from './src/auth/useAuth';

await removeToken();
await removeUser();
```

## Service yang Sudah Tersedia

### Auth

File:

```text
src/auth/useAuth.ts
```

Functions:

- `login(email, password)`
- `register(email, password, name?)`
- `saveToken(token)`
- `getToken()`
- `removeToken()`
- `saveUser(user)`
- `getUser()`
- `removeUser()`

### Chat

File:

```text
src/chat/chatService.ts
```

Functions:

- `sendMessage(message, sessionId?)`
- `streamMessage(message, sessionId, onChunk, onComplete, onError)`
- `getHistory()`
- `getSessions()`
- `getSessionMessages(sessionId)`
- `createNewSession()`
- `submitGad7(sessionId, answers)`

Contoh non-stream:

```ts
import { sendMessage } from './src/chat/chatService';

const result = await sendMessage('Saya merasa cemas hari ini');
```

Contoh stream:

```ts
import { streamMessage } from './src/chat/chatService';

const stop = await streamMessage(
  'Bantu saya grounding',
  undefined,
  (chunk) => console.log(chunk),
  () => console.log('done'),
  (error) => console.error(error)
);

// Panggil saat component unmount.
stop();
```

### Mindfulness APIs

File:

```text
src/api/index.ts
```

Import:

```ts
import {
  breathingAPI,
  meditationAPI,
  educationAPI,
  audioAPI,
} from './src/api';
```

Breathing:

```ts
const { techniques } = await breathingAPI.getTechniques();

await breathingAPI.saveLog({
  techniqueId: 'uuid',
  duration: 240,
  cyclesCompleted: 4,
});
```

Meditation:

```ts
const { sessions } = await meditationAPI.getSessions('anxiety');

await meditationAPI.saveLog({
  sessionId: 'uuid',
  duration: 600,
  completed: true,
});
```

Education:

```ts
const result = await educationAPI.getContents({
  page: 1,
  limit: 10,
  category: 'stres',
  source: 'youtube',
});
```

Audio admin:

```ts
const formData = new FormData();
formData.append('title', 'Audio Relaksasi');
formData.append('category', 'relaxation');
formData.append('audio', {
  uri: fileUri,
  name: 'audio.mp3',
  type: 'audio/mpeg',
} as any);

await audioAPI.uploadAudio(formData);
```

## Endpoint Backend yang Dipakai Frontend

Base URL:

```text
https://api.anxietypha.my.id
```

Auth:

- `POST /auth/login`
- `POST /auth/register`

Profile:

- `GET /profile`
- `PUT /profile`

Chat:

- `POST /chat/send`
- `POST /chat/stream`
- `GET /chat/history`
- `GET /chat/sessions`
- `GET /chat/sessions/:sessionId`
- `POST /chat/sessions/new`
- `POST /chat/gad7/submit`

Mindfulness:

- `GET /api/breathing/techniques`
- `GET /api/breathing/techniques/:id`
- `POST /api/breathing/logs`
- `GET /api/breathing/logs`
- `GET /api/meditation/sessions`
- `GET /api/meditation/sessions/:id`
- `POST /api/meditation/logs`
- `GET /api/meditation/logs`
- `GET /api/education-contents`
- `GET /api/education-contents/:id`

Admin:

- `POST /api/breathing/techniques`
- `PUT /api/breathing/techniques/:id`
- `DELETE /api/breathing/techniques/:id`
- `POST /api/meditation/sessions`
- `PUT /api/meditation/sessions/:id`
- `DELETE /api/meditation/sessions/:id`
- `POST /api/education-contents`
- `PUT /api/education-contents/:id`
- `DELETE /api/education-contents/:id`
- `GET /api/audio-contents`
- `POST /api/audio-contents`
- `DELETE /api/audio-contents/:id`

## Testing Checklist

Sebelum share QR ke tester:

1. Pastikan backend sehat:

   ```bash
   curl https://api.anxietypha.my.id/health
   ```

2. Pastikan `frontend/.env` benar:

   ```env
   EXPO_PUBLIC_API_URL=https://api.anxietypha.my.id
   ```

3. Restart Expo:

   ```bash
   npx expo start --tunnel --clear
   ```

4. Login dari Expo Go.

5. Test fitur yang memakai API:

   - register/login;
   - profile;
   - chat;
   - breathing list dan log;
   - meditation list, audio, dan log;
   - education feed.

## Troubleshooting

### App masih request ke IP lama atau localhost

Penyebab umum:

- `.env` belum dibuat;
- Expo belum direstart setelah `.env` berubah;
- cache Metro masih menyimpan value lama.

Fix:

```bash
npx expo start --tunnel --clear
```

### Network request failed di Expo Go

Cek:

- `https://api.anxietypha.my.id/health` bisa dibuka dari browser HP.
- HP punya internet.
- Expo dijalankan dengan `--tunnel` jika tester beda jaringan.
- Backend container di VPS masih healthy.

### 401 Unauthorized

Artinya token tidak ada, expired, atau invalid.

Fix:

- login ulang;
- hapus storage app Expo Go jika token lama tersimpan;
- cek backend `JWT_SECRET` tidak berubah saat container restart.

### 403 Forbidden

User login tidak punya role `ADMIN`, tetapi mengakses endpoint admin.

### Upload audio gagal

Cek:

- user punya role `ADMIN`;
- request memakai `multipart/form-data`;
- field file bernama `audio`;
- MIME termasuk `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/ogg`, atau `audio/aac`.

## Catatan untuk Production Build

Expo Go cocok untuk testing cepat. Untuk distribusi yang lebih stabil, gunakan build preview:

```bash
npx eas build --profile preview --platform android
```

Tetap arahkan `EXPO_PUBLIC_API_URL` ke backend HTTPS yang sama.
