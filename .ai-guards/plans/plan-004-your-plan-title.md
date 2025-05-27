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

### **Fase 3: Implementação de Mutations**

11. **Implementar mutations para operações CRUD**
    - Criar mutations para criar, atualizar e deletar clientes usando [useMutation](https://tanstack.com/query/latest/docs/framework/react/reference/useMutation)
    - Implementar callbacks `onSuccess`, `onError`, `onSettled` conforme [guia de mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
    - Arquivo: `lib/query/hooks/use-client-mutations.ts` (novo)
    - **Padrão**: 
      ```tsx
      useMutation({
        mutationFn: createClient,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['clients'] })
        }
      })
      ```
    - **Teste**: Verificar se mutations funcionam e invalidam cache

12. **Implementar optimistic updates**
    - Usar `onMutate` para updates otimistas conforme [documentação de optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
    - Implementar rollback em caso de erro usando `onError`
    - **Padrão**:
      ```tsx
      onMutate: async (newClient) => {
        await queryClient.cancelQueries({ queryKey: ['clients'] })
        const previousClients = queryClient.getQueryData(['clients'])
        queryClient.setQueryData(['clients'], (old) => [...old, newClient])
        return { previousClients }
      }
      ```

### **Fase 4: Otimização de Banco (Alto Risco - Requer Cuidado)**

13. **Preparar migração de índices**
    - Consultar documentação Prisma via MCP Context7 sobre índices compostos
    - Criar migração SQL manual para controle total
    - Arquivo: `prisma/migrations/[timestamp]_optimize_client_indexes/migration.sql`
    - **Conteúdo**:
      ```sql
      -- Índice principal para queries mais comuns
      CREATE INDEX CONCURRENTLY "Client_userId_deletedAt_createdAt_idx" 
      ON "Client"("userId", "deletedAt", "createdAt" DESC);
      
      -- Índice para busca por nome
      CREATE INDEX CONCURRENTLY "Client_userId_name_idx" 
      ON "Client"("userId", "name");
      
      -- Índice para filtros avançados
      CREATE INDEX CONCURRENTLY "Client_userId_industry_richnessScore_idx" 
      ON "Client"("userId", "industry", "richnessScore");
      ```

14. **Executar migração de índices (Horário de baixo tráfego)**
    - Usar `CREATE INDEX CONCURRENTLY` para não bloquear tabela
    - Monitorar performance durante criação
    - Executar: `npx prisma db push` ou `npx prisma migrate deploy`
    - **Teste**: Verificar se índices foram criados corretamente

15. **Atualizar schema Prisma**
    - Adicionar novos índices ao `schema.prisma`
    - Executar `npx prisma db pull` para sincronizar
    - Arquivo: `prisma/schema.prisma` (atualizar)
    - **Teste**: Verificar se schema está consistente

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
- `prisma/migrations/[timestamp]_optimize_client_indexes/migration.sql` (novo)
- `prisma/schema.prisma` - Adicionar índices

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
