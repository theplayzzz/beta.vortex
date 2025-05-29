# Plan 006: Planejamento Refinado com IA e Sistema de Aprovação

---
id: plan-006
title: Sistema de Refinamento com IA, Aprovação e Gestão de Listas (Next.js & IA Integration)
createdAt: 2025-05-28
author: theplayzzz
status: draft
---

## 📝 General Project Guidelines
- **No Automatic Commits**: All code changes must be manually reviewed and committed.
- **ID Management**: Extreme care must be taken to distinguish between different ID types baseando-se no mapeamento completo criado no plan-005.
- **Existing `.env` File**: Sempre adicionar novas variáveis ao arquivo existente, incluindo URLs de webhook e configurações de crédito.
- **Flowchart as Source of Truth**: Manter alinhamento com arquitetura estabelecida e dados estruturados do plan-005.

## 🧩 Scope

Implementar o sistema completo de geração de backlog por IA, interface de aprovação e refinamento de tarefas, criação de listas refinadas, e gestão avançada do sistema de créditos. Esta fase constrói sobre a infraestrutura criada no plan 006 007 008 , adicionando processamento inteligente, webhooks, sistema de aprovação interativo e criação final de tarefas executáveis.

### Componentes Desta Fase:
- **Integração com IA Externa**: 
  - Webhooks para geração de backlog inicial
  - Sistema de refinamento individual de tarefas
  - Processamento de listas refinadas
  - Validação e segurança de callbacks
- **Sistema de Créditos**: 
  - Gestão completa de consumo (10 créditos para backlog, 10 para refinamento)
  - Validação de saldo antes de operações
  - Transações atômicas e auditáveis
  - Histórico detalhado de consumo
- **Interface de Aprovação**: 
  - Sistema interativo para revisar tarefas geradas
  - Editor em tempo real para modificações
  - Seleção e priorização de tarefas
  - Refinamento individual com contexto adicional
- **Refinamento Individual**: 
  - Capacidade de refinar tarefas específicas
  - Adição de contexto personalizado
  - Reprocessamento por IA
  - Histórico de modificações
- **Criação de Listas Refinadas**: 
  - Conversão para `PlanningTask` executáveis
  - Output detalhado em markdown
  - Integração com sistema existente
  - Métricas de qualidade
- **Sistema de Auditoria**: 
  - Logs completos de modificações
  - Timeline visual do processo
  - Métricas de uso e qualidade
  - Feedback para melhoria contínua

## ✅ Functional Requirements

### 1. Análise e Validação da Base Criada no Plan-005

#### 1.1 Verificação de Estruturas
- **Mapeamento de IDs**: Confirmar implementação correta de `clientId`, `planningId`, `userId`
- **Validação de Schemas**: Verificar modelos Prisma e tipos TypeScript
- **Teste de Relacionamentos**: Validar integridade Client-StrategicPlanning
- **Revisão de APIs**: Confirmar endpoints básicos funcionando

#### 1.2 Validação do Formulário
- **Teste das 4 Abas**: Confirmar funcionamento do formulário multi-etapas
- **Validação de Campos**: Verificar regras de validação implementadas
- **Persistência**: Testar salvamento local e no banco
- **Integração Cliente**: Confirmar linkagem obrigatória funcionando

#### 1.3 Preparação para IA
- **Estruturas JSON**: Validar formato de `formDataJSON` e `clientSnapshot`
- **Webhooks**: Confirmar URLs configuradas no `.env`
- **Status**: Verificar enum `PlanningStatus` preparado
- **Segurança**: Validar proteções implementadas

### 2. Sistema de Gestão de Créditos Completo

#### 2.1 Configuração de Custos e Ambiente
- **Variáveis de ambiente** (adicionar ao `.env` existente):
  ```env
  # Webhooks
  PLANNING_WEBHOOK_URL=https://webhook.lucasfelix.com/webhook/vortex-planejamento-beta-2025
  REFINED_LIST_WEBHOOK_URL=https://webhook.lucasfelix.com/webhook/vortex-refinada-beta-2025
  
  # Custos de crédito
  COST_PLANNING_BACKLOG_VISIBLE=10
  COST_REFINED_LIST_VISIBLE=10
  COST_INDIVIDUAL_REFINEMENT=2
  
  # Webhook Security
  WEBHOOK_SECRET=sua_chave_secreta_aqui
  WEBHOOK_TIMEOUT=30000
  WEBHOOK_MAX_RETRIES=3
  ```

#### 2.2 Modelo de Transações de Crédito
- **Atualizar Schema Prisma**:
  ```prisma
  enum CreditTransactionType {
    // Tipos existentes...
    CONSUMPTION_PLANNING_BACKLOG_VISIBLE
    CONSUMPTION_REFINED_LIST_VISIBLE
    CONSUMPTION_INDIVIDUAL_REFINEMENT
    REFUND_FAILED_PROCESSING
  }
  
  model CreditTransaction {
    id          String   @id @default(cuid())
    userId      String
    type        CreditTransactionType
    amount      Int
    planningId  String?
    taskId      String?
    status      TransactionStatus @default(PENDING)
    metadata    Json?
    createdAt   DateTime @default(now())
    completedAt DateTime?
    
    user     User @relation(fields: [userId], references: [id])
    planning StrategicPlanning? @relation(fields: [planningId], references: [id])
    
    @@index([userId, type])
    @@index([planningId])
  }
  
  enum TransactionStatus {
    PENDING
    COMPLETED
    FAILED
    REFUNDED
  }
  ```

#### 2.3 Sistema de Validação e Débito
- **Verificação Prévia**:
  ```typescript
  async function validateCredits(userId: string, operationType: CreditTransactionType): Promise<boolean> {
    const costs = {
      CONSUMPTION_PLANNING_BACKLOG_VISIBLE: 10,
      CONSUMPTION_REFINED_LIST_VISIBLE: 10,
      CONSUMPTION_INDIVIDUAL_REFINEMENT: 2
    };
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true }
    });
    
    return user?.creditBalance >= costs[operationType];
  }
  ```

- **Débito Atômico**:
  ```typescript
  async function debitCredits(userId: string, planningId: string, type: CreditTransactionType) {
    return await prisma.$transaction(async (tx) => {
      // Criar transação pendente
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          planningId,
          type,
          amount: -costs[type],
          status: 'PENDING'
        }
      });
      
      // Atualizar saldo do usuário
      const user = await tx.user.update({
        where: { id: userId },
        data: { creditBalance: { decrement: costs[type] } }
      });
      
      // Finalizar transação
      return await tx.creditTransaction.update({
        where: { id: transaction.id },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
    });
  }
  ```

#### 2.4 Sistema de Reembolso Automático
- **Detecção de Falhas**:
  ```typescript
  async function handleProcessingFailure(planningId: string, type: CreditTransactionType) {
    const transaction = await prisma.creditTransaction.findFirst({
      where: { 
        planningId,
        type,
        status: 'COMPLETED'
      }
    });
    
    if (transaction) {
      await prisma.$transaction([
        // Criar transação de reembolso
        prisma.creditTransaction.create({
          data: {
            userId: transaction.userId,
            type: 'REFUND_FAILED_PROCESSING',
            amount: Math.abs(transaction.amount),
            planningId,
            status: 'COMPLETED',
            completedAt: new Date(),
            metadata: { originalTransactionId: transaction.id }
          }
        }),
        // Restaurar créditos do usuário
        prisma.user.update({
          where: { id: transaction.userId },
          data: { creditBalance: { increment: Math.abs(transaction.amount) } }
        })
      ]);
    }
  }
  ```

### 3. Submissão para Geração de Backlog IA

#### 3.1 Atualização de Status de Planejamento
- **Expandir enum `PlanningStatus`**:
  ```prisma
  enum PlanningStatus {
    // Status do plan-005
    DRAFT
    COMPLETED
    
    // Status de processamento IA
    PENDING_AI_BACKLOG_GENERATION
    AI_BACKLOG_RECEIVED_PENDING_PAYMENT
    AI_BACKLOG_VISIBLE
    USER_APPROVAL_PENDING_REFINEMENT_SUBMISSION
    REFINEMENT_SUBMITTED_PENDING_CALLBACK
    REFINEMENT_CALLBACK_RECEIVED_PENDING_TASKS_PAYMENT
    PROCESSING_COMPLETED
    FAILED_PROCESSING
    
    // Status de refinamento individual
    TASK_REFINEMENT_IN_PROGRESS
    TASK_REFINEMENT_COMPLETED
  }
  ```

#### 3.2 API de Submissão para IA
- **Endpoint**: `app/api/strategic-planning/[planningId]/submit-ai/route.ts`
- **Implementação**:
  ```typescript
  export async function POST(
    req: Request,
    { params: { planningId } }: { params: { planningId: string } }
  ) {
    try {
      // Validar usuário e permissões
      const { userId } = auth();
      if (!userId) return new Response('Unauthorized', { status: 401 });
      
      // Verificar saldo de créditos
      const hasCredits = await validateCredits(userId, 'CONSUMPTION_PLANNING_BACKLOG_VISIBLE');
      if (!hasCredits) {
        return new Response('Insufficient credits', { status: 402 });
      }
      
      // Buscar dados do planejamento
      const planning = await prisma.strategicPlanning.findUnique({
        where: { id: planningId },
        include: { client: true }
      });
      
      if (!planning) return new Response('Planning not found', { status: 404 });
      if (planning.userId !== userId) return new Response('Forbidden', { status: 403 });
      
      // Estruturar payload enriquecido
      const payload = {
        planning_id: planningId,
        timestamp: new Date().toISOString(),
        client_info: {
          id: planning.client.id,
          name: planning.client.name,
          industry: planning.client.industry,
          richnessScore: planning.client.richnessScore,
          customIndustry: planning.client.customIndustry,
          data_quality: planning.client.richnessScore > 80 ? "alto" : "médio"
        },
        form_submission_data: planning.formDataJSON,
        context_enrichment: {
          client_richness_level: planning.client.richnessScore > 80 ? "alto" : "médio",
          industry_specific_insights: true,
          personalization_level: "avançado",
          recommended_task_complexity: planning.client.richnessScore > 80 ? "avançado" : "intermediário"
        }
      };
      
      // Enviar para webhook
      const response = await fetch(process.env.PLANNING_WEBHOOK_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': process.env.WEBHOOK_SECRET!
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error('Webhook failed');
      
      // Atualizar status
      await prisma.strategicPlanning.update({
        where: { id: planningId },
        data: { 
          status: 'PENDING_AI_BACKLOG_GENERATION',
          aiProcessingStarted: new Date()
        }
      });
      
      return new Response('Processing started', { status: 202 });
      
    } catch (error) {
      console.error('Error submitting to AI:', error);
      return new Response('Internal error', { status: 500 });
    }
  }
  ```

### 4. Recebimento e Processamento do Backlog IA

#### 4.1 Webhook de Callback do Planejamento
- **Endpoint**: `app/api/webhooks/planning-callback/route.ts`
- **Implementação**:
  ```typescript
  export async function POST(req: Request) {
    try {
      // Validar autenticidade
      const secret = req.headers.get('X-Webhook-Secret');
      if (secret !== process.env.WEBHOOK_SECRET) {
        return new Response('Invalid secret', { status: 401 });
      }
      
      const data = await req.json();
      const { planning_id, tasks } = data;
      
      // Validar estrutura de dados
      if (!planning_id || !Array.isArray(tasks)) {
        return new Response('Invalid payload', { status: 400 });
      }
      
      // Buscar planejamento
      const planning = await prisma.strategicPlanning.findUnique({
        where: { id: planning_id },
        include: { user: true }
      });
      
      if (!planning) return new Response('Planning not found', { status: 404 });
      
      // Verificar créditos
      const hasCredits = await validateCredits(
        planning.userId,
        'CONSUMPTION_PLANNING_BACKLOG_VISIBLE'
      );
      
      // Atualizar planejamento
      await prisma.strategicPlanning.update({
        where: { id: planning_id },
        data: {
          aiGeneratedTasksJSON: data,
          status: hasCredits ? 'AI_BACKLOG_VISIBLE' : 'AI_BACKLOG_RECEIVED_PENDING_PAYMENT',
          aiProcessingCompleted: new Date()
        }
      });
      
      // Se tem créditos, debitar
      if (hasCredits) {
        await debitCredits(
          planning.userId,
          planning_id,
          'CONSUMPTION_PLANNING_BACKLOG_VISIBLE'
        );
      }
      
      return new Response('Success', { status: 200 });
      
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response('Internal error', { status: 500 });
    }
  }
  ```

#### 4.2 Estrutura de Dados do Backlog
```json
{
  "nome_do_backlog": "Backlog Estratégico 60 dias - E-commerce",
  "objetivo_do_backlog": "Estruturar e profissionalizar o marketing...",
  "tarefas": [
    {
      "nome": "Configuração do Gerenciador de Anúncios (Meta Ads)",
      "descricao": "Criar e configurar conta de anúncios no Meta Ads...",
      "prioridade": "alta",
      "selecionada": true,
      "detalhamentos": [
        {
          "texto": "Configurar pixel de conversão",
          "origem": "ia_inicial"
        }
      ],
      "metadata": {
        "setor_relacionado": "marketing",
        "complexidade": "intermediária",
        "tempo_estimado": "2 horas"
      }
    }
  ],
  "metadata": {
    "total_tarefas": 15,
    "distribuicao_prioridade": {
      "alta": 5,
      "media": 7,
      "baixa": 3
    },
    "areas_cobertas": ["marketing", "comercial", "operacional"]
  }
}
```

### 5. Interface de Aprovação e Edição de Tarefas

#### 5.1 Componente Principal de Aprovação
- **Página**: `app/planejamento/[planningId]/approve/page.tsx`
- **Componentes**:
  ```typescript
  // TaskApprovalInterface.tsx
  interface TaskApprovalProps {
    planningId: string;
    initialTasks: TarefaAI[];
    onTaskUpdate: (taskIndex: number, updates: Partial<TarefaAI>) => void;
    onTaskSelect: (taskIndex: number, selected: boolean) => void;
    onRequestRefinement: (taskIndex: number) => void;
  }
  
  // TaskCard.tsx
  interface TaskCardProps {
    task: TarefaAI;
    index: number;
    selected: boolean;
    onSelect: (selected: boolean) => void;
    onEdit: (updates: Partial<TarefaAI>) => void;
    onRefinementRequest: () => void;
  }
  
  // PrioritySelector.tsx
  interface PrioritySelectorProps {
    value: TaskPriority;
    onChange: (priority: TaskPriority) => void;
    size?: 'sm' | 'md' | 'lg';
  }
  ```

#### 5.2 Funcionalidades de Interação
- **Edição em tempo real**:
  ```typescript
  const handleTaskEdit = (index: number, updates: Partial<TarefaAI>) => {
    const updatedTasks = [...tasks];
    updatedTasks[index] = { ...updatedTasks[index], ...updates };
    
    // Salvar em localStorage para backup
    localStorage.setItem(
      `task-edits-${planningId}`,
      JSON.stringify(updatedTasks)
    );
    
    // Atualizar estado
    setTasks(updatedTasks);
    
    // Notificar servidor (debounced)
    debouncedUpdateTask(planningId, index, updates);
  };
  ```

- **Sistema de prioridades visuais**:
  ```typescript
  const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
    const colors = {
      baixa: 'bg-blue-100 text-blue-800',
      normal: 'bg-yellow-100 text-yellow-800',
      media: 'bg-orange-100 text-orange-800',
      alta: 'bg-red-100 text-red-800'
    };
    
    const icons = {
      baixa: '🔵',
      normal: '🟡',
      media: '🟠',
      alta: '🔴'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[priority]}`}>
        {icons[priority]} {priority.toUpperCase()}
      </span>
    );
  };
  ```

#### 5.3 Sistema de Refinamento Individual
- **Modal de refinamento**:
  ```typescript
  interface RefinementModalProps {
    task: TarefaAI;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (context: string) => Promise<void>;
  }
  ```

- **API específica**:
  ```typescript
  // app/api/strategic-planning/[planningId]/refine-task/route.ts
  export async function POST(
    req: Request,
    { params: { planningId } }: { params: { planningId: string } }
  ) {
    const { taskIndex, additionalContext } = await req.json();
    
    // Validar créditos para refinamento individual
    const hasCredits = await validateCredits(
      userId,
      'CONSUMPTION_INDIVIDUAL_REFINEMENT'
    );
    
    if (!hasCredits) {
      return new Response('Insufficient credits', { status: 402 });
    }
    
    // Processar refinamento
    const planning = await prisma.strategicPlanning.findUnique({
      where: { id: planningId },
      include: { client: true }
    });
    
    // Preparar payload para refinamento
    const payload = {
      planning_id: planningId,
      task_index: taskIndex,
      original_task: planning.aiGeneratedTasksJSON.tarefas[taskIndex],
      additional_context: additionalContext,
      client_context: {
        industry: planning.client.industry,
        richness_score: planning.client.richnessScore
      }
    };
    
    // Enviar para webhook de refinamento
    const response = await fetch(
      `${process.env.PLANNING_WEBHOOK_URL}/refine-task`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': process.env.WEBHOOK_SECRET!
        },
        body: JSON.stringify(payload)
      }
    );
    
    if (!response.ok) {
      throw new Error('Refinement failed');
    }
    
    // Debitar créditos
    await debitCredits(
      userId,
      planningId,
      'CONSUMPTION_INDIVIDUAL_REFINEMENT'
    );
    
    return new Response('Refinement submitted', { status: 202 });
  }
  ```

### 6. Submissão para Refinamento de Lista

#### 6.1 API de Submissão para Refinamento
- **Endpoint**: `app/api/strategic-planning/[planningId]/submit-refinement/route.ts`
- **Implementação**:
  ```typescript
  export async function POST(
    req: Request,
    { params: { planningId } }: { params: { planningId: string } }
  ) {
    try {
      const { userId } = auth();
      if (!userId) return new Response('Unauthorized', { status: 401 });
      
      // Buscar planejamento com tarefas aprovadas
      const planning = await prisma.strategicPlanning.findUnique({
        where: { id: planningId },
        include: { client: true }
      });
      
      if (!planning) return new Response('Planning not found', { status: 404 });
      if (planning.userId !== userId) return new Response('Forbidden', { status: 403 });
      
      // Coletar tarefas selecionadas
      const selectedTasks = planning.aiGeneratedTasksJSON.tarefas.filter(
        (t: TarefaAI) => t.selecionada
      );
      
      // Salvar tarefas aprovadas
      await prisma.strategicPlanning.update({
        where: { id: planningId },
        data: {
          approvedTasksJSON: selectedTasks,
          status: 'REFINEMENT_SUBMITTED_PENDING_CALLBACK'
        }
      });
      
      // Preparar payload para refinamento
      const payload = {
        planning_id: planningId,
        client_info: {
          id: planning.client.id,
          name: planning.client.name,
          industry: planning.client.industry,
          richnessScore: planning.client.richnessScore
        },
        approved_tasks: selectedTasks,
        form_data: planning.formDataJSON,
        statistics: {
          total_tasks: planning.aiGeneratedTasksJSON.tarefas.length,
          approved_tasks: selectedTasks.length,
          approval_rate: selectedTasks.length / planning.aiGeneratedTasksJSON.tarefas.length
        }
      };
      
      // Enviar para webhook de refinamento
      const response = await fetch(process.env.REFINED_LIST_WEBHOOK_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': process.env.WEBHOOK_SECRET!
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error('Refinement submission failed');
      
      return new Response('Refinement submitted', { status: 202 });
      
    } catch (error) {
      console.error('Error submitting refinement:', error);
      return new Response('Internal error', { status: 500 });
    }
  }
  ```

#### 6.2 Payload para Refinamento de Lista
```json
{
  "planning_id": "planning_123",
  "client_info": {
    "id": "client_456",
    "name": "Empresa XYZ Ltda",
    "industry": "E-commerce",
    "richnessScore": 85
  },
  "approved_tasks": [
    {
      "nome": "SUPER Configuração Otimizada do Meta Ads",
      "descricao": "Criar, configurar E VALIDAR a conta de anúncios...",
      "prioridade": "URGENT",
      "detalhamentos": [],
      "detalhamento_adicional_usuario": "Focar em lookalike do público comprador atual",
      "metadata": {
        "edicoes_usuario": ["nome", "descricao", "prioridade"],
        "refinamentos_aplicados": 1,
        "tempo_edicao": "5 minutos"
      }
    }
  ],
  "form_data": {
    "informacoes_basicas": {},
    "detalhes_do_setor": {},
    "marketing": {},
    "comercial": {}
  },
  "statistics": {
    "total_tasks": 15,
    "approved_tasks": 8,
    "approval_rate": 0.53,
    "refinements_requested": 3,
    "average_edit_time": "3 minutos"
  }
}
```

### 7. Processamento Final e Criação de Tarefas

#### 7.1 Webhook de Lista Refinada
- **Endpoint**: `app/api/webhooks/refined-list-callback/route.ts`
- **Implementação**:
  ```typescript
  export async function POST(req: Request) {
    try {
      // Validar autenticidade
      const secret = req.headers.get('X-Webhook-Secret');
      if (secret !== process.env.WEBHOOK_SECRET) {
        return new Response('Invalid secret', { status: 401 });
      }
      
      const { planning_id } = await req.json();
      
      // Buscar planejamento
      const planning = await prisma.strategicPlanning.findUnique({
        where: { id: planning_id },
        include: { user: true }
      });
      
      if (!planning) return new Response('Planning not found', { status: 404 });
      
      // Verificar créditos
      const hasCredits = await validateCredits(
        planning.userId,
        'CONSUMPTION_REFINED_LIST_VISIBLE'
      );
      
      if (!hasCredits) {
        await prisma.strategicPlanning.update({
          where: { id: planning_id },
          data: { status: 'REFINEMENT_CALLBACK_RECEIVED_PENDING_TASKS_PAYMENT' }
        });
        return new Response('Insufficient credits', { status: 402 });
      }
      
      // Debitar créditos
      await debitCredits(
        planning.userId,
        planning_id,
        'CONSUMPTION_REFINED_LIST_VISIBLE'
      );
      
      // Criar PlanningTasks
      const tasks = planning.approvedTasksJSON;
      await prisma.$transaction(
        tasks.map((task: TarefaAI) => 
          prisma.planningTask.create({
            data: {
              title: task.nome,
              description: task.descricao,
              priority: task.prioridade,
              userId: planning.userId,
              planningId: planning_id,
              refinedOutputMarkdown: generateTaskMarkdown(task, planning),
              planejamentoInformacoes: task,
              planejamentoFinal: {
                ...task,
                metadata: {
                  ...task.metadata,
                  created_at: new Date().toISOString()
                }
              },
              clientContext: {
                industry: planning.client.industry,
                richnessScore: planning.client.richnessScore,
                snapshot: planning.clientSnapshot
              }
            }
          })
        )
      );
      
      // Atualizar status do planejamento
      await prisma.strategicPlanning.update({
        where: { id: planning_id },
        data: { status: 'PROCESSING_COMPLETED' }
      });
      
      return new Response('Tasks created successfully', { status: 200 });
      
    } catch (error) {
      console.error('Error processing refined list:', error);
      return new Response('Internal error', { status: 500 });
    }
  }
  ```

#### 7.2 Geração do Output Markdown
```typescript
function generateTaskMarkdown(task: TarefaAI, planning: StrategicPlanning): string {
  return `# ${task.nome}

## 📋 Objetivo
${task.descricao}

## 🔍 Contexto do Cliente
- **Empresa**: ${planning.client.name}
- **Setor**: ${planning.client.industry}
- **Nível de Maturidade**: ${planning.formDataJSON.marketing.maturidade_marketing}

## ⚙️ Detalhamentos
${task.detalhamentos.map(d => `- ${d.texto} (${d.origem})`).join('\n')}

${task.detalhamento_adicional_usuario ? `## 📝 Contexto Adicional
${task.detalhamento_adicional_usuario}` : ''}

## 🎯 Métricas de Sucesso
${generateMetrics(task, planning)}

## 📅 Prazo Sugerido
${task.metadata?.tempo_estimado || 'A definir'}

## 🔗 Recursos Adicionais
${generateResources(task, planning)}`;
}

function generateMetrics(task: TarefaAI, planning: StrategicPlanning): string {
  // Gerar métricas baseadas no contexto
  const metrics = [];
  
  if (task.metadata?.setor_relacionado === 'marketing') {
    metrics.push('- Aumento no tráfego qualificado');
    metrics.push('- Melhoria na taxa de conversão');
  }
  
  if (task.metadata?.setor_relacionado === 'comercial') {
    metrics.push('- Aumento no número de leads');
    metrics.push('- Melhoria no ticket médio');
  }
  
  return metrics.join('\n');
}

function generateResources(task: TarefaAI, planning: StrategicPlanning): string {
  // Gerar links e recursos baseados no contexto
  const resources = [];
  
  if (task.metadata?.setor_relacionado === 'marketing') {
    resources.push('- [Meta Ads Best Practices](https://www.facebook.com/business/help)');
    resources.push('- [Google Analytics Setup](https://analytics.google.com/analytics/web/)');
  }
  
  return resources.join('\n');
}
```

### 8. Visualização e Gestão de Listas Refinadas

#### 8.1 Página de Lista Refinada
- **Rota**: `app/planejamento/[planningId]/refined-list/page.tsx`
- **Implementação**:
  ```typescript
  export default async function RefinedListPage({ params }: { params: { planningId: string } }) {
    const planning = await prisma.strategicPlanning.findUnique({
      where: { id: params.planningId },
      include: {
        client: true,
        tasks: {
          orderBy: { priority: 'desc' }
        }
      }
    });
    
    return (
      <div className="container mx-auto py-8">
        <PlanningHeader planning={planning} />
        <TaskStatistics tasks={planning.tasks} />
        <TaskList tasks={planning.tasks} />
        <ExecutionTracker tasks={planning.tasks} />
      </div>
    );
  }
  ```

#### 8.2 Componentes de Visualização
```typescript
// RefinedTaskView.tsx
interface RefinedTaskViewProps {
  task: PlanningTask;
  onStatusChange: (status: TaskStatus) => void;
}

const RefinedTaskView: React.FC<RefinedTaskViewProps> = ({ task, onStatusChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{task.title}</h3>
        <PriorityBadge priority={task.priority} />
      </div>
      
      <div className="mt-4 prose">
        <ReactMarkdown>{task.refinedOutputMarkdown}</ReactMarkdown>
      </div>
      
      <div className="mt-6 border-t pt-4">
        <h4 className="font-medium">Histórico de Refinamento</h4>
        <TaskHistory task={task} />
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <StatusSelector
          value={task.status}
          onChange={onStatusChange}
        />
        <Button onClick={() => window.open(`/tasks/${task.id}`, '_blank')}>
          Abrir Tarefa
        </Button>
      </div>
    </div>
  );
};

// TaskStatistics.tsx
interface TaskStatisticsProps {
  tasks: PlanningTask[];
}

const TaskStatistics: React.FC<TaskStatisticsProps> = ({ tasks }) => {
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    byPriority: {
      URGENT: tasks.filter(t => t.priority === 'URGENT').length,
      ALTA: tasks.filter(t => t.priority === 'ALTA').length,
      MEDIA: tasks.filter(t => t.priority === 'MEDIA').length,
      BAIXA: tasks.filter(t => t.priority === 'BAIXA').length
    }
  };
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="Total de Tarefas"
        value={stats.total}
        icon={<TaskIcon />}
      />
      <StatCard
        title="Concluídas"
        value={`${Math.round((stats.completed / stats.total) * 100)}%`}
        icon={<CheckIcon />}
      />
      <StatCard
        title="Em Progresso"
        value={stats.inProgress}
        icon={<ProgressIcon />}
      />
      <StatCard
        title="Prioridade Alta/Urgente"
        value={stats.byPriority.URGENT + stats.byPriority.ALTA}
        icon={<PriorityIcon />}
      />
    </div>
  );
};
```

### 9. Sistema de Auditoria e Histórico

#### 9.1 Log de Auditoria
```typescript
// models/PlanningAuditLog.ts
interface PlanningAuditLog {
  id: string;
  planningId: string;
  userId: string;
  action: AuditAction;
  details: Json;
  timestamp: Date;
  
  planning: StrategicPlanning;
  user: User;
}

enum AuditAction {
  TASK_CREATED = 'task_created',
  TASK_EDITED = 'task_edited',
  TASK_STATUS_CHANGED = 'task_status_changed',
  TASK_REFINED = 'task_refined',
  PLANNING_STATUS_CHANGED = 'planning_status_changed',
  CREDIT_TRANSACTION = 'credit_transaction'
}

// services/audit.ts
async function createAuditLog(
  planningId: string,
  userId: string,
  action: AuditAction,
  details: any
) {
  return await prisma.planningAuditLog.create({
    data: {
      planningId,
      userId,
      action,
      details,
      timestamp: new Date()
    }
  });
}

// Exemplo de uso
await createAuditLog(
  planningId,
  userId,
  'task_refined',
  {
    taskId: task.id,
    previousState: task.planejamentoInformacoes,
    newState: task.planejamentoFinal,
    refinementContext: additionalContext
  }
);
```

#### 9.2 Interface de Histórico
```typescript
// components/TaskHistory.tsx
interface TaskHistoryProps {
  task: PlanningTask;
}

const TaskHistory: React.FC<TaskHistoryProps> = async ({ task }) => {
  const logs = await prisma.planningAuditLog.findMany({
    where: {
      planningId: task.planningId,
      details: { path: ['taskId'], equals: task.id }
    },
    include: { user: true },
    orderBy: { timestamp: 'desc' }
  });
  
  return (
    <div className="space-y-4">
      {logs.map(log => (
        <div key={log.id} className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <TimelineIcon action={log.action} />
          </div>
          <div>
            <p className="text-sm text-gray-500">
              {format(log.timestamp, 'dd/MM/yyyy HH:mm')}
            </p>
            <p className="font-medium">
              {formatAction(log.action)}
            </p>
            <div className="mt-1 text-sm">
              {formatDetails(log.details)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// components/PlanningTimeline.tsx
interface PlanningTimelineProps {
  planningId: string;
}

const PlanningTimeline: React.FC<PlanningTimelineProps> = async ({ planningId }) => {
  const logs = await prisma.planningAuditLog.findMany({
    where: { planningId },
    include: { user: true },
    orderBy: { timestamp: 'desc' }
  });
  
  const groupedLogs = groupLogsByDate(logs);
  
  return (
    <div className="space-y-8">
      {Object.entries(groupedLogs).map(([date, dayLogs]) => (
        <div key={date}>
          <h3 className="text-lg font-medium mb-4">{formatDate(date)}</h3>
          <div className="space-y-4">
            {dayLogs.map(log => (
              <TimelineEvent key={log.id} log={log} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 10. Sistema de Notificações e Feedback

#### 10.1 Estados de Carregamento
```typescript
// hooks/useProcessingState.ts
interface ProcessingState {
  status: 'idle' | 'loading' | 'success' | 'error';
  progress: number;
  message: string;
  error?: Error;
}

const useProcessingState = (planningId: string) => {
  const [state, setState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  
  const startProcessing = (type: 'backlog' | 'refinement') => {
    setState({
      status: 'loading',
      progress: 0,
      message: type === 'backlog'
        ? 'Gerando backlog inicial...'
        : 'Refinando lista de tarefas...'
    });
    
    // Simular progresso baseado em tempos médios
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        progress: Math.min(prev.progress + 10, 90)
      }));
    }, type === 'backlog' ? 3000 : 2000);
    
    return () => clearInterval(interval);
  };
  
  const completeProcessing = () => {
    setState({
      status: 'success',
      progress: 100,
      message: 'Processamento concluído!'
    });
  };
  
  const handleError = (error: Error) => {
    setState({
      status: 'error',
      progress: 0,
      message: 'Erro no processamento',
      error
    });
  };
  
  return {
    state,
    startProcessing,
    completeProcessing,
    handleError
  };
};

// components/ProcessingIndicator.tsx
const ProcessingIndicator: React.FC<{ state: ProcessingState }> = ({ state }) => {
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center gap-4">
        {state.status === 'loading' && (
          <Spinner size="sm" className="text-primary" />
        )}
        <div>
          <p className="font-medium">{state.message}</p>
          {state.status === 'loading' && (
            <Progress value={state.progress} className="mt-2" />
          )}
        </div>
      </div>
    </div>
  );
};
```

#### 10.2 Feedback ao Usuário
```typescript
// components/TaskFeedback.tsx
interface TaskFeedbackProps {
  task: PlanningTask;
  onFeedback: (feedback: TaskFeedback) => void;
}

interface TaskFeedback {
  quality: 1 | 2 | 3 | 4 | 5;
  relevance: 1 | 2 | 3 | 4 | 5;
  clarity: 1 | 2 | 3 | 4 | 5;
  comments?: string;
}

const TaskFeedback: React.FC<TaskFeedbackProps> = ({ task, onFeedback }) => {
  const [feedback, setFeedback] = useState<TaskFeedback>({
    quality: 3,
    relevance: 3,
    clarity: 3
  });
  
  const handleSubmit = async () => {
    await prisma.planningTask.update({
      where: { id: task.id },
      data: {
        metadata: {
          ...task.metadata,
          feedback
        }
      }
    });
    
    await createAuditLog(
      task.planningId,
      task.userId,
      'task_feedback',
      { taskId: task.id, feedback }
    );
    
    onFeedback(feedback);
  };
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Avalie esta tarefa</h3>
      
      <div className="space-y-2">
        <RatingInput
          label="Qualidade"
          value={feedback.quality}
          onChange={quality => setFeedback(prev => ({ ...prev, quality }))}
        />
        <RatingInput
          label="Relevância"
          value={feedback.relevance}
          onChange={relevance => setFeedback(prev => ({ ...prev, relevance }))}
        />
        <RatingInput
          label="Clareza"
          value={feedback.clarity}
          onChange={clarity => setFeedback(prev => ({ ...prev, clarity }))}
        />
      </div>
      
      <textarea
        placeholder="Comentários adicionais..."
        value={feedback.comments}
        onChange={e => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
        className="w-full mt-2 rounded-md border-gray-300"
      />
      
      <Button onClick={handleSubmit}>
        Enviar Feedback
      </Button>
    </div>
  );
};
```

### 11. Otimizações e Performance

#### 11.1 Cache e Otimização
```typescript
// utils/cache.ts
const CACHE_KEYS = {
  planningTasks: (planningId: string) => `planning-tasks-${planningId}`,
  taskHistory: (taskId: string) => `task-history-${taskId}`,
  clientContext: (clientId: string) => `client-context-${clientId}`
};

const cache = new Map<string, { data: any; timestamp: number }>();

const CACHE_TTL = {
  planningTasks: 5 * 60 * 1000, // 5 minutos
  taskHistory: 10 * 60 * 1000,  // 10 minutos
  clientContext: 30 * 60 * 1000 // 30 minutos
};

async function getCachedData<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data as T;
  }
  
  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  
  return data;
}

// Exemplo de uso
const tasks = await getCachedData(
  CACHE_KEYS.planningTasks(planningId),
  CACHE_TTL.planningTasks,
  () => prisma.planningTask.findMany({ where: { planningId } })
);
```

#### 11.2 Monitoramento
```typescript
// utils/monitoring.ts
interface ProcessingMetrics {
  planningId: string;
  operation: 'backlog' | 'refinement' | 'task_creation';
  startTime: number;
  endTime: number;
  success: boolean;
  error?: string;
}

const metrics = new Map<string, ProcessingMetrics[]>();

function recordMetric(metric: ProcessingMetrics) {
  const existing = metrics.get(metric.planningId) || [];
  metrics.set(metric.planningId, [...existing, metric]);
  
  // TODO: Enviar para sistema de monitoramento externo
}

// Exemplo de uso
const startTime = Date.now();
try {
  await processBacklog(planningId);
  recordMetric({
    planningId,
    operation: 'backlog',
    startTime,
    endTime: Date.now(),
    success: true
  });
} catch (error) {
  recordMetric({
    planningId,
    operation: 'backlog',
    startTime,
    endTime: Date.now(),
    success: false,
    error: error.message
  });
  throw error;
}
```

## 🎯 Success Metrics

### Funcionalidade Core
- **Taxa de geração de backlog bem-sucedida**: > 95%
- **Taxa de aprovação de tarefas**: Baseline para otimização futura
- **Taxa de conclusão do refinamento**: > 90%
- **Tempo médio do processo completo**: < 15 minutos

### Qualidade da IA
- **Taxa de tarefas aprovadas sem modificação**: Métrica de qualidade da IA
- **Número médio de edições por tarefa**: Indicador de precisão
- **Uso do refinamento individual**: Métrica de necessidade de ajustes
- **Feedback médio das tarefas**: Score de qualidade, relevância e clareza

### Performance e Confiabilidade
- **Tempo de resposta de webhooks**: < 30s (95th percentile)
- **Taxa de sucesso de transações de crédito**: 100%
- **Uptime do sistema**: > 99.5%
- **Recovery time de erros**: < 5 minutos

### Experiência do Usuário
- **Satisfação com tarefas geradas**: Survey qualitativo
- **Taxa de conclusão do fluxo**: % que chegam até o final
- **Tempo médio na interface de aprovação**: Métrica de UX
- **Taxa de uso de funcionalidades avançadas**: Adoption metrics

### Negócio
- **Conversão para execução de tarefas**: % de `PlanningTask` executadas
- **Retenção de usuários**: Taxa que criam múltiplos planejamentos
- **ROI do sistema de créditos**: Valor percebido vs. custo
- **Crescimento de uso**: Evolução mensal de criação de planejamentos