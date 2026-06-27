# GAD-7 Onboarding Flow — Design Spec
Date: 2026-06-27

## Overview

Migrate GAD-7 screening dari n8n ke app-side. Tampilkan sebagai wizard onboarding friendly saat user pertama kali akses chat (atau setiap 2 minggu). Gate via `ChatGate` screen, status di-cache di `AuthContext`.

---

## Section 1 — Arsitektur & Data Flow

### Backend endpoints

| Endpoint | Status | Keterangan |
|---|---|---|
| `GET /chat/gad7/status` | Baru | Return `{ needsGad7, lastTakenAt }` |
| `POST /chat/gad7/submit` | Rewrite (hapus n8n) | Hitung skor, simpan Prisma, return `{ score, severity }` |
| `GET /users/:id/gad7/latest` | Tidak berubah | Read-only, tetap ada |

### Scheduling logic

```
needsGad7 = (belum pernah isi) || (daysSince(takenAt) >= 14)
```

**Keterbatasan terdokumentasi:** kadens berbasis `takenAt` menyebabkan drift jika user telat isi (misal isi hari ke-20 → jadwal berikutnya hari ke-34, bukan ke-28). Jarak antar titik data tidak seragam. Dicatat sebagai keterbatasan di Bab IV thesis. Anchor-based scheduling adalah upgrade future.

### GAD-7 scoring (standar)

| Rentang | Severity |
|---|---|
| 0–4 | minimal |
| 5–9 | mild |
| 10–14 | moderate |
| 15–21 | severe |

### AuthContext — tri-state

```ts
gad7LoadingState: 'loading' | 'ready' | 'error';
gad7Status: { needsGad7: boolean; lastTakenAt: string | null } | null;
refreshGad7Status: () => Promise<void>;
```

- Fetch dimulai saat `isAuthenticated` jadi `true`
- Error → `gad7LoadingState = 'error'`, `gad7Status = null`
- `null` hanya muncul saat `'error'` — tidak ambigu dengan "belum selesai"

### Data flow

```
Login
  └─ fetch GET /chat/gad7/status
       ├─ sukses → gad7LoadingState = 'ready', gad7Status = { needsGad7, lastTakenAt }
       └─ error  → gad7LoadingState = 'error', gad7Status = null

User tap "Chat" → navigate('ChatGate')
  └─ tunggu gad7LoadingState settled
       ├─ 'loading' → spinner (tunggu)
       ├─ 'error'   → replace('Chat')           [fail-open]
       └─ 'ready'   → replace(resolveChatRoute(gad7Status))

Gad7Onboarding → Q1..Q7 → submit (POST /chat/gad7/submit)
  └─ sukses → Gad7Result screen
  └─ TOO_SOON (409) → refreshGad7Status() → replace('Chat')  [silent recovery]
  └─ error lain → re-enable button + alert

Gad7Result
  └─ "Mulai Chat" → await refreshGad7Status() → replace('Chat')
       [await di sini, BUKAN di submit→Result — pastikan ini]

ChatScreen mount guard (jaring pengaman):
  └─ gad7LoadingState !== 'ready' → diam (fail-open)
  └─ gad7LoadingState === 'ready' && needsGad7 === true → replace('Gad7Onboarding')
```

### resolveChatRoute utility

```ts
// src/chat/chatGateUtils.ts
export function resolveChatRoute(
    gad7Status: { needsGad7: boolean } | null | undefined
): 'Chat' | 'Gad7Onboarding' {
    if (gad7Status?.needsGad7 === true) return 'Gad7Onboarding';
    return 'Chat'; // null / undefined / false → fail-open
}
```

**ChatGate dan ChatScreen guard wajib pakai pola tri-state yang sama:**
- Hanya act saat `gad7LoadingState === 'ready'`
- `'loading'` → tunggu
- `'error'` → fail-open ke Chat

Satu fungsi `resolveChatRoute` dipakai di kedua tempat supaya tidak bisa divergen.

---

## Section 2 — UI Wizard & Result Screen

### Gad7OnboardingScreen

**Layout per soal (satu soal per layar):**

```
┌─────────────────────────────────────┐
│  ← (Q1: dihadang)     3 / 7        │
│  ████████░░░░░░░░░░░░  progress bar │
│                                     │
│  [Ilustrasi kecil — calming]        │
│                                     │
│  Dalam 2 minggu terakhir, seberapa  │
│  sering kamu merasa gugup, cemas,   │
│  atau tegang?                       │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Tidak sama sekali          │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │  Beberapa hari          ✓   │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │  Lebih dari separuh hari    │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │  Hampir setiap hari         │    │
│  └─────────────────────────────┘    │
│                                     │
│        [ Lanjut → ]                 │
└─────────────────────────────────────┘
```

**Back navigation:**
- Back Q2–Q7 → kembali ke soal sebelumnya (jawaban tersimpan di local state)
- Back di Q1 → `Alert` konfirmasi keluar ("Jawabanmu tidak akan disimpan")
- Android hardware back di Q1: override via `BackHandler` + `useFocusEffect`
- `gestureEnabled: false` di Stack.Screen untuk blokir swipe iOS keluar wizard

**Exit behavior:**
- Keluar di tengah → mulai dari Q1 saat buka lagi
- Tidak ada resume, tidak ada partial save

**Submit (Q7 → "Lihat Hasilku"):**
- Button disabled + `ActivityIndicator` selama in-flight
- Sukses → replace ke `Gad7Result`
- `TOO_SOON` (409) → `refreshGad7Status()` → `replace('Chat')` (silent)
- Error lain → re-enable + alert

**Soal hardcoded** di frontend (GAD-7 standar, tidak perlu dari API).

**Animasi:** slide kiri/kanan antar soal via Reanimated `withTiming`.

### Gad7ResultScreen

**Headline map di frontend** (bukan dari backend):

```ts
const HEADLINES: Record<string, string> = {
    minimal:  'Kamu tampak cukup baik-baik saja belakangan ini.',
    mild:     'Ada sedikit gelombang yang kamu hadapi — itu wajar.',
    moderate: 'Kamu sedang menanggung cukup banyak. Itu bukan salahmu.',
    severe:   'Ini terdengar berat. Kamu tidak harus menanggungnya sendiri.',
};
```

Backend `POST /chat/gad7/submit` return: `{ score, severity }` saja — **tidak ada `headline`**.

**Disclaimer (semua severity):**
> "Ini gambaran perasaanmu sementara — bukan diagnosis."

**Konten per severity:**

| Severity | Konten |
|---|---|
| minimal / mild | Tombol "Mulai Chat dengan PHA" |
| moderate | Card mindfulness ("Coba teknik pernapasan sekarang →") + "Mulai Chat" |
| severe | Card mindfulness + Card "Konseling kampus — gratis & rahasia" (CB-FR-08) + link hotline + "Mulai Chat" |

**Hotline (severe only):**
- Framing: *"Kalau ada pikiran menyakiti diri atau merasa tidak aman:"*
- `Linking.openURL('tel:119')` — dial 119 saja
- Instruksi teks: *"Setelah tersambung, tekan ext 8"*
- Ekstensi tidak diteruskan via `tel:` scheme — **wajib verifikasi di device Android & iOS sebelum release**
- Back handler ResultScreen: `return true` + `replace('Chat')` (beri jalan keluar, bukan dinding no-op)
- Proteksi dua mekanisme: `gestureEnabled: false` (iOS swipe) + `BackHandler` (Android)

**Skor tidak ditampilkan** di layar ini — disimpan di DB, muncul di riwayat progres (future feature).

---

## Section 3 — Navigasi & Backend

### App.tsx

**Import tambah:**
```ts
import ChatGateScreen from './src/chat/ChatGateScreen';
import Gad7OnboardingScreen from './src/chat/Gad7OnboardingScreen';
import Gad7ResultScreen from './src/chat/Gad7ResultScreen';
```

**Stack screens tambah:**
```tsx
<Stack.Screen name="ChatGate" component={ChatGateScreen} options={{ headerShown: false }} />
<Stack.Screen name="Gad7Onboarding" component={Gad7OnboardingScreen}
    options={{ headerShown: false, gestureEnabled: false }} />
<Stack.Screen name="Gad7Result" component={Gad7ResultScreen}
    options={{ headerShown: false, gestureEnabled: false }} />
```

**Entry points:** semua `navigate('Chat')` diganti `navigate('ChatGate')`. Deep link dan notifikasi masa depan → `ChatGate`, bukan `Chat` langsung.

### ChatGateScreen

```ts
export default function ChatGateScreen({ navigation }) {
    const { gad7LoadingState, gad7Status } = useAuthContext();

    useEffect(() => {
        if (gad7LoadingState === 'loading') return;
        if (gad7LoadingState === 'error') {
            navigation.replace('Chat');
            return;
        }
        navigation.replace(resolveChatRoute(gad7Status));
    }, [gad7LoadingState]);

    return <LoadingSpinner />;
}
```

### Backend — chat.service.ts

**`checkGad7Status(userId)`** (baru):
```ts
export const checkGad7Status = async (userId: string) => {
    const latest = await prisma.gad7Result.findFirst({
        where: { userId },
        orderBy: { takenAt: 'desc' },
        select: { takenAt: true },
    });

    if (!latest) return { needsGad7: true, lastTakenAt: null };

    const daysSince = (Date.now() - latest.takenAt.getTime()) / 86_400_000;
    return {
        needsGad7: daysSince >= 14,
        lastTakenAt: latest.takenAt.toISOString(),
    };
};
```

**`submitGad7(userId, answers)`** (rewrite — hapus n8n, tambah min-gap guard):
```ts
// userId dari JWT (req.user.userId), TIDAK dari body
// Validasi input
if (answers.length !== 7) throw new Error('INVALID_ANSWERS');
if (answers.some(a => !Number.isInteger(a) || a < 0 || a > 3))
    throw new Error('INVALID_ANSWERS');

// Min-gap guard
const latest = await prisma.gad7Result.findFirst({
    where: { userId },
    orderBy: { takenAt: 'desc' },
    select: { takenAt: true },
});
if (latest) {
    const daysSince = (Date.now() - latest.takenAt.getTime()) / 86_400_000;
    if (daysSince < 13) {
        throw Object.assign(new Error('TOO_SOON'), { code: 'TOO_SOON' });
    }
}

// Scoring
const score = answers.reduce((s, a) => s + a, 0);
const severity = score <= 4  ? 'minimal'
               : score <= 9  ? 'mild'
               : score <= 14 ? 'moderate'
               : 'severe';

await prisma.gad7Result.create({
    data: { userId, score, severity, answers, takenAt: new Date() },
});

return { score, severity }; // tidak ada headline
```

Controller: `TOO_SOON` → HTTP 409 `{ code: 'TOO_SOON' }`.

**Threshold 13 vs 14 — intentional buffer:**
- Status gate: `daysSince >= 14` (perlu isi)
- Submit guard: `daysSince < 13` (tolak)
- Day 13 adalah zona buffer: status bilang belum perlu, submit tidak diblokir. Ini menangani user yang isi sedikit lebih awal atau beda timezone. Jika seragam lebih penting dari buffer, samakan ke 14/14.

### Route baru
```ts
router.get('/gad7/status', ChatController.checkGad7Status);
```

---

## Section 4 — Edge Cases

| # | Skenario | Penanganan |
|---|---|---|
| 1 | `refreshGad7Status` gagal setelah submit | `gad7LoadingState = 'error'` → ChatScreen guard fail-open → user masuk Chat. Skor sudah tersimpan. |
| 2 | ChatScreen mount guard saat `loading` | `gad7LoadingState !== 'ready'` → diam, tidak redirect. |
| 3 | Android back di Q1 Onboarding | `BackHandler` override → Alert konfirmasi keluar. |
| 4 | Android back di ResultScreen | `BackHandler` → `return true` + `replace('Chat')`. |
| 5 | `TOO_SOON` di Onboarding submit | `refreshGad7Status()` → `replace('Chat')`, no alert. |
| 6 | Token expired selama wizard | `notifyInvalidSession` → Login. Partial state hilang. Correct by design. |

**await placement — pastikan ini benar:**
- `await refreshGad7Status()` ada di **Result → Chat** (sebelum `replace`)
- `submit → Result` adalah fire-and-forget setelah submit berhasil — tidak ada await tambahan di sini

---

## Known Limitations

1. **Drift kadens:** Berbasis `takenAt`, bukan enrollment anchor. Jika user telat isi, jadwal berikutnya drift. Dicatat di Bab IV.
2. **Double-submit race:** Dua tap sangat cepat sebelum disable ter-render bisa lolos min-gap (belum ada baris saat keduanya cek). Loading state meminimalkan ini tapi tidak eliminasi. Bisa ditutup dengan unique constraint waktu atau dicatat sebagai keterbatasan diketahui.
3. **Hotline `tel:` extension:** `119 ext 8` tidak bisa auto-dial via `tel:` scheme. Solusi: dial 119 + instruksi teks. **Wajib verifikasi di device sebelum release.**

---

## Deprecation Checklist — Gad7Form.tsx

- [x] Workflow n8n sudah CBT-only (tidak mengirim `action: chat_with_gad7`) — **confirmed**
- [ ] Frontend berhenti mem-parse `action === 'chat_with_gad7'` di ChatScreen

Hapus `Gad7Form.tsx` setelah kondisi kedua terpenuhi (bagian dari implementasi ini).

---

## Files Affected

### Baru
- `frontend/src/chat/ChatGateScreen.tsx`
- `frontend/src/chat/chatGateUtils.ts`
- `frontend/src/chat/Gad7OnboardingScreen.tsx`
- `frontend/src/chat/Gad7ResultScreen.tsx`

### Diubah
- `frontend/App.tsx` — tambah screens, ganti navigate('Chat') → navigate('ChatGate')
- `frontend/src/auth/AuthContext.tsx` — tambah tri-state gad7Status
- `frontend/src/home/HomeScreen.tsx` — ganti navigate target
- `backend/src/modules/chat/chat.service.ts` — rewrite submitGad7, tambah checkGad7Status
- `backend/src/modules/chat/chat.controller.ts` — tambah handler checkGad7Status
- `backend/src/modules/chat/chat.routes.ts` — tambah GET /gad7/status
- `frontend/src/chat/ChatScreen.tsx` — hapus `action === 'chat_with_gad7'` parser, tambah mount guard

### Deprecated (hapus setelah cutover)
- `frontend/src/chat/Gad7Form.tsx`
