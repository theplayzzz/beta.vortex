# Análise de Impacto - Otimização de Performance da API de Clientes

**Data:** 2025-01-27  
**Autor:** theplayzzz  
**Plano:** plan-004-your-plan-title.md  

## 📊 Estado Atual da Aplicação

### Schema do Banco de Dados (Prisma)

#### Tabela Client
```prisma
model Client {
  id                      String               @id @default(cuid())
  name                    String
  industry                String?
  serviceOrProduct        String?
  initialObjective        String?
  contactEmail            String?
  contactPhone            String?
  website                 String?
  address                 String?
  businessDetails         String?
  targetAudience          String?
  marketingObjectives     String?
  historyAndStrategies    String?
  challengesOpportunities String?
  competitors             String?
  resourcesBudget         String?
  toneOfVoice             String?
  preferencesRestrictions String?
  richnessScore           Int                  @default(0)
  userId                  String
  createdAt               DateTime             @default(now())
  updatedAt               DateTime             @updatedAt
  deletedAt               DateTime?
  isViewed                Boolean              @default(false)
  // ... relacionamentos
  
  @@index([userId])
  @@index([deletedAt])
}
```

**Índices Existentes:**
- `@@index([userId])` - Para filtrar por usuário
- `@@index([deletedAt])` - Para soft delete

### API Atual `/api/clients` - Problemas Identificados

#### 1. **Query de Industries Desnecessária**
```typescript
// Esta query é executada em TODA requisição, mesmo quando não necessária
const industries = await prisma.client.findMany({
  where: {
    userId: userId,
    industry: { not: null },
  },
  select: { industry: true },
  distinct: ['industry'],
  orderBy: { industry: 'asc' },
})
```

#### 2. **Falta de Índices Otimizados**
- Não há índice composto para `(userId, deletedAt, createdAt)`
- Não há índice para busca por nome: `(userId, name)`
- Não há índice para filtros avançados: `(userId, industry, richnessScore)`

#### 3. **Contador de Clientes Incorreto**
```typescript
// No dashboard (app/page.tsx linha 32)
const response = await fetch('/api/clients?limit=1');
const data = await response.json();
setClientsCount(data.total || 0); // ❌ API não retorna 'total', retorna 'totalCount'
```

### Documentação Consultada via MCP Context7

#### ✅ TanStack Query v5
- **Breaking Changes:** Nenhum breaking change crítico identificado
- **Best Practices:** 
  - Usar `queryKey` com todas as dependências
  - Implementar `staleTime` para evitar refetch imediato após SSR
  - Usar `useSuspenseQuery` para type safety
  - Configurar `QueryClient` com singleton no browser

#### ✅ Prisma ORM
- **Índices:** Suporte completo para índices compostos e específicos
- **Performance:** Recomendação de reutilizar PrismaClient instance
- **Otimizações:** Usar `relationLoadStrategy: "join"` para evitar N+1

#### ✅ React 18
- **Suspense:** Totalmente compatível e estável
- **Error Boundaries:** Funcionam perfeitamente com Suspense
- **Concurrent Features:** `useTransition` e `useDeferredValue` disponíveis

#### ✅ Next.js API Routes
- **Performance:** Suporte a cache headers (`Cache-Control`)
- **Streaming:** Suporte a streaming responses
- **Edge Runtime:** Disponível para melhor performance

## 🔍 Dependências Identificadas

### Tabela Client
- **Relacionamentos:** User, ClientNote, ClientAttachment, CommercialProposal, PlanningTask, StrategicPlanning, AgentInteraction
- **Queries Frequentes:** 
  - Listagem por userId
  - Filtros por industry, richnessScore, name
  - Ordenação por createdAt, updatedAt, name, richnessScore
  - Soft delete (deletedAt)

### Componentes Afetados
1. **Dashboard (`app/page.tsx`)** - Contador de clientes
2. **Lista de Clientes** - Performance da API
3. **Filtros** - Query de industries

## 🎯 Oportunidades de Otimização

### 1. **Índices de Banco de Dados**
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

### 2. **Otimizações de API**
- Remover query de `industries` desnecessária
- Implementar cache inteligente
- Otimizar contagem com `LIMIT` em vez de `COUNT(*)`
- Combinar queries com `Promise.all`

### 3. **TanStack Query Implementation**
- Cache automático com TTL configurável
- Invalidação inteligente
- Loading states suaves
- Error handling robusto

## ⚠️ Riscos Identificados

### Alto Risco
- **Migração de índices:** Pode causar lock na tabela Client
- **Breaking changes:** Mudança na estrutura de resposta da API

### Médio Risco
- **Cache poisoning:** Dados incorretos em cache
- **Memory leaks:** Queries não limpas adequadamente

### Baixo Risco
- **Contador de clientes:** Mudança simples e isolada
- **TanStack Query base:** Implementação incremental

## 📋 Estratégia de Rollback

### Critérios de Rollback
- ❌ Tempo de resposta pior que o estado atual
- ❌ Erros de autenticação
- ❌ Perda de dados ou funcionalidade
- ❌ Queries falhando > 5%

### Plano de Rollback
1. **Fase 1-3:** Reverter commits via Git
2. **Fase 4:** Remover índices criados
3. **Backup:** Backup completo antes da Fase 4

## 🎯 Métricas de Sucesso

### Performance
- ✅ Redução de 50%+ no tempo de resposta da API
- ✅ Redução de 70%+ no tempo total de carregamento
- ✅ Cache hit rate > 80%

### Funcionalidade
- ✅ Contador de clientes mostrando valor correto
- ✅ Todas as funcionalidades existentes mantidas
- ✅ Zero downtime durante implementação

### UX
- ✅ Loading states suaves sem flickering
- ✅ Melhor feedback visual para o usuário

## 🚀 Próximos Passos

1. **Backup do banco de dados**
2. **Criar branch `feature/performance-optimization`**
3. **Implementar TanStack Query (Fase 1)**
4. **Corrigir contador de clientes**
5. **Otimizar API gradualmente (Fase 2)**
6. **Implementar índices (Fase 4)**

---

**Status:** ✅ Análise Completa  
**Aprovação para Fase 1:** ✅ Liberada  
**Próxima Fase:** Implementação do TanStack Query Base 