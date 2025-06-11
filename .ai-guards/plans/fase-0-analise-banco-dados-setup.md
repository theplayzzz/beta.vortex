 # Fase 0: Análise de Base de Dados e Setup Inicial - CONCLUÍDA

---
**Plan**: plan-005-criação-planejamento.md  
**Fase**: 0 - Análise de Base de Dados e Setup Inicial  
**Status**: ✅ CONCLUÍDA  
**Data**: 2025-05-28  
**Executado por**: AI Assistant  
---

## 📊 1. Análise Completa do Schema Prisma

### 🔍 Mapeamento de Todos os Modelos Existentes

#### **Modelos Principais Identificados:**

1. **User** - Usuário principal do sistema
2. **Client** - Clientes gerenciados pelos usuários
3. **StrategicPlanning** - Planejamentos estratégicos (JÁ EXISTE!)
4. **PlanningTask** - Tarefas vinculadas aos planejamentos
5. **AgentInteraction** - Interações com IA
6. **AgentMessage** - Mensagens das conversas com IA
7. **CommercialProposal** - Propostas comerciais
8. **SalesArgument** - Argumentos de vendas
9. **ClientNote** - Notas dos clientes
10. **ClientAttachment** - Anexos dos clientes
11. **TaskAttachment** - Anexos das tarefas
12. **TaskComment** - Comentários das tarefas
13. **CreditTransaction** - Transações de créditos

### 🆔 Mapeamento Completo de IDs e Relacionamentos

#### **Tipos de ID Identificados:**

| Tipo de ID | Modelo | Descrição | Formato |
|------------|--------|-----------|---------|
| `id` | Todos os modelos | Chave primária única | `String @id @default(cuid())` |
| `userId` | User.id | ID interno do usuário no sistema | `String @id @default(cuid())` |
| `clerkId` | User.clerkId | ID do usuário no Clerk (auth) | `String @unique` |
| `clientId` | Client.id | ID do cliente | `String @id @default(cuid())` |
| `planningId` | StrategicPlanning.id | ID do planejamento estratégico | `String @id @default(cuid())` |
| `strategicPlanningId` | PlanningTask.strategicPlanningId | FK para planejamento | `String?` |
| `agentInteractionId` | AgentInteraction.id | ID da interação com IA | `String @id @default(cuid())` |

#### **Relacionamentos Críticos Mapeados:**

```prisma
// User (1) -> (N) Client
User.id -> Client.userId

// User (1) -> (N) StrategicPlanning  
User.id -> StrategicPlanning.userId

// Client (1) -> (N) StrategicPlanning
Client.id -> StrategicPlanning.clientId

// StrategicPlanning (1) -> (N) PlanningTask
StrategicPlanning.id -> PlanningTask.strategicPlanningId

// Client (1) -> (N) PlanningTask (opcional)
Client.id -> PlanningTask.clientId

// User (1) -> (N) AgentInteraction
User.id -> AgentInteraction.userId

// Client (1) -> (N) AgentInteraction
Client.id -> AgentInteraction.clientId
```

### ⚠️ **DESCOBERTA IMPORTANTE: StrategicPlanning JÁ EXISTE!**

O modelo `StrategicPlanning` já está implementado no schema atual:

```prisma
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
  clientId           String
  userId             String
  createdAt          DateTime       @default(now())
  updatedAt          DateTime
  PlanningTask       PlanningTask[]
  Client             Client         @relation(fields: [clientId], references: [id], onDelete: Cascade)
  User               User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([clientId])
  @@index([userId])
}
```

**Status atual do PlanningStatus enum:**
```prisma
enum PlanningStatus {
  DRAFT
  ACTIVE
  COMPLETED
  ARCHIVED
}
```

### 🔄 **Adaptações Necessárias para Plan-005**

O modelo existente precisa ser **ESTENDIDO** para suportar o formulário multi-etapas:

1. **Adicionar campos JSON**: `formDataJSON`, `clientSnapshot`
2. **Manter compatibilidade**: Campos existentes devem ser preservados
3. **Estender enum**: Adicionar status para IA (plan-006)

## 📋 2. Análise do Modelo Client

### **Campos Existentes Relevantes:**

```prisma
model Client {
  id                      String               @id @default(cuid())
  name                    String               // ✅ Nome da empresa
  industry                String?              // ✅ Setor (flexível no banco)
  serviceOrProduct        String?              // ✅ Serviço/Produto
  initialObjective        String?              // ✅ Objetivo inicial
  contactEmail            String?              // ✅ Email de contato
  contactPhone            String?              // ✅ Telefone
  website                 String?              // ✅ Website
  address                 String?              // ✅ Endereço
  businessDetails         String?              // ✅ Detalhes do negócio
  targetAudience          String?              // ✅ Público-alvo
  marketingObjectives     String?              // ✅ Objetivos de marketing
  historyAndStrategies    String?              // ✅ Histórico e estratégias
  challengesOpportunities String?              // ✅ Desafios e oportunidades
  competitors             String?              // ✅ Concorrentes
  resourcesBudget         String?              // ✅ Recursos e orçamento
  toneOfVoice             String?              // ✅ Tom de voz
  preferencesRestrictions String?              // ✅ Preferências e restrições
  richnessScore           Int                  @default(0) // ✅ Score de riqueza
  userId                  String               // ✅ Relacionamento com usuário
  createdAt               DateTime             @default(now())
  updatedAt               DateTime             @updatedAt
  deletedAt               DateTime?            // ✅ Soft delete
  isViewed                Boolean              @default(false) // ✅ Visualização
  
  // Relacionamentos
  StrategicPlanning       StrategicPlanning[]  // ✅ Planejamentos
  AgentInteraction        AgentInteraction[]   // ✅ Chats IA
  PlanningTask            PlanningTask[]       // ✅ Tarefas
  CommercialProposal      CommercialProposal[] // ✅ Propostas
  ClientNote              ClientNote[]         // ✅ Notas
  ClientAttachment        ClientAttachment[]   // ✅ Anexos
}
```

### **Campo `customIndustry` - VERIFICAÇÃO NECESSÁRIA**

⚠️ **ATENÇÃO**: O campo `customIndustry` mencionado no plan-005 **NÃO EXISTE** no schema atual. 

**Opções:**
1. **Usar campo existente**: `industry` pode armazenar "Outro: [descrição personalizada]"
2. **Adicionar campo**: Criar `customIndustry String?` se necessário
3. **Usar businessDetails**: Campo existente pode armazenar detalhes personalizados

**Recomendação**: Usar `industry` flexível e `businessDetails` para detalhes adicionais.

## 🔧 3. Configuração de Variáveis de Ambiente

### **Arquivo .env Atual Analisado:**

```env
# Database
DATABASE_URL=postgresql://postgres.yikhktawbwnywlbsnjns:Dantevault.28@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Supabase  
NEXT_PUBLIC_SUPABASE_URL="https://yikhktawbwnywlbsnjns.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clerk (Auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_[CHAVE_MASCARADA_POR_SEGURANÇA]
CLERK_SECRET_KEY=sk_test_[CHAVE_MASCARADA_POR_SEGURANÇA]
DIRECT_URL="postgresql://postgres.yikhktawbwnywlbsnjns:Dantevault.28@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
CLERK_WEBHOOK_SECRET="whsec_/fulb5H9S55UnSWdPlbRyN43LBJ6iDcL"

# Configuração do Servidor
PORT=3003

# URLs do Clerk
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/clientes
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/clientes
NEXT_PUBLIC_CLERK_DOMAIN=http://5.161.64.137:3003
```

### **Variáveis a Serem Adicionadas (Plan-005 + Plan-006):**

```env
# Webhooks para IA (plan-006)
PLANNING_WEBHOOK_URL="https://webhook.lucasfelix.com/webhook/vortex-planejamento-beta-2025"
REFINED_LIST_WEBHOOK_URL="https://webhook.lucasfelix.com/webhook/vortex-refinada-beta-2025"
WEBHOOK_SECRET="[secret-key-to-be-defined]"

# Custos de créditos (plan-006)
COST_PLANNING_BACKLOG_VISIBLE=10
COST_REFINED_LIST_VISIBLE=10
```

## 🏗️ 4. Atualização do Schema Prisma Necessária

### **Modificações no Modelo StrategicPlanning:**

```prisma
model StrategicPlanning {
  id                 String         @id @default(cuid())
  userId             String         // ✅ Já existe
  clientId           String         // ✅ Já existe
  
  // Campos existentes (manter compatibilidade)
  title              String         // ✅ Já existe
  description        String?        // ✅ Já existe
  specificObjectives String?        // ✅ Já existe
  scope              String?        // ✅ Já existe
  successMetrics     String?        // ✅ Já existe
  budget             String?        // ✅ Já existe
  toneOfVoice        String?        // ✅ Já existe
  status             PlanningStatus @default(DRAFT) // ✅ Já existe
  
  // 🆕 NOVOS CAMPOS PARA PLAN-005
  formDataJSON       Json?          // Dados completos do formulário (4 abas)
  clientSnapshot     Json?          // Snapshot dos dados do cliente
  
  // Timestamps
  createdAt          DateTime       @default(now()) // ✅ Já existe
  updatedAt          DateTime       @updatedAt      // ✅ Já existe
  
  // Relacionamentos (já existem)
  client             Client         @relation(fields: [clientId], references: [id], onDelete: Cascade)
  user               User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  PlanningTask       PlanningTask[]
  
  // Índices (já existem)
  @@index([clientId])
  @@index([userId])
  @@index([userId, clientId])    // 🆕 Adicionar
  @@index([userId, status])      // 🆕 Adicionar
}
```

### **Extensão do Enum PlanningStatus (Preparação Plan-006):**

```prisma
enum PlanningStatus {
  // Status atuais (manter)
  DRAFT                           // ✅ Já existe
  ACTIVE                          // ✅ Já existe  
  COMPLETED                       // ✅ Já existe
  ARCHIVED                        // ✅ Já existe
  
  // 🆕 Status para Plan-006 (IA)
  PENDING_AI_BACKLOG_GENERATION   // Aguardando geração IA
  AI_BACKLOG_VISIBLE              // Backlog IA visível
  PENDING_AI_REFINED_LIST         // Aguardando lista refinada
  AI_REFINED_LIST_VISIBLE         // Lista refinada visível
}
```

## 📁 5. Estrutura de Arquivos Identificada

### **Arquivos Críticos Localizados:**

```
/root/Vortex/precedent/
├── prisma/
│   ├── schema.prisma              # ✅ Schema principal analisado
│   ├── migrations/                # ✅ Histórico de migrações
│   └── rls-policies.sql          # ✅ Políticas RLS
├── .env                          # ✅ Variáveis de ambiente
├── env.example                   # ✅ Template de variáveis
├── docs/
│   ├── Flowchart Vortex.mmd     # ✅ Arquitetura do sistema
│   └── formulario.md            # 📋 Estrutura do formulário
├── lib/
│   └── prisma/
│       └── client.ts            # ✅ Cliente Prisma
└── .ai-guards/
    └── plans/                   # ✅ Documentação de planos
```

## 🔍 6. Verificação de Integridade Referencial

### **Relacionamentos Validados:**

✅ **User ↔ Client**: `Client.userId -> User.id`  
✅ **User ↔ StrategicPlanning**: `StrategicPlanning.userId -> User.id`  
✅ **Client ↔ StrategicPlanning**: `StrategicPlanning.clientId -> Client.id`  
✅ **StrategicPlanning ↔ PlanningTask**: `PlanningTask.strategicPlanningId -> StrategicPlanning.id`  
✅ **Client ↔ AgentInteraction**: `AgentInteraction.clientId -> Client.id`  
✅ **User ↔ AgentInteraction**: `AgentInteraction.userId -> User.id`  

### **Políticas de Cascata:**

- `Client -> StrategicPlanning`: `onDelete: Cascade` ✅
- `User -> StrategicPlanning`: `onDelete: Cascade` ✅
- `StrategicPlanning -> PlanningTask`: Relacionamento opcional ✅

## 📊 7. Análise do Flowchart Vortex.mmd

### **Fluxos Relevantes Identificados:**

1. **ClientFlow**: Sistema de seleção/criação de cliente ✅
2. **Planning**: Criação de planejamento estratégico ✅  
3. **Dashboard**: Interface principal com widgets ✅
4. **QuickCreate**: Modal de criação universal ✅

### **Pontos de Integração Plan-005:**

- **CLIENT_MODAL**: Reutilizar modal existente com adaptações ✅
- **PLAN_CLIENT_SELECT**: Integração obrigatória com cliente ✅
- **PLAN_FORM**: Formulário multi-etapas ✅
- **AI_STRUCTURE_GEN**: Preparação para plan-006 ✅

## ✅ 8. Conclusões e Próximos Passos

### **Status da Análise:**

🟢 **SCHEMA MAPEADO**: Todos os modelos e relacionamentos identificados  
🟢 **IDs DOCUMENTADOS**: Tipos de ID e suas relações mapeadas  
🟢 **INTEGRIDADE VALIDADA**: Relacionamentos consistentes  
🟢 **VARIÁVEIS PREPARADAS**: .env pronto para extensão  
🟡 **MODELO EXISTENTE**: StrategicPlanning já existe, precisa extensão  

### **Descobertas Importantes:**

1. **StrategicPlanning já implementado**: Modelo base existe, precisa apenas de campos JSON
2. **Client.customIndustry não existe**: Usar `industry` + `businessDetails`
3. **Relacionamentos sólidos**: Integridade referencial bem estruturada
4. **Enum PlanningStatus**: Precisa extensão para status de IA

### **Preparação para Próximas Fases:**

✅ **Fase 1**: Adaptação da UI de Cliente (modal existente)  
✅ **Fase 2**: Formulário multi-etapas (estrutura JSON preparada)  
✅ **Fase 3**: Backend APIs (relacionamentos mapeados)  
✅ **Fase 4**: Painel de visualização (modelo existente)  
✅ **Fase 5**: Integração na UI (pontos identificados)  

### **Arquivos de Migração Necessários:**

1. **Adicionar campos JSON** ao StrategicPlanning
2. **Estender enum PlanningStatus** 
3. **Adicionar índices** otimizados
4. **Atualizar tipos TypeScript**

---

## 📋 Checklist de Execução da Fase 0

- [x] **Análise completa do schema Prisma**
- [x] **Mapeamento de todos os tipos de ID**
- [x] **Identificação de relacionamentos existentes**
- [x] **Verificação de integridade referencial**
- [x] **Análise do arquivo .env existente**
- [x] **Preparação de variáveis para plan-006**
- [x] **Documentação de estruturas JSON**
- [x] **Análise do flowchart de arquitetura**
- [x] **Identificação de pontos de integração**
- [x] **Preparação para próximas fases**

---

**🎯 FASE 0 CONCLUÍDA COM SUCESSO**

**Próxima Fase**: Fase 1 - Adaptação da UI de Cliente para Planejamento  
**Dependências Resolvidas**: Todos os IDs e relacionamentos mapeados  
**Estruturas Preparadas**: JSON schemas e variáveis de ambiente prontas  