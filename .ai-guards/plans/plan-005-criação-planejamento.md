# Plan 005: Criação de Planejamento e Painel de Planejamento

---
id: plan-005
title: Sistema de Criação de Planejamento e Painel de Planejamento (Next.js & Setup Inicial)
createdAt: 2025-05-28
author: theplayzzz
status: draft
---

## 📝 General Project Guidelines
- **No Automatic Commits**: All code changes must be manually reviewed and committed.
- **ID Management**: Extreme care must be taken to distinguish between different ID types (`id` of a model, `clientId`, `userId`, `planningId`, `clerkId`) by thoroughly analyzing the existing `prisma.schema` and current database state before implementing new queries or relations.
- **Existing `.env` File**: A `.env` file already exists in the repository; always append new variables there and **never commit secrets**.
- **Flowchart as Source of Truth**: Before altering flows or data models, study `docs/Flowchart Vortex.mmd` to ensure every change remains aligned with the current architecture.

## 📚 **ARQUIVOS DE REFERÊNCIA DA FASE 0** 

⚠️ **IMPORTANTE**: Os seguintes arquivos foram criados durante a Fase 0 e contêm informações críticas para a execução das próximas fases. **CONSULTE ESTES ARQUIVOS SEMPRE QUE NECESSÁRIO**:

### 🔍 **Análise Técnica Completa**
- **`.ai-guards/plans/fase-0-analise-banco-dados-setup.md`**
  - Mapeamento completo de todos os 13 modelos do schema Prisma
  - Identificação de 7 tipos diferentes de ID e seus relacionamentos
  - Análise do modelo `StrategicPlanning` existente (descoberta importante!)
  - Verificação de integridade referencial
  - Configuração de variáveis de ambiente
  - **CONSULTAR**: Sempre que precisar entender relacionamentos entre modelos ou tipos de ID

### 📊 **Estruturas JSON e Validação**
- **`.ai-guards/plans/estruturas-json-plan-005.md`**
  - Schema completo do `formDataJSON` (4 abas do formulário)
  - Configuração de perguntas por setor (11 setores)
  - Estrutura do `clientSnapshot`
  - Schemas de validação Zod
  - Payloads para webhooks (plan-006)
  - **CONSULTAR**: Durante implementação do formulário, validação e APIs

### 📋 **Resumo Executivo**
- **`.ai-guards/plans/fase-0-resumo-executivo.md`**
  - Status completo da Fase 0 executada
  - Descobertas críticas e pontos de atenção
  - Estruturas preparadas e métricas de sucesso
  - **CONSULTAR**: Para visão geral do que foi realizado na Fase 0

### 🗑️ **INSTRUÇÕES PARA EXCLUSÃO DOS ARQUIVOS**

**QUANDO EXCLUIR**: Após a conclusão completa do plan-005 (todas as 7 fases), os arquivos de referência da Fase 0 podem ser excluídos, pois:

1. **fase-0-analise-banco-dados-setup.md** → Excluir após Fase 3 (Backend APIs implementadas)
2. **estruturas-json-plan-005.md** → Excluir após Fase 2 (Formulário implementado) 
3. **fase-0-resumo-executivo.md** → Excluir após Fase 7 (Documentação final)

**COMANDO PARA EXCLUSÃO** (executar apenas quando indicado):
```bash
rm .ai-guards/plans/fase-0-analise-banco-dados-setup.md
rm .ai-guards/plans/estruturas-json-plan-005.md  
rm .ai-guards/plans/fase-0-resumo-executivo.md
```

---

## 🧩 Scope

Criar a infraestrutura inicial e o painel de planejamento para o sistema de criação de planejamentos estratégicos. Esta primeira fase focará na análise do banco de dados, configuração inicial, criação do formulário multi-etapas integrado com clientes, e setup do painel de visualização. O objetivo é estabelecer a base sólida para a posterior implementação de IA e refinamento de listas.

### Componentes Desta Fase:
- **✅ Análise de Base de Dados**: Identificação completa de todos os IDs e relacionamentos existentes *(CONCLUÍDA - Fase 0)*
- **Frontend (Next.js + TypeScript)**: Formulário dinâmico multi-etapas integrado à interface existente
- **Backend (Next.js API Routes)**: APIs para validação, armazenamento básico e gestão de dados
- **Integração com Clientes**: Sistema obrigatório de linkagem com clientes existentes
- **Painel de Planejamento**: Interface de visualização e gestão de planejamentos criados
- **✅ Configuração Inicial**: Setup de variáveis, modelos de dados e estruturas base *(CONCLUÍDA - Fase 0)*
- **✅ Preparação para IA**: Estruturas JSON e webhooks preparados para plan-006 *(CONCLUÍDA - Fase 0)*

## ✅ Functional Requirements

### ✅ 1. Análise Completa do Banco de Dados e Identificação de IDs *(CONCLUÍDA - Fase 0)*
- **✅ Mapeamento de Relacionamentos**: Analisar `prisma.schema` existente para identificar todos os tipos de ID
- **✅ Identificação de Chaves**: Mapear `id`, `userId`, `clientId`, `clerkId`, `planningId` e suas relações
- **✅ Verificação de Integridade**: Validar relacionamentos existentes no banco
- **✅ Documentação de IDs**: Criar mapeamento claro de qual ID usar em cada operação

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/fase-0-analise-banco-dados-setup.md` para detalhes completos dos relacionamentos e IDs mapeados.

### 2. Gestão de Clientes (Integração Obrigatória)

#### 2.1 Modal de Seleção/Criação de Cliente Adaptado
- **Reutilizar modal existente** da gestão de clientes com adaptações específicas
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

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/estruturas-json-plan-005.md` seção "Setores Permitidos" para implementação completa.

#### 2.2 Linkagem Cliente-Planejamento
- **Relacionamento obrigatório**: Todo `StrategicPlanning` deve ter `clientId` preenchido
- **Contexto enriquecido**: Interface mostra dados do cliente durante criação do planejamento
- **Validação de propriedade**: Verificar se cliente pertence ao usuário logado

#### 2.3 Exibição do Richness Score
- **Interface de planejamento**: Exibir `Client.richnessScore` de forma visível
- **Componente visual**: Badge/indicador do nível de nutrição do cliente
- **Contexto visual**: Cliente sempre visível durante preenchimento

### 3. Formulário Dinâmico Multi-Etapas com Cliente Linkado

#### 3.1 Interface do Formulário com Cliente
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

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/estruturas-json-plan-005.md` seção "Schema Completo do Formulário" para estrutura detalhada.

#### 3.2 Estrutura das 4 Abas do Formulário

**Aba 1: Informações Básicas**:
- **titulo_planejamento** (text, obrigatório): Título do planejamento estratégico
- **descricao_objetivo** (textarea, obrigatório): Descrição detalhada do objetivo
- **setor** (readonly/informativo): Preenchido automaticamente com `client.industry`
- **Badge do Richness Score**: Indicador visual do nível de nutrição do cliente
- Se `client.industry === "Outro"`: Exibe `client.businessDetails` como informativo *(Nota: customIndustry não existe no schema)*

**Aba 2: Detalhes do Setor** (Campos Dinâmicos):
- Campos dinâmicos carregados baseados em `client.industry`
- Suporta tipos `text`, `textarea`, `radio`, `checkbox`, `number`
- Lógica condicional e campos "Outro" com input adicional
- Se nenhuma pergunta específica para o setor: mensagem informativa

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/estruturas-json-plan-005.md` seção "Configuração de Perguntas por Setor" para implementação completa de todos os 11 setores.

**Configuração por Setor (Exemplos)**:

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

**Aba 3: Marketing**:
- **maturidade_marketing** (dropdown, obrigatório):
  - "Não fazemos marketing"
  - "Fazemos ações pontuais"
  - "Temos ações recorrentes, mas sem métricas"
  - "Temos estratégia definida com métricas"
  - "Marketing avançado com automação"
- **meta_marketing** (dropdown condicional): 6 metas específicas baseadas na maturidade selecionada
- **meta_marketing_personalizada** (text): Se meta = "Outro"

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/estruturas-json-plan-005.md` seção "Opções de Marketing por Maturidade" para metas completas.

**Aba 4: Comercial**:
- **maturidade_comercial** (dropdown, obrigatório):
  - "Não temos processo comercial estruturado"
  - "Vendas informais sem processo"
  - "Possuímos um funil de vendas claro"
  - "Processo comercial com métricas"
  - "Vendas automatizadas e otimizadas"
- **meta_comercial** (dropdown condicional): Baseado na maturidade selecionada
- **meta_comercial_personalizada** (text): Se meta = "Outro"

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/estruturas-json-plan-005.md` seção "Opções de Comercial por Maturidade" para metas completas.

#### 3.3 Sistema de Progresso e Validação
- **Distribuição por Seção**: 25% para cada aba
- **Cálculo dinâmico**: Baseado em campos obrigatórios preenchidos
- **Validação progressiva**: Campos obrigatórios validados em tempo real
- **Navegação entre abas**: Com validação obrigatória apenas na Aba 1

#### 3.4 Tipos de Campos Suportados
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

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/estruturas-json-plan-005.md` seção "Estrutura de Pergunta" para interface completa.

#### 3.5 Nomenclatura de Chaves JSON
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

### 4. Painel de Planejamento

#### 4.1 Interface Principal de Planejamentos
- **Seção "Planejamento" na sidebar**: Nova entrada no menu principal
- **Listagem de planejamentos**: Exibir todos os `StrategicPlanning` do usuário
- **Informações por item**: Nome, cliente, setor, data de criação, status
- **Filtros básicos**: Por cliente, setor, data de criação
- **Ações**: Visualizar, editar (se em draft), excluir

#### 4.2 Detalhes do Planejamento
- **Página de visualização**: Mostrar dados completos do formulário
- **Informações do cliente**: Header com dados do cliente linkado
- **Dados estruturados**: Exibição organizada por abas
- **Histórico**: Log básico de criação e modificações
- **Status visual**: Indicadores claros do estado atual

### 5. Sistema de Armazenamento e Validação

#### 5.1 Validação de Dados
- **Frontend**: React Hook Form + Zod para validação em tempo real
- **Backend**: Validação dupla com Zod nos endpoints de API
- **Integridade**: Verificar relacionamentos com cliente antes de salvar

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/estruturas-json-plan-005.md` seção "Validação com Zod" para schemas completos.

#### 5.2 Persistência de Dados
- **Salvamento automático**: LocalStorage para backup local
- **Salvamento manual**: Botão "Salvar Rascunho"
- **Finalização**: Submissão completa para criação definitiva

### ✅ 6. Preparação para Integração IA (Plan-006) *(CONCLUÍDA - Fase 0)*

#### ✅ 6.1 Estruturas JSON Preparadas *(CONCLUÍDA - Fase 0)*
- **✅ formDataJSON**: Estrutura padronizada para envio aos webhooks
- **✅ clientSnapshot**: Snapshot dos dados do cliente no momento da criação
- **✅ Webhooks configurados**: URLs preparadas no `.env` para plan-006

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/estruturas-json-plan-005.md` seção "Payload para Webhooks" para estrutura completa.

#### ✅ 6.2 Status de Planejamento Preparados *(CONCLUÍDA - Fase 0)*
- **✅ DRAFT**: Rascunho em edição
- **✅ COMPLETED**: Formulário finalizado (pronto para IA no plan-006)
- **✅ Status de IA**: 4 novos status adicionados ao enum para plan-006

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/fase-0-analise-banco-dados-setup.md` seção "Extensão do Enum PlanningStatus" para detalhes completos.

## ⚙️ Non-Functional Requirements

### Performance
- Formulário responsivo com validação em tempo real
- API Next.js otimizadas para consultas de cliente
- Carregamento dinâmico de perguntas por setor

### Security
- Validação de dados com Zod em frontend e backend
- Endpoints protegidos com Clerk
- Verificação de propriedade de clientes e planejamentos

### Configurabilidade
- Setores facilmente modificáveis no código frontend
- Perguntas por setor configuráveis em arquivo separado
- Status de planejamento extensível

## 📚 Guidelines & Packages

### Tecnologias Base (Existentes no Projeto)
- **Framework**: Next.js (com React 19 + TypeScript)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (via Supabase) com Prisma ORM
- **Auth**: Clerk
- **UI**: Tailwind CSS, Shadcn/UI, Radix UI
- **State**: TanStack Query
- **Formulários**: React Hook Form + Zod

### Arquivos de Referência
- `docs/formulario.md` (para estrutura de formulário e JSONs)
- `docs/Flowchart Vortex.mmd` (para fluxos gerais)
- `prisma/schema.prisma` (para estrutura de dados - **ATUALIZADO na Fase 0**)
- `.env` (existente, para novas variáveis - **PREPARADO na Fase 0**)

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/fase-0-analise-banco-dados-setup.md` para análise completa do schema atualizado.

### ✅ Variáveis de Ambiente (Preparação para Plan-006) *(CONCLUÍDA - Fase 0)*
```env
# Webhooks para IA (plan-006)
PLANNING_WEBHOOK_URL="https://webhook.lucasfelix.com/webhook/vortex-planejamento-beta-2025"
REFINED_LIST_WEBHOOK_URL="https://webhook.lucasfelix.com/webhook/vortex-refinada-beta-2025"
WEBHOOK_SECRET="your-webhook-secret-key"

# Custos de créditos (plan-006)
COST_PLANNING_BACKLOG_VISIBLE=10
COST_REFINED_LIST_VISIBLE=10
```

**📋 REFERÊNCIA**: Consultar `env.example` para variáveis completas adicionadas na Fase 0.

## 🔐 Threat Model
- **Data Integrity**: Consistência entre relacionamentos Client-StrategicPlanning
- **Authorization**: Verificar propriedade de recursos por usuário
- **Input Validation**: Sanitização de dados do formulário
- **Session Security**: Proteção via Clerk em todas as rotas

## 🔢 Execution Plan

### ✅ Fase 0: Análise de Base de Dados e Setup Inicial *(CONCLUÍDA)*
1. **✅ Análise Completa do Schema Prisma**:
   - ✅ Mapear todos os modelos existentes e seus relacionamentos
   - ✅ Identificar tipos de ID: `id`, `userId`, `clientId`, `clerkId`, etc.
   - ✅ Documentar relacionamentos entre User, Client e StrategicPlanning
   - ✅ Verificar integridade referencial existente

2. **✅ Configuração de Variáveis de Ambiente**:
   - ✅ Adicionar variáveis de configuração ao `env.example`
   - ✅ Definir constantes de configuração (custos, limites, etc.)
   - ✅ Preparar URLs de webhook para plan-006

3. **✅ Atualização do Schema Prisma para Planejamento**:
   - **✅ Client** (schema mantido flexível):
     - ✅ `industry: String?` - Continua flexível no banco
     - ✅ `richnessScore: Int?` - Score existente
     - ⚠️ `customIndustry`: **NÃO EXISTE** - usar `businessDetails`
   - **✅ StrategicPlanning** (modelo EXISTENTE estendido):
     ```prisma
     model StrategicPlanning {
       // Campos existentes mantidos
       id, title, description, specificObjectives, scope, 
       successMetrics, budget, toneOfVoice, status, 
       clientId, userId, createdAt, updatedAt
       
       // 🆕 NOVOS CAMPOS ADICIONADOS
       formDataJSON    Json?    // Dados completos do formulário (4 abas)
       clientSnapshot  Json?    // Snapshot dos dados do cliente
       
       // Relacionamentos e índices otimizados
     }
     ```
   - **✅ PlanningStatus** enum estendido:
     ```prisma
     enum PlanningStatus {
       DRAFT, ACTIVE, COMPLETED, ARCHIVED,           // Existentes
       PENDING_AI_BACKLOG_GENERATION,                // 🆕 Plan-006
       AI_BACKLOG_VISIBLE,                           // 🆕 Plan-006
       PENDING_AI_REFINED_LIST,                      // 🆕 Plan-006
       AI_REFINED_LIST_VISIBLE                       // 🆕 Plan-006
     }
     ```

4. **✅ Executar Migração Prisma**: `20250528075505_add_planning_form_fields_and_ai_status`
5. **✅ Gerar Tipos TypeScript atualizados**

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/fase-0-resumo-executivo.md` para detalhes completos da execução da Fase 0.

### Fase 1: Adaptação da UI de Cliente para Planejamento

#### 1.1 Modificação do Modal de Cliente Existente
- **Identificar modal atual** de criação/edição de cliente
- **Adicionar contexto** de "seleção para planejamento"
- **Implementar validação frontend** para os 11 setores:
  ```typescript
  // components/client/ClientModal.tsx
  const SETORES_PERMITIDOS = [
    "Alimentação", "Saúde e Bem-estar", "Educação", "Varejo físico",
    "E-commerce", "Serviços locais", "Serviços B2B", "Tecnologia / SaaS",
    "Imobiliário", "Indústria", "Outro"
  ];
  ```
- **Manter compatibilidade** com uso normal do modal

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/estruturas-json-plan-005.md` seção "Setores Permitidos" para implementação completa.

#### 1.2 Componente de Seleção de Cliente para Planejamento
- **Lista clientes existentes** com filtros
- **Busca por nome** de cliente
- **Botão "Criar Novo Cliente"** integrado
- **Validação obrigatória** de setor antes de prosseguir

#### 1.3 Fluxo de Início de Planejamento
- **Botão "Novo Planejamento"** na área de planejamento
- **Modal de seleção/criação** de cliente
- **Redirecionamento** para formulário com `clientId` na URL

### Fase 2: Desenvolvimento do Formulário Multi-Etapas

#### 2.1 Componente `ClientHeader.tsx`
- **Exibição do cliente selecionado**:
  ```tsx
  interface ClientHeaderProps {
    client: {
      id: string;
      name: string;
      industry: string;
      richnessScore: number;
      businessDetails?: string;  // Usar ao invés de customIndustry
    };
  }
  ```
- **Badge do richness score**
- **Informações sempre visíveis** durante preenchimento

#### 2.2 Componente `RichnessScoreBadge.tsx`
- **Indicador visual** do score (baixo/médio/alto)
- **Cores e ícones** baseados no nível
- **Tooltip explicativo**

#### 2.3 Configuração de Perguntas por Setor (`lib/formConfig.ts`)
- **Estrutura de dados** para os 11 setores
- **Perguntas específicas** por setor conforme documentação
- **Tipos de campo suportados** (text, textarea, radio, checkbox, number)
- **Lógica condicional** para campos "Outro"

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/estruturas-json-plan-005.md` seção "Configuração de Perguntas por Setor" para implementação completa de todos os setores.

**Contagem de Perguntas por Setor**:
- **Saúde**: 8 perguntas
- **Educação**: 8 perguntas
- **Imobiliário**: 8 perguntas
- **Varejo físico**: 8 perguntas
- **E-commerce**: 7 perguntas
- **Serviços locais**: 9 perguntas
- **B2B**: 8 perguntas
- **Tecnologia / SaaS**: 9 perguntas
- **Alimentação**: 8 perguntas
- **Outro**: 6 perguntas genéricas

#### 2.4 Componente `PlanningForm.tsx`
- **React Hook Form + Zod** para validação
- **4 abas** conforme especificação
- **Navegação entre abas** com validação
- **Persistência em localStorage**
- **Progress bar dinâmica**
- **Sistema de campos condicionais**

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/estruturas-json-plan-005.md` seção "Schema Completo do Formulário" para estrutura detalhada das 4 abas.

#### 2.5 Implementação das 4 Abas

**Aba 1: Informações Básicas**
```typescript
// Campos obrigatórios
const basicInfoFields = {
  titulo_planejamento: string().min(1, "Título é obrigatório"),
  descricao_objetivo: string().min(1, "Descrição é obrigatória"),
  // setor: readonly (vem do client.industry)
};
```

**Aba 2: Detalhes do Setor**
```typescript
// Campos dinâmicos baseados no client.industry
const sectorFields = PERGUNTAS_POR_SETOR[client.industry] || [];
```

**Aba 3: Marketing**
```typescript
const marketingFields = {
  maturidade_marketing: enum([
    "Não fazemos marketing",
    "Fazemos ações pontuais", 
    "Temos ações recorrentes, mas sem métricas",
    "Temos estratégia definida com métricas",
    "Marketing avançado com automação"
  ]),
  meta_marketing: string().optional(), // Condicional
  meta_marketing_personalizada: string().optional() // Se meta = "Outro"
};
```

**Aba 4: Comercial**
```typescript
const comercialFields = {
  maturidade_comercial: enum([
    "Não temos processo comercial estruturado",
    "Vendas informais sem processo",
    "Possuímos um funil de vendas claro", 
    "Processo comercial com métricas",
    "Vendas automatizadas e otimizadas"
  ]),
  meta_comercial: string().optional(), // Condicional
  meta_comercial_personalizada: string().optional() // Se meta = "Outro"
};
```

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/estruturas-json-plan-005.md` seções "Opções de Marketing por Maturidade" e "Opções de Comercial por Maturidade" para metas completas.

#### 2.6 Sistema de Progresso
```typescript
const sectionWeights = {
  informacoesBasicas: 25,  // 25%
  detalhesSetor: 25,       // 25%
  marketing: 25,           // 25%
  comercial: 25            // 25%
};

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

### Fase 3: Backend para Criação e Armazenamento

#### 3.1 API de Criação de Planejamento (`app/api/strategic-planning/route.ts`)
- **POST: Criar novo planejamento**:
  ```typescript
  // Validações
  - Verificar se clientId existe e pertence ao usuário
  - Validar se client.industry está preenchido
  - Validar formDataJSON com Zod
  
  // Buscar dados completos do cliente
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: userId },
    select: {
      id: true, name: true, industry: true, 
      richnessScore: true, businessDetails: true, createdAt: true  // businessDetails ao invés de customIndustry
    }
  });
  
  // Criar StrategicPlanning
  const planning = await prisma.strategicPlanning.create({
    data: {
      clientId: clientId,
      userId: userId,
      title: formData.informacoes_basicas.titulo_planejamento,
      description: formData.informacoes_basicas.descricao_objetivo,
      formDataJSON: formDataJSON,
      clientSnapshot: client,
      status: 'DRAFT'
    }
  });
  ```
- **Retorno**: `planningId`, `clientInfo`, `status`

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/fase-0-analise-banco-dados-setup.md` seção "Análise do Modelo Client" para campos disponíveis e `.ai-guards/plans/estruturas-json-plan-005.md` seção "Validação com Zod" para schemas.

#### 3.2 API de Atualização (`app/api/strategic-planning/[planningId]/route.ts`)
- **PUT: Atualizar planejamento existente**
- **PATCH: Salvar rascunho parcial**
- **GET: Buscar dados completos**
- **DELETE: Excluir planejamento** (se em DRAFT)

#### 3.3 Validação e Segurança
- **Schemas Zod** para validação de entrada
- **Verificação de propriedade** em todas as operações
- **Sanitização de dados** do formulário
- **Tratamento de erros** consistente

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/estruturas-json-plan-005.md` seção "Validação com Zod" para schemas completos de validação.

### Fase 4: Painel de Visualização e Gestão

#### 4.1 Página Principal de Planejamentos (`app/planejamento/page.tsx`)
- **Listagem paginada** de `StrategicPlanning`
- **Filtros por cliente, setor, status**
- **Busca por título**
- **Cards informativos** por planejamento
- **Botão "Novo Planejamento"**

#### 4.2 Página de Detalhes (`app/planejamento/[planningId]/page.tsx`)
- **Visualização completa** dos dados do formulário
- **Informações do cliente** linkado
- **Estrutura organizada** por abas
- **Botões de ação** (editar, excluir)
- **Breadcrumb** de navegação

#### 4.3 Componentes de Visualização
- **`PlanningCard.tsx`**: Card resumido para listagem
- **`PlanningDetails.tsx`**: Visualização completa
- **`FormDataDisplay.tsx`**: Exibição formatada dos dados das abas
- **`ClientInfo.tsx`**: Informações do cliente no contexto

### Fase 5: Integração na UI Principal

#### 5.1 Adição na Sidebar
- **Nova entrada "Planejamento"** no menu principal
- **Ícone apropriado** e posicionamento
- **Links** para "/planejamento" e "/planejamento/novo"

#### 5.2 Integração com Dashboard
- **Cards de resumo** de planejamentos no dashboard
- **Estatísticas básicas** (total, por status)
- **Links rápidos** para ações

#### 5.3 Navegação e UX
- **Breadcrumbs consistentes**
- **Estados de loading** apropriados
- **Mensagens de feedback** ao usuário
- **Confirmações** para ações destrutivas

### Fase 6: Testes e Refinamentos

#### 6.1 Validação do Fluxo Completo
- **Teste de criação** cliente → planejamento
- **Validação de todos os tipos** de pergunta por setor
- **Teste de salvamento** e edição de rascunhos
- **Verificação de relacionamentos** no banco

#### 6.2 Testes de Segurança
- **Verificação de autorização** em todas as rotas
- **Teste de acesso** a recursos de outros usuários
- **Validação de entrada** maliciosa

#### 6.3 Otimizações de Performance
- **Carregamento otimizado** de dados de cliente
- **Cache apropriado** para perguntas por setor
- **Validação eficiente** de formulários

#### 6.4 UX e Acessibilidade
- **Testes de navegação** por teclado
- **Validação de contraste** e legibilidade
- **Testes em diferentes** tamanhos de tela
- **Feedback adequado** para screen readers

### Fase 7: Documentação e Preparação para Plan-006

#### 7.1 Documentação Técnica
- **Mapeamento completo** de IDs identificados
- **Estruturas JSON** documentadas
- **APIs criadas** e seus contratos
- **Relacionamentos** no banco de dados

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/fase-0-analise-banco-dados-setup.md` para mapeamento completo de IDs e relacionamentos.

#### ✅ 7.2 Preparação para Integração IA *(CONCLUÍDA - Fase 0)*
- **✅ Estruturas de dados** prontas para webhooks
- **✅ Status intermediários** preparados no enum
- **✅ Pontos de extensão** identificados
- **✅ Dados de cliente** estruturados para envio

**📋 REFERÊNCIA**: Consultar `.ai-guards/plans/estruturas-json-plan-005.md` seção "Payload para Webhooks" para estruturas completas.

#### 7.3 Arquivo de Transição
- **Documento com estado atual** do projeto
- **Pontos de integração** para plan-006
- **Dados disponíveis** para processamento IA
- **Estruturas prontas** para refinamento

**🗑️ LIMPEZA**: Após conclusão da Fase 7, executar exclusão dos arquivos de referência da Fase 0 conforme instruções no início deste documento.

## 📊 Estruturas JSON (Preparação para IA)

**📋 REFERÊNCIA**: As estruturas abaixo são exemplos resumidos. Para implementação completa, consultar `.ai-guards/plans/estruturas-json-plan-005.md`.

### `StrategicPlanning.formDataJSON`
```json
{
  "client_context": {
    "client_id": "client_456",
    "client_name": "Empresa XYZ Ltda",
    "industry": "E-commerce",
    "richness_score": 85,
    "business_details": "E-commerce especializado em eletrônicos"
  },
  "informacoes_basicas": {
    "titulo_planejamento": "Expansão Digital 2024",
    "descricao_objetivo": "Aumentar vendas online em 50%",
    "setor": "E-commerce"
  },
  "detalhes_do_setor": {
    "ecom_categorias_destaque": "Eletrônicos e acessórios",
    "ecom_ticket_medio": 150,
    "ecom_upsell": "Sim, mas sem estrutura"
  },
  "marketing": {
    "maturidade_marketing": "Temos ações recorrentes, mas sem métricas",
    "meta_marketing": "Aumentar reconhecimento da marca"
  },
  "comercial": {
    "maturidade_comercial": "Possuímos um funil de vendas claro",
    "meta_comercial": "Otimizar taxa de conversão do funil"
  }
}
```

### `StrategicPlanning.clientSnapshot`
```json
{
  "id": "client_456",
  "name": "Empresa XYZ Ltda",
  "industry": "E-commerce",
  "richnessScore": 85,
  "businessDetails": "E-commerce especializado em eletrônicos com 3 anos no mercado",
  "createdAt": "2024-01-01T00:00:00Z",
  "snapshot_timestamp": "2024-01-15T10:30:00Z"
}
```

### Payload Preparado para Webhooks (Plan-006)
```json
{
  "planning_id": "planning_123",
  "client_info": {
    "id": "client_456",
    "name": "Empresa XYZ Ltda",
    "industry": "E-commerce",
    "richnessScore": 85,
    "businessDetails": "E-commerce especializado em eletrônicos",
    "data_quality": "alto"
  },
  "form_submission_data": {
    "informacoes_basicas": {
      "titulo_planejamento": "Expansão Digital 2024",
      "descricao_objetivo": "Aumentar vendas online em 50%",
      "setor": "E-commerce"
    },
    "detalhes_do_setor": {
      "ecom_categorias_destaque": "Eletrônicos e acessórios",
      "ecom_ticket_medio": 150,
      "ecom_upsell": "Sim, mas sem estrutura"
    },
    "marketing": {
      "maturidade_marketing": "Temos ações recorrentes, mas sem métricas",
      "meta_marketing": "Aumentar reconhecimento da marca"
    },
    "comercial": {
      "maturidade_comercial": "Possuímos um funil de vendas claro",
      "meta_comercial": "Otimizar taxa de conversão do funil"
    }
  },
  "context_enrichment": {
    "client_richness_level": "alto",
    "industry_specific_insights": true,
    "personalization_level": "avançado"
  }
}
```

**📋 REFERÊNCIA**: Para estruturas JSON completas e detalhadas, consultar `.ai-guards/plans/estruturas-json-plan-005.md`.

## 🎯 Success Metrics
- **✅ Usuários conseguem criar planejamentos**: 100% sucesso na criação básica
- **✅ Integração com clientes funcional**: Relacionamentos corretos no banco *(Fase 0 preparada)*
- **Formulário multi-etapas operacional**: Todas as 4 abas funcionando
- **✅ Dados estruturados corretamente**: JSONs prontos para processamento IA *(Fase 0 preparada)*
- **Interface responsiva e acessível**: Testes de UX aprovados
- **Performance adequada**: Carregamento < 2s para formulários
- **✅ Zero quebras de relacionamento**: Integridade referencial mantida *(Fase 0 validada)*
- **✅ Preparação completa para Plan-006**: Estruturas e webhooks prontos *(Fase 0 concluída)*

---

**📋 ARQUIVOS DE REFERÊNCIA CRIADOS NA FASE 0:**
- `.ai-guards/plans/fase-0-analise-banco-dados-setup.md` - Análise técnica completa
- `.ai-guards/plans/estruturas-json-plan-005.md` - Estruturas JSON e validação
- `.ai-guards/plans/fase-0-resumo-executivo.md` - Resumo executivo da Fase 0

**🗑️ LEMBRETE**: Excluir estes arquivos conforme cronograma definido no início deste documento.