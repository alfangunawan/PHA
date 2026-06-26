-- AlterEnum: Add new roles
ALTER TYPE "Role" ADD VALUE 'GAMIFICATION_ADMIN';
ALTER TYPE "Role" ADD VALUE 'MINDFULNESS_ADMIN';

-- CreateEnum
CREATE TYPE "AnxietyLevel" AS ENUM ('rendah', 'sedang', 'tinggi', 'risiko_tinggi');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('BREATHING', 'MEDITATION', 'EDUCATION_CONTENT', 'AUDIO_CONTENT', 'JOURNAL_ENTRY', 'WORD_PUZZLE', 'TETRIS');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('WORD_PUZZLE', 'TETRIS');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('started', 'completed', 'abandoned');

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "normalizedText" TEXT,
    "anxietyLevel" "AnxietyLevel" NOT NULL DEFAULT 'rendah',
    "highRisk" BOOLEAN NOT NULL DEFAULT false,
    "analysis" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalPositiveWord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "category" TEXT,
    "sourceJournalId" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalPositiveWord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'started',
    "score" INTEGER NOT NULL DEFAULT 0,
    "durationSec" INTEGER,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGamification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGamification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardRule" (
    "id" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "sourceId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "xp" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JournalEntry_userId_createdAt_idx" ON "JournalEntry"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalPositiveWord_userId_word_key" ON "PersonalPositiveWord"("userId", "word");

-- CreateIndex
CREATE INDEX "PersonalPositiveWord_userId_lastUsedAt_idx" ON "PersonalPositiveWord"("userId", "lastUsedAt");

-- CreateIndex
CREATE INDEX "GameSession_userId_gameType_createdAt_idx" ON "GameSession"("userId", "gameType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserGamification_userId_key" ON "UserGamification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RewardRule_activityType_key" ON "RewardRule"("activityType");

-- CreateIndex
CREATE UNIQUE INDEX "RewardEvent_idempotencyKey_key" ON "RewardEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RewardEvent_userId_activityType_idx" ON "RewardEvent"("userId", "activityType");

-- CreateIndex
CREATE INDEX "RewardEvent_userId_createdAt_idx" ON "RewardEvent"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalPositiveWord" ADD CONSTRAINT "PersonalPositiveWord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGamification" ADD CONSTRAINT "UserGamification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRule" ADD CONSTRAINT "RewardRule_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardEvent" ADD CONSTRAINT "RewardEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
