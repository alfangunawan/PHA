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
export const sendMessage = async (userId: string, message: string): Promise<N8nChatResponse> => {
    const webhookUrl = `${N8N_BASE_URL}/webhook/pha-chat`;

    // Fetch display name so n8n uses the real name instead of the UUID
    const profile = await getProfile(userId).catch(() => null);
    const userName = profile?.displayName ?? userId;

    try {
        console.log(`[n8n] Sending message for user ${userId} (${userName})`);
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // n8n Validasi Input node reads: body.user_id, body.message, body.name
            body: JSON.stringify({ user_id: userId, message, name: userName }),
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
    onChunk: (text: string) => void,
): Promise<N8nChatResponse> => {
    const result = await sendMessage(userId, message);
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
 * Forwards GAD-7 answers to n8n for scoring and persistence.
 * n8n saves the result to the gad7_results table.
 */
export const submitGad7 = async (
    userId: string,
    _sessionId: string,
    answers: number[],
): Promise<N8nGad7Response> => {
    const webhookUrl = `${N8N_BASE_URL}/webhook/pha-gad7-submit`;

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // n8n Hitung Skor GAD-7 reads: body.user_id and body.answers
        body: JSON.stringify({ user_id: userId, answers }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`n8n GAD-7 webhook failed (${response.status}): ${errText}`);
    }

    const data = await response.json();

    return {
        action: data?.action ?? 'gad7_saved',
        data: {
            score: data?.data?.score ?? 0,
            severity: data?.data?.severity ?? 'unknown',
            message: data?.data?.message ?? 'Terima kasih sudah menjawab.',
        },
    };
};
