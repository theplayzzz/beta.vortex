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

## 🔢 Execution Plan

### **Fase 0: Análise e Preparação (CRÍTICA)**

1. **Consultar documentação oficial via MCP Context7**
   - TanStack Query: Verificar breaking changes e best practices
   - Prisma: Consultar documentação de índices e performance
   - React 18: Confirmar compatibilidade com Suspense
   - Next.js: Verificar padrões de API routes otimizadas
   - **Comando**: Usar MCP Context7 para cada ferramenta antes de implementar

2. **Análise de impacto com Prisma**
   - Executar `npx prisma db pull` para sincronizar schema atual
   - Executar `npx prisma generate` para verificar client atual
   - Analisar queries existentes com `EXPLAIN ANALYZE` no PostgreSQL
   - Identificar todas as dependências da tabela `Client`
   - **Arquivo**: Criar `docs/impact-analysis.md` com resultados

3. **Backup e estratégia de rollback**
   - Backup completo do banco de dados
   - Criar branch `feature/performance-optimization`
   - Documentar estado atual da aplicação
   - Definir critérios de rollback

### **Fase 1: Otimizações Seguras (Sem Alteração de Schema)**

4. **Implementar TanStack Query (Base)**
   - Instalar: `npm install @tanstack/react-query @tanstack/react-query-devtools`
   - Configurar QueryClient com configurações conservadoras baseadas na [documentação oficial](https://tanstack.com/query/latest/docs/framework/react/quick-start)
   - Arquivo: `lib/query/client.ts` (novo)
   - Arquivo: `lib/query/keys.ts` (novo)
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

7. **Corrigir contador de clientes (Baixo risco)**
   - Criar hook `useClientsCount` com TanStack Query usando padrão [useQuery](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)
   - Substituir valor hardcoded no dashboard
   - Arquivo: `lib/query/hooks/use-clients-count.ts` (novo)
   - Arquivo: `app/page.tsx` (atualizar elemento específico)
   - **Localização**: `div.text-2xl.font-bold.text-seasalt` no 3º card
   - **Padrão**: `useQuery({ queryKey: ['clients-count'], queryFn: fetchClientsCount })`
   - **Teste**: Verificar se contador mostra valor correto

### **Fase 2: Otimização de API (Risco Médio)**

8. **Otimizar queries da API `/api/clients` (Gradual)**
   - Primeiro: Remover query desnecessária de `industries`
   - Segundo: Otimizar contagem usando `LIMIT` em vez de `COUNT(*)`
   - Terceiro: Combinar queries com `Promise.all` otimizado
   - Arquivo: `app/api/clients/route.ts` (atualizar)
   - **Teste**: Verificar se API retorna mesmos dados com melhor performance

9. **Migrar listagem de clientes para TanStack Query**
   - Criar hook `useClients` com todos os filtros usando [useQuery com parâmetros](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
   - Substituir `useState` + `useEffect` por `useQuery`
   - Implementar loading states e error handling conforme [guia de mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
   - Arquivo: `lib/query/hooks/use-clients.ts` (novo)
   - Arquivo: `components/client/client-list-with-filters.tsx` (atualizar)
   - **Padrão**: `useQuery({ queryKey: ['clients', filters], queryFn: () => fetchClients(filters) })`
   - **Teste**: Verificar se filtros, paginação e ordenação funcionam

10. **Implementar invalidação de cache**
    - Configurar invalidação automática após mutations usando [queryClient.invalidateQueries](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)
    - Adicionar refresh manual quando necessário
    - Implementar optimistic updates conforme [guia de optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
    - **Padrão**: `queryClient.invalidateQueries({ queryKey: ['clients'] })`
    - **Teste**: Verificar se cache é invalidado corretamente

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

#### **Fase 0 - Preparação:**
- `docs/impact-analysis.md` (novo) - Análise de impacto
- `.env.example` (atualizar) - Variáveis de ambiente necessárias

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
