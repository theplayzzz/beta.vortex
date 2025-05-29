---
id: plan-007
title: Reformulação da Área de Planejamento - Integração Cliente-Formulário
createdAt: 2025-05-29
author: theplayzzz
status: draft
---

## 🧩 Scope

Reformular completamente a área de planejamento removendo abas desnecessárias e criando um fluxo integrado onde:
1. **Sidebar**: Uma única aba "Planejamentos"
2. **Página Principal**: Lista todos os planejamentos existentes com botão "Novo Planejamento"
3. **Fluxo de Criação**: Cliente → Formulário Multi-Etapas
4. **Integração**: Usar todo o sistema de formulário do PLAN-006 concluído
5. **Otimização**: TanStack Query para operações CRUD e cache inteligente

## ✅ Functional Requirements

### 1. Estrutura de Navegação
- **Remover**: Aba de "lista refinada" do sidebar
- **Manter**: Única aba "Planejamentos" no sidebar
- **Página Principal**: `/planejamentos` - lista completa de planejamentos

### 2. Fluxo de Criação de Planejamento
- **Trigger**: Botão "Novo Planejamento" na página principal
- **Step 1**: Modal/Página de seleção/criação de cliente
- **Step 2**: Inicialização do formulário multi-etapas com cliente selecionado
- **Formulário**: Sistema completo do PLAN-006 (4 abas integradas)

### 3. Integração Cliente-Formulário
- **Cliente Existente**: Usar modal de seleção existente
- **Cliente Novo**: Usar modal de criação existente
- **Categoria/Setor**: Cliente define qual formulário dinâmico será usado
- **Context Transfer**: Dados do cliente alimentam automaticamente o formulário

### 4. Sistema de Formulário (Aproveitando PLAN-006)
- **Componente Principal**: `PlanningForm.tsx` já implementado
- **4 Abas Funcionais**: Informações Básicas, Detalhes do Setor, Marketing, Comercial
- **88 Perguntas Dinâmicas**: Por setor específico
- **Validação Robusta**: React Hook Form + Zod
- **Auto-save**: localStorage para recuperação

### 5. Otimizações TanStack Query
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

## 🔢 Execution Plan

### Phase 1: Reestruturação da Navegação
1. **Atualizar Sidebar**: Remover abas desnecessárias
2. **Configurar Rota**: `/planejamentos` como página principal
3. **Página Principal**: Lista de planejamentos + botão "Novo Planejamento"
4. **Navegação**: Integrar com routing existente

### Phase 2: Setup TanStack Query
1. **QueryClient Setup**: Configurar cliente global
2. **Query Keys**: Definir estrutura de keys para cache
3. **Base Queries**: Queries para listagem de planejamentos
4. **Base Mutations**: Mutations para CRUD operations

### Phase 3: Fluxo Cliente-Formulário
1. **Modal Integration**: Conectar modal cliente existente
2. **Client Selection**: Componente de seleção/criação
3. **Data Transfer**: Cliente → Context do formulário
4. **State Bridge**: Hook para transição cliente→formulário

### Phase 4: Integração Formulário PLAN-006
1. **Component Import**: Integrar PlanningForm.tsx
2. **Client Context**: Alimentar dados do cliente selecionado
3. **Sector Detection**: Auto-configurar formulário por setor
4. **Validation**: Adaptar schema para novo fluxo

### Phase 5: Otimizações TanStack Query
1. **Optimistic Updates**: Feedback imediato para mutations
2. **Cache Strategy**: Estratégia de invalidação inteligente
3. **Error Handling**: Recovery automático em falhas
4. **Performance**: Otimizar queries e mutations

### Phase 6: Produção e Documentação
1. **API Integration**: Endpoints para salvar planejamentos
2. **Database**: Conectar com schema Prisma
3. **Documentation**: Atualizar README
4. **Deployment**: Build e testes finais

## 📋 Estrutura de Arquivos Planejada

### Novos Componentes
```
components/planning/
├── PlanningForm.tsx              # [EXISTENTE] Do PLAN-006
├── ClientSelection.tsx           # [NOVO] Seleção/criação cliente
├── PlanningWorkflow.tsx          # [NOVO] Orquestrador cliente→formulário
└── hooks/
    ├── usePlanningForm.ts        # [EXISTENTE] Do PLAN-006
    ├── useClientSelection.ts     # [NOVO] Gerenciar seleção cliente
    ├── usePlanningWorkflow.ts    # [NOVO] Fluxo completo
    ├── usePlannings.ts           # [NOVO] TanStack Query hooks
    └── usePlanningMutations.ts   # [NOVO] Mutations optimizadas

app/
├── planejamentos/
│   ├── page.tsx                  # [NOVO] Página principal
│   └── novo/
│       └── page.tsx              # [NOVO] Fluxo cliente→formulário

lib/
├── react-query/
│   ├── queryClient.ts            # [NOVO] Setup QueryClient
│   ├── queryKeys.ts              # [NOVO] Query keys structure
│   └── mutations.ts              # [NOVO] Mutations factory
```

### TanStack Query Structure
```typescript
// Query Keys Hierarchy
export const queryKeys = {
  plannings: {
    all: ['plannings'] as const,
    lists: () => [...queryKeys.plannings.all, 'list'] as const,
    list: (filters: PlanningFilters) => [...queryKeys.plannings.lists(), { filters }] as const,
    details: () => [...queryKeys.plannings.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.plannings.details(), id] as const,
  },
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters: ClientFilters) => [...queryKeys.clients.lists(), { filters }] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
  },
} as const;
```

## 🎯 User Experience Flow

### 1. Navegação Principal
```
Sidebar → "Planejamentos" → /planejamentos
```

### 2. Página de Planejamentos
```
Lista de Planejamentos Existentes
┌─────────────────────────────────────┐
│ [+ Novo Planejamento]               │
│                                     │
│ 📊 Planejamento - Cliente A         │
│ 📊 Planejamento - Cliente B         │
│ 📊 Planejamento - Cliente C         │
└─────────────────────────────────────┘
```

### 3. Fluxo de Criação
```
[Novo Planejamento] 
    ↓
[Modal Seleção/Criação Cliente]
    ↓
[Cliente Selecionado]
    ↓
[Formulário Multi-Etapas Inicializado]
    ↓
[4 Abas: Básico → Setor → Marketing → Comercial]
    ↓
[Submissão e Salvamento]
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

## 🔄 TanStack Query Optimizations

### 1. Queries Structure
```typescript
// hooks/usePlannings.ts
export const usePlannings = (filters?: PlanningFilters) => {
  return useQuery({
    queryKey: queryKeys.plannings.list(filters || {}),
    queryFn: () => api.plannings.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,   // 10 minutos
  });
};

export const usePlanning = (id: string) => {
  return useQuery({
    queryKey: queryKeys.plannings.detail(id),
    queryFn: () => api.plannings.get(id),
    enabled: !!id,
  });
};
```

### 2. Optimistic Mutations
```typescript
// hooks/usePlanningMutations.ts
export const useCreatePlanning = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: PlanningFormData) => api.plannings.create(data),
    onMutate: async (newPlanning) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.plannings.lists() 
      });

      // Snapshot previous value
      const previousPlannings = queryClient.getQueryData(
        queryKeys.plannings.list({})
      );

      // Optimistically update cache
      const optimisticPlanning = {
        id: `temp-${Date.now()}`,
        title: `Planejamento - ${newPlanning.client_context.nome}`,
        status: 'DRAFT' as const,
        clientId: newPlanning.client_context.id,
        createdAt: new Date().toISOString(),
        Client: {
          id: newPlanning.client_context.id,
          name: newPlanning.client_context.nome,
          industry: newPlanning.client_context.setor,
        },
        ...newPlanning,
      };

      queryClient.setQueryData(
        queryKeys.plannings.list({}), 
        (old: any) => old ? [optimisticPlanning, ...old] : [optimisticPlanning]
      );

      return { previousPlannings };
    },
    onError: (err, newPlanning, context) => {
      // Rollback on error
      queryClient.setQueryData(
        queryKeys.plannings.list({}),
        context?.previousPlannings
      );
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.plannings.lists() 
      });
    },
  });
};
```

### 3. Cache Integration Strategy
```typescript
// lib/react-query/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutos default
      gcTime: 10 * 60 * 1000,       // 10 minutos GC
      retry: (failureCount, error) => {
        // Custom retry logic
        if (error?.status === 404) return false;
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 1,
      gcTime: 5 * 60 * 1000,        // 5 minutos para mutations
    },
  },
});
```

### 4. Form Integration with TanStack Query
```typescript
// hooks/usePlanningWorkflow.ts
export const usePlanningWorkflow = () => {
  const [step, setStep] = useState<'client' | 'form'>('client');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const createPlanningMutation = useCreatePlanning();
  
  const handleClientSelected = (client: Client) => {
    setSelectedClient(client);
    setStep('form');
  };
  
  const handleFormSubmit = async (formData: PlanningFormData) => {
    try {
      const result = await createPlanningMutation.mutateAsync({
        ...formData,
        client_context: {
          id: selectedClient!.id,
          nome: selectedClient!.name,
          setor: selectedClient!.industry || '',
          categoria: selectedClient!.industry || '',
          richness_score: selectedClient!.richnessScore,
        },
      });
      
      // Navigate to created planning
      router.push(`/planejamentos/${result.id}`);
    } catch (error) {
      console.error('Failed to create planning:', error);
    }
  };
  
  return {
    step,
    selectedClient,
    handleClientSelected,
    handleFormSubmit,
    isCreating: createPlanningMutation.isPending,
    createError: createPlanningMutation.error,
  };
};
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

### E2E Testing
```
1. Navegar para /planejamentos
2. Verificar carregamento da lista (TanStack Query)
3. Clicar "Novo Planejamento"
4. Selecionar cliente existente
5. Verificar formulário inicializado com dados corretos
6. Preencher 4 abas do formulário
7. Submeter e verificar optimistic update
8. Verificar salvamento final e cache update
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

### API Routes Structure
```typescript
// app/api/plannings/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = Object.fromEntries(searchParams);
  
  const plannings = await prisma.strategicPlanning.findMany({
    where: {
      userId: await getCurrentUserId(), // User.id (não clerkId)
      ...buildFilters(filters),
    },
    include: {
      Client: {
        select: {
          id: true,
          name: true,
          industry: true,
          richnessScore: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  return Response.json(plannings);
}

export async function POST(request: Request) {
  const data: PlanningFormData = await request.json();
  
  const planning = await prisma.strategicPlanning.create({
    data: {
      title: `Planejamento - ${data.client_context.nome}`,
      clientId: data.client_context.id,
      userId: await getCurrentUserId(), // User.id
      formDataJSON: data,
      clientSnapshot: await getClientSnapshot(data.client_context.id),
      status: 'DRAFT',
    },
    include: {
      Client: true,
    },
  });
  
  return Response.json(planning);
}
```

## 📋 Deliverables

### Components
1. **ClientSelection.tsx** - Componente seleção/criação cliente
2. **PlanningWorkflow.tsx** - Orquestrador fluxo completo
3. **useClientSelection.ts** - Hook gerenciamento cliente
4. **usePlanningWorkflow.ts** - Hook fluxo completo
5. **usePlannings.ts** - TanStack Query hooks
6. **usePlanningMutations.ts** - Mutations otimizadas

### Pages
1. **`/planejamentos`** - Página principal lista planejamentos
2. **`/planejamentos/novo`** - Fluxo criação cliente→formulário

### TanStack Query Infrastructure
1. **QueryClient Setup** - Configuração global
2. **Query Keys** - Estrutura hierárquica de keys
3. **Mutations Factory** - Factory para mutations CRUD
4. **Cache Strategy** - Estratégia de invalidação

### Integration
1. **Sidebar Update** - Remoção abas, única aba planejamentos
2. **Modal Integration** - Cliente existente → formulário
3. **Form Context** - Dados cliente no PlanningForm
4. **API Routes** - Endpoints salvar planejamentos

### Documentation
1. **README.md** - Documentação fluxo completo
2. **TANSTACK-INTEGRATION.md** - Como usar TanStack Query
3. **API.md** - Endpoints e payload structure

---

## 🎯 Success Definition

O PLAN-007 será considerado **CONCLUÍDO COM SUCESSO** quando:

✅ **Navegação Simplificada**: Uma única aba "Planejamentos" no sidebar  
✅ **Página Principal**: Lista planejamentos + botão "Novo Planejamento" funcional  
✅ **Fluxo Cliente→Formulário**: Seleção cliente → formulário inicializado  
✅ **Integração PLAN-006**: 100% dos componentes formulário reutilizados  
✅ **TanStack Query**: Cache inteligente e optimistic updates funcionais  
✅ **Validação Completa**: Zero erros TypeScript, build limpo  
✅ **UX Polida**: Transições suaves, feedback visual, performance otimizada  
✅ **Prisma Integration**: Compatibilidade total com modelo existente  

**Meta**: Sistema de planejamento **unificado, intuitivo, performante e otimizado** aproveitando todo o investimento do PLAN-006 + poder do TanStack Query! 🚀
