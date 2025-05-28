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

Implementar o sistema completo de geração de backlog por IA, interface de aprovação e refinamento de tarefas, criação de listas refinadas, e gestão avançada do sistema de créditos. Esta fase constrói sobre a infraestrutura criada no plan-005, adicionando processamento inteligente, webhooks, sistema de aprovação interativo e criação final de tarefas executáveis.

### Componentes Desta Fase:
- **Integração com IA Externa**: Webhooks para geração de backlog e refinamento de listas
- **Sistema de Créditos**: Gestão completa de consumo e validação de saldo
- **Interface de Aprovação**: Sistema interativo para revisar, editar e selecionar tarefas
- **Refinamento Individual**: Capacidade de refinar tarefas específicas
- **Criação de Listas Refinadas**: Conversão final para `PlanningTask` executáveis
- **Sistema de Auditoria**: Logs completos de modificações e histórico

## ✅ Functional Requirements

### 1. Análise e Validação da Base Criada no Plan-005
- **Verificar IDs e relacionamentos**: Confirmar mapeamento de `clientId`, `planningId`, `userId` criado no plan-005
- **Validar estruturas JSON**: Confirmar formato de `formDataJSON` e `clientSnapshot`
- **Testar relacionamentos**: Verificar integridade Client-StrategicPlanning
- **Confirmar endpoints**: Validar APIs básicas de criação e listagem de planejamentos

### 2. Sistema de Gestão de Créditos Completo

#### 2.1 Configuração de Custos
- **Variáveis de ambiente** (adicionar ao `.env` existente):
  ```env
  # Webhooks
  PLANNING_WEBHOOK_URL=https://webhook.lucasfelix.com/webhook/vortex-planejamento-beta-2025
  REFINED_LIST_WEBHOOK_URL=https://webhook.lucasfelix.com/webhook/vortex-refinada-beta-2025
  
  # Custos de crédito
  COST_PLANNING_BACKLOG_VISIBLE=10
  COST_REFINED_LIST_VISIBLE=10
  
  # Webhook Security
  WEBHOOK_SECRET=sua_chave_secreta_aqui
  ```

#### 2.2 Modelo de Transações de Crédito
- **Atualizar Schema Prisma** com novos tipos de transação:
  ```prisma
  enum CreditTransactionType {
    // Tipos existentes...
    CONSUMPTION_PLANNING_BACKLOG_VISIBLE
    CONSUMPTION_REFINED_LIST_VISIBLE
  }
  ```

#### 2.3 Sistema de Validação e Débito
- **Verificação antes da operação**: Validar saldo antes de processar
- **Débito após sucesso**: Cobrar apenas quando IA entregar resultados
- **Transações atômicas**: Garantir consistência em caso de erro
- **Histórico detalhado**: Log de todas as operações de crédito

### 3. Submissão para Geração de Backlog IA

#### 3.1 Atualização de Status de Planejamento
- **Expandir enum `PlanningStatus`**:
  ```prisma
  enum PlanningStatus {
    DRAFT
    COMPLETED  // Status do plan-005
    
    // Novos status para IA
    PENDING_AI_BACKLOG_GENERATION
    AI_BACKLOG_RECEIVED_PENDING_PAYMENT
    AI_BACKLOG_VISIBLE
    USER_APPROVAL_PENDING_REFINEMENT_SUBMISSION
    REFINEMENT_SUBMITTED_PENDING_CALLBACK
    REFINEMENT_CALLBACK_RECEIVED_PENDING_TASKS_PAYMENT
    PROCESSING_COMPLETED
    FAILED_PROCESSING
  }
  ```

#### 3.2 API de Submissão para IA
- **Endpoint**: `app/api/strategic-planning/[planningId]/submit-ai/route.ts`
- **Funcionalidades**:
  - Buscar dados completos do planejamento (incluindo cliente)
  - Verificar saldo de créditos (sem debitar ainda)
  - Estruturar payload enriquecido para webhook
  - Enviar para `PLANNING_WEBHOOK_URL`
  - Atualizar status para `PENDING_AI_BACKLOG_GENERATION`
  - Iniciar animação de carregamento no frontend

#### 3.3 Payload Enriquecido para IA
```json
{
  "planning_id": "planning_123",
  "timestamp": "2024-01-15T10:30:00Z",
  "client_info": {
    "id": "client_456",
    "name": "Empresa XYZ Ltda",
    "industry": "E-commerce",
    "richnessScore": 85,
    "customIndustry": null,
    "data_quality": "alto"
  },
  "form_submission_data": {
    "informacoes_basicas": { /* dados da aba 1 */ },
    "detalhes_do_setor": { /* dados da aba 2 */ },
    "marketing": { /* dados da aba 3 */ },
    "comercial": { /* dados da aba 4 */ }
  },
  "context_enrichment": {
    "client_richness_level": "alto",
    "industry_specific_insights": true,
    "personalization_level": "avançado",
    "recommended_task_complexity": "intermediário-avançado"
  }
}
```

### 4. Recebimento e Processamento do Backlog IA

#### 4.1 Webhook de Callback do Planejamento
- **Endpoint**: `app/api/webhooks/planning-callback/route.ts`
- **Funcionalidades**:
  - Validar autenticidade do webhook (WEBHOOK_SECRET)
  - Receber estrutura JSON de tarefas (`aiGeneratedTasksJSON`)
  - Salvar dados no `StrategicPlanning`
  - Verificar e debitar créditos (`COST_PLANNING_BACKLOG_VISIBLE`)
  - Atualizar status baseado no pagamento
  - Notificar frontend (encerrar animação)

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
      ]
    }
  ]
}
```

### 5. Interface de Aprovação e Edição de Tarefas

#### 5.1 Componente Principal de Aprovação
- **Página**: `app/planejamento/[planningId]/approve/page.tsx`
- **Componente**: `TaskApprovalInterface.tsx`
- **Funcionalidades**:
  - Exibição visual das tarefas em cards organizados
  - Sistema de seleção/desseleção com checkboxes
  - Interface de edição inline para nome e descrição
  - Dropdown visual para prioridades (🔵 Baixa, 🟡 Normal, 🟠 Média, 🔴 Alta)
  - Expansão/colapso para detalhamentos completos
  - Contador de tarefas selecionadas

#### 5.2 Funcionalidades de Interação
- **Edição em tempo real**: Auto-save de alterações
- **Visualização de detalhes**: Modal/tooltip para subtarefas
- **Sistema de prioridades visuais**: Cores e ícones intuitivos
- **Validação ao vivo**: Feedback visual de campos obrigatórios
- **Persistência local**: Backup em localStorage durante edição

#### 5.3 Sistema de Refinamento Individual
- **Botão "Refinar Tarefa"**: Em cada card de tarefa
- **Modal de refinamento**: Campo para contexto adicional
- **API específica**: `app/api/strategic-planning/[planningId]/refine-task/route.ts`
- **Webhook individual**: Endpoint separado para refinamento de tarefa específica
- **Atualização em tempo real**: Substituir tarefa no array

### 6. Submissão para Refinamento de Lista

#### 6.1 API de Submissão para Refinamento
- **Endpoint**: `app/api/strategic-planning/[planningId]/submit-refinement/route.ts`
- **Funcionalidades**:
  - Coletar tarefas com `selecionada: true`
  - Salvar em `approvedTasksJSON`
  - Estruturar payload para `REFINED_LIST_WEBHOOK_URL`
  - Atualizar status para `REFINEMENT_SUBMITTED_PENDING_CALLBACK`
  - Iniciar animação de carregamento

#### 6.2 Payload para Refinamento de Lista
```json
{
  "planning_id": "planning_123",
  "client_info": { /* dados do cliente */ },
  "original_backlog": { /* backlog completo original */ },
  "approved_tasks": [ /* apenas tarefas selecionadas */ ],
  "user_modifications": [
    {
      "task_index": 2,
      "modifications": {
        "nome": "Nome editado pelo usuário",
        "prioridade": "URGENT"
      },
      "additional_context": "Contexto adicional do usuário"
    }
  ],
  "statistics": {
    "total_tasks": 15,
    "approved_tasks": 8,
    "individual_refinements": 3,
    "session_duration": "45 minutos"
  }
}
```

### 7. Processamento Final e Criação de Tarefas

#### 7.1 Webhook de Lista Refinada
- **Endpoint**: `app/api/webhooks/refined-list-callback/route.ts`
- **Funcionalidades**:
  - Receber sinalização de conclusão
  - Verificar e debitar créditos (`COST_REFINED_LIST_VISIBLE`)
  - Processar criação de `PlanningTask` individuais
  - Atualizar status final
  - Notificar frontend

#### 7.2 Criação de PlanningTask
- **Atualizar Schema Prisma** para `PlanningTask`:
  ```prisma
  model PlanningTask {
    id          String   @id @default(cuid())
    title       String
    description String?
    priority    TaskPriority
    status      TaskStatus @default(PENDING)
    
    userId      String
    planningId  String
    
    // Dados específicos do planejamento
    planejamentoInformacoes Json?  // Dados originais da IA
    planejamentoFinal      Json?   // Versão final aprovada
    refinedOutputMarkdown  String? // Output detalhado construído pelo backend
    clientContext          Json?   // Contexto do cliente
    
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    
    planning StrategicPlanning @relation(fields: [planningId], references: [id])
    user     User @relation(fields: [userId], references: [id])
    
    @@index([planningId])
    @@index([userId, status])
  }
  
  enum TaskPriority {
    BAIXA
    NORMAL
    MEDIA
    ALTA
    URGENT
  }
  
  enum TaskStatus {
    PENDING
    IN_PROGRESS
    COMPLETED
    CANCELLED
  }
  ```

#### 7.3 Construção do Output Detalhado
```markdown
# [Nome da Tarefa]

## 📋 Objetivo
[Descrição detalhada da tarefa]

## 🔍 Contexto do Cliente
- **Empresa**: [Nome do Cliente]
- **Setor**: [Industry]
- **Nível de Maturidade**: [Marketing/Comercial]

## ⚙️ Detalhamentos
[Lista de subtarefas e detalhamentos]

## 🎯 Métricas de Sucesso
[Indicadores definidos pela IA]

## 📅 Prazo Sugerido
[Timeline recomendada]

## 🔗 Recursos Adicionais
[Links e materiais complementares]
```

### 8. Visualização e Gestão de Listas Refinadas

#### 8.1 Página de Lista Refinada
- **Rota**: `app/planejamento/[planningId]/refined-list/page.tsx`
- **Funcionalidades**:
  - Exibição das `PlanningTask` criadas
  - Interface para visualizar `refinedOutputMarkdown`
  - Links para editar tarefas individuais
  - Histórico completo do processo
  - Estatísticas de aprovação/modificação

#### 8.2 Componentes de Visualização
- **`RefinedTaskView.tsx`**: Visualização rica do markdown
- **`TaskHistoryView.tsx`**: Histórico de modificações
- **`PlanningStats.tsx`**: Estatísticas do processo
- **`TaskExecutionTracker.tsx`**: Acompanhamento de execução

### 9. Sistema de Auditoria e Histórico

#### 9.1 Log de Auditoria
- **Modelo no Prisma**:
  ```prisma
  model PlanningAuditLog {
    id          String   @id @default(cuid())
    planningId  String
    userId      String
    action      String  // "task_edited", "priority_changed", etc.
    details     Json    // Dados da modificação
    timestamp   DateTime @default(now())
    
    planning StrategicPlanning @relation(fields: [planningId], references: [id])
    
    @@index([planningId])
    @@index([userId, timestamp])
  }
  ```

#### 9.2 Interface de Histórico
- **Timeline visual**: Linha do tempo com todas as modificações
- **Comparação de versões**: Before/After das edições
- **Métricas de engage**: Tempo gasto, número de modificações
- **Análise de padrões**: Insights sobre uso do sistema

### 10. Sistema de Notificações e Feedback

#### 10.1 Estados de Carregamento
- **Animações específicas**: Para cada etapa do processo
- **Progress indicators**: Mostra etapa atual
- **Estimativa de tempo**: Baseada em histórico
- **Cancelamento**: Opção de cancelar durante processamento

#### 10.2 Feedback ao Usuário
- **Notificações em tempo real**: Toast messages para cada ação
- **Estados de erro**: Tratamento específico para falhas
- **Recuperação automática**: Retry em caso de falha temporária
- **Feedback de qualidade**: Sistema para avaliar tarefas geradas

### 11. Otimizações e Performance

#### 11.1 Cache e Otimização
- **Cache de perguntas por setor**: Evitar consultas repetitivas
- **Lazy loading**: Carregar tarefas sob demanda
- **Debounce**: Em edições em tempo real
- **Compression**: Para payloads de webhook grandes

#### 11.2 Monitoramento
- **Logs estruturados**: Para debugging e analytics
- **Métricas de performance**: Tempo de resposta dos webhooks
- **Health checks**: Status dos serviços externos
- **Alertas**: Para falhas críticas

## ⚙️ Non-Functional Requirements

### Performance
- **Webhook response**: < 30s para geração de backlog
- **UI responsiveness**: Edições em tempo real < 100ms
- **Lista refinada**: Criação em < 60s após aprovação
- **Carregamento**: Páginas < 3s, componentes < 1s

### Security
- **Webhook validation**: Verificação de assinatura/secret
- **Credit transactions**: Transações atômicas e auditáveis
- **Input sanitization**: Limpeza de dados de entrada
- **Authorization**: Verificação em todas as operações

### Reliability
- **Retry mechanism**: Para webhooks com falha
- **Transaction rollback**: Em caso de erro no débito de créditos
- **Data backup**: Snapshots antes de operações críticas
- **Error recovery**: Capacidade de retomar processamento

### Scalability
- **Queue system**: Para processamento de webhooks
- **Rate limiting**: Prevenção de abuso de APIs
- **Database optimization**: Índices e queries eficientes
- **Cache layers**: Para dados frequentemente acessados

## 📚 Guidelines & Packages

### Tecnologias Adicionais (Além do Plan-005)
- **Queue**: Bull/BullMQ para processamento assíncrono
- **Webhook Security**: Crypto para validação de assinaturas
- **Real-time**: WebSockets ou Server-Sent Events (opcional)
- **Markdown**: React-Markdown para visualização de outputs
- **Charts**: Recharts para estatísticas e métricas

### Webhooks URLs
- `PLANNING_WEBHOOK_URL="https://webhook.lucasfelix.com/webhook/vortex-planejamento-beta-2025"`
- `REFINED_LIST_WEBHOOK_URL="https://webhook.lucasfelix.com/webhook/vortex-refinada-beta-2025"`

## 🔐 Threat Model

### Webhook Security
- **Signature validation**: Verificar HMAC signatures
- **Timestamp validation**: Prevenir replay attacks
- **Rate limiting**: Limitar chamadas por origem
- **IP whitelist**: Restringir origens autorizadas

### Credit System Security
- **Transaction integrity**: Preventing double charges
- **Balance validation**: Atomic operations
- **Audit trail**: Complete transaction history
- **Fraud detection**: Unusual patterns monitoring

### Data Protection
- **Client data**: Encryption at rest and transit
- **PII handling**: Minimal exposure and proper storage
- **Backup security**: Encrypted backups
- **Access control**: Role-based permissions

## 🔢 Execution Plan

### Fase 1: Setup e Configuração Avançada
1. **Análise da Base do Plan-005**:
   - Verificar implementação completa do formulário
   - Confirmar estruturas JSON e relacionamentos
   - Testar criação e listagem de planejamentos
   - Validar esquema de IDs implementado

2. **Atualização do Schema para IA**:
   - Expandir `PlanningStatus` com novos estados
   - Adicionar campos para IA no `StrategicPlanning`:
     ```prisma
     aiGeneratedTasksJSON Json?      // Resposta do PLANNING_WEBHOOK_URL
     approvedTasksJSON    Json?      // Tarefas aprovadas pelo usuário
     aiProcessingStarted  DateTime?  // Timestamp do início
     aiProcessingCompleted DateTime? // Timestamp da conclusão
     ```
   - Criar modelo `PlanningTask` completo
   - Criar modelo `PlanningAuditLog`
   - Executar migração Prisma

3. **Configuração de Ambiente**:
   - Adicionar URLs de webhook ao `.env`
   - Configurar custos de crédito
   - Adicionar chave secreta para webhooks
   - Configurar variáveis de retry e timeout

### Fase 2: Sistema de Créditos e Webhook de Planejamento
1. **Expansão do Sistema de Créditos**:
   - Atualizar `CreditTransactionType` enum
   - Implementar funções de verificação/débito específicas
   - Criar APIs de consulta de saldo
   - Implementar transações atômicas

2. **API de Submissão para IA**:
   - `app/api/strategic-planning/[planningId]/submit-ai/route.ts`
   - Validação de dados e saldo
   - Estruturação do payload enriquecido
   - Dispatch assíncrono para `PLANNING_WEBHOOK_URL`
   - Atualização de status

3. **Webhook de Callback do Planejamento**:
   - `app/api/webhooks/planning-callback/route.ts`
   - Validação de segurança (HMAC)
   - Processamento da resposta da IA
   - Débito de créditos após sucesso
   - Notificação ao frontend

### Fase 3: Interface de Aprovação de Tarefas
1. **Componentes Base de Aprovação**:
   - `TaskApprovalInterface.tsx`: Interface principal
   - `TaskCard.tsx`: Card individual de tarefa
   - `PrioritySelector.tsx`: Seletor visual de prioridades
   - `TaskDetailsModal.tsx`: Modal para detalhes completos

2. **Funcionalidades de Interação**:
   - Sistema de seleção/desseleção
   - Edição inline de nome e descrição
   - Alteração de prioridades
   - Auto-save em localStorage
   - Contador de tarefas selecionadas

3. **Sistema de Refinamento Individual**:
   - `TaskRefinementModal.tsx`: Modal para contexto adicional
   - API `app/api/strategic-planning/[planningId]/refine-task/route.ts`
   - Webhook específico para refinamento individual
   - Atualização em tempo real da tarefa

### Fase 4: Submissão para Refinamento de Lista
1. **API de Submissão para Refinamento**:
   - `app/api/strategic-planning/[planningId]/submit-refinement/route.ts`
   - Coleta de tarefas aprovadas
   - Estruturação do payload completo
   - Envio para `REFINED_LIST_WEBHOOK_URL`

2. **Estados de Carregamento**:
   - Animações específicas para refinamento
   - Progress indicators
   - Estimativas de tempo
   - Opção de cancelamento

### Fase 5: Processamento Final e Criação de Tarefas
1. **Webhook de Lista Refinada**:
   - `app/api/webhooks/refined-list-callback/route.ts`
   - Verificação e débito de créditos
   - Sinalização para criar `PlanningTask`

2. **Criação de PlanningTask**:
   - Iteração sobre `approvedTasksJSON`
   - Construção do `refinedOutputMarkdown`
   - Criação dos registros individuais
   - Atualização de status final

3. **Construção do Output Detalhado**:
   - Templates markdown por tipo de tarefa
   - Incorporação de dados do cliente
   - Formatação de detalhamentos
   - Links e recursos adicionais

### Fase 6: Visualização de Listas Refinadas
1. **Página de Lista Refinada**:
   - `app/planejamento/[planningId]/refined-list/page.tsx`
   - Listagem de `PlanningTask` criadas
   - Filtros e busca
   - Links para detalhes

2. **Componentes de Visualização**:
   - `RefinedTaskView.tsx`: Visualização do markdown
   - `TaskHistoryView.tsx`: Histórico de modificações
   - `PlanningStats.tsx`: Estatísticas do processo
   - Integration com sistema de tarefas existente

### Fase 7: Sistema de Auditoria e Histórico
1. **Implementação de Logs**:
   - Criação automática de `PlanningAuditLog`
   - Captura de todas as modificações
   - Timestamps e contexto detalhado

2. **Interface de Histórico**:
   - Timeline visual do processo
   - Comparação de versões
   - Métricas de engajamento
   - Análise de padrões de uso

### Fase 8: Estados de Loading e Notificações
1. **Sistema de Loading States**:
   - Animações específicas por etapa
   - Progress indicators visuais
   - Feedback de tempo estimado
   - Estados de erro específicos

2. **Sistema de Notificações**:
   - Toast messages por ação
   - Notificações de conclusão
   - Alertas de erro
   - Feedback de qualidade

### Fase 9: Otimizações e Performance
1. **Cache e Performance**:
   - Cache de consultas frequentes
   - Lazy loading de componentes
   - Debounce em edições
   - Compression de payloads

2. **Monitoramento**:
   - Logs estruturados
   - Métricas de performance
   - Health checks
   - Sistema de alertas

### Fase 10: Testes Integrados e Refinamentos
1. **Testes do Fluxo Completo**:
   - Formulário → IA → Aprovação → Refinamento → Tarefas
   - Teste de todos os estados de status
   - Validação de débito de créditos
   - Teste de recuperação de erros

2. **Testes de Segurança**:
   - Validação de webhooks
   - Teste de transações de crédito
   - Verificação de autorização
   - Teste de payload maliciosos

3. **Otimizações de UX**:
   - Testes de usabilidade
   - Refinamento de animações
   - Melhoria de feedback visual
   - Acessibilidade completa

### Fase 11: Documentação e Handover
1. **Documentação Técnica Completa**:
   - Fluxo completo documentado
   - APIs e contratos
   - Estruturas JSON finais
   - Troubleshooting guide

2. **Métricas de Sucesso**:
   - KPIs de conversão
   - Métricas de qualidade
   - Performance benchmarks
   - Feedback dos usuários

3. **Preparação para Produção**:
   - Health checks finais
   - Monitoring dashboards
   - Alertas configurados
   - Backup strategies

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

### Performance e Confiabilidade
- **Tempo de resposta de webhooks**: < 30s (95th percentile)
- **Taxa de sucesso de transações de crédito**: 100%
- **Uptime do sistema**: > 99.5%
- **Recovery time de erros**: < 5 minutos

### Experiência do Usuário
- **Satisfação com tarefas geradas**: Survey qualitativo
- **Taxa de conclusão do fluxo**: % que chegam até o final
- **Tempo médio na interface de aprovação**: Métrica de UX
- **Taxa de use de funcionalidades avançadas**: Adoption metrics

### Negócio
- **Conversão para execução de tarefas**: % de `PlanningTask` executadas
- **Retenção de usuários**: Taxa que criam múltiplos planejamentos
- **ROI do sistema de créditos**: Valor percebido vs. custo
- **Crescimento de uso**: Evolução mensal de criação de planejamentos