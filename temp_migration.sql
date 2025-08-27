-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('PURCHASE', 'CONSUMPTION_PLANNING_INITIAL', 'CONSUMPTION_PLANNING_DETAILED', 'CONSUMPTION_AGENT_IA_MESSAGE', 'CONSUMPTION_PROPOSAL_GENERATION', 'CONSUMPTION_TASK_IA_ASSIST', 'CONSUMPTION_SALES_ARGUMENT_IA', 'CONSUMPTION_MEETING_INSIGHTS_IA', 'CONSUMPTION_PITCH_ANALYSIS_IA', 'ADJUSTMENT_ADMIN', 'INITIAL_GRANT');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'AI');

-- CreateEnum
CREATE TYPE "PlanningStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED', 'AWAITING_APPROVAL', 'GENERATING_REFINED', 'REFINED_COMPLETED', 'PENDING_AI_BACKLOG_GENERATION', 'AI_BACKLOG_VISIBLE', 'PENDING_AI_REFINED_LIST', 'AI_REFINED_LIST_VISIBLE');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'NEGOTIATION', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('APPROVE', 'REJECT', 'SUSPEND', 'UNSUSPEND', 'UNSUSPEND_TO_APPROVED', 'UNSUSPEND_TO_PENDING', 'RESET_TO_PENDING');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('GENERALISTA', 'ESPECIALISTA');

-- CreateTable
CREATE TABLE "AgentInteraction" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "agentInteractionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "serviceOrProduct" TEXT,
    "initialObjective" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "businessDetails" TEXT,
    "targetAudience" TEXT,
    "marketingObjectives" TEXT,
    "historyAndStrategies" TEXT,
    "challengesOpportunities" TEXT,
    "competitors" TEXT,
    "resourcesBudget" TEXT,
    "toneOfVoice" TEXT,
    "preferencesRestrictions" TEXT,
    "richnessScore" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isViewed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientAttachment" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientNote" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialProposal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "generatedContent" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "clientId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aiGeneratedContent" JSONB,
    "proposalHtml" TEXT,
    "proposalMarkdown" TEXT,
    "aiMetadata" JSONB,
    "formDataJSON" JSONB,
    "clientSnapshot" JSONB,

    CONSTRAINT "CommercialProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "relatedEntityId" TEXT,
    "relatedEntityType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "effortEstimate" TEXT,
    "strategicPlanningId" TEXT,
    "clientId" TEXT,
    "ownerId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesArgument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "script" TEXT,
    "objectionsHandled" JSONB,
    "category" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesArgument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicPlanning" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "specificObjectives" TEXT,
    "scope" TEXT,
    "successMetrics" TEXT,
    "budget" TEXT,
    "toneOfVoice" TEXT,
    "status" "PlanningStatus" NOT NULL DEFAULT 'DRAFT',
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "formDataJSON" JSONB,
    "clientSnapshot" JSONB,

    CONSTRAINT "StrategicPlanning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAttachment" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "profileImageUrl" TEXT,
    "creditBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "TranscriptionSession" (
    "id" TEXT NOT NULL,
    "sessionName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "customIndustry" TEXT,
    "revenue" TEXT,
    "agentType" "AgentType" NOT NULL,
    "spinQuestions" JSONB,
    "connectTime" TIMESTAMP(3),
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "analysisCount" INTEGER NOT NULL DEFAULT 0,
    "analyses" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "activeParticipantId" TEXT,
    "connectionCount" INTEGER NOT NULL DEFAULT 0,
    "lastDisconnectAt" TIMESTAMP(3),
    "webhookEvents" JSONB NOT NULL DEFAULT '[]',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TranscriptionSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentInteraction_clientId_idx" ON "AgentInteraction"("clientId");

-- CreateIndex
CREATE INDEX "AgentInteraction_userId_idx" ON "AgentInteraction"("userId");

-- CreateIndex
CREATE INDEX "AgentMessage_agentInteractionId_idx" ON "AgentMessage"("agentInteractionId");

-- CreateIndex
CREATE INDEX "Client_deletedAt_idx" ON "Client"("deletedAt");

-- CreateIndex
CREATE INDEX "Client_userId_idx" ON "Client"("userId");

-- CreateIndex
CREATE INDEX "Client_userId_deletedAt_createdAt_idx" ON "Client"("userId", "deletedAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Client_userId_name_idx" ON "Client"("userId", "name");

-- CreateIndex
CREATE INDEX "Client_userId_industry_richnessScore_idx" ON "Client"("userId", "industry", "richnessScore");

-- CreateIndex
CREATE INDEX "ClientAttachment_clientId_idx" ON "ClientAttachment"("clientId");

-- CreateIndex
CREATE INDEX "ClientAttachment_userId_idx" ON "ClientAttachment"("userId");

-- CreateIndex
CREATE INDEX "ClientNote_clientId_idx" ON "ClientNote"("clientId");

-- CreateIndex
CREATE INDEX "ClientNote_userId_idx" ON "ClientNote"("userId");

-- CreateIndex
CREATE INDEX "CommercialProposal_clientId_idx" ON "CommercialProposal"("clientId");

-- CreateIndex
CREATE INDEX "CommercialProposal_userId_idx" ON "CommercialProposal"("userId");

-- CreateIndex
CREATE INDEX "CommercialProposal_userId_status_idx" ON "CommercialProposal"("userId", "status");

-- CreateIndex
CREATE INDEX "CreditTransaction_type_idx" ON "CreditTransaction"("type");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");

-- CreateIndex
CREATE INDEX "PlanningTask_assigneeId_idx" ON "PlanningTask"("assigneeId");

-- CreateIndex
CREATE INDEX "PlanningTask_clientId_idx" ON "PlanningTask"("clientId");

-- CreateIndex
CREATE INDEX "PlanningTask_ownerId_idx" ON "PlanningTask"("ownerId");

-- CreateIndex
CREATE INDEX "PlanningTask_parentId_idx" ON "PlanningTask"("parentId");

-- CreateIndex
CREATE INDEX "PlanningTask_strategicPlanningId_idx" ON "PlanningTask"("strategicPlanningId");

-- CreateIndex
CREATE INDEX "SalesArgument_category_idx" ON "SalesArgument"("category");

-- CreateIndex
CREATE INDEX "SalesArgument_userId_idx" ON "SalesArgument"("userId");

-- CreateIndex
CREATE INDEX "StrategicPlanning_clientId_idx" ON "StrategicPlanning"("clientId");

-- CreateIndex
CREATE INDEX "StrategicPlanning_userId_idx" ON "StrategicPlanning"("userId");

-- CreateIndex
CREATE INDEX "StrategicPlanning_userId_clientId_idx" ON "StrategicPlanning"("userId", "clientId");

-- CreateIndex
CREATE INDEX "StrategicPlanning_userId_status_idx" ON "StrategicPlanning"("userId", "status");

-- CreateIndex
CREATE INDEX "TaskAttachment_taskId_idx" ON "TaskAttachment"("taskId");

-- CreateIndex
CREATE INDEX "TaskAttachment_userId_idx" ON "TaskAttachment"("userId");

-- CreateIndex
CREATE INDEX "TaskComment_taskId_idx" ON "TaskComment"("taskId");

-- CreateIndex
CREATE INDEX "TaskComment_userId_idx" ON "TaskComment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_approvalStatus_idx" ON "User"("approvalStatus");

-- CreateIndex
CREATE INDEX "User_approvalStatus_createdAt_idx" ON "User"("approvalStatus", "createdAt");

-- CreateIndex
CREATE INDEX "User_approvedBy_idx" ON "User"("approvedBy");

-- CreateIndex
CREATE INDEX "User_rejectedBy_idx" ON "User"("rejectedBy");

-- CreateIndex
CREATE INDEX "UserModerationLog_userId_idx" ON "UserModerationLog"("userId");

-- CreateIndex
CREATE INDEX "UserModerationLog_moderatorId_idx" ON "UserModerationLog"("moderatorId");

-- CreateIndex
CREATE INDEX "UserModerationLog_action_idx" ON "UserModerationLog"("action");

-- CreateIndex
CREATE INDEX "UserModerationLog_createdAt_idx" ON "UserModerationLog"("createdAt");

-- CreateIndex
CREATE INDEX "TranscriptionSession_deletedAt_idx" ON "TranscriptionSession"("deletedAt");

-- CreateIndex
CREATE INDEX "TranscriptionSession_userId_idx" ON "TranscriptionSession"("userId");

-- CreateIndex
CREATE INDEX "TranscriptionSession_userId_deletedAt_createdAt_idx" ON "TranscriptionSession"("userId", "deletedAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "TranscriptionSession_sessionName_idx" ON "TranscriptionSession"("sessionName");

-- CreateIndex
CREATE INDEX "TranscriptionSession_agentType_idx" ON "TranscriptionSession"("agentType");

-- CreateIndex
CREATE INDEX "TranscriptionSession_userId_agentType_idx" ON "TranscriptionSession"("userId", "agentType");

-- CreateIndex
CREATE INDEX "TranscriptionSession_isActive_idx" ON "TranscriptionSession"("isActive");

-- CreateIndex
CREATE INDEX "TranscriptionSession_activeParticipantId_idx" ON "TranscriptionSession"("activeParticipantId");

-- AddForeignKey
ALTER TABLE "AgentInteraction" ADD CONSTRAINT "AgentInteraction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentInteraction" ADD CONSTRAINT "AgentInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentMessage" ADD CONSTRAINT "AgentMessage_agentInteractionId_fkey" FOREIGN KEY ("agentInteractionId") REFERENCES "AgentInteraction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAttachment" ADD CONSTRAINT "ClientAttachment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAttachment" ADD CONSTRAINT "ClientAttachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNote" ADD CONSTRAINT "ClientNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNote" ADD CONSTRAINT "ClientNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialProposal" ADD CONSTRAINT "CommercialProposal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialProposal" ADD CONSTRAINT "CommercialProposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningTask" ADD CONSTRAINT "PlanningTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningTask" ADD CONSTRAINT "PlanningTask_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningTask" ADD CONSTRAINT "PlanningTask_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningTask" ADD CONSTRAINT "PlanningTask_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PlanningTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanningTask" ADD CONSTRAINT "PlanningTask_strategicPlanningId_fkey" FOREIGN KEY ("strategicPlanningId") REFERENCES "StrategicPlanning"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesArgument" ADD CONSTRAINT "SalesArgument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategicPlanning" ADD CONSTRAINT "StrategicPlanning_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategicPlanning" ADD CONSTRAINT "StrategicPlanning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAttachment" ADD CONSTRAINT "TaskAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "PlanningTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAttachment" ADD CONSTRAINT "TaskAttachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "PlanningTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserModerationLog" ADD CONSTRAINT "UserModerationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserModerationLog" ADD CONSTRAINT "UserModerationLog_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptionSession" ADD CONSTRAINT "TranscriptionSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

