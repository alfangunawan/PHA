# GAD-7 Testing Retake Button — Design

**Date:** 2026-07-01
**Status:** Approved
**Context:** UAT 1 — testers explore the app freely.

## Problem

The GAD-7 form only appears once (gated by `needsGad7`, which resets after 14
days). During UAT a tester who forgets to screenshot their result cannot get
back to the form — the backend `submitGad7` cooldown (`TOO_SOON`, blocks
resubmit < 13 days) also prevents retaking. Testers need to run the assessment
repeatedly to explore it.

The chatbot entry flow must stay untouched: the form should still appear only
once when opening the chatbot. Showing it every time the chatbot opens would be
annoying.

## Goal

Add a clearly-marked **testing-only** button on Beranda (home) that lets a
tester retake the GAD-7 assessment as many times as they want, showing the
result each time. The button is hidden for the real release via a single config
flag.

## Non-Goals

- No change to the chatbot GAD-7 gate (`ChatGateScreen` / `needsGad7`). It stays
  "once per 14 days".
- No new persistent "assessment history" UI. Retake just recomputes and shows
  the result screen.
- Not a production feature. It is explicitly for UAT and removed by flipping a
  flag.

## Approach

Retake is a **separate entry path** from Beranda that **reuses the existing**
`Gad7Onboarding` and `Gad7Result` screens, distinguished by a navigation route
param `retake: true`. The chatbot path (via `ChatGateScreen`, using
`navigation.replace`) is not modified at all.

The backend `submitGad7` cooldown guard is bypassed **only** when the client
sends an explicit `retake` flag. Score is still computed and a new `gad7Result`
row is still saved, so the result screen shows a real score/severity.

### Frontend

1. **`frontend/src/config.ts`** — add `TESTING_MODE: true` to the default export.
   Flip to `false` (and rebuild) to hide all testing-only affordances for the
   real release.

2. **`frontend/src/home/HomeScreen.tsx`** — when `config.TESTING_MODE` is true,
   render a visually distinct "testing" block below the "Mulai Cerita" CTA:
   - Dashed border + a `🧪 Mode Testing` label so it's obviously not a
     production feature.
   - Button **"Tes Ulang GAD-7"** →
     `navigation.navigate('Gad7Onboarding', { retake: true })`.
   - When `TESTING_MODE` is false, render nothing (no layout gap).

3. **`frontend/src/chat/Gad7OnboardingScreen.tsx`** — read `route.params?.retake`.
   - Pass it into the submit call: `submitGad7(answers, { retake })`.
   - On success: `navigation.replace('Gad7Result', { severity, retake })`.
   - Behavior when `retake` is falsy (the chatbot path) is unchanged, including
     the existing `TOO_SOON` 409 fallback (which won't fire on the retake path
     because the guard is bypassed).

4. **`frontend/src/chat/Gad7ResultScreen.tsx`** — read `route.params?.retake`.
   - When `retake` is true: footer button label becomes **"Kembali ke Beranda"**
     and navigates `navigation.navigate('MainTabs', { screen: 'Beranda' })`.
     The Android hardware-back handler also returns to Beranda instead of Chat.
   - When `retake` is falsy: unchanged ("Mulai Chat dengan PHA" → Chat).
   - Score/severity headline + cards render identically so testers can
     screenshot the result.

5. **`frontend/src/chat/chatService.ts`** — change
   `submitGad7(answers, opts?: { retake?: boolean })`. When `opts.retake` is
   true, include `retake: true` in the POST body. Default (no opts) behaves
   exactly as before.

### Backend

6. **`backend/src/modules/chat/chat.schema.ts`** — `submitGad7Schema.body` gains
   `retake: z.boolean().optional()`.

7. **`backend/src/modules/chat/chat.controller.ts`** — read `req.body.retake`
   and pass it to the service: `ChatService.submitGad7(userId, answers, { retake })`.

8. **`backend/src/modules/chat/chat.service.ts`** — signature becomes
   `submitGad7(userId, answers, opts?: { retake?: boolean })`. When
   `opts?.retake === true`, **skip** the `TOO_SOON` cooldown check. Still
   validate answers, compute score/severity, and create a new `gad7Result` row.
   Without the flag, behavior is unchanged (cooldown enforced).

## Data Flow

```
Beranda "Tes Ulang GAD-7" (TESTING_MODE only)
  → navigate Gad7Onboarding { retake: true }
    → submitGad7(answers, { retake: true })
      → POST /chat/gad7/submit { answers, retake: true }
        → service skips TOO_SOON, scores, inserts gad7Result row
      → replace Gad7Result { severity, retake: true }
        → footer "Kembali ke Beranda" → MainTabs/Beranda
```

Chatbot path (unchanged):
```
Beranda "Mulai Cerita" → ChatGate → (needsGad7?) → Gad7Onboarding (no retake)
  → submit (cooldown enforced) → Gad7Result → "Mulai Chat" → Chat
```

## Error Handling

- Retake submit skips the cooldown, so no `TOO_SOON` 409 on that path.
- Other failures (network, `INVALID_ANSWERS`) keep the existing
  `Alert.alert('Gagal', …)` behavior in `Gad7OnboardingScreen`.
- If `TESTING_MODE` is false the button never renders, so the retake param is
  never produced by the UI.

## Security Note

The cooldown is data-hygiene, not a security control. Allowing a client-sent
`retake` flag to bypass it only lets an authenticated user insert extra
`gad7Result` rows for their own account — low risk. It is reversible: remove the
frontend flag and set `TESTING_MODE = false`. Acceptable for UAT.

## Testing

Update `backend/src/modules/chat/__tests__/gad7.test.ts`:
- New case: `submitGad7` with `{ retake: true }` when a recent result exists
  (< 13 days) succeeds and inserts a row (no `TOO_SOON`).
- Existing case: `submitGad7` without the flag within 13 days still throws
  `TOO_SOON`.

## Rollback for Release

1. Set `TESTING_MODE = false` in `frontend/src/config.ts` and rebuild.
   (Hides the button; the whole feature becomes unreachable from the UI.)
2. Optional full removal: delete the testing block from `HomeScreen`, the
   `retake` param handling, and the backend `retake` bypass.
