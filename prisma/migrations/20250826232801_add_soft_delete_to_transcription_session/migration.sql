-- AddColumn
ALTER TABLE "TranscriptionSession" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "TranscriptionSession_deletedAt_idx" ON "TranscriptionSession"("deletedAt");

-- CreateIndex  
CREATE INDEX "TranscriptionSession_userId_deletedAt_createdAt_idx" ON "TranscriptionSession"("userId", "deletedAt", "createdAt" DESC);