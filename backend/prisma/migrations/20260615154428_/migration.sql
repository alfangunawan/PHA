-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MeditationCategory" AS ENUM ('sleep', 'focus', 'anxiety', 'morning', 'general');

-- CreateEnum
CREATE TYPE "ContentSource" AS ENUM ('youtube', 'tiktok', 'other');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "BreathingTechnique" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inhaleDuration" INTEGER NOT NULL,
    "holdDuration" INTEGER NOT NULL DEFAULT 0,
    "exhaleDuration" INTEGER NOT NULL,
    "holdAfterExhale" INTEGER NOT NULL DEFAULT 0,
    "cycles" INTEGER NOT NULL DEFAULT 4,
    "colorTheme" TEXT NOT NULL DEFAULT '#A8C5DA',
    "icon" TEXT NOT NULL DEFAULT 'wind',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BreathingTechnique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreathingLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "techniqueId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "cyclesCompleted" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BreathingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeditationSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "MeditationCategory" NOT NULL DEFAULT 'general',
    "audioUrl" TEXT,
    "thumbnailUrl" TEXT,
    "durationOptions" JSONB NOT NULL,
    "colorTheme" TEXT NOT NULL DEFAULT '#C9B8E8',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeditationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeditationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeditationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationContent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "source" "ContentSource" NOT NULL DEFAULT 'youtube',
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "tags" JSONB,
    "createdByAdminId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioContent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "duration" INTEGER,
    "description" TEXT,
    "createdByAdminId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudioContent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BreathingLog" ADD CONSTRAINT "BreathingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreathingLog" ADD CONSTRAINT "BreathingLog_techniqueId_fkey" FOREIGN KEY ("techniqueId") REFERENCES "BreathingTechnique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeditationLog" ADD CONSTRAINT "MeditationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeditationLog" ADD CONSTRAINT "MeditationLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MeditationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationContent" ADD CONSTRAINT "EducationContent_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioContent" ADD CONSTRAINT "AudioContent_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
