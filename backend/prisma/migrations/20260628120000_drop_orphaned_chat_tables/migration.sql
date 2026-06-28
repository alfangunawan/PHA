-- Drop orphaned ChatMessage and ChatSession tables (both empty, never used by app).
-- n8n writes to `conversations` (Conversation model); ChatSession/ChatMessage were dead from the start.

ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_sessionId_fkey";
ALTER TABLE "ChatSession" DROP CONSTRAINT "ChatSession_userId_fkey";

DROP TABLE "ChatMessage";
DROP TABLE "ChatSession";
