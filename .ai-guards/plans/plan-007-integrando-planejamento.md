---
id: plan-007
title: Reformulação da Área de Planejamento - Integração Cliente-Formulário
createdAt: 2025-05-29
author: theplayzzz
status: in-progress
progress: "Phase 1: ✅ CONCLUÍDA | Phase 2-6: Pendentes"
---

## 🧩 Scope

Reformular completamente a área de planejamento removendo abas desnecessárias e criando um fluxo integrado onde:
1. **Sidebar**: Uma única aba "Planejamentos" ✅ **CONCLUÍDO**
2. **Página Principal**: Lista todos os planejamentos existentes com botão "Novo Planejamento" ✅ **CONCLUÍDO**
3. **Fluxo de Criação**: Cliente → Formulário Multi-Etapas ✅ **ESTRUTURA CRIADA**
4. **Integração**: Usar todo o sistema de formulário do PLAN-006 concluído
5. **Otimização**: TanStack Query para operações CRUD e cache inteligente

## ✅ Functional Requirements

### 1. Estrutura de Navegação ✅ **CONCLUÍDO**
- **Removido**: Aba de "lista refinada" do sidebar ✅
- **Mantido**: Única aba "Planejamentos" no sidebar ✅
- **Página Principal**: `/planejamentos` - lista completa de planejamentos ✅

### 2. Fluxo de Criação de Planejamento ✅ **ESTRUTURA CRIADA**
- **Trigger**: Botão "Novo Planejamento" na página principal ✅
- **Step 1**: Modal/Página de seleção/criação de cliente ✅ **UI PRONTA**
- **Step 2**: Inicialização do formulário multi-etapas com cliente selecionado ⏳ **PENDENTE**
- **Formulário**: Sistema completo do PLAN-006 (4 abas integradas) ⏳ **PENDENTE**

### 3. Integração Cliente-Formulário ⏳ **PENDENTE**
- **Cliente Existente**: Usar modal de seleção existente
- **Cliente Novo**: Usar modal de criação existente
- **Categoria/Setor**: Cliente define qual formulário dinâmico será usado
- **Context Transfer**: Dados do cliente alimentam automaticamente o formulário

### 4. Sistema de Formulário (Aproveitando PLAN-006) ⏳ **PENDENTE**
- **Componente Principal**: `PlanningForm.tsx` já implementado
- **4 Abas Funcionais**: Informações Básicas, Detalhes do Setor, Marketing, Comercial
- **88 Perguntas Dinâmicas**: Por setor específico
- **Validação Robusta**: React Hook Form + Zod
- **Auto-save**: localStorage para recuperação

### 5. Otimizações TanStack Query ⏳ **PENDENTE**
- **Cache Inteligente**: Queries para listagem de planejamentos e clientes
- **Mutations Otimizadas**: Create, Update, Delete com optimistic updates
- **Auto-invalidation**: Cache refresh automático após mutações
- **Optimistic UI**: Feedback imediato para criação de planejamentos
- **Error Recovery**: Rollback automático em caso de falha

## 📚 Guidelines & Packages

### Packages Aproveitados do PLAN-006
```json
{
  "react-hook-form": "^7.56.4",
  "@hookform/resolvers": "^5.0.1", 
  "class-variance-authority": "^0.7.1"
}
```

### Novo Package - TanStack Query
```json
{
  "@tanstack/react-query": "^5.59.0",
  "@tanstack/react-query-devtools": "^5.59.0"
}
```

### Componentes Base (Já Implementados)
- **PlanningForm.tsx**: Formulário principal
- **ClientHeader.tsx**: Header com dados do cliente
- **RichnessScoreBadge.tsx**: Badge de qualificação
- **FormProgress.tsx**: Progresso das 4 seções
- **QuestionField.tsx**: Renderizador universal
- **4 Tabs**: BasicInfo, SectorDetails, Marketing, Commercial

### Guidelines de Implementação
- **Seguir**: Design system atual (night, eerie-black, sgbus-green)
- **Reutilizar**: Máximo dos componentes PLAN-006
- **Manter**: TypeScript strict compliance
- **Preservar**: Sistema de validação robusto
- **Aplicar**: Padrões TanStack Query para cache e mutations

## 🔐 Threat Model

### Dados do Cliente
- **Exposição**: Dados sensíveis no localStorage
- **Mitigação**: Limpeza automática após submissão + cache TanStack Query
- **Validação**: Schema de entrada rigoroso

### Formulário Multi-Etapas
- **Manipulação**: Dados do formulário no frontend
- **Mitigação**: Validação dupla (frontend + backend)
- **Recovery**: Dados perdidos por refresh via TanStack Query cache

### Session Management
- **Conflito**: Múltiplos formulários simultâneos
- **Mitigação**: Keys únicos por sessão + query keys específicos
- **Cleanup**: Auto-limpeza após timeout

### Cache Poisoning
- **Risk**: Cache inválido após operações concorrentes
- **Mitigação**: Optimistic updates com rollback automático
- **Invalidation**: Estratégia precisa de invalidação de cache

## 🔢 Execution Plan - REORGANIZADO PARA IMPLEMENTAÇÃO INCREMENTAL

### ✅ Phase 1: Reestruturação da Navegação - **CONCLUÍDA 29/05/2025**
1. ✅ **Atualizar Sidebar**: Remover abas desnecessárias
2. ✅ **Configurar Rota**: `/planejamentos` como página principal
3. ✅ **Página Principal**: Lista de planejamentos + botão "Novo Planejamento"
4. ✅ **Fluxo Base**: Estrutura cliente→formulário criada
5. ✅ **Navegação**: Integrar com routing existente

**📋 Testável**: Navegação sidebar, páginas carregam, botões funcionam
**📄 Documentação**: `.ai-guards/plans/concluido/PHASE-1-NAVEGACAO-CONCLUIDA.md`

---

### 🔄 Phase 2: Setup TanStack Query e API Routes
**Objetivo**: Criar infraestrutura para operações CRUD funcionais

#### 2.1 Instalação e Configuração TanStack Query
1. **Instalar Packages**: `@tanstack/react-query` e devtools
2. **QueryClient Setup**: Configurar cliente global em `app/layout.tsx`
3. **Query Keys Structure**: Definir hierarquia de keys para cache
4. **Provider Setup**: Envolver aplicação com QueryClient

#### 2.2 API Routes para Planejamentos
1. **GET `/api/plannings`**: Listar planejamentos do usuário
2. **POST `/api/plannings`**: Criar novo planejamento
3. **GET `/api/plannings/[id]`**: Buscar planejamento específico
4. **PUT `/api/plannings/[id]`**: Atualizar planejamento
5. **DELETE `/api/plannings/[id]`**: Deletar planejamento

#### 2.3 Hooks Base TanStack Query
1. **usePlannings()**: Query para listagem
2. **usePlanning(id)**: Query para item específico
3. **useCreatePlanning()**: Mutation para criação
4. **useUpdatePlanning()**: Mutation para atualização
5. **useDeletePlanning()**: Mutation para deleção

**📋 Testável**: 
- Instalar packages sem erro
- API routes respondem corretamente
- Cache TanStack Query funcionando
- DevTools mostrando queries

**📄 Entregáveis**:
```
lib/react-query/
├── queryClient.ts
├── queryKeys.ts
└── hooks/
    ├── usePlannings.ts
    └── usePlanningMutations.ts

app/api/plannings/
├── route.ts
└── [id]/route.ts
```

---

### 🔄 Phase 3: Integração Real com Banco de Dados
**Objetivo**: Conectar frontend com dados reais via Prisma

#### 3.1 Atualizar Schema Prisma (se necessário)
1. **Verificar StrategicPlanning**: Campos compatíveis com PLAN-006
2. **Adicionar campos**: Se necessário para formulário completo
3. **Migrations**: Aplicar mudanças no banco

#### 3.2 Implementar API Routes Completas
1. **Validação**: Schemas Zod para entrada de dados
2. **Filtros**: Query params para busca/filtros
3. **Paginação**: Implementar paginação eficiente
4. **Relacionamentos**: Include Client nos queries

#### 3.3 Conectar Frontend com API Real
1. **Atualizar usePlannings**: Usar API real
2. **Página Principal**: Mostrar dados reais do banco
3. **Filtros Funcionais**: Conectar com query params
4. **Loading States**: Implementar skeletons

**📋 Testável**:
- Página `/planejamentos` mostra dados reais
- Filtros funcionam corretamente
- Loading states aparecem
- Paginação funcional

**📄 Entregáveis**:
```
app/planejamentos/page.tsx         # Conectado com dados reais
components/planning/
├── PlanningCard.tsx               # Card para listagem
├── PlanningFilters.tsx            # Componente de filtros
└── PlanningList.tsx               # Lista com loading states
```

---

### 🔄 Phase 4: Integração Modal Cliente Existente
**Objetivo**: Conectar seleção de cliente com modais já implementados

#### 4.1 Identificar Componentes Existentes
1. **ClientFlowModal**: Localizar modal de seleção/criação
2. **useClientFlow**: Hook de gerenciamento existente
3. **API Clientes**: Verificar endpoints disponíveis

#### 4.2 Integrar na Página de Criação
1. **Cliente Existente**: Conectar com modal de seleção
2. **Novo Cliente**: Conectar com modal de criação
3. **Callback Integration**: Receber cliente selecionado
4. **Estado Management**: Gerenciar transição cliente→formulário

#### 4.3 Funcionalidade Completa de Seleção
1. **Lista Real**: Buscar clientes do banco via API
2. **Busca/Filtros**: Implementar filtros no modal
3. **Criação Express**: Formulário rápido funcional
4. **Validação**: Cliente obrigatório para continuar

**📋 Testável**:
- Botão "Cliente Existente" abre modal funcional
- Lista de clientes reais aparece
- Criação de novo cliente funciona
- Transição para formulário com dados corretos

**📄 Entregáveis**:
```
app/planejamentos/novo/page.tsx    # Conectado com modais reais
components/planning/
├── ClientSelection.tsx            # Wrapper para modais existentes
└── PlanningWorkflow.tsx           # Orquestrador do fluxo
hooks/
└── usePlanningWorkflow.ts         # Hook do fluxo completo
```

---

### 🔄 Phase 5: Integração PlanningForm do PLAN-006
**Objetivo**: Integrar formulário completo de 4 abas com dados do cliente

#### 5.1 Import e Configuração do PlanningForm
1. **Verificar Imports**: Todos os componentes do PLAN-006
2. **Context Setup**: Preparar dados do cliente para formulário
3. **Inicialização**: Auto-preencher campos com dados do cliente
4. **Setor Mapping**: Mapear setor do cliente para perguntas dinâmicas

#### 5.2 Fluxo Completo Cliente→Formulário
1. **Context Transfer**: Passar dados do cliente selecionado
2. **Form Initialization**: Inicializar com contexto correto
3. **Breadcrumb**: Navegação entre cliente e formulário
4. **Auto-save**: Preservar progresso durante preenchimento

#### 5.3 Submissão e Salvamento
1. **Form Validation**: Validação completa antes submissão
2. **API Integration**: Enviar para API de criação
3. **Success Flow**: Redirecionamento após criação
4. **Error Handling**: Tratamento de erros com rollback

**📋 Testável**:
- Seleção de cliente inicia formulário corretamente
- 4 abas do formulário funcionais
- Dados do cliente pré-preenchidos corretamente
- Submissão cria planejamento no banco
- Redirecionamento para planejamento criado

**📄 Entregáveis**:
```
app/planejamentos/novo/page.tsx    # Formulário PLAN-006 integrado
components/planning/
├── PlanningFormWithClient.tsx     # Wrapper com contexto cliente
└── ClientFormContext.tsx          # Context provider
lib/planning/
└── clientContextMapping.ts        # Mapeamento cliente→formulário
```

---

### 🔄 Phase 6: Otimizações TanStack Query e Polimento
**Objetivo**: Implementar optimistic updates e otimizações de performance

#### 6.1 Optimistic Updates
1. **Create Planning**: Feedback imediato na criação
2. **Update Planning**: Atualizações instantâneas
3. **Delete Planning**: Remoção visual imediata
4. **Rollback Logic**: Reverter em caso de erro

#### 6.2 Cache Strategy Avançada
1. **Invalidation Rules**: Quando invalidar cada query
2. **Background Refetch**: Atualizações automáticas
3. **Stale Time**: Configurar tempo de cache
4. **Garbage Collection**: Limpeza automática

#### 6.3 UX Enhancements
1. **Loading Skeletons**: Esqueletos durante carregamento
2. **Error Boundaries**: Tratamento elegante de erros
3. **Retry Logic**: Tentativas automáticas
4. **Offline Support**: Funcionalidade básica offline

**📋 Testável**:
- Criação de planejamento mostra feedback imediato
- Lista atualiza automaticamente após mudanças
- Errors são tratados elegantemente
- Performance otimizada (< 2s carregamento)

**📄 Entregáveis**:
```
lib/react-query/
├── optimisticUpdates.ts           # Lógica de updates otimistas
├── cacheStrategies.ts             # Estratégias de cache
└── errorHandling.ts               # Tratamento de erros

components/ui/
├── PlanningCardSkeleton.tsx       # Loading skeleton
└── ErrorBoundary.tsx              # Boundary de erro
```

## 📊 Análise do Modelo Prisma

### Identificadores do Sistema
```typescript
interface SystemIds {
  // IDs Distintos e suas funções
  user: {
    id: string;           // UUID interno do User (PK)
    clerkId: string;      // ID externo do Clerk Auth (unique)
    email: string;        // Email único do usuário
  };
  
  client: {
    id: string;           // UUID interno do Client (PK)
    userId: string;       // FK para User.id (owner)
    // Sem clerkId - Cliente é entidade interna
  };
  
  planning: {
    id: string;           // UUID do StrategicPlanning (PK)
    clientId: string;     // FK para Client.id (required)
    userId: string;       // FK para User.id (owner)
    // Relacionamento: User → Client → StrategicPlanning
  };
}
```

### Modelo StrategicPlanning Atual
```typescript
model StrategicPlanning {
  id                 String         @id @default(cuid())
  title              String
  description        String?
  specificObjectives String?
  scope              String?
  successMetrics     String?
  budget             String?
  toneOfVoice        String?
  status             PlanningStatus @default(DRAFT)
  clientId           String         // ✅ FK para Client
  userId             String         // ✅ FK para User (owner)
  createdAt          DateTime       @default(now())
  updatedAt          DateTime
  
  // 🆕 CAMPOS PLAN-006 (JÁ EXISTENTES!)
  formDataJSON       Json?          // ✅ Dados completos do formulário
  clientSnapshot     Json?          // ✅ Snapshot dos dados do cliente
  
  // Relations
  PlanningTask       PlanningTask[]
  Client             Client         @relation(fields: [clientId], references: [id], onDelete: Cascade)
  User               User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Índices otimizados
  @@index([clientId])
  @@index([userId])
  @@index([userId, clientId])
  @@index([userId, status])
}
```

### Payload Structure (PLAN-006 Compatible)
```typescript
interface PlanningFormData {
  client_context: {
    id: string;                    // Client.id
    nome: string;                  // Client.name
    setor: string;                 // Client.industry
    categoria: string;             // Derived from industry
    richness_score: number;        // Client.richnessScore
    // outros campos do Client
  };
  form_data: {
    informacoes_basicas: BasicInfoData;
    detalhes_do_setor: SectorQuestionsData;
    marketing: MarketingMaturityData;
    comercial: CommercialMaturityData;
  };
  submission_metadata: {
    submitted_at: string;
    form_version: string;
    user_id: string;               // User.id (não clerkId)
    session_id: string;
  };
}

// Salvamento no Banco
interface StrategicPlanningCreate {
  title: string;                   // Gerado automaticamente
  clientId: string;                // Client.id selecionado
  userId: string;                  // User.id do owner atual
  formDataJSON: PlanningFormData;  // Todo o payload
  clientSnapshot: Client;          // Snapshot do cliente
  status: 'DRAFT';                 // Status inicial
}
```

## 🧪 Testing Strategy

### Componente Testing
- **ClientSelection**: Seleção e criação de clientes
- **PlanningWorkflow**: Transição cliente→formulário
- **Form Integration**: Dados do cliente no formulário
- **Navigation**: Fluxo completo sidebar→lista→criação
- **TanStack Query**: Mocking de queries e mutations

### Integration Testing
- **Modal Cliente**: Integração com modal existente
- **Form Validation**: Schema com dados do cliente
- **Auto-save**: Persistência durante o fluxo
- **Error Recovery**: Cenários de falha com rollback
- **Cache Consistency**: Validar invalidação correta

### E2E Testing Manual por Phase
```
Phase 2: Navegar para /planejamentos, verificar TanStack Query DevTools
Phase 3: Verificar dados reais, filtros funcionais, paginação
Phase 4: Testar seleção cliente, criação nova, transição
Phase 5: Fluxo completo cliente→formulário→submissão
Phase 6: Performance, optimistic updates, error handling
```

## 📈 Success Metrics

### Performance Targets
- **Página Principal**: Carregamento < 2s
- **Transição Cliente→Formulário**: < 500ms
- **Auto-save**: Debounced 1s, não bloqueia UI
- **Build Size**: Manter < 40kB
- **Cache Hit Rate**: >80% para queries de listagem

### Functionality Targets
- **Fluxo Completo**: 100% funcional cliente→formulário→submissão
- **Validação**: 0 erros TypeScript
- **Reuso**: >80% componentes PLAN-006 reutilizados
- **UX**: Transições suaves e feedback visual
- **Optimistic Updates**: Feedback imediato em 100% das mutations

### Quality Targets
- **Type Safety**: TypeScript strict mode
- **Error Handling**: Cenários cobertos com rollback automático
- **Documentation**: README atualizado
- **Testing**: Componentes principais testados
- **Cache Strategy**: Invalidação inteligente sem over-fetching

## 🚀 Integration com Sistema Existente

### Aproveitamento PLAN-006
- **16 Componentes**: Reutilização total dos componentes core
- **4 Abas**: Sistema completo de tabs funcionais
- **88 Perguntas**: Sistema dinâmico por setor
- **Validação**: Schema Zod robusto
- **Performance**: Otimizações já implementadas

### Modal Cliente Existente
- **Integração**: Usar modal de criação/seleção atual
- **Context Transfer**: Dados do cliente → formulário
- **Sector Mapping**: Categoria cliente → formulário dinâmico

### Database Schema (Compatível)
```typescript
// ✅ Schema já compatível com PLAN-006
model StrategicPlanning {
  id            String  @id @default(cuid())
  clientId      String  // FK para Client.id
  userId        String  // FK para User.id (owner)
  formDataJSON  Json?   // Todo o PlanningFormData
  clientSnapshot Json?  // Snapshot do Cliente na criação
  // ... outros campos existentes
}

// TanStack Query Types
interface PlanningWithClient extends StrategicPlanning {
  Client: Pick<Client, 'id' | 'name' | 'industry' | 'richnessScore'>;
  User: Pick<User, 'id' | 'firstName' | 'lastName'>;
}
```

## 📋 Deliverables por Phase

### ✅ Phase 1 - CONCLUÍDA
1. ✅ **Sidebar atualizado** - Navegação simplificada
2. ✅ **Página principal** - `/planejamentos` 
3. ✅ **Fluxo de criação** - `/planejamentos/novo`
4. ✅ **Documentação** - Phase 1 completa

### Phase 2 - Setup TanStack Query
1. **QueryClient Configuration** - Configuração global
2. **Query Keys Structure** - Hierarquia de keys
3. **API Routes** - Endpoints CRUD planejamentos
4. **Base Hooks** - usePlannings, mutations base

### Phase 3 - Banco de Dados Real
1. **API Implementation** - Conexão Prisma completa
2. **Frontend Integration** - Dados reais na UI
3. **Filtering System** - Filtros funcionais
4. **Loading States** - UX durante carregamento

### Phase 4 - Modal Cliente
1. **ClientSelection.tsx** - Integração com modais existentes
2. **PlanningWorkflow.tsx** - Orquestrador do fluxo
3. **useClientSelection.ts** - Hook de seleção
4. **Client Integration** - Seleção/criação funcional

### Phase 5 - PlanningForm PLAN-006
1. **Form Integration** - PlanningForm completo
2. **Client Context** - Dados cliente no formulário
3. **Validation** - Schema integrado
4. **Submission** - Salvamento no banco

### Phase 6 - Otimizações
1. **Optimistic Updates** - Feedback imediato
2. **Cache Strategy** - Performance otimizada
3. **Error Handling** - Recovery automático
4. **Documentation** - Guias de uso

---

## 🎯 Success Definition

O PLAN-007 será considerado **CONCLUÍDO COM SUCESSO** quando:

✅ **Navegação Simplificada**: Uma única aba "Planejamentos" no sidebar ✅ **CONCLUÍDO**  
✅ **Página Principal**: Lista planejamentos + botão "Novo Planejamento" funcional ✅ **CONCLUÍDO**  
⏳ **Fluxo Cliente→Formulário**: Seleção cliente → formulário inicializado  
⏳ **Integração PLAN-006**: 100% dos componentes formulário reutilizados  
⏳ **TanStack Query**: Cache inteligente e optimistic updates funcionais  
✅ **Validação Completa**: Zero erros TypeScript, build limpo ✅ **CONCLUÍDO**  
⏳ **UX Polida**: Transições suaves, feedback visual, performance otimizada  
⏳ **Prisma Integration**: Compatibilidade total com modelo existente  

**Meta**: Sistema de planejamento **unificado, intuitivo, performante e otimizado** aproveitando todo o investimento do PLAN-006 + poder do TanStack Query! 🚀

**Status Atual**: ✅ **Phase 1 COMPLETA** | 🔄 **Phase 2-6 PENDENTES** | �� **16% Concluído**
