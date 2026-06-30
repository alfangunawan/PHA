# GAD-7 Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace n8n-based GAD-7 screening with an in-app wizard that gates the Chat screen for new users and every 2 weeks.

**Architecture:** `ChatGate` proxy screen reads a tri-state `gad7LoadingState` from `AuthContext` and routes to either `Gad7OnboardingScreen` (7-question wizard) or `ChatScreen`. Backend handles scoring, min-gap enforcement, and persistence directly via Prisma — no n8n calls.

**Tech Stack:** React Native / Expo, React Navigation (stack), Animated (RN built-in), Express + Prisma (PostgreSQL), Zod, Jest.

## Global Constraints

- `userId` in all GAD-7 writes comes from `req.user.userId` (JWT) — never from request body
- `answers` must be exactly 7 integers each in range 0–3; reject anything else before scoring
- Min-gap guard: reject submit if previous result is < 13 days old → HTTP 409 `{ code: 'TOO_SOON' }`
- `needsGad7` threshold: `daysSince(takenAt) >= 14`
- Intentional 1-day buffer: day 13 = submit allowed but status says not needed yet
- ChatGate and ChatScreen mount guard use identical routing logic via `resolveChatRoute()`
- `resolveChatRoute(null | undefined)` → `'Chat'` (fail-open); only `{ needsGad7: true }` → `'Gad7Onboarding'`
- Headline map lives in frontend — backend returns `{ score, severity }` only
- `Gad7Form.tsx` stays until ChatScreen no longer parses `action === 'chat_with_gad7'` (Task 8)
- n8n workflow confirmed CBT-only — no longer emits `action: chat_with_gad7`

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `backend/src/modules/chat/__tests__/gad7.test.ts` | Jest unit tests for checkGad7Status + submitGad7 |
| `frontend/src/chat/chatGateUtils.ts` | `resolveChatRoute()` shared routing utility |
| `frontend/src/chat/ChatGateScreen.tsx` | Tri-state-aware proxy that routes to Chat or Onboarding |
| `frontend/src/chat/Gad7OnboardingScreen.tsx` | 7-question wizard with progress bar and back nav |
| `frontend/src/chat/Gad7ResultScreen.tsx` | Severity-based result screen with crisis signposting |

### Modified files
| File | Change |
|---|---|
| `backend/src/modules/chat/chat.service.ts` | Add `checkGad7Status`; rewrite `submitGad7` (no n8n, min-gap, scoring) |
| `backend/src/modules/chat/chat.controller.ts` | Add `checkGad7Status` handler; update `submitGad7` to catch TOO_SOON → 409 |
| `backend/src/modules/chat/chat.routes.ts` | Add `GET /gad7/status` route |
| `backend/src/modules/chat/chat.schema.ts` | Make `sessionId` optional in `submitGad7Schema` |
| `frontend/src/auth/AuthContext.tsx` | Add `gad7LoadingState`, `gad7Status`, `refreshGad7Status` |
| `frontend/src/chat/chatService.ts` | Add `checkGad7Status()`; make `sessionId` optional in `submitGad7` |
| `frontend/App.tsx` | Register ChatGate, Gad7Onboarding, Gad7Result screens |
| `frontend/src/home/HomeScreen.tsx` | Change `navigate('Chat')` → `navigate('ChatGate')` |
| `frontend/src/chat/ChatScreen.tsx` | Remove `chat_with_gad7` parser; add mount guard |

---

## Task 1: Backend — checkGad7Status service + route

**Files:**
- Modify: `backend/src/modules/chat/chat.service.ts`
- Modify: `backend/src/modules/chat/chat.controller.ts`
- Modify: `backend/src/modules/chat/chat.routes.ts`
- Test: `backend/src/modules/chat/__tests__/gad7.test.ts`

**Interfaces:**
- Produces: `GET /chat/gad7/status` → `{ needsGad7: boolean, lastTakenAt: string | null }`

- [ ] **Step 1: Write failing tests for checkGad7Status**

Create `backend/src/modules/chat/__tests__/gad7.test.ts`:

```typescript
import { checkGad7Status } from '../chat.service';

// Mock prisma
jest.mock('../../../config/prisma', () => ({
    prisma: {
        gad7Result: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
    },
}));

import { prisma } from '../../../config/prisma';
const mockFindFirst = prisma.gad7Result.findFirst as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('checkGad7Status', () => {
    it('returns needsGad7: true when no results exist', async () => {
        mockFindFirst.mockResolvedValue(null);
        const result = await checkGad7Status('user-1');
        expect(result).toEqual({ needsGad7: true, lastTakenAt: null });
    });

    it('returns needsGad7: false when last result is 5 days ago', async () => {
        const takenAt = new Date(Date.now() - 5 * 86_400_000);
        mockFindFirst.mockResolvedValue({ takenAt });
        const result = await checkGad7Status('user-1');
        expect(result.needsGad7).toBe(false);
        expect(result.lastTakenAt).toBe(takenAt.toISOString());
    });

    it('returns needsGad7: true when last result is 15 days ago', async () => {
        const takenAt = new Date(Date.now() - 15 * 86_400_000);
        mockFindFirst.mockResolvedValue({ takenAt });
        const result = await checkGad7Status('user-1');
        expect(result.needsGad7).toBe(true);
    });

    it('returns needsGad7: true when last result is exactly 14 days ago', async () => {
        const takenAt = new Date(Date.now() - 14 * 86_400_000);
        mockFindFirst.mockResolvedValue({ takenAt });
        const result = await checkGad7Status('user-1');
        expect(result.needsGad7).toBe(true);
    });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd backend && npx jest gad7 --no-coverage
```

Expected: `FAIL — checkGad7Status is not a function`

- [ ] **Step 3: Add checkGad7Status to chat.service.ts**

In `backend/src/modules/chat/chat.service.ts`, add after the imports:

```typescript
export const checkGad7Status = async (userId: string): Promise<{
    needsGad7: boolean;
    lastTakenAt: string | null;
}> => {
    const latest = await (prisma as any).gad7Result.findFirst({
        where: { userId },
        orderBy: { takenAt: 'desc' },
        select: { takenAt: true },
    });

    if (!latest) return { needsGad7: true, lastTakenAt: null };

    const daysSince = (Date.now() - (latest.takenAt as Date).getTime()) / 86_400_000;
    return {
        needsGad7: daysSince >= 14,
        lastTakenAt: (latest.takenAt as Date).toISOString(),
    };
};
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd backend && npx jest gad7 --no-coverage
```

Expected: `PASS — 4 tests passed`

- [ ] **Step 5: Add controller handler**

In `backend/src/modules/chat/chat.controller.ts`, add:

```typescript
export const checkGad7Status = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const status = await ChatService.checkGad7Status(userId);
        res.json(status);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
```

- [ ] **Step 6: Add route**

In `backend/src/modules/chat/chat.routes.ts`, add before `export default router`:

```typescript
router.get('/gad7/status', ChatController.checkGad7Status);
```

- [ ] **Step 7: Commit**

```bash
cd backend
git add src/modules/chat/chat.service.ts src/modules/chat/chat.controller.ts src/modules/chat/chat.routes.ts src/modules/chat/__tests__/gad7.test.ts
git commit -m "feat(chat): add GET /chat/gad7/status endpoint"
```

---

## Task 2: Backend — submitGad7 rewrite

**Files:**
- Modify: `backend/src/modules/chat/chat.service.ts`
- Modify: `backend/src/modules/chat/chat.controller.ts`
- Modify: `backend/src/modules/chat/chat.schema.ts`
- Test: `backend/src/modules/chat/__tests__/gad7.test.ts`

**Interfaces:**
- Consumes: `{ userId: string, answers: number[] }` (sessionId ignored)
- Produces: `{ score: number, severity: 'minimal'|'mild'|'moderate'|'severe' }` or throws `{ code: 'TOO_SOON' }` / `{ message: 'INVALID_ANSWERS' }`

- [ ] **Step 1: Write failing tests for submitGad7**

Append to `backend/src/modules/chat/__tests__/gad7.test.ts`:

```typescript
import { submitGad7 } from '../chat.service';

const mockCreate = prisma.gad7Result.create as jest.Mock;

describe('submitGad7', () => {
    const validAnswers = [1, 0, 2, 1, 0, 1, 2]; // score = 7, mild

    it('saves result and returns score + severity for valid answers', async () => {
        mockFindFirst.mockResolvedValue(null); // no previous result
        mockCreate.mockResolvedValue({});
        const result = await submitGad7('user-1', validAnswers);
        expect(result).toEqual({ score: 7, severity: 'mild' });
        expect(mockCreate).toHaveBeenCalledWith({
            data: expect.objectContaining({ userId: 'user-1', score: 7, severity: 'mild' }),
        });
    });

    it('throws INVALID_ANSWERS if answers length is not 7', async () => {
        await expect(submitGad7('user-1', [0, 1, 2])).rejects.toThrow('INVALID_ANSWERS');
    });

    it('throws INVALID_ANSWERS if any answer is out of range', async () => {
        await expect(submitGad7('user-1', [0, 1, 2, 3, 4, 0, 0])).rejects.toThrow('INVALID_ANSWERS');
    });

    it('throws INVALID_ANSWERS if any answer is not an integer', async () => {
        await expect(submitGad7('user-1', [0, 1.5, 2, 3, 0, 0, 0])).rejects.toThrow('INVALID_ANSWERS');
    });

    it('throws TOO_SOON if last result is 10 days ago', async () => {
        const takenAt = new Date(Date.now() - 10 * 86_400_000);
        mockFindFirst.mockResolvedValue({ takenAt });
        const err: any = await submitGad7('user-1', validAnswers).catch(e => e);
        expect(err.code).toBe('TOO_SOON');
    });

    it('allows submit if last result is 13 days ago (buffer zone)', async () => {
        const takenAt = new Date(Date.now() - 13 * 86_400_000);
        mockFindFirst.mockResolvedValue({ takenAt });
        mockCreate.mockResolvedValue({});
        await expect(submitGad7('user-1', validAnswers)).resolves.toBeDefined();
    });

    it('scores [0,0,0,0,0,0,0] as minimal', async () => {
        mockFindFirst.mockResolvedValue(null);
        mockCreate.mockResolvedValue({});
        expect((await submitGad7('user-1', [0,0,0,0,0,0,0])).severity).toBe('minimal');
    });

    it('scores sum=9 as mild', async () => {
        mockFindFirst.mockResolvedValue(null);
        mockCreate.mockResolvedValue({});
        expect((await submitGad7('user-1', [1,1,1,1,1,2,2])).severity).toBe('mild');
    });

    it('scores sum=14 as moderate', async () => {
        mockFindFirst.mockResolvedValue(null);
        mockCreate.mockResolvedValue({});
        expect((await submitGad7('user-1', [2,2,2,2,2,2,2])).severity).toBe('moderate');
    });

    it('scores sum=15 as severe', async () => {
        mockFindFirst.mockResolvedValue(null);
        mockCreate.mockResolvedValue({});
        expect((await submitGad7('user-1', [2,2,2,2,2,2,3])).severity).toBe('severe');
    });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd backend && npx jest gad7 --no-coverage
```

Expected: failures related to validation and TOO_SOON not existing.

- [ ] **Step 3: Rewrite submitGad7 in chat.service.ts**

Replace the existing `submitGad7` export (the one that calls n8n) with:

```typescript
export const submitGad7 = async (
    userId: string,
    answers: number[],
): Promise<{ score: number; severity: string }> => {
    // Validate
    if (answers.length !== 7) throw new Error('INVALID_ANSWERS');
    if (answers.some(a => !Number.isInteger(a) || a < 0 || a > 3))
        throw new Error('INVALID_ANSWERS');

    // Min-gap guard (13 days — 1-day buffer below the 14-day needsGad7 threshold)
    const latest = await (prisma as any).gad7Result.findFirst({
        where: { userId },
        orderBy: { takenAt: 'desc' },
        select: { takenAt: true },
    });
    if (latest) {
        const daysSince = (Date.now() - (latest.takenAt as Date).getTime()) / 86_400_000;
        if (daysSince < 13) {
            throw Object.assign(new Error('TOO_SOON'), { code: 'TOO_SOON' });
        }
    }

    // Score
    const score = answers.reduce((s, a) => s + a, 0);
    const severity =
        score <= 4  ? 'minimal' :
        score <= 9  ? 'mild' :
        score <= 14 ? 'moderate' :
        'severe';

    await (prisma as any).gad7Result.create({
        data: { userId, score, severity, answers, takenAt: new Date() },
    });

    return { score, severity };
};
```

- [ ] **Step 4: Update submitGad7 controller to handle TOO_SOON**

In `backend/src/modules/chat/chat.controller.ts`, replace the `submitGad7` handler body:

```typescript
export const submitGad7 = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { answers } = req.body; // sessionId ignored after n8n removal

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const result = await ChatService.submitGad7(userId, answers);
        res.json(result);
    } catch (error: any) {
        if (error.code === 'TOO_SOON') {
            return res.status(409).json({ code: 'TOO_SOON' });
        }
        if (error.message === 'INVALID_ANSWERS') {
            return res.status(400).json({ error: 'INVALID_ANSWERS' });
        }
        res.status(500).json({ error: error.message });
    }
};
```

- [ ] **Step 5: Make sessionId optional in submitGad7Schema**

In `backend/src/modules/chat/chat.schema.ts`, update:

```typescript
export const submitGad7Schema = z.object({
    body: z.object({
        sessionId: z.string().min(1).max(128).optional(), // no longer required post-n8n
        answers: z
            .array(z.number().int().min(0).max(3))
            .length(7, 'GAD-7 requires exactly 7 answers (0–3 each)'),
    }),
});
```

- [ ] **Step 6: Run tests — verify all pass**

```bash
cd backend && npx jest gad7 --no-coverage
```

Expected: `PASS — 14 tests passed`

- [ ] **Step 7: Commit**

```bash
cd backend
git add src/modules/chat/chat.service.ts src/modules/chat/chat.controller.ts src/modules/chat/chat.schema.ts src/modules/chat/__tests__/gad7.test.ts
git commit -m "feat(chat): rewrite submitGad7 — direct scoring, min-gap guard, no n8n"
```

---

## Task 3: Frontend — chatGateUtils + chatService additions

**Files:**
- Create: `frontend/src/chat/chatGateUtils.ts`
- Modify: `frontend/src/chat/chatService.ts`

**Interfaces:**
- Produces: `resolveChatRoute(status) => 'Chat' | 'Gad7Onboarding'`
- Produces: `checkGad7Status() => Promise<{ needsGad7: boolean, lastTakenAt: string | null }>`
- Produces: `submitGad7(answers: number[]) => Promise<{ score: number, severity: string }>`

- [ ] **Step 1: Create chatGateUtils.ts**

Create `frontend/src/chat/chatGateUtils.ts`:

```typescript
export type Gad7Status = { needsGad7: boolean; lastTakenAt: string | null } | null;

export function resolveChatRoute(
    gad7Status: Gad7Status | undefined,
): 'Chat' | 'Gad7Onboarding' {
    if (gad7Status?.needsGad7 === true) return 'Gad7Onboarding';
    return 'Chat';
}
```

- [ ] **Step 2: Add checkGad7Status to chatService.ts**

In `frontend/src/chat/chatService.ts`, add:

```typescript
export const checkGad7Status = async (): Promise<{
    needsGad7: boolean;
    lastTakenAt: string | null;
}> => {
    const response = await client.get('/chat/gad7/status');
    return response.data;
};
```

- [ ] **Step 3: Update submitGad7 signature in chatService.ts**

Replace the existing `submitGad7` export:

```typescript
export const submitGad7 = async (
    answers: number[],
): Promise<{ score: number; severity: string }> => {
    const response = await client.post('/chat/gad7/submit', { answers });
    return response.data;
};
```

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/chat/chatGateUtils.ts src/chat/chatService.ts
git commit -m "feat(chat): add chatGateUtils and update chatService for GAD-7 gate"
```

---

## Task 4: Frontend — AuthContext gad7 tri-state

**Files:**
- Modify: `frontend/src/auth/AuthContext.tsx`

**Interfaces:**
- Consumes: `checkGad7Status()` from `chatService.ts`
- Produces: `gad7LoadingState: 'loading' | 'ready' | 'error'`
- Produces: `gad7Status: Gad7Status`
- Produces: `refreshGad7Status: () => Promise<void>`

- [ ] **Step 1: Update AuthContext.tsx**

Replace the full contents of `frontend/src/auth/AuthContext.tsx`:

```typescript
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getToken, getUser, removeToken, removeUser, login as apiLogin, register as apiRegister, saveUser } from './useAuth';
import { setInvalidSessionHandler } from './sessionEvents';
import { checkGad7Status as apiCheckGad7Status } from '../chat/chatService';
import type { Gad7Status } from '../chat/chatGateUtils';

interface UserInfo {
    id: string;
    email: string;
    role: string;
    name?: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserInfo | null;
    isAdmin: boolean;
    canAccessAdminPanel: boolean;
    isLoading: boolean;
    gad7LoadingState: 'loading' | 'ready' | 'error';
    gad7Status: Gad7Status;
    refreshGad7Status: () => Promise<void>;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string, name?: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [gad7LoadingState, setGad7LoadingState] = useState<'loading' | 'ready' | 'error'>('loading');
    const [gad7Status, setGad7Status] = useState<Gad7Status>(null);

    useEffect(() => {
        checkAuth();
        setInvalidSessionHandler(() => {
            setIsAuthenticated(false);
            setUser(null);
            setGad7Status(null);
            setGad7LoadingState('error');
        });

        return () => setInvalidSessionHandler(null);
    }, []);

    // Fetch GAD-7 status whenever user becomes authenticated
    useEffect(() => {
        if (isAuthenticated) {
            refreshGad7Status();
        }
    }, [isAuthenticated]);

    const checkAuth = async () => {
        try {
            const token = await getToken();
            const savedUser = await getUser();
            setIsAuthenticated(!!token);
            setUser(savedUser);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshGad7Status = async () => {
        setGad7LoadingState('loading');
        try {
            const status = await apiCheckGad7Status();
            setGad7Status(status);
            setGad7LoadingState('ready');
        } catch {
            setGad7Status(null);
            setGad7LoadingState('error');
        }
    };

    const login = async (email: string, pass: string) => {
        const data = await apiLogin(email, pass);
        setIsAuthenticated(true);
        if (data.user) {
            setUser(data.user);
            await saveUser(data.user);
        }
    };

    const register = async (email: string, pass: string, name?: string) => {
        await apiRegister(email, pass, name);
        await login(email, pass);
    };

    const logout = async () => {
        await removeToken();
        await removeUser();
        setIsAuthenticated(false);
        setUser(null);
        setGad7Status(null);
        setGad7LoadingState('loading');
    };

    const isAdmin = user?.role === 'ADMIN';

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user,
                isAdmin,
                canAccessAdminPanel: isAdmin,
                isLoading,
                gad7LoadingState,
                gad7Status,
                refreshGad7Status,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => useContext(AuthContext);
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/auth/AuthContext.tsx
git commit -m "feat(auth): add tri-state gad7Status to AuthContext"
```

---

## Task 5: Frontend — ChatGateScreen

**Files:**
- Create: `frontend/src/chat/ChatGateScreen.tsx`

**Interfaces:**
- Consumes: `gad7LoadingState`, `gad7Status` from `useAuthContext()`
- Consumes: `resolveChatRoute()` from `chatGateUtils.ts`

- [ ] **Step 1: Create ChatGateScreen.tsx**

Create `frontend/src/chat/ChatGateScreen.tsx`:

```typescript
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthContext } from '../auth/AuthContext';
import { resolveChatRoute } from './chatGateUtils';

interface Props {
    navigation: any;
}

export default function ChatGateScreen({ navigation }: Props) {
    const { gad7LoadingState, gad7Status } = useAuthContext();

    useEffect(() => {
        if (gad7LoadingState === 'loading') return; // wait
        if (gad7LoadingState === 'error') {
            navigation.replace('Chat'); // fail-open
            return;
        }
        // 'ready' — status is known
        navigation.replace(resolveChatRoute(gad7Status));
    }, [gad7LoadingState]);

    return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#1A59A1" />
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
});
```

- [ ] **Step 2: Manual verification plan**

After wiring in App.tsx (Task 7), verify:
1. New user (no GAD-7) → taps Chat → ChatGate spinner briefly → lands on Gad7Onboarding ✓
2. Existing user (GAD-7 < 14 days) → taps Chat → ChatGate spinner briefly → lands on Chat ✓
3. Kill app mid-gate (before status fetch) → restart → gate waits for fetch → routes correctly ✓

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/chat/ChatGateScreen.tsx
git commit -m "feat(chat): add ChatGateScreen as tri-state routing proxy"
```

---

## Task 6: Frontend — Gad7OnboardingScreen

**Files:**
- Create: `frontend/src/chat/Gad7OnboardingScreen.tsx`

**Interfaces:**
- Consumes: `submitGad7(answers)` from `chatService.ts`
- Consumes: `refreshGad7Status()` from `useAuthContext()`
- Produces: navigates to `'Gad7Result'` with `{ severity }` param on success

- [ ] **Step 1: Create Gad7OnboardingScreen.tsx**

Create `frontend/src/chat/Gad7OnboardingScreen.tsx`:

```typescript
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Alert,
    BackHandler, Animated, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { submitGad7 } from './chatService';
import { useAuthContext } from '../auth/AuthContext';

const PRIMARY = '#1A59A1';
const PRIMARY_DEEP = '#14457D';

const GAD7_QUESTIONS = [
    'Merasa gugup, cemas, atau tegang?',
    'Tidak mampu menghentikan atau mengendalikan rasa khawatir?',
    'Terlalu banyak khawatir tentang berbagai hal?',
    'Kesulitan untuk santai?',
    'Sangat gelisah sehingga sulit untuk duduk diam?',
    'Mudah tersinggung atau mudah marah?',
    'Merasa takut seolah-olah sesuatu yang buruk akan terjadi?',
];

const GAD7_OPTIONS = [
    { label: 'Tidak sama sekali', value: 0 },
    { label: 'Beberapa hari', value: 1 },
    { label: 'Lebih dari separuh hari', value: 2 },
    { label: 'Hampir setiap hari', value: 3 },
];

interface Props {
    navigation: any;
}

export default function Gad7OnboardingScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const { refreshGad7Status } = useAuthContext();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<number[]>(new Array(7).fill(-1));
    const [submitting, setSubmitting] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Android hardware back: exit alert at Q0, go back at Q1+
    useFocusEffect(useCallback(() => {
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            if (currentQuestion > 0) {
                goBack();
            } else {
                showExitAlert();
            }
            return true;
        });
        return () => sub.remove();
    }, [currentQuestion]));

    const showExitAlert = () => {
        Alert.alert(
            'Keluar?',
            'Jawabanmu tidak akan disimpan.',
            [
                { text: 'Batal', style: 'cancel' },
                { text: 'Keluar', onPress: () => navigation.goBack() },
            ],
        );
    };

    const slideToNext = (callback: () => void) => {
        Animated.sequence([
            Animated.timing(slideAnim, { toValue: -400, duration: 180, useNativeDriver: true }),
        ]).start(() => {
            callback();
            slideAnim.setValue(400);
            Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
        });
    };

    const slideToPrev = (callback: () => void) => {
        Animated.sequence([
            Animated.timing(slideAnim, { toValue: 400, duration: 180, useNativeDriver: true }),
        ]).start(() => {
            callback();
            slideAnim.setValue(-400);
            Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
        });
    };

    const handleSelect = (value: number) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = value;
        setAnswers(newAnswers);
    };

    const goForward = () => {
        if (currentQuestion < 6) {
            slideToNext(() => setCurrentQuestion(q => q + 1));
        } else {
            handleSubmit();
        }
    };

    const goBack = () => {
        slideToPrev(() => setCurrentQuestion(q => q - 1));
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const result = await submitGad7(answers);
            // Do NOT await refreshGad7Status here — that would hang the submit screen.
            // Refresh happens in Gad7ResultScreen before navigating to Chat.
            navigation.replace('Gad7Result', { severity: result.severity });
        } catch (error: any) {
            if (error?.response?.status === 409 && error?.response?.data?.code === 'TOO_SOON') {
                // Already submitted recently — refresh and go to chat silently
                await refreshGad7Status();
                navigation.replace('Chat');
                return;
            }
            Alert.alert('Gagal', 'Gagal mengirim jawaban. Silakan coba lagi.');
        } finally {
            setSubmitting(false);
        }
    };

    const currentAnswer = answers[currentQuestion];
    const isAnswered = currentAnswer !== -1;
    const isLastQuestion = currentQuestion === 6;
    const progress = (currentQuestion + 1) / 7;

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={currentQuestion === 0 ? showExitAlert : goBack}
                    style={styles.backBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Text style={styles.backText}>{currentQuestion === 0 ? '✕' : '←'}</Text>
                </TouchableOpacity>
                <Text style={styles.progress}>{currentQuestion + 1} / 7</Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>

            {/* Question */}
            <Animated.View
                style={[styles.content, { transform: [{ translateX: slideAnim }] }]}
            >
                <Text style={styles.preamble}>Dalam 2 minggu terakhir, seberapa sering kamu…</Text>
                <Text style={styles.question}>{GAD7_QUESTIONS[currentQuestion]}</Text>

                <View style={styles.options}>
                    {GAD7_OPTIONS.map(opt => {
                        const selected = currentAnswer === opt.value;
                        return (
                            <TouchableOpacity
                                key={opt.value}
                                style={[styles.option, selected && styles.optionSelected]}
                                onPress={() => handleSelect(opt.value)}
                                activeOpacity={0.85}
                            >
                                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </Animated.View>

            {/* Next / Submit button */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity
                    style={[styles.nextBtn, !isAnswered && styles.nextBtnDisabled]}
                    onPress={goForward}
                    disabled={!isAnswered || submitting}
                    activeOpacity={0.85}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.nextBtnText}>
                            {isLastQuestion ? 'Lihat Hasilku' : 'Lanjut →'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#ffffff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    backText: { fontSize: 20, color: '#243a5c' },
    progress: { fontSize: 13, color: '#7689a6', fontWeight: '600' },
    progressTrack: {
        height: 4,
        backgroundColor: '#eaf1fa',
        marginHorizontal: 20,
        borderRadius: 2,
    },
    progressFill: {
        height: 4,
        backgroundColor: PRIMARY,
        borderRadius: 2,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 36,
    },
    preamble: {
        fontSize: 14,
        color: '#7689a6',
        marginBottom: 8,
    },
    question: {
        fontSize: 22,
        fontWeight: '700',
        color: '#243a5c',
        lineHeight: 30,
        marginBottom: 32,
        fontFamily: Platform.OS === 'ios' ? undefined : undefined,
    },
    options: { gap: 12 },
    option: {
        borderWidth: 1.5,
        borderColor: '#dbe7f6',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#f7faff',
    },
    optionSelected: {
        borderColor: PRIMARY,
        backgroundColor: '#eaf1fa',
    },
    optionText: { fontSize: 15, color: '#243a5c' },
    optionTextSelected: { color: PRIMARY, fontWeight: '600' },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    nextBtn: {
        backgroundColor: PRIMARY,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    nextBtnDisabled: { backgroundColor: '#a8c5e8' },
    nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
```

- [ ] **Step 2: Manual verification**

After wiring App.tsx (Task 7):
1. Navigate to Gad7Onboarding → swipe through Q1–Q7, verify slide animation ✓
2. Select answer on Q3 → tap Back → Q2 shows, previous answer retained ✓
3. On Q1, tap ← → Alert "Keluar?" appears, cancel resumes wizard ✓
4. Android: hardware back at Q2 → goes to Q1 ✓; hardware back at Q1 → Alert ✓
5. Answer all 7 → tap "Lihat Hasilku" → spinner shows while submitting ✓
6. TOO_SOON response → silently navigates to Chat ✓

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/chat/Gad7OnboardingScreen.tsx
git commit -m "feat(chat): add GAD-7 wizard onboarding screen"
```

---

## Task 7: Frontend — Gad7ResultScreen

**Files:**
- Create: `frontend/src/chat/Gad7ResultScreen.tsx`

**Interfaces:**
- Consumes: `route.params.severity: 'minimal' | 'mild' | 'moderate' | 'severe'`
- Consumes: `refreshGad7Status()` from `useAuthContext()`

- [ ] **Step 1: Create Gad7ResultScreen.tsx**

Create `frontend/src/chat/Gad7ResultScreen.tsx`:

```typescript
import React, { useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Linking, Alert,
    BackHandler, ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthContext } from '../auth/AuthContext';

const PRIMARY = '#1A59A1';

const HEADLINES: Record<string, string> = {
    minimal:  'Kamu tampak cukup baik-baik saja belakangan ini.',
    mild:     'Ada sedikit gelombang yang kamu hadapi — itu wajar.',
    moderate: 'Kamu sedang menanggung cukup banyak. Itu bukan salahmu.',
    severe:   'Ini terdengar berat. Kamu tidak harus menanggungnya sendiri.',
};

interface Props {
    navigation: any;
    route: { params: { severity: string } };
}

export default function Gad7ResultScreen({ navigation, route }: Props) {
    const insets = useSafeAreaInsets();
    const { refreshGad7Status } = useAuthContext();
    const { severity } = route.params;
    const headline = HEADLINES[severity] ?? HEADLINES.mild;
    const isModerate = severity === 'moderate' || severity === 'severe';
    const isSevere = severity === 'severe';

    // Android hardware back → go to Chat (give user a way out, not a wall)
    useFocusEffect(useCallback(() => {
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            navigation.replace('Chat');
            return true;
        });
        return () => sub.remove();
    }, []));

    const handleStartChat = async () => {
        // Await refresh here (Result → Chat), NOT in submit → Result.
        // This ensures ChatScreen mount guard sees updated status.
        await refreshGad7Status();
        navigation.replace('Chat');
    };

    const handleBreathing = () => {
        // Navigate to Breathing tab via MainTabs
        navigation.navigate('MainTabs', { screen: 'Napas' });
    };

    const handleHotline = async () => {
        try {
            await Linking.openURL('tel:119');
        } catch {
            Alert.alert('Tidak bisa membuka telepon', 'Hubungi 119 secara manual, lalu tekan ext 8.');
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 24) + 80 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Headline */}
                <View style={styles.headlineSection}>
                    <Text style={styles.headline}>{headline}</Text>
                    <Text style={styles.disclaimer}>
                        Ini gambaran perasaanmu sementara — bukan diagnosis.
                    </Text>
                </View>

                {/* Moderate+ — breathing */}
                {isModerate && (
                    <TouchableOpacity style={styles.card} onPress={handleBreathing} activeOpacity={0.85}>
                        <Text style={styles.cardIcon}>🌬️</Text>
                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle}>Coba teknik pernapasan sekarang</Text>
                            <Text style={styles.cardSub}>Bantu menenangkan pikiran dalam 3 menit</Text>
                        </View>
                        <Text style={styles.cardArrow}>→</Text>
                    </TouchableOpacity>
                )}

                {/* Severe — counseling signpost */}
                {isSevere && (
                    <View style={styles.card}>
                        <Text style={styles.cardIcon}>🤝</Text>
                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle}>Konseling kampus — gratis & rahasia</Text>
                            <Text style={styles.cardSub}>
                                Berbicara dengan konselor bisa membantu ketika beban terasa besar.
                                Layanan ini tersedia untukmu di kampus (CB-FR-08).
                            </Text>
                        </View>
                    </View>
                )}

                {/* Severe — hotline (crisis framing only) */}
                {isSevere && (
                    <View style={styles.hotlineSection}>
                        <Text style={styles.hotlineLabel}>
                            Kalau ada pikiran menyakiti diri atau merasa tidak aman:
                        </Text>
                        <TouchableOpacity style={styles.hotlineBtn} onPress={handleHotline} activeOpacity={0.8}>
                            <Text style={styles.hotlineBtnText}>Hubungi 119</Text>
                        </TouchableOpacity>
                        <Text style={styles.hotlineNote}>Setelah tersambung, tekan ext 8</Text>
                    </View>
                )}
            </ScrollView>

            {/* Start Chat — pinned bottom */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity style={styles.chatBtn} onPress={handleStartChat} activeOpacity={0.85}>
                    <Text style={styles.chatBtnText}>Mulai Chat dengan PHA</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#ffffff' },
    scroll: { paddingHorizontal: 24, paddingTop: 48 },

    headlineSection: { marginBottom: 32 },
    headline: {
        fontSize: 26,
        fontWeight: '700',
        color: '#243a5c',
        lineHeight: 34,
        marginBottom: 12,
    },
    disclaimer: {
        fontSize: 13,
        color: '#7689a6',
        fontStyle: 'italic',
        lineHeight: 18,
    },

    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#eaf1fa',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        gap: 12,
    },
    cardIcon: { fontSize: 24, marginTop: 2 },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: '#243a5c', marginBottom: 4 },
    cardSub: { fontSize: 13, color: '#7689a6', lineHeight: 18 },
    cardArrow: { fontSize: 18, color: PRIMARY, alignSelf: 'center' },

    hotlineSection: {
        marginTop: 8,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#dbe7f6',
        backgroundColor: '#f7faff',
        alignItems: 'flex-start',
    },
    hotlineLabel: { fontSize: 13, color: '#243a5c', marginBottom: 10, lineHeight: 18 },
    hotlineBtn: {
        backgroundColor: PRIMARY,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    hotlineBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    hotlineNote: { fontSize: 12, color: '#7689a6' },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 12,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#eef3fa',
    },
    chatBtn: {
        backgroundColor: PRIMARY,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    chatBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
```

- [ ] **Step 2: Manual verification**

After wiring App.tsx (Task 8):
1. `severity: minimal` → only headline + disclaimer + "Mulai Chat" ✓
2. `severity: moderate` → breathing card + "Mulai Chat" ✓
3. `severity: severe` → breathing + counseling + hotline section + "Mulai Chat" ✓
4. Tap "Hubungi 119" → phone dialer opens to 119 ✓ (verify on real device)
5. Android hardware back from ResultScreen → navigates to Chat ✓
6. iOS swipe from ResultScreen → blocked (gestureEnabled: false in App.tsx) ✓

- [ ] **Step 3: Commit**

```bash
cd frontend
git add src/chat/Gad7ResultScreen.tsx
git commit -m "feat(chat): add GAD-7 result screen with severity-based signposting"
```

---

## Task 8: Frontend — App.tsx wiring + HomeScreen

**Files:**
- Modify: `frontend/App.tsx`
- Modify: `frontend/src/home/HomeScreen.tsx`

- [ ] **Step 1: Register new screens in App.tsx**

At the top of `frontend/App.tsx`, add imports after the existing screen imports:

```typescript
import ChatGateScreen from './src/chat/ChatGateScreen';
import Gad7OnboardingScreen from './src/chat/Gad7OnboardingScreen';
import Gad7ResultScreen from './src/chat/Gad7ResultScreen';
```

In the `Stack.Navigator` inside `RootNavigator`, add three screens after the existing `Chat` screen:

```tsx
<Stack.Screen
    name="ChatGate"
    component={ChatGateScreen}
    options={{ headerShown: false }}
/>
<Stack.Screen
    name="Gad7Onboarding"
    component={Gad7OnboardingScreen}
    options={{ headerShown: false, gestureEnabled: false }}
/>
<Stack.Screen
    name="Gad7Result"
    component={Gad7ResultScreen}
    options={{ headerShown: false, gestureEnabled: false }}
/>
```

- [ ] **Step 2: Change HomeScreen navigate target**

In `frontend/src/home/HomeScreen.tsx` at line 191, change:

```typescript
// Before
onPress={() => navigation.navigate('Chat')}

// After
onPress={() => navigation.navigate('ChatGate')}
```

- [ ] **Step 3: Commit**

```bash
cd frontend
git add App.tsx src/home/HomeScreen.tsx
git commit -m "feat(nav): wire ChatGate, Gad7Onboarding, Gad7Result into navigator"
```

---

## Task 9: Frontend — ChatScreen cleanup

**Files:**
- Modify: `frontend/src/chat/ChatScreen.tsx`

**Interfaces:**
- Consumes: `gad7LoadingState`, `gad7Status` from `useAuthContext()`
- Consumes: `resolveChatRoute()` from `chatGateUtils.ts`

- [ ] **Step 1: Add imports to ChatScreen.tsx**

At the top of `frontend/src/chat/ChatScreen.tsx`, add:

```typescript
import { useAuthContext } from '../auth/AuthContext';
import { resolveChatRoute } from './chatGateUtils';
```

- [ ] **Step 2: Add mount guard**

Inside `ChatScreen`, after the existing `useState` declarations, add:

```typescript
const { gad7LoadingState, gad7Status } = useAuthContext();

// Safety net: if reached without going through ChatGate
useEffect(() => {
    if (gad7LoadingState !== 'ready') return;
    if (resolveChatRoute(gad7Status) === 'Gad7Onboarding') {
        navigation.replace('Gad7Onboarding');
    }
}, [gad7LoadingState]);
```

- [ ] **Step 3: Remove chat_with_gad7 parser**

In `ChatScreen.tsx`, find the `onComplete` callback in `handleSend` (around line 170):

```typescript
// Remove this entire block:
if (final?.action === 'chat_with_gad7' && final?.data?.gad7) {
    setMessages(prev => prev.map(m =>
        m.id === aiMsgId
            ? { ...m, action: final.action, gad7Data: final.data }
            : m
    ));
}
```

Replace with nothing — `onComplete` body becomes empty or just closes:
```typescript
(final) => {
    setSending(false);
},
```

- [ ] **Step 4: Remove Gad7Form rendering in renderItem**

In `renderItem` in `ChatScreen.tsx`, remove the block:

```typescript
// Remove:
if (!isUser && item.action === 'chat_with_gad7' && item.gad7Data) {
    return (
        <View style={styles.aiBubbleRow}>
            <View style={styles.phaAvatar}><PHAChatIcon size={16} /></View>
            <Gad7Form
                data={item.gad7Data}
                sessionId={item.sessionId ?? currentSessionId ?? ''}
                onSubmitted={(rawResponse) => {
                        const resultMsg: ChatMessage = {
                            id: Date.now().toString(),
                            sender: 'ai',
                            message: rawResponse?.data?.message ?? 'Terima kasih sudah menjawab.',
                            timestamp: new Date().toISOString(),
                        };
                        setMessages(prev => [...prev, resultMsg]);
                    }}
            />
        </View>
    );
}
```

- [ ] **Step 5: Remove Gad7Form import**

Remove from `ChatScreen.tsx`:

```typescript
import Gad7Form from './Gad7Form';
```

Also remove `action` and `gad7Data` from `ChatMessage` type usage if no longer referenced. In `chatService.ts`, the `ChatMessage` interface has `action?` and `gad7Data?` — leave them for now (they're optional, harmless).

- [ ] **Step 6: Commit**

```bash
cd frontend
git add src/chat/ChatScreen.tsx
git commit -m "feat(chat): add GAD-7 mount guard, remove chat_with_gad7 parser"
```

---

## Task 10: End-to-End Verification

- [ ] **Step 1: Full new-user flow**

1. Register a new account
2. Tap chat icon on HomeScreen
3. Expected: ChatGate → Gad7Onboarding (7 questions)
4. Complete all 7 questions → tap "Lihat Hasilku"
5. Expected: Gad7Result screen with appropriate severity headline
6. Tap "Mulai Chat dengan PHA"
7. Expected: ChatScreen opens, chat works normally

- [ ] **Step 2: Returning user flow (< 14 days)**

1. Log in with an account that has a recent GAD-7
2. Tap chat icon
3. Expected: ChatGate → Chat directly (no wizard)

- [ ] **Step 3: 2-week reminder flow**

1. In DB, manually set `taken_at = NOW() - INTERVAL '15 days'` for a test user's latest `gad7_results` row
2. Log in, tap chat
3. Expected: ChatGate → Gad7Onboarding again

```sql
UPDATE gad7_results
SET taken_at = NOW() - INTERVAL '15 days'
WHERE user_id = '<your-test-user-id>'
  AND id = (SELECT id FROM gad7_results WHERE user_id = '<your-test-user-id>' ORDER BY taken_at DESC LIMIT 1);
```

- [ ] **Step 4: TOO_SOON guard**

1. Call `POST /chat/gad7/submit` twice within 13 days (second call via curl or Postman)
2. Expected: second call returns `409 { code: 'TOO_SOON' }`

- [ ] **Step 5: Android back navigation**

On Android device or emulator:
1. Open Gad7Onboarding → press hardware back at Q1 → Alert appears ✓
2. At Q3 → hardware back → returns to Q2 with answer retained ✓
3. On Gad7Result → hardware back → navigates to Chat ✓

- [ ] **Step 6: Hotline verify on device**

On real Android device with SIM:
1. Navigate to Gad7Result with `severity: severe`
2. Tap "Hubungi 119" → confirm phone dialer opens to 119
3. If it opens, note that ext 8 must be dialed manually (per on-screen instruction)

- [ ] **Step 7: Final commit**

```bash
cd frontend && git add -p  # stage any remaining verification fixes
git commit -m "test: verify GAD-7 onboarding e2e flow"
```

---

## Known Limitations (carry into thesis Bab IV)

1. **Kadens drift**: Scheduling based on `takenAt` — if user fills late, next due date shifts. Not anchor-based. Acknowledge in Bab IV.
2. **Double-submit race**: Two near-simultaneous submits before any row exists can both pass the min-gap check. Mitigated by button disable but not eliminated.
3. **Hotline tel: extension**: `119 ext 8` cannot be auto-dialed; requires manual entry. Documented in-screen.
