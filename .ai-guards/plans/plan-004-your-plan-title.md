---
id: plan-004
title: Otimização de Performance da API de Clientes e Implementação do TanStack Query
createdAt: 2025-05-27
author: theplayzzz
status: draft
---

## 🧩 Scope

Otimizar a performance da API `/api/clients` que está apresentando lentidão significativa, implementar TanStack Query para gerenciamento de estado assíncrono, e corrigir o contador de clientes na dashboard que está mostrando valor incorreto (0).

## ✅ Functional Requirements

- Reduzir significativamente o tempo de resposta da API `/api/clients`
- Implementar cache inteligente com TanStack Query
- Corrigir contador de clientes na dashboard para mostrar valor real
- Manter funcionalidade existente de filtros, paginação e ordenação
- Implementar loading states e error handling adequados
- Adicionar invalidação automática de cache quando necessário

## ⚙️ Non-Functional Requirements

- UX: Loading states suaves com skeleton loaders
- Caching: Cache inteligente com TTL configurável
- Scalability: Suporte para grandes volumes de clientes sem degradação
- Reliability: Error boundaries e fallbacks para falhas de rede

## 📚 Guidelines & Packages

- **TanStack Query v5**: Para gerenciamento de estado assíncrono e cache (MIT License)
  - **Documentação**: [TanStack Query Official Docs](https://tanstack.com/query/latest)
  - **React Guide**: [React Query Guide](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- **React Query DevTools**: Para debugging em desenvolvimento
- **MCP Context7**: Para consulta de documentação oficial de todas as ferramentas
- **Prisma CLI**: Para análise de impacto e migrações seguras
- Seguir padrões existentes do projeto (TypeScript, Tailwind CSS)
- Manter compatibilidade com Clerk Auth e Prisma ORM
- Usar React 18+ features (Suspense, Error Boundaries)

## 🔐 Threat Model (Stub)

- Cache poisoning: Validar dados antes de armazenar em cache
- Memory leaks: Implementar cleanup adequado de queries
- Race conditions: Usar query keys únicos e debouncing
- Unauthorized access: Manter validação de userId em todas as queries
- Database migration risks: Backup e rollback strategy
- Breaking changes: Versionamento de API durante transição

## 📋 Problemas Identificados na Análise de Impacto

### 🚨 Problemas Críticos Encontrados:

1. **Contador de Clientes Incorreto**
   - **Localização**: `app/page.tsx` linha 32
   - **Problema**: Dashboard busca `data.total` mas API retorna `data.pagination.totalCount`
   - **Impacto**: Contador sempre mostra 0
   - **Referência**: `.ai-guards/plans/impact-analysis.md` seção "Contador de Clientes Incorreto"

2. **Query Desnecessária de Industries**
   - **Localização**: `app/api/clients/route.ts`
   - **Problema**: Query executada em TODA requisição mesmo quando não necessária
   - **Impacto**: Performance degradada desnecessariamente
   - **Referência**: `.ai-guards/plans/impact-analysis.md` seção "Query de Industries Desnecessária"

3. **Índices de Banco Faltantes**
   - **Problema**: Falta índices compostos para queries frequentes
   - **Impacto**: Queries lentas em tabelas grandes
   - **Índices Necessários**: `(userId, deletedAt, createdAt)`, `(userId, name)`, `(userId, industry, richnessScore)`
   - **Referência**: `.ai-guards/plans/impact-analysis.md` seção "Falta de Índices Otimizados"

### 📄 Documentação de Referência:
- **Análise Completa**: `.ai-guards/plans/impact-analysis.md`
- **Variáveis de Ambiente**: `.ai-guards/plans/environment-variables.md`

### ⚠️ Correções Críticas para Evitar Erros:

1. **ANTES de implementar TanStack Query**: Corrigir o bug do contador de clientes
   - **Motivo**: Evitar que o bug seja mascarado pela nova implementação
   - **Ação**: Alterar `data.total` para `data.pagination?.totalCount` em `app/page.tsx`

2. **DURANTE a Fase 4 (Índices)**: Usar `CREATE INDEX CONCURRENTLY`
   - **Motivo**: Evitar lock da tabela Client em produção
   - **Ação**: Executar migrações em horário de baixo tráfego

3. **MANTER compatibilidade**: Não alterar estrutura de resposta da API durante transição
   - **Motivo**: Evitar quebrar funcionalidades existentes
   - **Ação**: Implementar mudanças de forma incremental e backward-compatible

## 🔢 Execution Plan

### **Fase 0: Análise e Preparação (CRÍTICA) ✅ COMPLETA**

1. **✅ Consultar documentação oficial via MCP Context7**
   - ✅ TanStack Query v5: Sem breaking changes críticos, compatibilidade confirmada
   - ✅ Prisma: Documentação de índices compostos e performance consultada
   - ✅ React 18: Suspense e Error Boundaries totalmente compatíveis
   - ✅ Next.js: Padrões de API routes otimizadas identificados
   - **Resultado**: Todas as ferramentas são compatíveis e seguras para uso

2. **✅ Análise de impacto com Prisma**
   - ✅ Executado `npx prisma db pull` - Schema sincronizado
   - ✅ Executado `npx prisma generate` - Client atualizado
   - ✅ Identificadas dependências da tabela `Client` (7 relacionamentos)
   - ✅ Problemas identificados: Query desnecessária de industries, índices faltantes, contador incorreto
   - **Arquivo**: `📄 .ai-guards/plans/impact-analysis.md` - Análise completa

3. **✅ Backup e estratégia de rollback**
   - ✅ Branch `feature/performance-optimization` criada
   - ✅ Estado atual documentado e commitado
   - ✅ Critérios de rollback definidos
   - **Arquivo**: `📄 .ai-guards/plans/environment-variables.md` - Variáveis documentadas

### **Fase 1: Otimizações Seguras (Sem Alteração de Schema)**

4. **Implementar TanStack Query (Base)**
   - Instalar: `npm install @tanstack/react-query @tanstack/react-query-devtools`
   - Configurar QueryClient com configurações conservadoras baseadas na [documentação oficial](https://tanstack.com/query/latest/docs/framework/react/quick-start)
   - Arquivo: `lib/query/client.ts` (novo)
   - Arquivo: `lib/query/keys.ts` (novo)
   - **Configuração**: Usar variáveis de ambiente de `.ai-guards/plans/environment-variables.md`
   - **Padrão**: Usar `QueryClient` com `defaultOptions` conforme [guia de configuração](https://tanstack.com/query/latest/docs/reference/QueryClient)
   - **Teste**: Verificar se aplicação ainda funciona normalmente

5. **Adicionar QueryProvider ao layout**
   - Envolver aplicação com `QueryClientProvider` conforme [quick start guide](https://tanstack.com/query/latest/docs/framework/react/quick-start)
   - Configurar DevTools apenas em desenvolvimento usando [React Query DevTools](https://tanstack.com/query/latest/docs/framework/react/devtools)
   - Arquivo: `app/layout.tsx` (atualizar)
   - Arquivo: `components/providers/query-provider.tsx` (novo)
   - **Teste**: Verificar se todas as páginas carregam corretamente

6. **Otimizar autenticação (Sem quebrar)**
   - Implementar cache de `getUserIdFromClerk()` no middleware
   - Adicionar header `x-user-id` como fallback (manter lookup original)
   - Arquivo: `lib/auth/auth-wrapper.ts` (atualizar)
   - Arquivo: `middleware.ts` (atualizar)
   - **Teste**: Verificar autenticação em todas as rotas

7. **🚨 CORRIGIR CONTADOR DE CLIENTES (CRÍTICO - PRIORIDADE ALTA)**
   - **PROBLEMA IDENTIFICADO**: Dashboard busca `data.total` mas API retorna `data.pagination.totalCount`
   - **Localização**: `app/page.tsx` linha 32 - `setClientsCount(data.total || 0)`
   - **Correção Imediata**: Alterar para `setClientsCount(data.pagination?.totalCount || 0)`
   - Criar hook `useClientsCount` com TanStack Query usando padrão [useQuery](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)
   - Arquivo: `lib/query/hooks/use-clients-count.ts` (novo)
   - Arquivo: `app/page.tsx` (corrigir bug + implementar hook)
   - **Padrão**: `useQuery({ queryKey: ['clients-count'], queryFn: fetchClientsCount })`
   - **Referência**: Ver análise em `.ai-guards/plans/impact-analysis.md` seção "Contador de Clientes Incorreto"
   - **Teste**: Verificar se contador mostra valor correto

### **Fase 2: Otimização de API (Risco Médio) ✅ COMPLETA**

8. **✅ OTIMIZAR QUERIES DA API `/api/clients` (IMPLEMENTADO)**
   - ✅ **CORREÇÃO 1**: Query de `industries` agora é condicional (apenas primeira página sem filtros)
   - ✅ **CORREÇÃO 2**: Implementada paginação otimizada com `LIMIT+1` para páginas subsequentes
   - ✅ **CORREÇÃO 3**: Queries combinadas com `Promise.all` otimizado
   - ✅ Arquivo: `app/api/clients/route.ts` - Otimizações implementadas
   - ✅ **Performance**: Redução significativa de queries desnecessárias
   - ✅ **Teste**: API mantém funcionalidade com melhor performance

9. **✅ MIGRAR LISTAGEM PARA TANSTACK QUERY (IMPLEMENTADO)**
   - ✅ Hook `useClients` criado com filtros completos: `lib/query/hooks/use-clients.ts`
   - ✅ Hook `useClientsCount` criado para contador: `lib/query/hooks/use-clients-count.ts`
   - ✅ Query keys padronizadas implementadas: `lib/query/keys.ts`
   - ✅ QueryClient configurado: `lib/query/client.ts`
   - ✅ QueryProvider adicionado ao layout: `app/layout.tsx`
   - ✅ DevTools configuradas para desenvolvimento
   - ✅ **Padrão**: `useQuery({ queryKey: queryKeys.clients.list(filters), queryFn: fetchClients })`

10. **✅ IMPLEMENTAR INVALIDAÇÃO DE CACHE (IMPLEMENTADO)**
    - ✅ Mutations CRUD completas: `lib/query/hooks/use-client-mutations.ts`
    - ✅ Invalidação automática após mutations implementada
    - ✅ Hook `useInvalidateClients` para invalidação manual
    - ✅ Hooks disponíveis: `useCreateClient`, `useUpdateClient`, `useDeleteClient`, `useRestoreClient`
    - ✅ **Padrão**: `queryClient.invalidateQueries({ queryKey: queryKeys.clients.all })`
    - ✅ **Cache Strategy**: Invalidação inteligente por tipo de operação

### **Fase 3: Implementação de Mutations (✅ COMPLETA)**

11. **Implementar mutations para operações CRUD**
   - ✅ Criadas mutations para criar, atualizar, deletar e restaurar clientes usando `useMutation` do TanStack Query.
   - ✅ Implementados callbacks `onSuccess`, `onError`, `onSettled` para cada operação, seguindo o guia oficial.
   - ✅ Arquivo: `lib/query/hooks/use-client-mutations.ts` (novo)
   - ✅ Hooks criados: `useCreateClient`, `useUpdateClient`, `useDeleteClient`, `useRestoreClient`
   - ✅ Invalidação automática de cache após cada mutation.
   - ✅ Criado hook `useInvalidateClients` para invalidação manual.
   - ✅ Testes realizados: mutations funcionam e invalidam cache corretamente.

12. **Implementar optimistic updates**
   - ✅ Todos os mutations implementam updates otimistas com `onMutate`, rollback com `onError` e atualização final com `onSettled`.
   - ✅ `useCreateClient`: Adiciona cliente ao cache de forma otimista, com rollback em caso de erro.
   - ✅ `useUpdateClient`: Atualiza cliente no cache de forma otimista, com rollback em caso de erro.
   - ✅ `useDeleteClient`: Remove cliente do cache e atualiza contador de forma otimista, com rollback em caso de erro.
   - ✅ `useRestoreClient`: Atualiza contador de clientes de forma otimista ao restaurar.
   - ✅ Todos os mutations usam snapshots para rollback seguro.
   - ✅ Testes realizados: updates otimistas funcionam e são revertidos corretamente em caso de erro.

**Recursos Avançados Adicionais Implementados:**
- ✅ Criado hook `useClientDetail` para gerenciamento individual de cliente com mutations.
- ✅ Criado hook `useErrorHandling` para tratamento centralizado de erros (network, validação, autorização, server, unknown).
- ✅ Criado hook `useLoadingStates` para estados de loading granulares.
- ✅ Criado hook `useNotifications` com sistema de toast notifications.
- ✅ Criado hook `useClientUX` que combina todos os recursos de UX e helper `handleOperation`.
- ✅ Criado hook `useBulkClientOperations` para operações em lote com updates otimistas.
- ✅ Criado hook unificado `useClientOperations` para todas as operações CRUD com estados combinados.
- ✅ Exemplo prático em `lib/query/examples/client-operations-example.tsx`.
- ✅ Documentação detalhada em `lib/query/README.md`.
- ✅ Todos os erros de lint/TypeScript corrigidos.

**Arquivos criados/alterados na Fase 3:**
- `lib/query/hooks/use-client-mutations.ts` (novo)
- `lib/query/hooks/useClientDetail.ts` (novo)
- `lib/query/hooks/useErrorHandling.ts` (novo)
- `lib/query/hooks/useLoadingStates.ts` (novo)
- `lib/query/hooks/useNotifications.ts` (novo)
- `lib/query/hooks/useClientUX.ts` (novo)
- `lib/query/hooks/useBulkClientOperations.ts` (novo)
- `lib/query/hooks/useClientOperations.ts` (novo)
- `lib/query/examples/client-operations-example.tsx` (novo)
- `lib/query/README.md` (novo)
- `lib/query/hooks/index.ts` (atualizado para exportar todos os hooks)

**Resumo:**  
A Fase 3 está 100% concluída, com mutations CRUD, updates otimistas, rollback seguro, hooks avançados de UX, documentação e exemplos práticos, e todos os testes e validações realizados com sucesso.

### **Fase 4: Otimização de Banco (Alto Risco - Requer Cuidado)**

⚠️ **ATENÇÃO**: Esta fase requer **backup completo** e **janela de manutenção**

#### **Pré-Requisitos Obrigatórios:**
- [ ] Backup completo do banco de dados
- [ ] Verificar espaço em disco (mínimo 50% livre)
- [ ] Executar em horário de baixo tráfego (madrugada/fim de semana)
- [ ] Testar em ambiente de staging primeiro
- [ ] Preparar script de rollback

13. **🔍 Análise Pré-Migração (OBRIGATÓRIO)**
    - Verificar tamanho atual da tabela Client
    - Estimar tempo de criação dos índices
    - Confirmar espaço em disco disponível
    - Arquivo: `scripts/pre-migration-analysis.sql` (novo)
    - **Comandos**:
      ```bash
      # Verificar tamanho da tabela
      psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_total_relation_size('Client'));"
      
      # Verificar espaço em disco
      df -h
      
      # Backup completo
      pg_dump $DATABASE_URL > backup_pre_indexes_$(date +%Y%m%d_%H%M%S).sql
      ```

14. **📝 Criar Migração de Índices**
    - Consultar documentação Prisma via MCP Context7 sobre índices compostos
    - Criar migração SQL manual para controle total
    - Arquivo: `prisma/migrations/[timestamp]_optimize_client_indexes/migration.sql` (novo)
    - Arquivo: `scripts/create-indexes.sql` (novo - script standalone)
    - Arquivo: `scripts/rollback-indexes.sql` (novo - script de rollback)
    - **Conteúdo da Migração**:
      ```sql
      -- Migration: Optimize Client table indexes
      -- Created: [timestamp]
      -- Purpose: Improve query performance for client operations
      
      -- Índice principal para queries mais comuns (listagem ordenada)
      -- Otimiza: SELECT * FROM Client WHERE userId = ? AND deletedAt IS NULL ORDER BY createdAt DESC
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "Client_userId_deletedAt_createdAt_idx" 
      ON "Client"("userId", "deletedAt", "createdAt" DESC);
      
      -- Índice para busca por nome
      -- Otimiza: SELECT * FROM Client WHERE userId = ? AND name ILIKE '%search%'
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "Client_userId_name_idx" 
      ON "Client"("userId", "name");
      
      -- Índice para filtros avançados
      -- Otimiza: SELECT * FROM Client WHERE userId = ? AND industry = ? AND richnessScore > ?
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "Client_userId_industry_richnessScore_idx" 
      ON "Client"("userId", "industry", "richnessScore");
      ```

15. **🚀 Executar Migração (Horário de Baixo Tráfego)**
    - **TIMING**: Executar entre 2h-5h da madrugada ou fim de semana
    - **MONITORAMENTO**: Acompanhar logs e performance em tempo real
    - Usar `CREATE INDEX CONCURRENTLY` para não bloquear tabela
    - Executar índices um por vez para controle granular
    - **Comandos de Execução**:
      ```bash
      # Método 1: Via migração Prisma (recomendado)
      npx prisma migrate dev --name optimize_client_indexes
      
      # Método 2: Execução manual (maior controle)
      psql $DATABASE_URL -f scripts/create-indexes.sql
      
      # Verificar criação dos índices
      psql $DATABASE_URL -c "\d+ Client"
      ```
    - **Monitoramento Durante Execução**:
      ```sql
      -- Verificar progresso
      SELECT schemaname, tablename, indexname, indexdef 
      FROM pg_indexes WHERE tablename = 'Client';
      
      -- Monitorar locks
      SELECT * FROM pg_locks WHERE relation = 'Client'::regclass;
      
      -- Verificar tamanho dos índices
      SELECT indexname, pg_size_pretty(pg_relation_size(indexname::regclass))
      FROM pg_indexes WHERE tablename = 'Client';
      ```

16. **✅ Validação e Atualização do Schema**
    - Verificar se todos os índices foram criados corretamente
    - Testar performance das queries principais
    - Atualizar `schema.prisma` com os novos índices
    - Arquivo: `prisma/schema.prisma` (atualizar)
    - Arquivo: `scripts/performance-test.sql` (novo)
    - **Validações**:
      ```bash
      # Sincronizar schema
      npx prisma db pull
      
      # Gerar client atualizado
      npx prisma generate
      
      # Testar aplicação
      npm run build
      npm run test
      ```
    - **Testes de Performance**:
      ```sql
      -- Testar query principal (deve usar Client_userId_deletedAt_createdAt_idx)
      EXPLAIN ANALYZE SELECT * FROM "Client" 
      WHERE "userId" = 'test-user-id' AND "deletedAt" IS NULL 
      ORDER BY "createdAt" DESC LIMIT 12;
      
      -- Testar busca por nome (deve usar Client_userId_name_idx)
      EXPLAIN ANALYZE SELECT * FROM "Client" 
      WHERE "userId" = 'test-user-id' AND "name" ILIKE '%test%';
      
      -- Testar filtros (deve usar Client_userId_industry_richnessScore_idx)
      EXPLAIN ANALYZE SELECT * FROM "Client" 
      WHERE "userId" = 'test-user-id' AND "industry" = 'Technology' AND "richnessScore" > 50;
      ```

#### **🛡️ Estratégia de Rollback**
- **Critérios de Rollback**:
  - ❌ Criação de índice falha após 1 hora
  - ❌ Performance pior que antes da migração
  - ❌ Espaço em disco < 20%
  - ❌ Aplicação com erros > 5%
  - ❌ Queries falhando > 2%

- **Script de Rollback**:
  ```bash
  # Executar rollback imediato
  psql $DATABASE_URL -f scripts/rollback-indexes.sql
  
  # Restaurar backup se necessário
  psql $DATABASE_URL < backup_pre_indexes_[timestamp].sql
  ```

#### **📊 Métricas de Sucesso**
- ✅ Todos os 3 índices criados sem erros
- ✅ Redução de 50%+ no tempo de resposta das queries principais
- ✅ Planos de execução usando os novos índices
- ✅ Aplicação funcionando normalmente
- ✅ Zero downtime durante a migração

### **Fase 5: Melhorias Avançadas (Opcional)**

16. **Implementar paginação cursor-based**
    - Substituir offset por cursor para melhor performance
    - Atualizar API e frontend gradualmente
    - Manter compatibilidade com paginação atual
    - **Teste**: Verificar se paginação funciona com grandes datasets

17. **Adicionar cache Redis (Se necessário)**
    - Configurar Redis para cache de queries frequentes
    - Implementar invalidação inteligente
    - Arquivo: `lib/cache/redis.ts` (novo)
    - **Teste**: Verificar se cache Redis melhora performance

### **Arquivos que Precisam ser Alterados (Em Ordem de Implementação):**

#### **Fase 0 - Preparação: ✅ COMPLETA**
- `📄 .ai-guards/plans/impact-analysis.md` ✅ - Análise de impacto completa
- `📄 .ai-guards/plans/environment-variables.md` ✅ - Variáveis de ambiente documentadas

#### **Fase 1 - Base TanStack Query:**
- `package.json` - Adicionar dependências
- `lib/query/client.ts` (novo) - Configuração do QueryClient
- `lib/query/keys.ts` (novo) - Query keys padronizadas
- `components/providers/query-provider.tsx` (novo) - Provider
- `app/layout.tsx` - Adicionar QueryProvider
- `lib/query/hooks/use-clients-count.ts` (novo) - Hook contador
- `app/page.tsx` - Corrigir contador de clientes

#### **Fase 2 - Otimização API:**
- `lib/auth/auth-wrapper.ts` - Cache de autenticação
- `middleware.ts` - Header x-user-id
- `app/api/clients/route.ts` - Otimizar queries
- `lib/query/hooks/use-clients.ts` (novo) - Hook principal
- `components/client/client-list-with-filters.tsx` - Migrar para TanStack Query

#### **Fase 3 - Mutations:**
- `lib/query/hooks/use-client-mutations.ts` (novo) - Mutations CRUD
- Componentes que fazem operações CRUD - Migrar para mutations

#### **Fase 4 - Banco de Dados:**
- `scripts/pre-migration-analysis.sql` (novo) - Análise pré-migração
- `scripts/create-indexes.sql` (novo) - Script standalone para criação de índices
- `scripts/rollback-indexes.sql` (novo) - Script de rollback
- `scripts/performance-test.sql` (novo) - Testes de performance
- `prisma/migrations/[timestamp]_optimize_client_indexes/migration.sql` (novo) - Migração oficial
- `prisma/schema.prisma` (atualizar) - Adicionar definições dos novos índices
- `docs/phase4-execution-log.md` (novo) - Log de execução da Fase 4

#### **Fase 5 - Avançado:**
- `lib/cache/redis.ts` (novo) - Cache Redis opcional

### **Comandos MCP Context7 Necessários:**

```bash
# Consultar documentação antes de cada fase
mcp-context7 get-library-docs --library="@tanstack/react-query" --topic="best practices"
mcp-context7 get-library-docs --library="prisma" --topic="database indexes"
mcp-context7 get-library-docs --library="next.js" --topic="api routes performance"
mcp-context7 get-library-docs --library="react" --topic="suspense error boundaries"
```

### **Referências da Documentação TanStack Query:**

- **Quick Start**: https://tanstack.com/query/latest/docs/framework/react/quick-start
- **useQuery Reference**: https://tanstack.com/query/latest/docs/framework/react/reference/useQuery
- **useMutation Reference**: https://tanstack.com/query/latest/docs/framework/react/reference/useMutation
- **Mutations Guide**: https://tanstack.com/query/latest/docs/framework/react/guides/mutations
- **Optimistic Updates**: https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
- **Query Invalidation**: https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations
- **DevTools**: https://tanstack.com/query/latest/docs/framework/react/devtools
- **Query Keys**: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys

### **Critérios de Rollback:**
- ❌ Tempo de resposta pior que o estado atual
- ❌ Erros de autenticação
- ❌ Perda de dados ou funcionalidade
- ❌ Queries falhando > 5%
- ❌ Memory leaks detectados

### **Métricas de Sucesso:**
- ✅ Redução significativa no tempo de resposta da API
- ✅ Redução substancial no tempo total de carregamento
- ✅ Contador de clientes mostrando valor correto
- ✅ Cache hit rate otimizado
- ✅ Eliminação de queries desnecessárias em navegação normal
- ✅ Loading states suaves sem flickering
- ✅ Zero downtime durante implementação
- ✅ Todas as funcionalidades existentes mantidas
- ✅ Melhor experiência do usuário com feedback visual adequado
