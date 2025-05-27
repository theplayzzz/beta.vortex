-- Migration: Optimize Client table indexes
-- Created: 2025-05-27T17:15:16
-- Purpose: Improve query performance for client operations
-- Plano: plan-004-your-plan-title.md - Fase 4

-- Índice principal para queries mais comuns (listagem ordenada)
-- Otimiza: SELECT * FROM Client WHERE userId = ? AND deletedAt IS NULL ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS "Client_userId_deletedAt_createdAt_idx" 
ON "Client"("userId", "deletedAt", "createdAt" DESC);

-- Índice para busca por nome
-- Otimiza: SELECT * FROM Client WHERE userId = ? AND name ILIKE '%search%'
CREATE INDEX IF NOT EXISTS "Client_userId_name_idx" 
ON "Client"("userId", "name");

-- Índice para filtros avançados
-- Otimiza: SELECT * FROM Client WHERE userId = ? AND industry = ? AND richnessScore > ?
CREATE INDEX IF NOT EXISTS "Client_userId_industry_richnessScore_idx" 
ON "Client"("userId", "industry", "richnessScore");