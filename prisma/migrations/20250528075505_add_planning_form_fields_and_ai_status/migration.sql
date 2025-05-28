-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PlanningStatus" ADD VALUE 'PENDING_AI_BACKLOG_GENERATION';
ALTER TYPE "PlanningStatus" ADD VALUE 'AI_BACKLOG_VISIBLE';
ALTER TYPE "PlanningStatus" ADD VALUE 'PENDING_AI_REFINED_LIST';
ALTER TYPE "PlanningStatus" ADD VALUE 'AI_REFINED_LIST_VISIBLE';

-- AlterTable
ALTER TABLE "StrategicPlanning" ADD COLUMN     "clientSnapshot" JSONB,
ADD COLUMN     "formDataJSON" JSONB;

-- CreateIndex
CREATE INDEX "StrategicPlanning_userId_clientId_idx" ON "StrategicPlanning"("userId", "clientId");

-- CreateIndex
CREATE INDEX "StrategicPlanning_userId_status_idx" ON "StrategicPlanning"("userId", "status");
