---
id: plan-012-commercial-proposals
title: Módulo de Propostas Comerciais com IA Externa
createdAt: 2025-01-29
author: theplayzzz
status: draft
---

## 🧩 Scope

Implementação do módulo de propostas comerciais seguindo o padrão estabelecido no sistema de planejamento estratégico. O sistema permitirá criar, organizar e gerenciar propostas comerciais através de um formulário multi-step que coleta informações básicas e envia para um agente IA externo via webhook. A proposta gerada será armazenada e listada no sistema, mantendo a mesma experiência do usuário já familiar com o módulo de planejamento.

### Arquivos de Referência para Análise:
- `/docs/Flowchart Vortex.mmd` - Seção "MÓDULO AVANÇADO DE VENDAS" (linha 165)
- `/docs/PRD Vortex Voult.md` - Seção 2.5 "Módulo de Vendas com IA" (linha 125)
- `/prisma/schema.prisma` - Modelo CommercialProposal (linha 112)
- `/app/planejamentos/` - Estrutura de referência para páginas
- `/app/planejamento/novo/` - Fluxo de criação para replicar
- `/components/planning/` - Componentes para inspiração
- `/hooks/use-client-flow.ts` - Hook existente para reutilizar

## ✅ Functional Requirements

### Requisitos Funcionais Principais:
- **Área de Listagem de Propostas**: Dashboard com todas as propostas organizadas por status
- **Botão "Nova Proposta"**: Seguindo padrão visual do sistema
- **Client Flow Integration**: Reutilizar modal existente para seleção/criação de cliente
- **Formulário Multi-Step**: Coletar informações básicas em 3 abas
- **Integração Webhook**: Enviar dados estruturados para agente IA externo
- **Recepção e Armazenamento**: Salvar resposta da IA no banco
- **Status Management**: DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, NEGOTIATION, ARCHIVED
- **Versionamento Básico**: Incremento automático de versão em updates
- **Dashboard Widget**: Integração com dashboard principal

### Fluxo Detalhado:
1. Dashboard → Botão "Nova Proposta"
2. Client Flow → Selecionar/Criar cliente (obrigatório)
3. Formulário multi-step → Coleta informações específicas
4. Payload estruturado → Enviado para IA externa
5. Response handling → Salva resultado no banco
6. Listagem → Mostra propostas criadas

## 📚 Guidelines & Packages

### Tecnologias Existentes (Manter):
- **Next.js 14** com App Router
- **TypeScript** para type safety
- **Tailwind CSS** com design tokens existentes
- **Prisma ORM** para database
- **Supabase** PostgreSQL
- **TanStack Query** para state management
- **Zod** para validações
- **React Hook Form** para formulários
- **Clerk** para autenticação

### Padrões a Seguir:
- Reutilizar `useClientFlow` hook existente
- Seguir estrutura de pastas do módulo planning
- Manter design system (cores: seasalt, eerie-black, sgbus-green, periwinkle)
- Usar componentes UI existentes (Button, Modal, etc.)
- Aplicar mesma lógica de auto-save do planning

### Não Adicionar:
- Novas bibliotecas de UI
- Novos state managers
- Sistemas de export complexos (deixar para futuro)

## 🔐 Threat Model (Stub)

- **Webhook Security**: Validar origem e autenticação do webhook
- **Data Validation**: Sanitizar conteúdo HTML recebido da IA
- **Rate Limiting**: Prevenir spam de criação de propostas
- **RLS Policies**: Já implementadas no Supabase (verificar funcionamento)
- **Client Access**: Garantir que usuário só vê suas próprias propostas
- **Version Control**: Prevenir edições simultâneas

## 🔢 Execution Plan

### 📋 **IMPORTANTE: Atualização do Progress**
Durante a execução, atualizar este documento (`plan-012-commercial-proposals.md`) com:
- [ ] Marcar tarefas concluídas com ✅
- [ ] Adicionar seção "## 📊 Progress Log" no final
- [ ] Documentar desafios encontrados
- [ ] Registrar decisões técnicas tomadas
- [ ] Atualizar estimativas se necessário

### **FASE 0: Análise e Preparação (1 dia)**

#### 0.1 Análise do Banco de Dados
- [x] Verificar modelo `CommercialProposal` no Prisma schema
- [x] Confirmar relacionamentos com `Client` e `User`
- [x] Validar enum `ProposalStatus` e seus valores
- [x] Verificar políticas RLS implementadas
- [x] Testar migrations existentes
- [x] Documentar campos disponíveis e tipos

#### 0.2 Análise do Código Existente
- [x] Estudar fluxo completo de `/app/planejamento/novo/`
- [x] Entender `useClientFlow` hook implementation
- [x] Analisar estrutura de tabs do PlanningForm
- [x] Verificar padrões de validação com Zod
- [x] Documentar APIs existentes para referência

### **FASE 1: Frontend - Estrutura Base (2-3 dias)**

#### 1.1 Estrutura de Páginas
```typescript
/app/
├── propostas/              # ← Espelho de /planejamentos/
│   ├── page.tsx           # Lista de propostas
│   └── nova/              # ← Espelho de /planejamento/novo/
│       └── page.tsx       # Criação nova proposta
```

**Tarefas:**
- [x] Criar `/app/propostas/page.tsx` com layout base
- [x] Implementar header com botão "Nova Proposta"
- [x] Criar grid de stats cards (Total, Em Andamento, Enviadas, Aprovadas)
- [x] Preparar estrutura para lista de propostas (skeleton)
- [x] Criar `/app/propostas/nova/page.tsx` com container básico
- [x] Adicionar navegação ao menu principal

#### 1.2 Componentes Base
```typescript
/components/proposals/
├── ProposalCard.tsx       # Card individual para lista
├── ProposalsList.tsx      # Container da lista
├── ProposalStatusBadge.tsx # Badge colorido de status
└── ProposalProgress.tsx   # Indicador de progresso do form
```

**Tarefas:**
- [x] Criar `ProposalCard` seguindo design do `PlanningCard`
- [x] Implementar `ProposalStatusBadge` com cores por status
- [x] Criar `ProposalsList` com grid responsivo
- [x] Adaptar `FormProgress` para `ProposalProgress`
- [x] Adicionar loading states e empty states

### **FASE 2: Frontend - Formulário Multi-Step (3-4 dias)**

#### 2.1 Configurações e Schemas
```typescript
/lib/proposals/
├── formSchema.ts          # Validações Zod
├── proposalConfig.ts      # Tipos e opções
└── types.ts              # TypeScript interfaces
```

**Estrutura do proposalConfig.ts:**
```typescript
export const TIPOS_PROPOSTA = [
  "Consultoria Estratégica",
  "Implementação de Marketing",
  "Gestão de Campanhas", 
  "Desenvolvimento Web",
  "Auditoria e Análise",
  "Treinamento e Capacitação",
  "Outro"
] as const;

export const MODALIDADES_ENTREGA = [
  "Projeto único",
  "Retainer mensal", 
  "Pacote de horas",
  "Performance-based",
  "Híbrido"
] as const;
```

**Tarefas:**
- [ ] Criar tipos e enums em `proposalConfig.ts`
- [ ] Implementar schema de validação com Zod
- [ ] Definir interfaces TypeScript
- [ ] Criar funções helpers para options

#### 2.2 Componente Principal e Tabs
```typescript
/components/proposals/
├── ProposalForm.tsx       # Container principal
└── tabs/
    ├── BasicInfoTab.tsx   # Informações básicas
    ├── ScopeTab.tsx       # Escopo de serviços
    └── CommercialTab.tsx  # Contexto comercial
```

**ProposalForm.tsx - Estrutura:**
```typescript
export function ProposalForm({ client }: { client: Client }) {
  const [currentTab, setCurrentTab] = useState(0);
  const [formData, setFormData] = useState<ProposalFormData>({});
  
  const tabs = [
    { id: 'basic', title: 'Informações Básicas', component: BasicInfoTab },
    { id: 'scope', title: 'Escopo de Serviços', component: ScopeTab },
    { id: 'commercial', title: 'Contexto Comercial', component: CommercialTab }
  ];
}
```

**Tarefas:**
- [ ] Criar `ProposalForm` container com state management
- [ ] Implementar navegação entre tabs
- [ ] Criar `BasicInfoTab` com campos:
  - Título da Proposta
  - Tipo de Proposta (dropdown)
  - Descrição/Objetivo
  - Prazo Estimado
- [ ] Criar `ScopeTab` com campos:
  - Modalidade de Entrega
  - Serviços Incluídos (checkbox múltiplo)
  - Requisitos Especiais
- [ ] Criar `CommercialTab` com campos:
  - Orçamento Estimado (opcional)
  - Concorrentes Considerados
  - Urgência do Projeto
  - Tomador de Decisão
- [ ] Implementar validação por aba
- [ ] Adicionar indicador de progresso
- [ ] Criar preview antes do envio

#### 2.3 Integração Client Flow
**Tarefas:**
- [ ] Integrar `useClientFlow` em `/app/propostas/nova/page.tsx`
- [ ] Passar cliente selecionado para `ProposalForm`
- [ ] Exibir `ClientHeader` com `RichnessScoreBadge`
- [ ] Implementar redirect se não houver cliente

### **FASE 3: Backend - APIs e Integração (3-4 dias)**

#### 3.1 Estrutura de APIs
```typescript
/app/api/proposals/
├── route.ts              # GET (lista), POST (criar)
├── generate/route.ts     # POST webhook para IA
└── [id]/
    └── route.ts         # GET, PUT, DELETE individual
```

#### 3.2 API de Listagem e CRUD
**GET /api/proposals:**
```typescript
export async function GET(request: Request) {
  const { userId } = auth();
  
  const proposals = await prisma.commercialProposal.findMany({
    where: { userId },
    include: { client: true },
    orderBy: { createdAt: 'desc' }
  });
  
  return NextResponse.json(proposals);
}
```

**Tarefas:**
- [ ] Implementar GET para listar propostas
- [ ] Criar POST para salvar proposta inicial
- [ ] Implementar GET by ID
- [ ] Criar PUT para updates
- [ ] Implementar DELETE (soft delete?)
- [ ] Adicionar paginação na listagem

#### 3.3 Webhook Integration
**Estrutura do Payload:**
```typescript
interface ProposalWebhookPayload {
  proposal_id: string;
  user_info: {
    id: string;
    name: string;
    email: string;
  };
  client_info: {
    id: string;
    name: string;
    industry: string;
    richnessScore: number;
    businessDetails?: string;
    // Todos dados relevantes do cliente
  };
  proposal_requirements: {
    titulo_proposta: string;
    tipo_proposta: string;
    modalidade: string;
    prazo_estimado: string;
    servicos_incluidos: string[];
    orcamento_estimado?: string;
    urgencia_projeto: string;
    contexto_adicional: string;
  };
}
```

**POST /api/proposals/generate:**
```typescript
export async function POST(request: Request) {
  // 1. Validar dados
  // 2. Criar registro inicial
  // 3. Preparar payload
  // 4. Enviar para webhook
  // 5. Processar resposta
  // 6. Atualizar banco
  // 7. Retornar ID
}
```

**Tarefas:**
- [ ] Implementar endpoint `/api/proposals/generate`
- [ ] Criar função `buildProposalPayload`
- [ ] Configurar variável ambiente `PROPOSAL_WEBHOOK_URL`
- [ ] Implementar timeout e retry logic
- [ ] Adicionar error handling robusto
- [ ] Criar logs para debugging
- [ ] Implementar webhook response handler

#### 3.4 React Query Hooks
```typescript
/hooks/use-proposals.ts
```

**Tarefas:**
- [ ] Criar `useProposals` para listagem
- [ ] Implementar `useProposal` para detalhes
- [ ] Criar `useCreateProposal` com optimistic update
- [ ] Implementar `useUpdateProposal`
- [ ] Criar `useDeleteProposal`
- [ ] Adicionar cache invalidation

### **FASE 4: Integração e Polish (2-3 dias)**

#### 4.1 Dashboard Integration
**Widget para Dashboard Principal:**
```typescript
const PropostasWidget = () => {
  const { data: propostas } = useProposals({ limit: 5 });
  
  return (
    <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
      <h3>Propostas Recentes</h3>
      {/* Lista resumida */}
    </div>
  );
};
```

**Tarefas:**
- [ ] Criar widget para dashboard
- [ ] Adicionar ao `/app/page.tsx`
- [ ] Implementar navegação do widget
- [ ] Adicionar contadores no header

#### 4.2 Melhorias UX
**Tarefas:**
- [ ] Implementar loading states consistentes
- [ ] Adicionar animações de transição
- [ ] Criar toasts de sucesso/erro
- [ ] Implementar confirmação antes de deletar
- [ ] Adicionar breadcrumbs nas páginas internas
- [ ] Garantir responsividade mobile
- [ ] Implementar keyboard navigation

#### 4.3 Testes e Ajustes
**Tarefas:**
- [ ] Testar fluxo completo de criação
- [ ] Validar integração com webhook
- [ ] Verificar permissões e RLS
- [ ] Testar edge cases
- [ ] Ajustar performance
- [ ] Documentar processo

## Execution test

**Configuração de Teste**:
- **Login**: play-felix@hotmail.com  
- **Senha**: 123Senha...
- **Ambiente**: Frontend de desenvolvimento/produção

### Checklist de Testes:

1. **Teste de Navegação:**
   - [ ] Menu lateral mostra "Propostas"
   - [ ] Navegação para `/propostas` funciona
   - [ ] Botão "Nova Proposta" visível e funcional

2. **Teste Client Flow:**
   - [ ] Modal de seleção de cliente abre
   - [ ] Possível criar novo cliente inline
   - [ ] Cliente selecionado aparece no header
   - [ ] RichnessScore badge visível

3. **Teste Formulário:**
   - [ ] Todas as 3 abas carregam
   - [ ] Validações funcionam por aba
   - [ ] Progress indicator atualiza
   - [ ] Preview mostra dados corretos

4. **Teste Webhook:**
   - [ ] Payload enviado corretamente
   - [ ] Resposta processada
   - [ ] Proposta salva no banco
   - [ ] Redirect para lista funciona

5. **Teste Listagem:**
   - [ ] Propostas aparecem na lista
   - [ ] Filtros funcionam
   - [ ] Status badges corretos
   - [ ] Cards mostram informações

6. **Teste Dashboard:**
   - [ ] Widget aparece no dashboard
   - [ ] Contadores corretos
   - [ ] Links funcionam

## 📊 Progress Log

### Data: 2025-01-29
- **Tarefas Concluídas:**
  - ✅ FASE 0 COMPLETA - Análise do banco de dados e código existente
  - ✅ Validação do modelo CommercialProposal no Prisma schema
  - ✅ Confirmação dos relacionamentos Client/User
  - ✅ Análise do enum ProposalStatus (DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, NEGOTIATION, ARCHIVED)
  - ✅ Estudo do padrão de páginas em `/app/planejamentos/` e `/app/planejamentos/novo/`
  - ✅ Análise do hook `useClientFlow` para reutilização
  - ✅ Estudo do componente `PlanningCard` para padrão visual
  - ✅ Verificação da estrutura de componentes em `/components/planning/`
  - ✅ FASE 1 COMPLETA - Estrutura Base do Frontend
  - ✅ Criação das páginas `/app/propostas/page.tsx` e `/app/propostas/nova/page.tsx`
  - ✅ Implementação de todos os componentes base: ProposalCard, ProposalsList, ProposalStatusBadge, ProposalProgress
  - ✅ Adição do menu "Propostas" no sidebar com ícone FileCheck
  - ✅ Integração do useClientFlow na página de nova proposta
  - ✅ Cards de estatísticas funcionais com dados mockados
  - ✅ Lista de propostas funcional com dados de teste

- **Descobertas Técnicas:**
  - O modelo CommercialProposal já está bem estruturado no Prisma
  - O hook useClientFlow é perfeitamente reutilizável
  - Estrutura de páginas segue padrão: `/propostas/` (lista) e `/propostas/nova/` (criação)
  - PlanningCard fornece excelente referência para ProposalCard
  - Sistema de cores já estabelecido: seasalt, eerie-black, sgbus-green, periwinkle
  - Componentes de proposals seguem perfeitamente o padrão visual estabelecido
  - RichnessScoreBadge é reutilizável entre módulos
  - Sidebar expansível já preparado para novos menus

- **Próximos Passos:**
  - Fases 0 e 1 concluídas conforme solicitado
  - Estrutura sólida criada para as próximas fases
  - Pronto para implementar Fase 2 (Formulário Multi-Step) quando necessário