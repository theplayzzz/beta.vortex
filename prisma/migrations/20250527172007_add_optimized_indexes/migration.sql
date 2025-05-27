-- CreateIndex
CREATE INDEX "Client_userId_deletedAt_createdAt_idx" ON "Client"("userId", "deletedAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Client_userId_name_idx" ON "Client"("userId", "name");

-- CreateIndex
CREATE INDEX "Client_userId_industry_richnessScore_idx" ON "Client"("userId", "industry", "richnessScore");
