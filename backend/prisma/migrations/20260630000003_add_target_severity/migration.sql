-- AlterTable: BreathingTechnique — tambah kolom targetSeverity
ALTER TABLE "BreathingTechnique" ADD COLUMN "targetSeverity" TEXT;

-- AlterTable: MeditationSession — tambah kolom targetSeverity
ALTER TABLE "MeditationSession" ADD COLUMN "targetSeverity" TEXT;

-- AlterTable: AudioContent — tambah kolom targetSeverity
ALTER TABLE "AudioContent" ADD COLUMN "targetSeverity" TEXT;

-- AlterTable: EducationContent — tambah kolom targetSeverity
ALTER TABLE "EducationContent" ADD COLUMN "targetSeverity" TEXT;
