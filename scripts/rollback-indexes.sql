-- ============================================================================
-- ROLLBACK DE ÍNDICES - FASE 4: OTIMIZAÇÃO DE PERFORMANCE
-- ============================================================================
-- Arquivo: scripts/rollback-indexes.sql
-- Propósito: Remover índices criados na Fase 4 em caso de problemas
-- Data: 2025-01-27
-- Plano: plan-004-your-plan-title.md - Fase 4
-- 
-- ATENÇÃO: Este script remove os índices de otimização!
-- Use apenas em caso de problemas ou necessidade de rollback.
-- ============================================================================

-- Configurações de segurança
SET statement_timeout = '30min';  -- Timeout de 30 minutos
SET lock_timeout = '30s';         -- Timeout de lock de 30 segundos

-- ============================================================================
-- VERIFICAÇÕES PRÉ-ROLLBACK
-- ============================================================================

\echo '=== VERIFICAÇÕES PRÉ-ROLLBACK ==='

-- Verificar se a tabela Client existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Client') THEN
        RAISE EXCEPTION 'Tabela Client não encontrada!';
    END IF;
    RAISE NOTICE '✅ Tabela Client encontrada';
END $$;

-- Listar índices existentes antes do rollback
\echo 'Índices existentes na tabela Client:'
SELECT 
    indexname,
    indexdef,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as "Tamanho"
FROM pg_indexes 
WHERE tablename = 'Client'
ORDER BY indexname;

-- Verificar quais índices da Fase 4 existem
DO $$
DECLARE
    existing_indexes TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Verificar cada índice da Fase 4
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Client_userId_deletedAt_createdAt_idx') THEN
        existing_indexes := array_append(existing_indexes, 'Client_userId_deletedAt_createdAt_idx');
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Client_userId_name_idx') THEN
        existing_indexes := array_append(existing_indexes, 'Client_userId_name_idx');
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Client_userId_industry_richnessScore_idx') THEN
        existing_indexes := array_append(existing_indexes, 'Client_userId_industry_richnessScore_idx');
    END IF;
    
    -- Reportar resultado
    IF array_length(existing_indexes, 1) IS NULL THEN
        RAISE NOTICE '⚠️  Nenhum índice da Fase 4 encontrado para remoção';
    ELSE
        RAISE NOTICE '📋 Índices da Fase 4 encontrados: %', array_to_string(existing_indexes, ', ');
    END IF;
END $$;

-- ============================================================================
-- CONFIRMAÇÃO DE ROLLBACK
-- ============================================================================

\echo ''
\echo '⚠️  ATENÇÃO: ROLLBACK DE ÍNDICES ⚠️'
\echo 'Este script irá remover os índices de otimização criados na Fase 4.'
\echo 'Isso pode impactar negativamente a performance da aplicação!'
\echo ''

-- Pausa para confirmação (comentar se executando automaticamente)
-- \prompt 'Digite "CONFIRMAR" para continuar com o rollback: ' confirmation

-- ============================================================================
-- REMOÇÃO DOS ÍNDICES
-- ============================================================================

\echo '=== INICIANDO ROLLBACK DOS ÍNDICES ==='

-- ============================================================================
-- REMOVER ÍNDICE 1: LISTAGEM PRINCIPAL
-- ============================================================================

\echo ''
\echo '🗑️  Removendo índice 1/3: Client_userId_deletedAt_createdAt_idx'

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Client_userId_deletedAt_createdAt_idx') THEN
        RAISE NOTICE '🚀 Removendo índice Client_userId_deletedAt_createdAt_idx...';
        
        -- Remover índice
        EXECUTE 'DROP INDEX CONCURRENTLY IF EXISTS "Client_userId_deletedAt_createdAt_idx"';
        
        RAISE NOTICE '✅ Índice Client_userId_deletedAt_createdAt_idx removido com sucesso!';
    ELSE
        RAISE NOTICE '⚠️  Índice Client_userId_deletedAt_createdAt_idx não encontrado, pulando...';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ Erro ao remover índice Client_userId_deletedAt_createdAt_idx: %', SQLERRM;
END $$;

-- ============================================================================
-- REMOVER ÍNDICE 2: BUSCA POR NOME
-- ============================================================================

\echo ''
\echo '🗑️  Removendo índice 2/3: Client_userId_name_idx'

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Client_userId_name_idx') THEN
        RAISE NOTICE '🚀 Removendo índice Client_userId_name_idx...';
        
        -- Remover índice
        EXECUTE 'DROP INDEX CONCURRENTLY IF EXISTS "Client_userId_name_idx"';
        
        RAISE NOTICE '✅ Índice Client_userId_name_idx removido com sucesso!';
    ELSE
        RAISE NOTICE '⚠️  Índice Client_userId_name_idx não encontrado, pulando...';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ Erro ao remover índice Client_userId_name_idx: %', SQLERRM;
END $$;

-- ============================================================================
-- REMOVER ÍNDICE 3: FILTROS AVANÇADOS
-- ============================================================================

\echo ''
\echo '🗑️  Removendo índice 3/3: Client_userId_industry_richnessScore_idx'

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Client_userId_industry_richnessScore_idx') THEN
        RAISE NOTICE '🚀 Removendo índice Client_userId_industry_richnessScore_idx...';
        
        -- Remover índice
        EXECUTE 'DROP INDEX CONCURRENTLY IF EXISTS "Client_userId_industry_richnessScore_idx"';
        
        RAISE NOTICE '✅ Índice Client_userId_industry_richnessScore_idx removido com sucesso!';
    ELSE
        RAISE NOTICE '⚠️  Índice Client_userId_industry_richnessScore_idx não encontrado, pulando...';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ Erro ao remover índice Client_userId_industry_richnessScore_idx: %', SQLERRM;
END $$;

-- ============================================================================
-- VERIFICAÇÕES PÓS-ROLLBACK
-- ============================================================================

\echo ''
\echo '=== VERIFICAÇÕES PÓS-ROLLBACK ==='

-- Listar índices restantes na tabela Client
\echo 'Índices restantes na tabela Client:'
SELECT 
    indexname,
    indexdef,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as "Tamanho"
FROM pg_indexes 
WHERE tablename = 'Client'
ORDER BY indexname;

-- Verificar se todos os índices da Fase 4 foram removidos
DO $$
DECLARE
    remaining_indexes TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Verificar cada índice da Fase 4
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Client_userId_deletedAt_createdAt_idx') THEN
        remaining_indexes := array_append(remaining_indexes, 'Client_userId_deletedAt_createdAt_idx');
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Client_userId_name_idx') THEN
        remaining_indexes := array_append(remaining_indexes, 'Client_userId_name_idx');
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Client_userId_industry_richnessScore_idx') THEN
        remaining_indexes := array_append(remaining_indexes, 'Client_userId_industry_richnessScore_idx');
    END IF;
    
    -- Reportar resultado
    IF array_length(remaining_indexes, 1) IS NULL THEN
        RAISE NOTICE '✅ SUCESSO: Todos os índices da Fase 4 foram removidos!';
    ELSE
        RAISE WARNING '⚠️  ATENÇÃO: Índices ainda presentes: %', array_to_string(remaining_indexes, ', ');
    END IF;
END $$;

-- Calcular espaço liberado
\echo ''
\echo 'Espaço liberado após remoção dos índices:'
SELECT 
    pg_size_pretty(pg_total_relation_size('Client')) as "Tamanho Total da Tabela Client";

-- ============================================================================
-- TESTES PÓS-ROLLBACK
-- ============================================================================

\echo ''
\echo '=== TESTES PÓS-ROLLBACK ==='
\echo 'ATENÇÃO: As queries abaixo podem estar mais lentas após o rollback!'

-- Teste 1: Query principal (sem índice otimizado)
\echo 'Teste 1: Query principal (performance pode estar degradada)'
EXPLAIN (COSTS OFF, BUFFERS OFF)
SELECT "id", "name", "industry", "richnessScore", "createdAt"
FROM "Client" 
WHERE "userId" = (SELECT "id" FROM "User" LIMIT 1) 
  AND "deletedAt" IS NULL 
ORDER BY "createdAt" DESC 
LIMIT 12;

-- Teste 2: Busca por nome (sem índice otimizado)
\echo ''
\echo 'Teste 2: Busca por nome (performance pode estar degradada)'
EXPLAIN (COSTS OFF, BUFFERS OFF)
SELECT "id", "name", "industry", "richnessScore"
FROM "Client" 
WHERE "userId" = (SELECT "id" FROM "User" LIMIT 1) 
  AND "name" ILIKE '%test%'
LIMIT 10;

-- ============================================================================
-- FINALIZAÇÃO
-- ============================================================================

\echo ''
\echo '=== ROLLBACK DE ÍNDICES CONCLUÍDO ==='
\echo ''
\echo '📊 RESUMO:'
\echo '   ✅ Índices da Fase 4 removidos'
\echo '   ⚠️  Performance pode estar degradada'
\echo '   ✅ Verificações de integridade passaram'
\echo ''
\echo '🔄 PRÓXIMOS PASSOS:'
\echo '   1. Monitorar performance da aplicação'
\echo '   2. Considerar recriar índices se necessário'
\echo '   3. Atualizar schema.prisma removendo índices'
\echo '   4. Documentar motivo do rollback'
\echo ''
\echo '📝 COMANDO PARA RECRIAR ÍNDICES (se necessário):'
\echo '   psql $DATABASE_URL -f scripts/create-indexes.sql'
\echo ''

-- Registrar timestamp de conclusão
SELECT 
    'Rollback de índices concluído em: ' || current_timestamp as "Status Final";

-- ============================================================================
-- LIMPEZA ADICIONAL (OPCIONAL)
-- ============================================================================

\echo ''
\echo '=== LIMPEZA ADICIONAL ==='

-- Limpar estatísticas antigas
ANALYZE "Client";

-- Atualizar estatísticas do planner
SELECT 'Estatísticas da tabela Client atualizadas' as "Limpeza";

\echo 'Rollback concluído com sucesso!' 