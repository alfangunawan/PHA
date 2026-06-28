-- CreateEnum
CREATE TYPE "ContentFormat" AS ENUM ('landscape', 'vertical');

-- DropForeignKey
ALTER TABLE "chatbot_session_state" DROP CONSTRAINT "chatbot_session_state_user_id_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_user_id_fkey";

-- DropForeignKey
ALTER TABLE "gad7_results" DROP CONSTRAINT "gad7_results_user_id_fkey";

-- AlterTable
ALTER TABLE "EducationContent" ADD COLUMN     "format" "ContentFormat" NOT NULL DEFAULT 'landscape';

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gad7_results" ADD CONSTRAINT "gad7_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_session_state" ADD CONSTRAINT "chatbot_session_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
