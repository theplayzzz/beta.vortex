-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('APPROVE', 'REJECT', 'SUSPEND', 'UNSUSPEND', 'RESET_TO_PENDING');

-- AlterTable
ALTER TABLE "CommercialProposal" ADD COLUMN     "aiGeneratedContent" JSONB,
ADD COLUMN     "aiMetadata" JSONB,
ADD COLUMN     "clientSnapshot" JSONB,
ADD COLUMN     "formDataJSON" JSONB,
ADD COLUMN     "proposalHtml" TEXT,
ADD COLUMN     "proposalMarkdown" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserModerationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "action" "ModerationAction" NOT NULL,
    "previousStatus" "ApprovalStatus" NOT NULL,
    "newStatus" "ApprovalStatus" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserModerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserModerationLog_userId_idx" ON "UserModerationLog"("userId");

-- CreateIndex
CREATE INDEX "UserModerationLog_moderatorId_idx" ON "UserModerationLog"("moderatorId");

-- CreateIndex
CREATE INDEX "UserModerationLog_action_idx" ON "UserModerationLog"("action");

-- CreateIndex
CREATE INDEX "UserModerationLog_createdAt_idx" ON "UserModerationLog"("createdAt");

-- CreateIndex
CREATE INDEX "CommercialProposal_userId_status_idx" ON "CommercialProposal"("userId", "status");

-- CreateIndex
CREATE INDEX "User_approvalStatus_idx" ON "User"("approvalStatus");

-- CreateIndex
CREATE INDEX "User_approvalStatus_createdAt_idx" ON "User"("approvalStatus", "createdAt");

-- CreateIndex
CREATE INDEX "User_approvedBy_idx" ON "User"("approvedBy");

-- CreateIndex
CREATE INDEX "User_rejectedBy_idx" ON "User"("rejectedBy");

-- AddForeignKey
ALTER TABLE "UserModerationLog" ADD CONSTRAINT "UserModerationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserModerationLog" ADD CONSTRAINT "UserModerationLog_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
