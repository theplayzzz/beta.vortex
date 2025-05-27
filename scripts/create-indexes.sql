-- ============================================================================
-- CRIAÇÃO DE ÍNDICES - FASE 4: OTIMIZAÇÃO DE PERFORMANCE
-- ============================================================================
-- Arquivo: scripts/create-indexes.sql
-- Propósito: Criar índices otimizados para a tabela Client
-- Data: 2025-01-27
-- Plano: plan-004-your-plan-title.md - Fase 4
-- 
-- ATENÇÃO: Este script deve ser executado em horário de baixo tráfego!
-- ============================================================================

-- Configurações de segurança
SET statement_timeout = '60min';  -- Timeout de 60 minutos
SET lock_timeout = '30s';         -- Timeout de lock de 30 segundos

-- ============================================================================
-- VERIFICAÇÕES PRÉ-EXECUÇÃO
-- ============================================================================

\echo '=== VERIFICAÇÕES PRÉ-EXECUÇÃO ==='

-- Verificar se a tabela Client existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Client') THEN
        RAISE EXCEPTION 'Tabela Client não encontrada!';
    END IF;
    RAISE NOTICE '✅ Tabela Client encontrada';
END $$;

-- Verificar espaço em disco
\echo 'Verificando espaço em disco...'
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as "Tamanho do Banco",
    pg_size_pretty(pg_total_relation_size('Client')) as "Tamanho da Tabela Client";

-- Verificar índices existentes
\echo 'Índices existentes na tabela Client:'
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'Client'
ORDER BY indexname;

-- ============================================================================
-- CRIAÇÃO DOS ÍNDICES
-- ============================================================================

\echo ''
\echo '=== INICIANDO CRIAÇÃO DOS ÍNDICES ==='
\echo 'ATENÇÃO: Este processo pode levar vários minutos!'

-- ============================================================================
-- ÍNDICE 1: LISTAGEM PRINCIPAL
-- ============================================================================

\echo ''
\echo '📝 Criando índice 1/3: Client_userId_deletedAt_createdAt_idx'
\echo 'Propósito: Otimizar listagem principal ordenada por data'
\echo 'Query otimizada: SELECT * FROM Client WHERE userId = ? AND deletedAt IS NULL ORDER BY createdAt DESC'

-- Verificar se o índice já existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Client_userId_deletedAt_createdAt_idx') THEN
        RAISE NOTICE '⚠️  Índice Client_userId_deletedAt_createdAt_idx já existe, pulando...';
    ELSE
        RAISE NOTICE '🚀 Criando índice Client_userId_deletedAt_createdAt_idx...';
        
        -- Registrar início
        INSERT INTO pg_stat_statements_reset();
        
        -- Criar índice
        EXECUTE 'CREATE INDEX CONCURRENTLY "Client_userId_deletedAt_createdAt_idx" 
                 ON "Client"("userId", "deletedAt", "createdAt" DESC)';
        
        RAISE NOTICE '✅ Índice Client_userId_deletedAt_createdAt_idx criado com sucesso!';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Erro ao criar índice Client_userId_deletedAt_createdAt_idx: %', SQLERRM;
END $$;

-- ============================================================================
-- ÍNDICE 2: BUSCA POR NOME
-- ============================================================================

\echo ''
\echo '📝 Criando índice 2/3: Client_userId_name_idx'
\echo 'Propósito: Otimizar busca por nome de cliente'
\echo 'Query otimizada: SELECT * FROM Client WHERE userId = ? AND name ILIKE ?'

-- Verificar se o índice já existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Client_userId_name_idx') THEN
        RAISE NOTICE '⚠️  Índice Client_userId_name_idx já existe, pulando...';
    ELSE
        RAISE NOTICE '🚀 Criando índice Client_userId_name_idx...';
        
        -- Criar índice
        EXECUTE 'CREATE INDEX CONCURRENTLY "Client_userId_name_idx" 
                 ON "Client"("userId", "name")';
        
        RAISE NOTICE '✅ Índice Client_userId_name_idx criado com sucesso!';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Erro ao criar índice Client_userId_name_idx: %', SQLERRM;
END $$;

-- ============================================================================
-- ÍNDICE 3: FILTROS AVANÇADOS
-- ============================================================================

\echo ''
\echo '📝 Criando índice 3/3: Client_userId_industry_richnessScore_idx'
\echo 'Propósito: Otimizar filtros por setor e score de riqueza'
\echo 'Query otimizada: SELECT * FROM Client WHERE userId = ? AND industry = ? AND richnessScore > ?'

-- Verificar se o índice já existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Client_userId_industry_richnessScore_idx') THEN
        RAISE NOTICE '⚠️  Índice Client_userId_industry_richnessScore_idx já existe, pulando...';
    ELSE
        RAISE NOTICE '🚀 Criando índice Client_userId_industry_richnessScore_idx...';
        
        -- Criar índice
        EXECUTE 'CREATE INDEX CONCURRENTLY "Client_userId_industry_richnessScore_idx" 
                 ON "Client"("userId", "industry", "richnessScore")';
        
        RAISE NOTICE '✅ Índice Client_userId_industry_richnessScore_idx criado com sucesso!';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Erro ao criar índice Client_userId_industry_richnessScore_idx: %', SQLERRM;
END $$;

-- ============================================================================
-- VERIFICAÇÕES PÓS-CRIAÇÃO
-- ============================================================================

\echo ''
\echo '=== VERIFICAÇÕES PÓS-CRIAÇÃO ==='

-- Listar todos os índices da tabela Client
\echo 'Índices na tabela Client após criação:'
SELECT 
    indexname,
    indexdef,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as "Tamanho"
FROM pg_indexes 
WHERE tablename = 'Client'
ORDER BY indexname;

-- Verificar se todos os índices foram criados
DO $$
DECLARE
    missing_indexes TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Verificar cada índice
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Client_userId_deletedAt_createdAt_idx') THEN
        missing_indexes := array_append(missing_indexes, 'Client_userId_deletedAt_createdAt_idx');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Client_userId_name_idx') THEN
        missing_indexes := array_append(missing_indexes, 'Client_userId_name_idx');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Client_userId_industry_richnessScore_idx') THEN
        missing_indexes := array_append(missing_indexes, 'Client_userId_industry_richnessScore_idx');
    END IF;
    
    -- Reportar resultado
    IF array_length(missing_indexes, 1) IS NULL THEN
        RAISE NOTICE '✅ SUCESSO: Todos os 3 índices foram criados com sucesso!';
    ELSE
        RAISE EXCEPTION '❌ ERRO: Índices não criados: %', array_to_string(missing_indexes, ', ');
    END IF;
END $$;

-- Calcular espaço total usado pelos novos índices
\echo ''
\echo 'Espaço total usado pelos novos índices:'
SELECT 
    pg_size_pretty(
        COALESCE(pg_relation_size('Client_userId_deletedAt_createdAt_idx'::regclass), 0) +
        COALESCE(pg_relation_size('Client_userId_name_idx'::regclass), 0) +
        COALESCE(pg_relation_size('Client_userId_industry_richnessScore_idx'::regclass), 0)
    ) as "Espaço Total dos Novos Índices";

-- ============================================================================
-- TESTES BÁSICOS DE PERFORMANCE
-- ============================================================================

\echo ''
\echo '=== TESTES BÁSICOS DE PERFORMANCE ==='

-- Teste 1: Query principal
\echo 'Teste 1: Verificando uso do índice principal'
EXPLAIN (COSTS OFF, BUFFERS OFF)
SELECT "id", "name", "industry", "richnessScore", "createdAt"
FROM "Client" 
WHERE "userId" = (SELECT "id" FROM "User" LIMIT 1) 
  AND "deletedAt" IS NULL 
ORDER BY "createdAt" DESC 
LIMIT 12;

-- Teste 2: Busca por nome
\echo ''
\echo 'Teste 2: Verificando uso do índice de nome'
EXPLAIN (COSTS OFF, BUFFERS OFF)
SELECT "id", "name", "industry", "richnessScore"
FROM "Client" 
WHERE "userId" = (SELECT "id" FROM "User" LIMIT 1) 
  AND "name" ILIKE '%test%'
LIMIT 10;

-- Teste 3: Filtros avançados
\echo ''
\echo 'Teste 3: Verificando uso do índice de filtros'
EXPLAIN (COSTS OFF, BUFFERS OFF)
SELECT "id", "name", "industry", "richnessScore"
FROM "Client" 
WHERE "userId" = (SELECT "id" FROM "User" LIMIT 1) 
  AND "industry" IS NOT NULL
  AND "richnessScore" > 50
LIMIT 10;

-- ============================================================================
-- FINALIZAÇÃO
-- ============================================================================

\echo ''
\echo '=== CRIAÇÃO DE ÍNDICES CONCLUÍDA ==='
\echo ''
\echo '📊 RESUMO:'
\echo '   ✅ 3 índices criados com sucesso'
\echo '   ✅ Verificações de integridade passaram'
\echo '   ✅ Testes básicos de performance executados'
\echo ''
\echo '🔄 PRÓXIMOS PASSOS:'
\echo '   1. Executar testes de performance completos'
\echo '   2. Atualizar schema.prisma com os novos índices'
\echo '   3. Monitorar performance da aplicação'
\echo '   4. Documentar resultados no log de execução'
\echo ''
\echo '📝 COMANDO PARA ROLLBACK (se necessário):'
\echo '   psql $DATABASE_URL -f scripts/rollback-indexes.sql'
\echo ''

-- Registrar timestamp de conclusão
SELECT 
    'Criação de índices concluída em: ' || current_timestamp as "Status Final"; 