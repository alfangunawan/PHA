-- CreateTable: EducationContentLog
CREATE TABLE "EducationContentLog" (
    "id"        TEXT         NOT NULL DEFAULT gen_random_uuid(),
    "userId"    TEXT         NOT NULL,
    "contentId" TEXT         NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed" BOOLEAN      NOT NULL DEFAULT false,
    CONSTRAINT "EducationContentLog_pkey"          PRIMARY KEY ("id"),
    CONSTRAINT "EducationContentLog_userId_fkey"   FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EducationContentLog_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "EducationContent"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EducationContentLog_userId_watchedAt_idx" ON "EducationContentLog"("userId", "watchedAt" DESC);
