import { prisma } from '../../config/prisma';
import { getProfile } from '../profile/profile.service';

const N8N_BASE_URL = 'https://n8n.alstore.space';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface N8nChatResponse {
    action: 'chat_response' | 'chat_with_gad7';
    data: {
        message: string;
        cbt_phase: string | null;
        is_crisis: boolean;
        gad7: Gad7Form | null;
        timestamp?: string;
    };
}

interface Gad7Form {
    questions: { id: number; text: string }[];
    options: { value: number; label: string }[];
    submit_endpoint: string;
}

interface N8nGad7Response {
    action: 'gad7_saved';
    data: {
        score: number;
        severity: string;
        message: string;
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat (routed through n8n)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends a user message to n8n webhook.
 * n8n handles: user upsert, history fetch, GAD-7 signal tracking,
 * CBT phase routing, Gemini call, and conversation persistence.
 * The backend does NOT duplicate messages into Prisma — n8n owns the conversations table.
 */
export const sendMessage = async (userId: string, message: string, sessionId?: string): Promise<N8nChatResponse> => {
    const webhookUrl = `${N8N_BASE_URL}/webhook/pha-chat`;

    // Fetch display name so n8n uses the real name instead of the UUID
    const profile = await getProfile(userId).catch(() => null);
    const userName = profile?.displayName ?? userId;

    try {
        console.log(`[n8n] Sending message for user ${userId} (${userName})`);
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-PHA-Key': process.env.PHA_WEBHOOK_SECRET ?? '',
            },
            // n8n Validasi Input node reads: body.user_id, body.message, body.name, body.session_id
            body: JSON.stringify({
                user_id: userId,
                message,
                name: userName,
                ...(sessionId ? { session_id: sessionId } : {}),
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`n8n responded with ${response.status}: ${errText}`);
        }

        const raw = await response.json();
        console.log(`[n8n] Response action: ${raw?.action}`);

        // n8n always returns: { status, action, data: { message, cbt_phase, is_crisis, gad7? } }
        return {
            action: raw?.action ?? 'chat_response',
            data: {
                message: raw?.data?.message ?? 'Maaf, tidak ada respons.',
                cbt_phase: raw?.data?.cbt_phase ?? null,
                is_crisis: raw?.data?.is_crisis ?? false,
                gad7: raw?.data?.gad7 ?? null,
            },
        };
    } catch (error: any) {
        console.error('[n8n] Webhook Error:', error.message);
        return {
            action: 'chat_response',
            data: {
                message: 'Maaf, saya sedang mengalami gangguan komunikasi. Bisa ulangi lagi?',
                cbt_phase: null,
                is_crisis: false,
                gad7: null,
            },
        };
    }
};

/**
 * Wraps sendMessage for SSE stream endpoints.
 * Since n8n doesn't support streaming, we call the full webhook
 * then emit the response word-by-word to simulate streaming.
 */
export const streamMessage = async (
    userId: string,
    message: string,
    sessionId: string | undefined,
    onChunk: (text: string) => void,
): Promise<N8nChatResponse> => {
    const result = await sendMessage(userId, message, sessionId);
    const fullText = result.data.message;

    // Simulate streaming: emit word by word with small delay
    const words = fullText.split(' ');
    for (const word of words) {
        onChunk(word + ' ');
        await new Promise(r => setTimeout(r, 25));
    }

    return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// History — queries n8n's conversations table directly (raw SQL)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the full conversation history for a user from n8n's conversations table.
 */
export const getHistory = async (userId: string) => {
    try {
        const rows = await prisma.$queryRaw<any[]>`
            SELECT id, user_id, session_id, role, content, cbt_phase, created_at
            FROM conversations
            WHERE user_id = ${userId}
            ORDER BY created_at ASC
            LIMIT 100
        `;
        return rows;
    } catch (e: any) {
        console.error('[getHistory] Raw query failed:', e.message);
        return [];
    }
};

/**
 * Returns distinct chat sessions for a user from the conversations table.
 */
export const getSessions = async (userId: string) => {
    try {
        const rows = await prisma.$queryRaw<any[]>`
            SELECT
                session_id,
                MIN(created_at) AS started_at,
                MAX(created_at) AS last_message_at,
                COUNT(*) AS message_count,
                (
                    SELECT content FROM conversations c2
                    WHERE c2.session_id = c1.session_id AND c2.user_id = ${userId}
                    ORDER BY created_at ASC LIMIT 1
                ) AS first_message
            FROM conversations c1
            WHERE user_id = ${userId}
            GROUP BY session_id
            ORDER BY last_message_at DESC
        `;

        return rows.map(r => ({
            id: r.session_id,
            startedAt: r.started_at,
            lastMessageAt: r.last_message_at,
            messageCount: Number(r.message_count),
            preview: (r.first_message as string)?.substring(0, 80) || 'Empty chat',
        }));
    } catch (e: any) {
        console.error('[getSessions] Raw query failed:', e.message);
        return [];
    }
};

/**
 * Returns all messages for a specific session belonging to a user.
 */
export const getSessionMessages = async (userId: string, sessionId: string) => {
    try {
        const rows = await prisma.$queryRaw<any[]>`
            SELECT id, user_id, session_id, role, content, cbt_phase, created_at
            FROM conversations
            WHERE user_id = ${userId} AND session_id = ${sessionId}
            ORDER BY created_at ASC
        `;
        return rows;
    } catch (e: any) {
        console.error('[getSessionMessages] Raw query failed:', e.message);
        return [];
    }
};

/**
 * Checks whether a user needs to retake the GAD-7 assessment.
 * Returns needsGad7: true if no prior result exists or the last result is ≥ 14 days old.
 */
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

/**
 * Returns the latest GAD-7 screening result for a user from pha_db.
 */
export const getLatestGad7ForUser = async (userId: string) => {
    const gad7Result = (prisma as any).gad7Result as {
        findFirst: (args: {
            where: { userId: string };
            orderBy: { takenAt: 'desc' };
            select: { score: true; severity: true; takenAt: true };
        }) => Promise<{ score: number; severity: string; takenAt: Date } | null>;
    };

    return gad7Result.findFirst({
        where: { userId },
        orderBy: { takenAt: 'desc' },
        select: {
            score: true,
            severity: true,
            takenAt: true,
        },
    });
};

/**
 * Creates a new session token. Since n8n manages sessions implicitly
 * (session_id = user_id by default, or provided by client), we just
 * return a new UUID the frontend can use as session_id in future messages.
 */
export const createNewSession = async (userId: string) => {
    const sessionId = crypto.randomUUID();
    return { id: sessionId, userId, startedAt: new Date().toISOString() };
};

// ─────────────────────────────────────────────────────────────────────────────
// GAD-7 Submission
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scores and persists a GAD-7 submission directly via Prisma.
 * Replaces the previous n8n webhook approach.
 *
 * Throws:
 *   - Error('INVALID_ANSWERS') if answers are not exactly 7 integers in 0–3
 *   - Object.assign(Error('TOO_SOON'), { code: 'TOO_SOON' }) if last result < 13 days ago
 */
export const submitGad7 = async (
    userId: string,
    answers: number[],
): Promise<{ score: number; severity: 'minimal' | 'mild' | 'moderate' | 'severe' }> => {
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
