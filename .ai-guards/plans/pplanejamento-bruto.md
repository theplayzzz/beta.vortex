---
id: plan-005
title: Sistema de Criação de Planejamento e Listas Refinadas com IA (Next.js & Webhook Focus)
createdAt: 2025-05-28
author: theplayzzz
status: draft
---

## 📝 General Project Guidelines
- **No Automatic Commits**: All code changes must be manually reviewed and committed.
- **ID Management**: Extreme care must be taken to distinguish between different ID types (`id` of a model, `clientId`, `userId`, `planningId`, `clerkId`) by thoroughly analyzing the existing `prisma.schema` and current database state before implementing new queries or relations.
- **Existing `.env` File**: A `.env` file already exists in the repository; always append new variables there and **never commit secrets**.
- **Flowchart as Source of Truth**: Before altering flows or data models, study `docs/Flowchart Vortex.mmd` to ensure every change remains aligned with the current architecture.

## 🧩 Scope

Implementar um sistema de criação de planejamentos estratégicos (backlogs) e sua subsequente conversão em listas refinadas de tarefas. O sistema utilizará a stack Next.js existente, focando na coleta de dados via formulário dinâmico multi-etapas (com lógica específica para as abas "Detalhes do Setor", "Marketing" e "Comercial"), envio de dados para webhooks externos para processamento por IA, e gerenciamento das respostas. A funcionalidade será integrada à gestão de clientes e ao sistema de créditos existentes.

### Componentes Principais:
- **Frontend (Next.js + TypeScript)**: Formulário dinâmico multi-etapas integrado à interface existente. A seleção de um dos 11 setores de mercado do cliente ocorrerá na interface de criação/edição do cliente (validação no frontend).
- **Backend (Next.js API Routes)**: APIs para validação, armazenamento de metadados, dispatch de webhooks e processamento final das tarefas refinadas.
- **Integração IA (Externa)**: Envio de dados (incluindo informações do cliente e do formulário) para webhooks pré-definidos e recebimento de respostas/sinalizações.
- **Interface de Aprovação**: Sistema para o usuário revisar, editar, selecionar e priorizar tarefas sugeridas pela IA (backlog inicial).
- **Gestão de Clientes**: Obrigatoriedade de selecionar ou criar um cliente (com `industry` preenchido com um dos 11 setores via UI) antes de iniciar o planejamento.
- **Sistema de Créditos**: Consumo de créditos do usuário para operações de IA (10 créditos para geração do backlog inicial, 10 créditos para submissão ao refinamento de lista), debitados após a disponibilização do resultado ao usuário. Valores devem ser configuráveis.
- **Feedback Visual**: Animações de carregamento no frontend durante o processamento da IA, encerradas após a conclusão do processamento no backend e disponibilização dos dados.

## ✅ Functional Requirements

### 1. Gestão de Clientes (Pré-requisito)
- A interface de criação/edição de Cliente (global na aplicação) deve restringir o campo `Client.industry` a uma seleção de 11 setores predefinidos. Esta é uma validação de UI; o banco de dados (`Client.industry`) armazena `String?`.
- A restrição aos 11 setores é **exclusivamente no frontend**; o schema Prisma continua permitindo valores livres para retro-compatibilidade e importações de dados externos.

### 2. Fluxo de Criação de Planejamento (Backlog Inicial)
- **Seleção/Criação de Cliente**: Conforme `ClientFlow` existente. O `Client.industry` selecionado é crucial para a Aba 2.

### 1. Integração com Sistema de Gestão de Clientes (Obrigatório)

#### 1.1 Modal de Seleção/Criação de Cliente
- **Reutilizar modal existente** da gestão de clientes com adaptações específicas:
  - Quando acessado da **página de clientes**: Abre o cliente selecionado
  - Quando acessado da **área de planejamento**: Abre o planejamento linkado ao cliente
- **Modificação no modal**: Campo `Client.industry` limitado a **11 opções** no frontend:
  ```typescript
  const SETORES_PERMITIDOS = [
    "Alimentação", "Saúde e Bem-estar", "Educação", "Varejo físico",
    "E-commerce", "Serviços locais", "Serviços B2B", "Tecnologia / SaaS",
    "Imobiliário", "Indústria", "Outro"
  ];
  ```
- **Validação obrigatória**: Não é possível criar planejamento sem cliente linkado
- **Fluxo de criação**: Se cliente não existe, modal permite criar novo cliente com setor obrigatório

#### 1.2 Linkagem Cliente-Planejamento
- **Relacionamento obrigatório**: Todo `StrategicPlanning` deve ter `clientId` preenchido
- **Dados combinados**: Webhook recebe informações do cliente + formulário juntos
- **Contexto enriquecido**: IA recebe dados do cliente (setor, richness score, histórico) junto com respostas do formulário

#### 1.3 Exibição do Richness Score
- **Interface de planejamento**: Exibir `Client.richnessScore` de forma visível
- **Componente visual**: Badge/indicador do nível de nutrição do cliente
- **Contexto para IA**: Richness score enviado no payload para personalizar sugestões

### 2. Fluxo de Criação de Planejamento Integrado (Backlog Inicial)

#### 2.1 Início do Processo
1. **Acesso à área de planejamento**
2. **Botão "Novo Planejamento"** → Abre modal de seleção de cliente
3. **Modal de Cliente Adaptado**:
   - Lista clientes existentes com filtros
   - Botão "Criar Novo Cliente" se necessário
   - Campo `industry` limitado aos 11 setores
   - Validação obrigatória do setor antes de prosseguir
4. **Seleção/Criação confirmada** → Redireciona para formulário de planejamento

#### 2.2 Interface do Formulário com Cliente Linkado
- **Header do formulário**: Exibe informações do cliente selecionado
  ```tsx
  <ClientHeader>
    <ClientName>{client.name}</ClientName>
    <ClientIndustry>{client.industry}</ClientIndustry>
    <RichnessScore score={client.richnessScore} />
  </ClientHeader>
  ```
- **Aba 1 modificada**: Campo "Setor" preenchido automaticamente e **readonly**
- **Aba 2**: Perguntas carregadas baseadas em `client.industry`
- **Contexto visual**: Cliente sempre visível durante preenchimento

#### 2.3 Dados Enviados para IA (Enriquecidos)
```json
{
  "planning_id": "123",
  "client_info": {
    "id": "client_456",
    "name": "Empresa XYZ Ltda",
    "industry": "E-commerce",
    "richnessScore": 85,
    "customIndustry": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "additional_context": "Cliente com alto nível de informações"
  },
  "form_submission_data": {
    "informacoes_basicas": {
      "titulo_planejamento": "Expansão Digital 2024",
      "descricao_objetivo": "Aumentar vendas online em 50%"
    },
    "detalhes_do_setor": {
      "ecom_categorias_destaque": "Eletrônicos e acessórios",
      "ecom_ticket_medio": 150
    },
    "marketing": {
      "maturidade_marketing": "Ações recorrentes, mas sem métricas",
      "meta_marketing": "Aumentar reconhecimento da marca"
    },
    "comercial": {
      "maturidade_comercial": "Processo com rotinas, sem previsibilidade",
      "meta_comercial": "Otimizar taxa de conversão"
    }
  },
  "context_enrichment": {
    "client_richness_level": "alto",
    "industry_specific_insights": true,
    "personalization_level": "avançado"
  }
}
```

#### 2.4 Formulário Dinâmico Multi-Etapas (Com Cliente Linkado)
- **Aba 1: Informações Básicas**: 
  - Título e Descrição do planejamento
  - **Campo "Setor" readonly**: Exibe `client.industry` (não editável)
  - **Badge do Richness Score**: Indicador visual do nível de nutrição do cliente
  - Se `client.industry === "Outro"`: Exibe `client.customIndustry` como informativo
- **Aba 2: Detalhes do Setor**: 
  - Campos dinâmicos carregados baseados em `client.industry`
  - Suporta tipos `text`, `textarea`, `radio`, `checkbox`, `number`
  - Lógica condicional e campos "Outro" com input adicional
  - Se nenhuma pergunta específica para o setor: mensagem informativa
- **Aba 3: Marketing**: 
  - Campo "Nível de Maturidade Marketing" (dropdown obrigatório)
  - Campo "Meta Marketing" (condicional, baseado na maturidade)
  - Campo "Meta Personalizada Marketing" (se meta = "Outro")
- **Aba 4: Comercial**: 
  - Campo "Nível de Maturidade Comercial" (dropdown obrigatório)
  - Campo "Meta Comercial" (condicional, baseado na maturidade)
  - Campo "Meta Personalizada Comercial" (se meta = "Outro")

#### 2.5 Submissão para Geração de Backlog IA
- Estruturar dados do formulário + informações completas do cliente
- Enviar para `PLANNING_WEBHOOK_URL` com payload enriquecido
- Frontend exibe animação de carregamento
- Backend armazena dados submetidos no `StrategicPlanning` com `clientId` obrigatório

### 3. Recebimento e Disponibilização do Backlog Inicial IA
- Endpoint de callback para `PLANNING_WEBHOOK_URL`.
- Backend recebe resposta (JSON com `nome_do_backlog`, `objetivo_do_backlog`, `tarefas` - estrutura de `TarefaAI`).
- Resposta é salva em `StrategicPlanning.aiGeneratedTasksJSON`.
- Backend verifica `User.creditBalance` (custo: 10 créditos). Se suficiente, debita créditos (`CONSUMPTION_PLANNING_BACKLOG_VISIBLE`).
- `StrategicPlanning.status` atualizado (e.g., `AI_BACKLOG_VISIBLE` ou `AI_BACKLOG_RECEIVED_PENDING_PAYMENT`).
- Frontend é notificado (encerra animação) e exibe as tarefas para aprovação ou mensagem de pendência.

### 4. Interface de Interação e Aprovação de Tarefas do Backlog
- Usuário visualiza tarefas de `StrategicPlanning.aiGeneratedTasksJSON` (lista de `TarefaAI`).
- **Interações do Usuário**:
    - Visualizar `descricao` completa da tarefa (e.g., tooltip/modal ao passar o mouse).
    - Editar `nome` e `descricao` da tarefa.
    - Selecionar/deselecionar tarefas para inclusão na lista refinada.
    - Definir/alterar `prioridade` da tarefa (baixa, normal, media, alta).
    - O usuário pode realizar múltiplas rodadas de edição até decidir enviar o conjunto final para refinamento.
- **Submissão para Refinamento de Lista**:
    - Backend coleta as tarefas selecionadas/editadas (lista de `TarefaAI` modificadas).
    - Salva em `StrategicPlanning.approvedTasksJSON`.
    - Enviar payload (incluindo dados do cliente, `approvedTasksJSON`) para `REFINED_LIST_WEBHOOK_URL`.
    - Frontend exibe animação de carregamento.

### 5. Processamento da Lista Refinada e Criação de `PlanningTask`
- O `REFINED_LIST_WEBHOOK_URL` apenas sinaliza que a IA externa concluiu sua parte do processamento.
- Endpoint de callback para `REFINED_LIST_WEBHOOK_URL` recebe esta sinalização.
- Backend então:
    - Verifica `User.creditBalance` (custo: 10 créditos). Se suficiente, debita créditos (`CONSUMPTION_REFINED_LIST_VISIBLE`).
    - Itera sobre `StrategicPlanning.approvedTasksJSON`.
    - Para cada tarefa aprovada, **o backend constrói o "output" detalhado (markdown)** (conforme exemplo de "Lista Refinada - output" do `formulario.md`) e cria um registro `PlanningTask`.
    - O `PlanningTask.refinedOutputMarkdown` armazena este output.
    - `StrategicPlanning.status` atualizado (e.g., `COMPLETED` ou `COMPLETED_PENDING_PAYMENT`).
- Frontend é notificado (encerra animação) e exibe as `PlanningTask` finais ou mensagem de pendência.

### 6. UI/UX
- Seção "Planejamento" unificada na sidebar.
- Listagem de `StrategicPlanning` com status claros e acesso às diferentes etapas.
- Animações de carregamento controladas pelo estado do processamento no backend.
- As animações de carregamento nos envios de webhooks devem ser encerradas imediatamente após o callback HTTP; **não utilizar websockets, SSE ou polling** para esta finalidade.

## 📋 Estrutura Detalhada do Formulário

### 1. Os 11 Setores Predefinidos

```typescript
export const SETORES = [
  "Alimentação",
  "Saúde e Bem-estar", 
  "Educação",
  "Varejo físico",
  "E-commerce",
  "Serviços locais",
  "Serviços B2B",
  "Tecnologia / SaaS",
  "Imobiliário",
  "Indústria",
  "Outro"
];
```

### 2. Estrutura das Abas do Formulário

#### Aba 1: Informações Básicas
- **titulo_planejamento** (text, obrigatório): Título do planejamento estratégico
- **descricao_objetivo** (textarea, obrigatório): Descrição detalhada do objetivo
- **setor** (readonly/informativo): Preenchido automaticamente com `Client.industry`
- **setor_personalizado** (text, condicional): Aparece apenas se `Client.industry === "Outro"`

#### Aba 2: Detalhes do Setor (Campos Dinâmicos)

**Configuração por Setor**:

**Alimentação** (`alim_`):
```typescript
[
  {
    label: "O negócio é:",
    field: "alim_tipo_negocio",
    type: "radio",
    options: ["Restaurante", "Lanchonete", "Food truck", "Delivery", "Indústria de alimentos", "Outro"]
  },
  {
    label: "Qual é o ticket médio por pedido?",
    field: "alim_ticket_medio",
    type: "number"
  },
  {
    label: "Utilizam plataformas como iFood, Rappi, etc.?",
    field: "alim_plataformas",
    type: "radio",
    options: ["Sim", "Não"]
  }
]
```

**E-commerce** (`ecom_`):
```typescript
[
  {
    label: "Quais categorias de produtos mais vendem ou são mais lucrativas?",
    field: "ecom_categorias_destaque",
    type: "textarea"
  },
  {
    label: "Vocês aplicam estratégias de upsell/cross-sell no checkout?",
    field: "ecom_upsell",
    type: "radio",
    options: ["Não aplicamos", "Sim, mas sem estrutura", "Sim, com estratégia definida", "Outro"]
  },
  {
    label: "Qual é o ticket médio atual?",
    field: "ecom_ticket_medio",
    type: "number"
  }
]
```

**Tecnologia / SaaS** (`tech_`):
```typescript
[
  {
    label: "Qual funcionalidade ou plano é mais procurado ou rentável?",
    field: "tech_funcionalidade",
    type: "textarea"
  },
  {
    label: "Existem ofertas de planos complementares ou upgrades?",
    field: "tech_planos",
    type: "radio",
    options: ["Não oferecemos", "Sim, mas sem automação", "Sim, com automação", "Outro"]
  }
]
```

**Varejo físico** (`varejo_`):
```typescript
[
  {
    label: "Quantas lojas físicas possuem atualmente?",
    field: "varejo_numero_lojas",
    type: "number"
  },
  {
    label: "Principais categorias de produtos vendidos:",
    field: "varejo_categorias_produtos",
    type: "textarea"
  },
  {
    label: "Possuem sistema de gestão integrado?",
    field: "varejo_sistema_gestao",
    type: "radio",
    options: ["Não possuímos", "Sistema básico", "Sistema completo", "Outro"]
  }
]
```

#### Aba 3: Maturidade Marketing

**Campo Principal**:
- **maturidade_marketing** (dropdown, obrigatório):
  - "Não fazemos marketing"
  - "Fazemos ações pontuais"
  - "Temos ações recorrentes, mas sem métricas"
  - "Temos estratégia definida com métricas"
  - "Marketing avançado com automação"

**Campo Condicional**:
- **meta_marketing** (dropdown, aparece se maturidade selecionada):
  - **6 metas específicas** baseadas no nível de maturidade selecionado
  - Cada nível de maturidade tem seu próprio conjunto de 6 metas
  - Se "Outro" selecionado → **meta_marketing_personalizada** (text)

#### Aba 4: Maturidade Comercial

**Campo Principal**:
- **maturidade_comercial** (dropdown, obrigatório):
  - "Não temos processo comercial estruturado"
  - "Vendas informais sem processo"
  - "Possuímos um funil de vendas claro"
  - "Processo comercial com métricas"
  - "Vendas automatizadas e otimizadas"

**Campo Condicional**:
- **meta_comercial** (dropdown, aparece se maturidade selecionada):
  - Opções baseadas na maturidade selecionada
  - Se "Outro" selecionado → **meta_comercial_personalizada** (text)

### 3. Tipos de Campos Suportados

```typescript
interface Question {
  label: string;                    // Texto da pergunta
  field: string;                    // Nome do campo (snake_case com prefixo do setor)
  type: "text" | "textarea" | "radio" | "checkbox" | "number" | "conditional";
  options?: string[];               // Opções para radio/checkbox
  conditional?: {                   // Campos condicionais
    dependsOn: string;
    showWhen: string[];
  };
}
```

### 4. Sistema de Progresso

**Distribuição por Seção**:
```typescript
const sectionWeights = {
  informacoesBasicas: 25,  // 25%
  detalhesSetor: 25,       // 25%
  marketing: 25,           // 25%
  comercial: 25            // 25%
};
```

**Cálculo Marketing/Comercial**:
- **Maturidade selecionada**: 50% da seção (12.5% total)
- **Meta selecionada**: 50% da seção (12.5% total)
- **Meta "Outro" + campo preenchido**: 100% da seção

O progresso é calculado dinamicamente:
```typescript
const updateProgress = () => {
  const requiredFields = ["titulo_planejamento", "descricao_objetivo", "maturidade_marketing", "maturidade_comercial"];
  const filledFields = requiredFields.filter(field => formData[field]?.trim());
  const sectorQuestions = formData.setor ? PERGUNTAS_POR_SETOR[formData.setor] || [] : [];
  const filledSectorFields = sectorQuestions.filter(q => formData[q.field]?.trim());
  
  const totalFields = requiredFields.length + sectorQuestions.length;
  const totalFilled = filledFields.length + filledSectorFields.length;
  const progressValue = Math.round((totalFilled / totalFields) * 100);
  
  setProgress(Math.min(progressValue, 100));
};
```

### 5. Nomenclatura de Chaves JSON

**Prefixos por Setor**:
- `alim_` - Alimentação
- `saude_` - Saúde e Bem-estar
- `edu_` - Educação
- `varejo_` - Varejo físico
- `ecom_` - E-commerce
- `servicos_` - Serviços locais
- `b2b_` - Serviços B2B
- `tech_` - Tecnologia / SaaS
- `imob_` - Imobiliário
- `ind_` - Indústria

**Contagem de Perguntas por Setor**:
- **Saúde**: 8 perguntas
- **Educação**: 8 perguntas
- **Imobiliário**: 8 perguntas
- **Varejo físico**: 8 perguntas
- **E-commerce**: 9 perguntas
- **Serviços locais**: 9 perguntas
- **B2B**: 8 perguntas
- **Tecnologia / SaaS**: 9 perguntas
- **Alimentação**: 8 perguntas
- **Outro**: 6 perguntas genéricas

**Sufixos Comuns**:
- `_tipo` - Tipo/categoria
- `_medio` - Valores médios
- `_estrategia` - Estratégias utilizadas
- `_processo` - Processos internos
- `_sistema` - Sistemas utilizados
- `_outro` - Campo personalizado

### 6. Lógica Condicional

**Campos "Outro"**: Quando uma opção "Outro" é selecionada em radio/checkbox, um campo de texto adicional aparece automaticamente com sufixo `_outro_detalhes`.

**Campos Dependentes**: Alguns campos só aparecem baseados em seleções anteriores (ex: metas só aparecem após selecionar maturidade).

**Validação Progressiva**: Campos obrigatórios são validados em tempo real, atualizando a barra de progresso.

**Exemplo de Campo Condicional**:
```typescript
{
  label: "Detalhes sobre serviços complementares",
  field: "saude_servicos_complementares_outro",
  type: "text",
  conditional: {
    dependsOn: "saude_servicos_complementares",
    showWhen: ["Outro"]
  }
}
```

### 7. Navegação e Validação entre Abas

**Fluxo de Navegação**:
```
Aba 1: [Próximo] → Validação obrigatória (título, descrição, setor)
Aba 2: [Voltar] [Próximo] → Sem validação obrigatória
Aba 3: [Voltar] [Próximo] → Sem validação obrigatória
Aba 4: [Voltar] [Finalizar] → Submissão automática
```

**Processamento de Dados**:
1. **Validação de tipos**: Números, strings, arrays
2. **Nomes descritivos**: Conversão de campos técnicos para chaves descritivas
3. **Processamento de valores**: Limpeza e formatação
4. **Estruturação JSON**: Organização em 4 seções principais
5. **Envio API**: POST com dados estruturados
6. **Webhook**: Envio automático para processamento IA

### 8. Identificadores das Abas

```typescript
const tabs = [
  "informacoes_basicas",    // Aba 1
  "detalhes_do_setor",      // Aba 2
  "marketing",              // Aba 3
  "comercial"               // Aba 4
];
```

## ⚙️ Non-Functional Requirements

### Performance
- Formulário responsivo. API Next.js rápidas. Webhook dispatches assíncronos.
- Animações de carregamento não devem bloquear a UI principal.

### Security
- Validação de dados (Zod). URLs de webhook e custos de crédito em `.env` ou config backend. Endpoints protegidos (Clerk).

### Configurabilidade
- Custos de créditos (10 para backlog, 10 para refinamento) devem ser facilmente alteráveis no código do backend (e.g., constantes carregadas de config).

### Reliability & Scalability
- Retry para envios de webhook. Logs detalhados. Tratamento de erros.
- // (Conteúdo anterior relevante mantido)

## 📚 Guidelines & Packages

### Tecnologias Base (Existentes no Projeto)
- **Framework**: Next.js (com React 19 + TypeScript)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (via Supabase) com Prisma ORM (schema existente como base)
- **Auth**: Clerk
- **UI**: Tailwind CSS, Shadcn/UI, Radix UI
- **State**: TanStack Query
- **Formulários**: React Hook Form + Zod

### Arquivos de Referência
- `docs/formulario.md` (para estrutura de formulário e JSONs)
- `docs/Flowchart Vortex.mmd` (para fluxos gerais e integração com `ClientFlow`)
- `prisma/schema.prisma` (atual, para estrutura de dados)
- `.env` (existente, para adicionar novas variáveis)

### Webhook URLs (a serem adicionadas ao `.env` existente)
- `PLANNING_WEBHOOK_URL="https://webhook.lucasfelix.com/webhook/vortex-planejamento-beta-2025"`
- `REFINED_LIST_WEBHOOK_URL="https://webhook.lucasfelix.com/webhook/vortex-refinada-beta-2025"`

## 🔐 Threat Model
- **Webhook Security**: Validar callbacks (e.g., secrets compartilhados).
- **Credit System**: Transações atômicas para débito de crédito após sucesso da operação.
- **Data Integrity**: Consistência entre `StrategicPlanning` e `PlanningTask`.
- // (Conteúdo anterior relevante mantido)

## 🔢 Execution Plan

### Fase 0: Configuração, Modelagem de Dados e Setup Inicial
1.  **Variáveis de Ambiente e Configuração de Custos**: `.env` existente; `COST_PLANNING_BACKLOG_VISIBLE = 10`, `COST_REFINED_LIST_VISIBLE = 10` no backend.
2.  **Análise e Atualização do Schema Prisma** (Conforme IDs, `prisma/schema.prisma` atual):
    *   Antes de qualquer migração, revisar cuidadosamente `docs/Flowchart Vortex.mmd` **e** o banco de dados atual para mapear relacionamentos e evitar confusões entre chaves (`id`, `clientId`, `userId`, `planningId`, `clerkId`).
    *   **Client**: `industry: String?`.
    *   **StrategicPlanning**:
        *   `PlanningStatus` enum: `DRAFT`, `PENDING_AI_BACKLOG_GENERATION`, `AI_BACKLOG_RECEIVED_PENDING_PAYMENT`, `AI_BACKLOG_VISIBLE`, `USER_APPROVAL_PENDING_REFINEMENT_SUBMISSION`, `REFINEMENT_SUBMITTED_PENDING_CALLBACK`, `REFINEMENT_CALLBACK_RECEIVED_PENDING_TASKS_PAYMENT`, `COMPLETED`, `FAILED_PROCESSING`.
        *   Campos: `setor` (copiado de `Client.industry`), `formDataJSON` (para armazenar toda a estrutura do formulário, incluindo as novas abas Marketing/Comercial), `aiGeneratedTasksJSON` (estrutura `TarefaAI`), `approvedTasksJSON`.
    *   **PlanningTask**: Adicionar `refinedOutputMarkdown: String?`.
    *   **CreditTransactionType**: `CONSUMPTION_PLANNING_BACKLOG_VISIBLE`, `CONSUMPTION_REFINED_LIST_VISIBLE`.
3.  **Executar Migração Prisma**.
4.  **Gerar/Atualizar Tipos TypeScript**.

### Fase 0: Configuração, Modelagem de Dados e Setup Inicial (Integração com Clientes)
1.  **Variáveis de Ambiente e Configuração de Custos**: `.env` existente; `COST_PLANNING_BACKLOG_VISIBLE = 10`, `COST_REFINED_LIST_VISIBLE = 10` no backend.
2.  **Análise e Atualização do Schema Prisma** (Integração com Sistema de Clientes):
    *   Antes de qualquer migração, revisar cuidadosamente `docs/Flowchart Vortex.mmd` **e** o banco de dados atual para mapear relacionamentos e evitar confusões entre chaves (`id`, `clientId`, `userId`, `planningId`, `clerkId`).
    *   **Client** (modelo existente - apenas validação frontend):
        *   `industry: String?` - Continua flexível no banco
        *   `richnessScore: Int?` - Score de nutrição existente
        *   `customIndustry: String?` - Campo para setor personalizado
    *   **StrategicPlanning** (atualização para integração):
        *   **`clientId: String` (OBRIGATÓRIO)** - Relacionamento com Client
        *   `PlanningStatus` enum: `DRAFT`, `PENDING_CLIENT_SELECTION`, `PENDING_AI_BACKLOG_GENERATION`, `AI_BACKLOG_RECEIVED_PENDING_PAYMENT`, `AI_BACKLOG_VISIBLE`, `USER_APPROVAL_PENDING_REFINEMENT_SUBMISSION`, `REFINEMENT_SUBMITTED_PENDING_CALLBACK`, `REFINEMENT_CALLBACK_RECEIVED_PENDING_TASKS_PAYMENT`, `COMPLETED`, `FAILED_PROCESSING`.
        *   Campos existentes: `formDataJSON`, `aiGeneratedTasksJSON`, `approvedTasksJSON`
        *   **Novos campos**: `clientSnapshot: Json?` (snapshot dos dados do cliente no momento da criação)
    *   **PlanningTask** (atualização para contexto do cliente):
        *   Campos existentes: `refinedOutputMarkdown: String?`
        *   **Novos campos**: `clientContext: Json?` (contexto do cliente para a tarefa)
    *   **CreditTransactionType**: `CONSUMPTION_PLANNING_BACKLOG_VISIBLE`, `CONSUMPTION_REFINED_LIST_VISIBLE`.
    *   **Relacionamentos**:
        ```prisma
        model StrategicPlanning {
          // ... campos existentes
          clientId String
          client   Client @relation(fields: [clientId], references: [id])
          
          @@index([clientId])
          @@index([userId, clientId])
        }
        ```

### Fase 1: UI Cliente e Desenvolvimento do Formulário de Planejamento Detalhado (Frontend)
1.  **Atualização UI Criação/Edição de Cliente**: Campo `industry` como select dos 11 setores.
2.  **Fluxo de Início do Planejamento**: Conforme `ClientFlow`, garantindo `Client.industry`.
3.  **Componente `PlanningForm.tsx`**:
    *   Implementar lógica das 4 abas conforme detalhado em "Functional Requirements":
        *   **Aba 1 (Informações Básicas)**: Título, Descrição. Lógica para "Setor Personalizado" se `Client.industry == 'Outro'` (se aplicável, senão usar `Client.customIndustry`).
        *   **Aba 2 (Detalhes do Setor)**: Renderizar campos dinâmicos de `lib/formConfig.ts` (ou similar) baseados em `Client.industry`. Suportar tipos de campo, condicionais e opções "Outro".
        *   **Aba 3 (Marketing)**: Dropdown de Nível de Maturidade. Se selecionado, mostrar dropdown de Metas de Marketing (opções baseadas na maturidade). Se meta = "Outro", mostrar campo de texto para meta personalizada.
        *   **Aba 4 (Comercial)**: Similar à Aba 3, mas para Maturidade e Metas Comerciais.
    *   React Hook Form + Zod. Persistência localStorage. Chaves `formDataJSON` descritivas.

### Fase 1: Integração UI Cliente e Desenvolvimento do Formulário (Frontend Integrado)
1.  **Adaptação do Modal de Cliente Existente**:
    *   Modificar modal existente para limitar `Client.industry` aos 11 setores no frontend
    *   Manter funcionalidade de criação/edição de cliente
    *   Adicionar contexto de "seleção para planejamento" vs "edição de cliente"
2.  **Fluxo de Início do Planejamento Integrado**:
    *   **Botão "Novo Planejamento"** → Abre modal de seleção de cliente
    *   **Validação obrigatória**: Cliente deve ser selecionado/criado antes de prosseguir
    *   **Redirecionamento**: Após seleção, redireciona para formulário com `clientId` na URL
3.  **Componente `PlanningForm.tsx` (Com Cliente Linkado)**:
    *   **Props obrigatórias**: `clientId` e dados do cliente carregados
    *   **Header do formulário**: Exibição permanente do cliente selecionado
    *   **Componente `ClientHeader.tsx`**:
        ```tsx
        interface ClientHeaderProps {
          client: {
            id: string;
            name: string;
            industry: string;
            richnessScore: number;
            customIndustry?: string;
          };
        }
        ```
    *   **Implementação das 4 abas integradas**:
        *   **Aba 1 (Informações Básicas)**: 
            - Título e Descrição do planejamento
            - Campo "Setor" readonly exibindo `client.industry`
            - Badge do `richnessScore` visível
        *   **Aba 2 (Detalhes do Setor)**: 
            - Campos dinâmicos baseados em `client.industry`
            - Carregamento de `lib/formConfig.ts` com setor do cliente
        *   **Aba 3 (Marketing)**: Dropdown de Maturidade + Metas condicionais
        *   **Aba 4 (Comercial)**: Dropdown de Maturidade + Metas condicionais
    *   **Validação e persistência**: React Hook Form + Zod + localStorage com `clientId`
4.  **Componente `RichnessScoreBadge.tsx`**:
    *   Exibição visual do score de nutrição do cliente
    *   Cores e ícones baseados no nível (baixo/médio/alto)
    *   Tooltip explicativo sobre o significado do score

### Fase 2: Submissão para Geração de Backlog IA (Backend + Frontend)
1.  **API Backend (`app/api/strategic-planning/submit-backlog/route.ts` - POST)**:
    *   Recebe `clientId`, `formDataJSON` (incluindo dados das abas Marketing/Comercial).
    *   Cria `StrategicPlanning` (status `PENDING_AI_BACKLOG_GENERATION`).
    *   Payload para `PLANNING_WEBHOOK_URL` (com `planning_id`, `client_info`, `form_submission_data`).
    *   Dispatch assíncrono. Retorna ID e status.
2.  **Frontend**: Inicia animação de carregamento.

### Fase 2: Submissão para Geração de Backlog IA (Backend + Frontend Integrado)
1.  **API Backend (`app/api/strategic-planning/submit-backlog/route.ts` - POST)**:
    *   **Recebe**: `clientId` (obrigatório), `formDataJSON` (4 abas completas)
    *   **Validações**:
        - Verificar se `clientId` existe e pertence ao usuário
        - Validar se `client.industry` está preenchido
        - Verificar saldo de créditos do usuário
    *   **Buscar dados completos do cliente**:
        ```typescript
        const client = await prisma.client.findFirst({
          where: { id: clientId, userId: userId },
          select: {
            id: true,
            name: true,
            industry: true,
            richnessScore: true,
            customIndustry: true,
            createdAt: true
          }
        });
        ```
    *   **Criar `StrategicPlanning`** com linkagem obrigatória:
        ```typescript
        const planning = await prisma.strategicPlanning.create({
          data: {
            clientId: clientId,
            userId: userId,
            formDataJSON: formDataJSON,
            clientSnapshot: client, // Snapshot dos dados do cliente
            status: 'PENDING_AI_BACKLOG_GENERATION'
          }
        });
        ```
    *   **Payload enriquecido para `PLANNING_WEBHOOK_URL`**:
        - `planning_id`: ID do planejamento criado
        - `client_info`: Dados completos do cliente + richness score
        - `form_submission_data`: Dados das 4 abas do formulário
        - `context_enrichment`: Nível de personalização baseado no richness score
    *   **Dispatch assíncrono** com dados enriquecidos
    *   **Retorna**: `planningId`, `clientInfo`, `status`
2.  **Frontend**: 
    *   Inicia animação de carregamento
    *   Exibe informações do cliente durante o carregamento
    *   Mantém contexto do cliente visível

### Fase 3: Recebimento do Backlog IA, Interface de Aprovação e Débito de Créditos (Backend + Frontend)
1.  **API Backend (`app/api/webhooks/planning-callback/route.ts` - POST)**:
    *   Recebe resposta JSON (`aiGeneratedTasksJSON` com estrutura `TarefaAI`).
    *   Salva em `StrategicPlanning.aiGeneratedTasksJSON`.
    *   Verifica créditos (`COST_PLANNING_BACKLOG_VISIBLE`). Se OK, debita e status = `AI_BACKLOG_VISIBLE`. Senão, status = `AI_BACKLOG_RECEIVED_PENDING_PAYMENT`.
    *   Notifica frontend.
2.  **Frontend (`app/planejamento/[planningId]/approve/page.tsx`)**:
    *   Encerra animação. Exibe tarefas ou mensagem de pendência.
3.  **Componente `TaskApprovalView.tsx`**:
    *   Exibe `TarefaAI` de `aiGeneratedTasksJSON`.
    *   Permite: ver descrição (hover/modal), editar nome/descrição, selecionar/deselecionar, definir prioridade (baixa, normal, media, alta).

### Fase 4: Submissão para Refinamento de Lista (Backend + Frontend)
1.  **Frontend**: Usuário submete tarefas aprovadas/editadas.
2.  **API Backend (`app/api/strategic-planning/[planningId]/submit-refinement/route.ts` - POST)**:
    *   Recebe `approvedTasksJSON` (lista de `TarefaAI` modificadas).
    *   Salva em `StrategicPlanning.approvedTasksJSON`.
    *   Payload para `REFINED_LIST_WEBHOOK_URL` (com `planning_id`, `client_info`, `tasks_for_refinement`).
    *   Dispatch assíncrono. Atualiza status para `REFINEMENT_SUBMITTED_PENDING_CALLBACK`.
    *   Retorna status.
3.  **Frontend**: Inicia animação de carregamento.

### Fase 5: Processamento Final, Criação de `PlanningTask` e Débito de Créditos (Backend + Frontend)
1.  **API Backend (`app/api/webhooks/refined-list-callback/route.ts` - POST)**:
    *   Recebe sinalização de conclusão do `REFINED_LIST_WEBHOOK_URL`.
    *   Verifica créditos (`COST_REFINED_LIST_VISIBLE`). Se OK, debita. Senão, status = `REFINEMENT_CALLBACK_RECEIVED_PENDING_TASKS_PAYMENT`.
    *   Notifica frontend.
2.  **Lógica de Criação de `PlanningTask` (Backend)**:
    *   Se pagamento OK:
        *   Itera `StrategicPlanning.approvedTasksJSON`.
        *   Para cada `TarefaAI` aprovada, cria `PlanningTask`, construindo `refinedOutputMarkdown` (texto detalhado e formatado pelo nosso backend).
        *   Atualiza `StrategicPlanning.status` para `COMPLETED`.
3.  **Frontend**: Encerra animação. Exibe link para `PlanningTask` ou mensagem de pendência.
4.  **Visualização das `PlanningTask`**.

### Fase 6: Testes Finais, Ajustes de UX e Documentação
1.  Testes completos do fluxo, incluindo todos os estados de status e pagamento de créditos.
2.  Verificação das animações de carregamento e notificações ao frontend.
3.  Validação das estruturas JSON enviadas e recebidas.
4.  Documentação técnica interna.

### Fase 7: Interface de Aprovação e Edição de Tarefas (Frontend Avançado)
1.  **Componente `TaskApprovalInterface.tsx`**:
    *   Exibição visual das tarefas com cards organizados
    *   Sistema de seleção/desseleção com checkboxes
    *   Interface de edição inline para nome e descrição
    *   Dropdown visual para alteração de prioridades (🔵 Baixa, 🟡 Normal, 🟠 Média, 🔴 Alta)
    *   Expansão/colapso para visualizar detalhamentos completos
2.  **Funcionalidades de Interação**:
    *   **Edição em tempo real**: Salvar automaticamente alterações de nome/descrição
    *   **Visualização de detalhamentos**: Modal/tooltip para mostrar subtarefas e origem dos insights
    *   **Sistema de prioridades visuais**: Interface com cores e ícones
    *   **Contador de tarefas selecionadas**: Feedback visual do progresso
3.  **Refinamento Individual de Tarefas**:
    *   Botão "Refinar Tarefa" para cada item
    *   Modal para adicionar contexto adicional
    *   Campo "Detalhamento Adicional" para observações do usuário
    *   Envio individual para IA reprocessar tarefa específica

### Fase 8: Sistema de Refinamento Individual e Reprocessamento (Backend + Frontend)
1.  **API Backend (`app/api/strategic-planning/[planningId]/refine-task/route.ts` - POST)**:
    *   Recebe `taskIndex`, `additionalContext`, `userModifications`
    *   Marca tarefa como `refeito: true` e adiciona `detalhamento_adicional_usuario`
    *   Envia tarefa específica para webhook de refinamento individual
    *   Atualiza `StrategicPlanning.aiGeneratedTasksJSON` com versão refinada
2.  **Webhook de Refinamento Individual**:
    *   Endpoint específico para reprocessar tarefas individuais
    *   Payload inclui contexto original + modificações do usuário
    *   Resposta substitui tarefa específica no array
3.  **Frontend de Refinamento**:
    *   Animação de carregamento específica para tarefa sendo refinada
    *   Atualização em tempo real da tarefa reprocessada
    *   Histórico de refinamentos aplicados

### Fase 9: Aprovação Final e Criação de Lista Refinada (Backend + Frontend)
1.  **Processo de Aprovação Final**:
    *   Filtrar apenas tarefas com `selecionada: true`
    *   Salvar em `StrategicPlanning.approvedTasksJSON` com todas as modificações
    *   Atualizar status para `USER_APPROVAL_COMPLETED`
2.  **API Backend (`app/api/strategic-planning/[planningId]/create-refined-list/route.ts` - POST)**:
    *   Processa `approvedTasksJSON` para criar tarefas individuais
    *   Para cada tarefa aprovada, cria registro `PlanningTask` com:
        *   `title`: Nome editado pelo usuário
        *   `description`: Descrição editada pelo usuário  
        *   `priority`: Prioridade definida pelo usuário
        *   `planejamentoInformacoes`: Detalhamentos originais da IA (JSON)
        *   `planejamentoFinal`: Versão final aprovada pelo usuário (JSON)
        *   `refinedOutputMarkdown`: Output detalhado construído pelo backend
3.  **Webhook de Lista Refinada Final**:
    *   Envio para `REFINED_LIST_WEBHOOK_URL` com payload completo:
        *   `total_tarefas`: Número total de tarefas geradas pela IA
        *   `tarefas_aprovadas`: Número de tarefas selecionadas pelo usuário
        *   `contexto_original`: Dados do formulário original
        *   `refinamentos_aplicados`: Histórico de modificações do usuário
        *   `lista_final`: Array de tarefas aprovadas com todas as modificações

### Fase 10: Visualização e Gestão da Lista Refinada Final (Frontend)
1.  **Página de Lista Refinada (`app/planejamento/[planningId]/refined-list/page.tsx`)**:
    *   Exibição das `PlanningTask` criadas
    *   Interface para visualizar `refinedOutputMarkdown` formatado
    *   Links para editar tarefas individuais
    *   Histórico completo do processo (formulário → IA → aprovação → refinamento)
2.  **Componente `RefinedTaskView.tsx`**:
    *   Visualização rica do markdown de cada tarefa
    *   Informações de contexto (origem, refinamentos aplicados)
    *   Status de execução das tarefas
    *   Integração com sistema de tarefas existente

### Fase 11: Histórico e Auditoria Completa (Backend + Frontend)
1.  **Sistema de Auditoria**:
    *   Log completo de todas as modificações do usuário
    *   Timestamps de cada etapa do processo
    *   Histórico de refinamentos individuais aplicados
    *   Métricas de uso (tempo gasto, número de edições, etc.)
2.  **Interface de Histórico**:
    *   Timeline visual do processo completo
    *   Comparação entre versão original da IA e versão final aprovada
    *   Estatísticas de aprovação/rejeição de tarefas
    *   Feedback para melhoria do sistema

## 📊 Estruturas JSON Padronizadas

### `StrategicPlanning.formDataJSON` (Armazenado no DB)
```json
{
  "informacoes_basicas": {
    "titulo_planejamento": "Expansão para Novo Mercado Regional",
    "descricao_objetivo": "Definir estratégias para penetrar no mercado do Nordeste em 2026."
    // O setor vem do Client.industry e Client.customIndustry (se aplicável)
  },
  "detalhes_do_setor": { // Chaves são perguntas em snake_case
    // Exemplo para Client.industry = "Varejo físico"
    "varejo_numero_de_lojas_atuais": 5,
    "varejo_principais_categorias_de_produtos": "Eletrônicos, Vestuário",
    "varejo_campo_outro_exemplo_se_radio_selecionado": "Detalhe específico do usuário para opção Outro"
  },
  "marketing": {
    "maturidade_marketing": "Temos ações recorrentes, mas sem métricas", // Valor do dropdown de maturidade
    "meta_marketing": "Aumentar reconhecimento da marca" // Valor do dropdown de meta ou texto da meta personalizada
  },
  "comercial": {
    "maturidade_comercial": "Possuímos um funil de vendas claro",
    "meta_comercial": "Otimizar taxa de conversão do funil"
  }
}
```

### Payload para `PLANNING_WEBHOOK_URL` (Enviado para a API externa)
// ... (manter exemplo anterior, já inclui client_info e form_submission_data)

### `StrategicPlanning.formDataJSON` (Armazenado no DB - Integrado com Cliente)
```json
{
  "client_context": {
    "client_id": "client_456",
    "client_name": "Empresa XYZ Ltda",
    "industry": "E-commerce",
    "richness_score": 85,
    "custom_industry": null
  },
  "informacoes_basicas": {
    "titulo_planejamento": "Expansão Digital 2024",
    "descricao_objetivo": "Aumentar vendas online em 50%"
  },
  "detalhes_do_setor": {
    "ecom_categorias_destaque": "Eletrônicos e acessórios",
    "ecom_ticket_medio": 150,
    "ecom_upsell": "Sim, mas sem estrutura"
  },
  "marketing": {
    "maturidade_marketing": "Ações recorrentes, mas sem métricas",
    "meta_marketing": "Aumentar reconhecimento da marca"
  },
  "comercial": {
    "maturidade_comercial": "Processo com rotinas, sem previsibilidade",
    "meta_comercial": "Otimizar taxa de conversão do funil"
  }
}
```

### `StrategicPlanning.clientSnapshot` (Snapshot do Cliente no Momento da Criação)
```json
{
  "id": "client_456",
  "name": "Empresa XYZ Ltda",
  "industry": "E-commerce",
  "richnessScore": 85,
  "customIndustry": null,
  "createdAt": "2024-01-01T00:00:00Z",
  "snapshot_timestamp": "2024-01-15T10:30:00Z",
  "additional_context": {
    "richness_level": "alto",
    "data_completeness": "95%",
    "last_interaction": "2024-01-10T14:20:00Z"
  }
}
```

### Payload para `PLANNING_WEBHOOK_URL` (Integrado com Cliente)
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
    "data_quality": "alto",
    "context_level": "avançado"
  },
  "form_submission_data": {
    "informacoes_basicas": {
      "titulo_planejamento": "Expansão Digital 2024",
      "descricao_objetivo": "Aumentar vendas online em 50%"
    },
    "detalhes_do_setor": {
      "ecom_categorias_destaque": "Eletrônicos e acessórios",
      "ecom_ticket_medio": 150,
      "ecom_upsell": "Sim, mas sem estrutura"
    },
    "marketing": {
      "maturidade_marketing": "Ações recorrentes, mas sem métricas",
      "meta_marketing": "Aumentar reconhecimento da marca"
    },
    "comercial": {
      "maturidade_comercial": "Processo com rotinas, sem previsibilidade",
      "meta_comercial": "Otimizar taxa de conversão do funil"
    }
  },
  "context_enrichment": {
    "client_richness_level": "alto",
    "industry_specific_insights": true,
    "personalization_level": "avançado",
    "data_completeness": 95,
    "recommended_task_complexity": "intermediário-avançado"
  },
  "user_context": {
    "user_id": "user_789",
    "credit_balance": 150,
    "previous_plannings": 3
  }
}
```

### `StrategicPlanning.aiGeneratedTasksJSON` (Resposta do `PLANNING_WEBHOOK_URL` - Formato `TarefaAI`)
Conforme o exemplo de "planejamento" fornecido pelo usuário, adaptado para uma lista de objetos `TarefaAI`:
```json
{ // Objeto raiz, assumindo que a resposta do webhook é esta estrutura direta
  "nome_do_backlog": "Backlog Estratégico 60 dias - Advocacia Info-produtor",
  "objetivo_do_backlog": "Estruturar e profissionalizar o marketing e o comercial para aumentar vendas...",
  "tarefas": [
    {
      "nome": "Configuração do Gerenciador de Anúncios (Meta Ads)",
      "descricao": "Criar e configurar la conta de anúncios no Meta Ads para começar as campanhas de mídia paga de forma profissional.",
      "prioridade": "alta", // Sugestão da IA
      "selecionada": true, // Frontend pode pré-selecionar todas
      "detalhamentos": [] // Estrutura para detalhamentos, se houver
    },
    // ...demais tarefas conforme o exemplo de planejamento do usuário
    {
      "nome": "Envio de Feedback Semanal à Agência",
      "descricao": "Enviar relatórios informais sobre evolução dos leads, vendas e dúvidas à agência, facilitando ajustes rápidos de estratégia.",
      "prioridade": "normal",
      "selecionada": true,
      "detalhamentos": []
    }
  ]
}
```

### `StrategicPlanning.approvedTasksJSON` (Tarefas editadas/selecionadas pelo usuário, armazenadas no DB)
Array de objetos `TarefaAI` como definido acima, mas refletindo as edições e seleções do usuário.
```json
[
  {
    "nome": "SUPER Configuração Otimizada do Gerenciador de Anúncios (Meta Ads)", // Nome editado
    "descricao": "Criar, configurar E VALIDAR a conta de anúncios no Meta Ads...", // Descrição editada
    "prioridade": "URGENT", // Prioridade definida pelo usuário
    "selecionada": true, // Confirmado para envio ao refinamento
    "detalhamentos": [],
    "detalhamento_adicional_usuario": "Focar em lookalike do público comprador atual."
  }
  // ... apenas as tarefas que o usuário marcou como "selecionada: true"
]
```

### Payload para `REFINED_LIST_WEBHOOK_URL` (Enviado para a API externa)
// ... (manter exemplo anterior, já inclui client_info e tasks_for_refinement com approvedTasksJSON)

### `PlanningTask.refinedOutputMarkdown` (String, armazenado no DB para cada `PlanningTask`)
// ... (manter exemplo anterior, já descreve o formato markdown construído pelo backend)

### Estruturas JSON para Refinamento Individual

#### Payload para Refinamento Individual de Tarefa
```json
{
  "planning_id": "123",
  "task_index": 2,
  "original_task": {
    "nome": "Configuração do Gerenciador de Anúncios",
    "descricao": "Criar e configurar conta de anúncios no Meta Ads",
    "prioridade": "alta"
  },
  "user_modifications": {
    "nome": "SUPER Configuração Otimizada do Meta Ads",
    "descricao": "Criar, configurar E VALIDAR a conta de anúncios...",
    "prioridade": "URGENT"
  },
  "additional_context": "Focar em lookalike do público comprador atual",
  "client_info": {
    "industry": "E-commerce",
    "maturidade_marketing": "Ações recorrentes, mas sem métricas"
  }
}
```

#### Resposta do Refinamento Individual
```json
{
  "task_index": 2,
  "refined_task": {
    "nome": "Configuração Estratégica do Meta Ads com Lookalike",
    "descricao": "Criar e configurar conta de anúncios no Meta Ads focando em audiências lookalike do público comprador atual, incluindo validação completa da configuração",
    "prioridade": "alta",
    "detalhamentos": [
      {
        "texto": "Configurar pixel de conversão para rastreamento",
        "origem": "refinamento_usuario"
      },
      {
        "texto": "Criar audiência lookalike baseada em compradores",
        "origem": "contexto_adicional"
      }
    ],
    "refeito": true,
    "refinamento_aplicado": "Adicionado foco em lookalike e validação"
  }
}
```

### Estruturas JSON para Lista Refinada Final

#### `PlanningTask` (Modelo do Banco de Dados)
```json
{
  "id": "task_001",
  "title": "Configuração Estratégica do Meta Ads com Lookalike",
  "description": "Versão final editada pelo usuário",
  "priority": "alta",
  "status": "pending",
  "userId": "user_123",
  "planningId": "planning_456",
  "planejamentoInformacoes": {
    "detalhamentos_originais": [
      {
        "texto": "Configurar conta básica do Meta Ads",
        "origem": "ia_inicial"
      }
    ],
    "contexto_setor": "E-commerce",
    "maturidade_base": "Ações recorrentes, mas sem métricas"
  },
  "planejamentoFinal": {
    "nome_final": "Configuração Estratégica do Meta Ads com Lookalike",
    "descricao_final": "Versão final com todas as modificações",
    "prioridade_final": "alta",
    "refinamentos_aplicados": 2,
    "contexto_adicional_usuario": "Focar em lookalike do público comprador atual"
  },
  "refinedOutputMarkdown": "# Configuração Estratégica do Meta Ads\n\n## Objetivo\n...",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:45:00Z"
}
```

#### Webhook de Lista Refinada Final
```json
{
  "event": "refined_list_created",
  "timestamp": "2024-01-15T11:45:00Z",
  "data": {
    "planning_id": "planning_456",
    "user_id": "user_123",
    "client_id": "client_789",
    "estatisticas": {
      "total_tarefas_geradas": 15,
      "tarefas_aprovadas": 8,
      "tarefas_rejeitadas": 7,
      "refinamentos_individuais": 3,
      "tempo_total_processo": "35 minutos"
    },
    "contexto_original": {
      "setor": "E-commerce",
      "maturidade_marketing": "Ações recorrentes, mas sem métricas",
      "maturidade_comercial": "Processo com rotinas, sem previsibilidade",
      "dados_formulario": {
        "ecom_categorias_destaque": "Eletrônicos e acessórios",
        "ecom_ticket_medio": 150
      }
    },
    "refinamentos_aplicados": [
      {
        "task_index": 2,
        "tipo": "refinamento_individual",
        "contexto_adicional": "Focar em lookalike do público comprador atual"
      },
      {
        "task_index": 5,
        "tipo": "edicao_usuario",
        "modificacoes": ["nome", "descricao", "prioridade"]
      }
    ],
    "lista_final": [
      {
        "task_id": "task_001",
        "nome": "Configuração Estratégica do Meta Ads com Lookalike",
        "prioridade": "alta",
        "status_aprovacao": "aprovada_com_modificacoes"
      }
    ]
  }
}
```

### Estruturas JSON para Sistema de Auditoria

#### Log de Modificações do Usuário
```json
{
  "planning_id": "planning_456",
  "user_id": "user_123",
  "audit_log": [
    {
      "timestamp": "2024-01-15T10:35:00Z",
      "action": "task_selection_changed",
      "task_index": 2,
      "details": {
        "from": false,
        "to": true
      }
    },
    {
      "timestamp": "2024-01-15T10:37:00Z",
      "action": "task_name_edited",
      "task_index": 2,
      "details": {
        "from": "Configuração do Gerenciador de Anúncios",
        "to": "SUPER Configuração Otimizada do Meta Ads"
      }
    },
    {
      "timestamp": "2024-01-15T10:40:00Z",
      "action": "priority_changed",
      "task_index": 2,
      "details": {
        "from": "alta",
        "to": "URGENT"
      }
    },
    {
      "timestamp": "2024-01-15T10:42:00Z",
      "action": "individual_refinement_requested",
      "task_index": 2,
      "details": {
        "additional_context": "Focar em lookalike do público comprador atual"
      }
    },
    {
      "timestamp": "2024-01-15T11:45:00Z",
      "action": "final_approval",
      "details": {
        "approved_tasks": 8,
        "total_tasks": 15
      }
    }
  ],
  "metricas": {
    "tempo_total_sessao": "70 minutos",
    "numero_edicoes": 12,
    "refinamentos_individuais": 3,
    "taxa_aprovacao": "53%"
  }
}
```

## 🎯 Success Metrics
- Taxa de conclusão do formulário de planejamento.
- Número de planejamentos enviados para geração de backlog IA.
- Taxa de aprovação/modificação de tarefas sugeridas pela IA.
- Número de listas refinadas geradas (conversão para `PlanningTask`).
- Consumo de créditos alinhado com o uso da funcionalidade.
- Feedback qualitativo dos usuários sobre a clareza do processo e utilidade dos resultados.

### Métricas Específicas do Fluxo de Aprovação e Refinamento

#### Engajamento do Usuário
- **Taxa de aprovação de tarefas**: Percentual de tarefas geradas pela IA que são aprovadas pelos usuários
- **Número médio de edições por tarefa**: Quantas modificações os usuários fazem em cada tarefa
- **Tempo médio de sessão de aprovação**: Quanto tempo os usuários gastam revisando e editando tarefas
- **Taxa de uso do refinamento individual**: Percentual de usuários que utilizam a funcionalidade de refinar tarefas específicas

#### Qualidade das Tarefas Geradas
- **Taxa de tarefas aprovadas sem modificação**: Percentual de tarefas aceitas exatamente como geradas pela IA
- **Tipos de modificações mais comuns**: Análise de quais campos são mais editados (nome, descrição, prioridade)
- **Efetividade do refinamento individual**: Comparação da satisfação antes e depois do refinamento

#### Performance do Sistema
- **Tempo de resposta dos webhooks**: Latência entre envio e recebimento das respostas da IA
- **Taxa de sucesso dos refinamentos individuais**: Percentual de refinamentos que são processados com sucesso
- **Tempo médio para completar o fluxo completo**: Do formulário inicial até a lista refinada final

#### Métricas de Negócio
- **Conversão de planejamento para execução**: Quantos planejamentos resultam em tarefas efetivamente executadas
- **Satisfação do usuário com as tarefas refinadas**: Feedback qualitativo sobre a utilidade das tarefas finais
- **Retenção de usuários**: Taxa de usuários que criam múltiplos planejamentos
- **ROI do sistema de créditos**: Análise do valor percebido vs. créditos consumidos

#### Métricas de Auditoria e Melhoria
- **Padrões de uso por setor**: Análise de como diferentes setores utilizam o sistema
- **Eficácia das sugestões de prioridade da IA**: Quantas prioridades sugeridas são mantidas pelos usuários
- **Feedback para melhoria da IA**: Identificação de padrões nas modificações para treinar melhor a IA
