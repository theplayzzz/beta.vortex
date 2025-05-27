-- ============================================================================
-- ANÁLISE PRÉ-MIGRAÇÃO - FASE 4: OTIMIZAÇÃO DE ÍNDICES
-- ============================================================================
-- Arquivo: scripts/pre-migration-analysis.sql
-- Propósito: Analisar estado atual do banco antes da criação de índices
-- Data: 2025-01-27
-- Plano: plan-004-your-plan-title.md - Fase 4

-- ============================================================================
-- 1. INFORMAÇÕES GERAIS DO BANCO
-- ============================================================================

\echo '=== INFORMAÇÕES GERAIS DO BANCO ==='
SELECT 
    current_database() as database_name,
    current_user as current_user,
    version() as postgresql_version;

-- ============================================================================
-- 2. ANÁLISE DA TABELA CLIENT
-- ============================================================================

\echo ''
\echo '=== ANÁLISE DA TABELA CLIENT ==='

-- Tamanho da tabela Client
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "Tamanho Total",
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as "Tamanho Tabela",
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as "Tamanho Índices"
FROM pg_tables 
WHERE tablename = 'Client';

-- Número de registros
SELECT 
    COUNT(*) as "Total de Clientes",
    COUNT(*) FILTER (WHERE "deletedAt" IS NULL) as "Clientes Ativos",
    COUNT(*) FILTER (WHERE "deletedAt" IS NOT NULL) as "Clientes Arquivados"
FROM "Client";

-- Distribuição por usuário (top 10)
SELECT 
    "userId",
    COUNT(*) as "Quantidade de Clientes"
FROM "Client"
GROUP BY "userId"
ORDER BY COUNT(*) DESC
LIMIT 10;

-- ============================================================================
-- 3. ÍNDICES EXISTENTES
-- ============================================================================

\echo ''
\echo '=== ÍNDICES EXISTENTES NA TABELA CLIENT ==='

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as "Tamanho do Índice"
FROM pg_indexes 
WHERE tablename = 'Client'
ORDER BY indexname;

-- ============================================================================
-- 4. ANÁLISE DE PERFORMANCE DAS QUERIES ATUAIS
-- ============================================================================

\echo ''
\echo '=== ANÁLISE DE PERFORMANCE - QUERIES PRINCIPAIS ==='

-- Query 1: Listagem principal (mais comum)
\echo 'Query 1: Listagem principal ordenada por data'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) 
SELECT "id", "name", "industry", "richnessScore", "createdAt"
FROM "Client" 
WHERE "userId" = (SELECT "id" FROM "User" LIMIT 1) 
  AND "deletedAt" IS NULL 
ORDER BY "createdAt" DESC 
LIMIT 12;

-- Query 2: Busca por nome
\echo ''
\echo 'Query 2: Busca por nome'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT "id", "name", "industry", "richnessScore"
FROM "Client" 
WHERE "userId" = (SELECT "id" FROM "User" LIMIT 1) 
  AND "name" ILIKE '%test%'
LIMIT 10;

-- Query 3: Filtros avançados
\echo ''
\echo 'Query 3: Filtros por industry e richnessScore'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT "id", "name", "industry", "richnessScore"
FROM "Client" 
WHERE "userId" = (SELECT "id" FROM "User" LIMIT 1) 
  AND "industry" IS NOT NULL
  AND "richnessScore" > 50
LIMIT 10;

-- Query 4: Contagem total
\echo ''
\echo 'Query 4: Contagem total de clientes'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(*)
FROM "Client" 
WHERE "userId" = (SELECT "id" FROM "User" LIMIT 1) 
  AND "deletedAt" IS NULL;

-- ============================================================================
-- 5. ANÁLISE DE ESPAÇO EM DISCO
-- ============================================================================

\echo ''
\echo '=== ANÁLISE DE ESPAÇO EM DISCO ==='

-- Espaço total do banco
SELECT 
    pg_database.datname as "Database",
    pg_size_pretty(pg_database_size(pg_database.datname)) as "Tamanho"
FROM pg_database
WHERE datname = current_database();

-- Top 10 tabelas por tamanho
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "Tamanho Total"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- ============================================================================
-- 6. ESTIMATIVAS PARA NOVOS ÍNDICES
-- ============================================================================

\echo ''
\echo '=== ESTIMATIVAS PARA NOVOS ÍNDICES ==='

-- Estimativa de tamanho dos novos índices
WITH table_stats AS (
    SELECT 
        pg_relation_size('Client') as table_size,
        (SELECT COUNT(*) FROM "Client") as row_count
)
SELECT 
    'Client_userId_deletedAt_createdAt_idx' as "Índice",
    pg_size_pretty(table_size * 0.3) as "Tamanho Estimado",
    '30% do tamanho da tabela' as "Base de Cálculo"
FROM table_stats
UNION ALL
SELECT 
    'Client_userId_name_idx' as "Índice",
    pg_size_pretty(table_size * 0.2) as "Tamanho Estimado",
    '20% do tamanho da tabela' as "Base de Cálculo"
FROM table_stats
UNION ALL
SELECT 
    'Client_userId_industry_richnessScore_idx' as "Índice",
    pg_size_pretty(table_size * 0.25) as "Tamanho Estimado",
    '25% do tamanho da tabela' as "Base de Cálculo"
FROM table_stats;

-- ============================================================================
-- 7. VERIFICAÇÕES DE SEGURANÇA
-- ============================================================================

\echo ''
\echo '=== VERIFICAÇÕES DE SEGURANÇA ==='

-- Verificar conexões ativas
SELECT 
    COUNT(*) as "Conexões Ativas",
    COUNT(*) FILTER (WHERE state = 'active') as "Queries Ativas",
    COUNT(*) FILTER (WHERE state = 'idle') as "Conexões Idle"
FROM pg_stat_activity
WHERE datname = current_database();

-- Verificar locks ativos na tabela Client
SELECT 
    locktype,
    mode,
    granted,
    pid,
    query
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE relation = 'Client'::regclass;

-- ============================================================================
-- 8. RECOMENDAÇÕES
-- ============================================================================

\echo ''
\echo '=== RECOMENDAÇÕES BASEADAS NA ANÁLISE ==='

DO $$
DECLARE
    client_count INTEGER;
    table_size_mb NUMERIC;
    estimated_time TEXT;
    recommendation TEXT;
BEGIN
    -- Obter estatísticas
    SELECT COUNT(*) INTO client_count FROM "Client";
    SELECT pg_total_relation_size('Client') / (1024*1024) INTO table_size_mb;
    
    -- Determinar recomendações baseadas no tamanho
    IF client_count < 1000 THEN
        estimated_time := '1-2 minutos';
        recommendation := 'BAIXO RISCO - Pode executar a qualquer momento';
    ELSIF client_count < 10000 THEN
        estimated_time := '5-10 minutos';
        recommendation := 'MÉDIO RISCO - Executar em horário de baixo tráfego';
    ELSIF client_count < 100000 THEN
        estimated_time := '15-30 minutos';
        recommendation := 'ALTO RISCO - Executar apenas em janela de manutenção';
    ELSE
        estimated_time := '30+ minutos';
        recommendation := 'MUITO ALTO RISCO - Planejar cuidadosamente';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESUMO DA ANÁLISE:';
    RAISE NOTICE '   • Total de registros: %', client_count;
    RAISE NOTICE '   • Tamanho da tabela: % MB', ROUND(table_size_mb, 2);
    RAISE NOTICE '   • Tempo estimado: %', estimated_time;
    RAISE NOTICE '   • Recomendação: %', recommendation;
    RAISE NOTICE '';
    
    IF table_size_mb > 1000 THEN
        RAISE NOTICE '⚠️  ATENÇÃO: Tabela grande detectada!';
        RAISE NOTICE '   • Fazer backup completo antes da migração';
        RAISE NOTICE '   • Executar apenas em horário de manutenção';
        RAISE NOTICE '   • Monitorar espaço em disco durante execução';
    END IF;
END $$;

\echo ''
\echo '=== ANÁLISE CONCLUÍDA ==='
\echo 'Próximo passo: Revisar os resultados e decidir sobre a execução da migração'
\echo 'Arquivo de log recomendado: phase4-pre-migration-analysis-$(date +%Y%m%d_%H%M%S).log' 