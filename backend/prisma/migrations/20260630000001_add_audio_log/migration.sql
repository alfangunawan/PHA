-- CreateTable: AudioLog (mengikuti pola MeditationLog)
CREATE TABLE "AudioLog" (
    "id"          TEXT         NOT NULL DEFAULT gen_random_uuid(),
    "userId"      TEXT         NOT NULL,
    "audioId"     TEXT         NOT NULL,
    "duration"    INTEGER      NOT NULL,
    "completed"   BOOLEAN      NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AudioLog_pkey"         PRIMARY KEY ("id"),
    CONSTRAINT "AudioLog_userId_fkey"  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AudioLog_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "AudioContent"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AudioLog_userId_completedAt_idx" ON "AudioLog"("userId", "completedAt" DESC);
