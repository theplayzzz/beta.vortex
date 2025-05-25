# Planejamento Revisado - Vortex Voult (Baseado na Estrutura Existente)

## Fase 1: Integração de Base e Setup Banco de Dados

---
id: phase-001-revised
title: Integração de Base e Setup Banco de Dados
createdAt: 2025-01-23
author: ai-guards
status: draft
---

## 🧩 Scope

Integração do banco de dados Supabase na estrutura existente do projeto, configuração do Prisma ORM conforme schema definido, e preparação da base para sistema de créditos. Aproveitar a navegação, sidebar e perfil já funcionais para focar na conectividade de dados.

## ✅ Functional Requirements

- Integração Supabase seguindo configuração do `/docs/Schema prisma.txt`
- Setup Prisma ORM com todas as tabelas e relacionamentos definidos
- Configuração variáveis ambiente para desenvolvimento e produção
- Preparação hooks TanStack Query para operações CRUD
- Sistema de tipos TypeScript baseado no schema Prisma
- Setup inicial para futuro sistema de créditos (estrutura de tabelas)
- Integração com autenticação Clerk existente
- Configuração middlewares de segurança e validação

## ⚙️ Non-Functional Requirements

- **Performance**: Queries otimizadas com Prisma, conexão pool configurada
- **Security**: Environment variables seguras, validação schema level
- **Scalability**: Estrutura preparada para crescimento, índices otimizados

## 📚 Guidelines & Packages

- **Follow project guidelines**: Consultar `/docs/Schema prisma.txt` para estrutura exata do banco
- **Reference files**: 
  - `/docs/PRD Vortex Voult.md` - Seção 2.8 Sistema de Créditos
  - `/docs/package.json` - Dependências já instaladas
- **Packages já disponíveis**:
  - `@supabase/supabase-js` - Cliente Supabase
  - `prisma` - ORM type-safe
  - `@clerk/nextjs` - Autenticação

## 🔐 Threat Model (Stub)

- **Database Connection Exposure**: Credenciais de conexão mal configuradas
- **Schema Migration Issues**: Perda de dados durante migrations
- **Access Control Setup**: Configurações RLS (Row Level Security) inadequadas

## 🔢 Execution Plan

1. Configuração Supabase project e obtenção de credenciais de produção
2. Setup Prisma com schema completo conforme `/docs/Schema prisma.txt`
3. Configuração Row Level Security (RLS) policies no Supabase
4. Implementação tipos TypeScript gerados pelo Prisma
5. Setup TanStack Query com hooks básicos para User e Client
6. Configuração middleware autenticação Clerk + Prisma
7. Testes de conectividade e validação schema
8. Preparação estrutura créditos (tabelas prontas, lógica posterior)

---

## Fase 2: Gestão de Clientes (Funcionalidade Existente)

---
id: phase-002-revised
title: Gestão de Clientes - Implementação Prioritária
createdAt: 2025-01-23
author: ai-guards
status: draft
---

## 🧩 Scope

Implementação completa do sistema de gestão de clientes conforme funcionalidade existente no aplicativo anterior. Foco na criação rápida via pop-up, enriquecimento progressivo e sistema de pontuação de riqueza. Base fundamental para todas as outras funcionalidades.

## ✅ Functional Requirements

- Modal de criação rápida de clientes (campos: name, industry, serviceOrProduct, initialObjective)
- Página completa de perfil do cliente com todas as seções de enriquecimento
- Cálculo automático de richnessScore (0-100) baseado no preenchimento
- Indicador visual motivacional de riqueza de informações
- Lista de clientes com filtros por industry e richnessScore
- Sistema de notas (ClientNote) e anexos (ClientAttachment)
- ClientFlow reutilizável entre módulos conforme fluxograma
- Integração com sistema de busca global do header

## ⚙️ Non-Functional Requirements

- **Performance**: Cálculo richnessScore em tempo real, carregamento lista <300ms
- **Security**: Validação rigorosa dados cliente, controle acesso por userId
- **Scalability**: Estrutura preparada para milhares de clientes por usuário

## 📚 Guidelines & Packages

- **Reference files**: 
  - `/docs/Flowchart Vortex.mmd` - Seção "FLUXO COMUM: CLIENTE" e "GESTÃO COMPLETA DE CLIENTES"
  - `/docs/PRD Vortex Voult.md` - Seção 2.1 Cadastro e Contexto do Cliente
  - `/docs/Schema prisma.txt` - Modelos Client, ClientNote, ClientAttachment
  - `/docs/analise-estrutura-visual.md` - Para padrões de UI existentes
- **Packages já disponíveis**:
  - `@radix-ui/react-dialog` - Para modals
  - `react-hook-form` - Formulários otimizados
  - `zod` - Validação schemas

## 🔐 Threat Model (Stub)

- **PII Data Exposure**: Dados pessoais de clientes vazados entre usuários
- **Input Validation**: Injection attacks via campos de cliente
- **File Upload Security**: Anexos maliciosos via ClientAttachment

## 🔢 Execution Plan

1. Implementação modelo Client com CRUD completo seguindo schema
2. Desenvolvimento pop-up criação rápida conforme fluxograma
3. Criação página perfil completo com seções de enriquecimento
4. Algoritmo cálculo richnessScore baseado em campos preenchidos
5. Implementação indicador visual motivacional de riqueza
6. Sistema ClientNote e ClientAttachment com Supabase Storage
7. Lista de clientes com filtros e busca
8. Criação ClientFlow reutilizável para outros módulos

---

## Fase 3: Planejamento Estratégico (Funcionalidade Existente)

---
id: phase-003-revised
title: Planejamento Estratégico - Funcionalidade Core
createdAt: 2025-01-23
author: ai-guards
status: draft
---

## 🧩 Scope

Implementação do módulo de planejamento estratégico que replica a funcionalidade existente, incluindo formulário inteligente, geração inicial de estrutura e criação de backlog detalhado. Preparado para futuro consumo de créditos mas funcionando inicialmente sem IA.

## ✅ Functional Requirements

- Formulário de planejamento vinculado obrigatoriamente a um cliente
- Campos: title, description, specificObjectives, scope, successMetrics, budget, toneOfVoice
- Geração de estrutura inicial (preparado para IA, inicialmente manual/template)
- Criação automática de PlanningTask[] vinculadas ao planejamento
- Estados de planejamento: DRAFT, ACTIVE, COMPLETED, ARCHIVED
- Interface de gestão de planejamentos (lista, filtros, status)
- Sistema de edição e revisão de planejamentos
- Vinculação automática com cliente (clientId)

## ⚙️ Non-Functional Requirements

- **Performance**: Criação planejamento <2s, carregamento lista <300ms
- **Security**: Validação permissões por usuário, sanitização inputs
- **Scalability**: Estrutura preparada para centenas de planejamentos por usuário

## 📚 Guidelines & Packages

- **Reference files**: 
  - `/docs/Flowchart Vortex.mmd` - Seção "PLANEJAMENTO ESTRATÉGICO COM IA"
  - `/docs/PRD Vortex Voult.md` - Seção 2.2 Planejamento Estratégico com IA
  - `/docs/Schema prisma.txt` - Modelo StrategicPlanning e PlanningTask
  - `/docs/guia-de-cores-e-estilos.md` - Para consistência visual
- **Packages preparados para IA**: 
  - `openai` - API OpenAI (futuro)
  - `@anthropic-ai/sdk` - API Anthropic (futuro)

## 🔐 Threat Model (Stub)

- **Unauthorized Access**: Acesso a planejamentos de outros usuários
- **Data Integrity**: Corrupção de vínculos client-planning-tasks
- **Future AI Security**: Preparação para prompt injection (estrutura)

## 🔢 Execution Plan

1. Implementação modelo StrategicPlanning com CRUD completo
2. Desenvolvimento formulário criação usando ClientFlow
3. Sistema de estados e transições de planejamento
4. Geração automática de backlog (PlanningTask[]) - inicialmente template
5. Interface gestão de planejamentos com filtros
6. Sistema de edição e versionamento básico
7. Preparação estrutural para futura integração IA
8. Vinculação com dashboard widgets existentes

---

## Fase 4: Lista Refinada - Backlog de Tarefas (Funcionalidade Existente)

---
id: phase-004-revised
title: Lista Refinada - Sistema de Tarefas
createdAt: 2025-01-23
author: ai-guards
status: draft
---

## 🧩 Scope

Implementação completa do sistema de gestão de tarefas (backlog refinado), replicando funcionalidade existente com visualizações múltiplas, sistema de colaboração e integração com planejamentos estratégicos.

## ✅ Functional Requirements

- Visualização em lista detalhada com filtros avançados
- Visualização kanban interativo com drag-and-drop
- Visualização em calendário baseada em endDate
- Sistema completo de estados: TODO, IN_PROGRESS, REVIEW, DONE, BLOCKED
- Prioridades: LOW, MEDIUM, HIGH, URGENT
- Sistema de atribuição (ownerId, assigneeId)
- Comentários (TaskComment) e anexos (TaskAttachment)
- Subtarefas com hierarquia (parentId)
- Estimativas de esforço (effortEstimate)
- Vinculação opcional com cliente (clientId)

## ⚙️ Non-Functional Requirements

- **Performance**: Renderização kanban <200ms, drag-drop 60fps, virtualização para listas grandes
- **Security**: Controle granular acesso tarefas, audit trail alterações
- **Scalability**: Suporte a milhares de tarefas por usuário, paginação eficiente

## 📚 Guidelines & Packages

- **Reference files**: 
  - `/docs/Flowchart Vortex.mmd` - Seção "GESTÃO AVANÇADA DE TAREFAS"
  - `/docs/PRD Vortex Voult.md` - Seção 2.4 Gestão de Tarefas
  - `/docs/Schema prisma.txt` - Modelos PlanningTask, TaskComment, TaskAttachment
  - `/docs/analise-estrutura-visual.md` - Para layout kanban e componentes
- **Packages já disponíveis**:
  - `@dnd-kit/core` - Drag and drop
  - `react-big-calendar` - Visualização calendário (a instalar)
  - `@radix-ui/react-select` - Selects e filtros

## 🔐 Threat Model (Stub)

- **Task Access Control**: Visualização tarefas não autorizadas
- **File Upload Vulnerabilities**: Anexos maliciosos via TaskAttachment
- **Data Consistency**: Inconsistência estados após drag-drop

## 🔢 Execution Plan

1. Implementação modelo PlanningTask com todos os campos
2. Desenvolvimento visualização lista com filtros avançados
3. Criação kanban interativo com drag-and-drop (@dnd-kit)
4. Implementação visualização calendário
5. Sistema comentários e menções
6. Sistema anexos de tarefas
7. Hierarquia de subtarefas
8. Integração com planejamentos e clientes existentes

---

## Fase 5: Sistema de Créditos - Preparação e Base

---
id: phase-005-revised
title: Sistema de Créditos - Estrutura Base
createdAt: 2025-01-23
author: ai-guards
status: draft
---

## 🧩 Scope

Implementação da estrutura base do sistema de créditos, incluindo modelos de dados, tracking básico e preparação para futuras funcionalidades de IA. Estabelece a fundação para monetização sem ainda implementar cobrança ativa.

## ✅ Functional Requirements

- Modelo User.creditBalance funcional com operações básicas
- Sistema CreditTransaction com todos os tipos definidos
- Dashboard básico de créditos (saldo, histórico simples)
- Tracking de operações preparado para IA (sem cobrança ativa ainda)
- Sistema de grants iniciais (INITIAL_GRANT)
- Estrutura para futuras integrações Clerk payments
- Alertas básicos de saldo baixo
- Histórico de transações com filtros

## ⚙️ Non-Functional Requirements

- **Performance**: Operações crédito <100ms, cálculos precisos com Decimal.js
- **Security**: Validação rigorosa transações, audit logs completos
- **Scalability**: Estrutura preparada para volume alto de transações

## 📚 Guidelines & Packages

- **Reference files**: 
  - `/docs/PRD Vortex Voult.md` - Seção 2.8 Sistema de Créditos e Monetização
  - `/docs/Schema prisma.txt` - Modelos User.creditBalance e CreditTransaction
  - `/docs/Flowchart Vortex.mmd` - Seção "SISTEMA TRANSPARENTE DE CRÉDITOS"
- **Packages a instalar**:
  - `decimal.js` - Cálculos precisos (MIT)
  - `@clerk/clerk-sdk-node` - Future payments (MIT)

## 🔐 Threat Model (Stub)

- **Credit Balance Manipulation**: Alteração não autorizada saldos
- **Transaction Integrity**: Dupla cobrança ou inconsistências
- **Future Payment Security**: Preparação para fraud detection

## 🔢 Execution Plan

1. Implementação operações CRUD para creditBalance
2. Sistema CreditTransaction com todos os enum types
3. Desenvolvimento dashboard básico de créditos
4. Implementação grants iniciais para novos usuários
5. Sistema de alertas de saldo baixo
6. Preparação hooks para futuras cobranças IA
7. Histórico de transações com filtros
8. Estrutura para futura integração Clerk payments

---

## Fase 6: Propostas Comerciais - Nova Funcionalidade Prioritária

---
id: phase-006-revised
title: Propostas Comerciais - Próxima Funcionalidade
createdAt: 2025-01-23
author: ai-guards
status: draft
---

## 🧩 Scope

Implementação do módulo de propostas comerciais como primeira nova funcionalidade após replicar o sistema original. Inclui geração básica, editor avançado e sistema de tracking, preparado para futuro upgrade com IA.

## ✅ Functional Requirements

- Sistema CRUD completo para CommercialProposal
- Editor de propostas com rich text (generatedContent)
- Estados: DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, NEGOTIATION, ARCHIVED
- Versionamento de propostas (version)
- Vinculação opcional com cliente (clientId)
- Templates básicos de propostas
- Sistema de export PDF/DOCX básico
- Tracking simples de status
- Dashboard de propostas com métricas básicas

## ⚙️ Non-Functional Requirements

- **Performance**: Editor responsivo <200ms, export PDF <5s
- **Security**: Versionamento seguro, controle acesso por usuário
- **Scalability**: Estrutura preparada para templates e IA futura

## 📚 Guidelines & Packages

- **Reference files**: 
  - `/docs/PRD Vortex Voult.md` - Seção 2.5 Módulo de Vendas
  - `/docs/Schema prisma.txt` - Modelo CommercialProposal
  - `/docs/Flowchart Vortex.mmd` - Seção "MÓDULO AVANÇADO DE VENDAS"
- **Packages a instalar**:
  - `@tiptap/react` - Rich text editor (MIT)
  - `jspdf` - PDF generation básico (MIT)
  - `html-to-docx` - DOCX export (MIT)

## 🔐 Threat Model (Stub)

- **Proposal Data Leakage**: Acesso não autorizado a propostas
- **Version Control Issues**: Perda ou corrupção de versões
- **Export Security**: Dados sensíveis em exports

## 🔢 Execution Plan

1. Implementação modelo CommercialProposal completo
2. Desenvolvimento editor rich text com @tiptap
3. Sistema de estados e versionamento
4. Templates básicos de propostas
5. Export PDF/DOCX funcional
6. Dashboard propostas com métricas
7. Integração com ClientFlow existente
8. Preparação para futura geração IA

---

## Fase 7: Agente IA Contextualizado

---
id: phase-007-revised
title: Agente IA - Primeira Funcionalidade com IA Real
createdAt: 2025-01-23
author: ai-guards
status: draft
---

## 🧩 Scope

Primeira implementação real de IA na plataforma, criando o agente contextualizado que utiliza os dados ricos dos clientes. Integra consumo de créditos e estabelece o padrão para futuras funcionalidades de IA.

## ✅ Functional Requirements

- Interface chat em tempo real com streaming
- Contextualização automática baseada em richnessScore do cliente
- Persistência AgentInteraction e AgentMessage
- Consumo real de créditos (CONSUMPTION_AGENT_IA_MESSAGE)
- Capacidades: redação, brainstorming, análise, sugestões
- Sistema de favoritos e organização de chats
- Busca em histórico de conversas
- Integração com OpenAI/Anthropic APIs

## ⚙️ Non-Functional Requirements

- **Performance**: Streaming responses <2s, context loading <500ms
- **Security**: Sanitização prompts, rate limiting, context security
- **Scalability**: Queue system para processamento, context caching

## 📚 Guidelines & Packages

- **Reference files**: 
  - `/docs/PRD Vortex Voult.md` - Seção 2.3 Agente de Conversação IA
  - `/docs/Schema prisma.txt` - Modelos AgentInteraction, AgentMessage
  - `/docs/Flowchart Vortex.mmd` - Seção "AGENTE IA CONTEXTUALIZADO"
- **Packages a usar**:
  - `openai@4+` - OpenAI integration (MIT)
  - `ai@3+` - Vercel AI SDK (MIT)
  - `react-markdown@9+` - Markdown rendering (MIT)

## 🔐 Threat Model (Stub)

- **Prompt Injection**: Manipulação maliciosa de prompts
- **Context Poisoning**: Injeção dados maliciosos no contexto
- **Credit Abuse**: Consumo excessivo automatizado

## 🔢 Execution Plan

1. Setup OpenAI/Anthropic APIs com rate limiting
2. Implementação interface chat com streaming
3. Sistema contextualização baseado em cliente
4. Integração consumo créditos real
5. Persistência conversas e mensagens
6. Sistema organização e busca chats
7. Implementação capacidades avançadas
8. Monitoramento uso e qualidade IA

---

## Fase 8: Upgrade IA nas Funcionalidades Existentes

---
id: phase-008-revised
title: Upgrade IA - Planejamentos e Propostas
createdAt: 2025-01-23
author: ai-guards
status: draft
---

## 🧩 Scope

Upgrade das funcionalidades já implementadas (planejamentos e propostas) com capacidades reais de IA, aproveitando a infraestrutura estabelecida na Fase 7 e o sistema de créditos maduro.

## ✅ Functional Requirements

- Geração IA de estruturas de planejamento estratégico
- Criação automática de backlogs detalhados com IA
- Geração IA de propostas comerciais contextualizadas
- Upgrade do sistema de argumentos de vendas
- Consumo de créditos: CONSUMPTION_PLANNING_INITIAL, CONSUMPTION_PLANNING_DETAILED, CONSUMPTION_PROPOSAL_GENERATION
- Sistema de templates inteligentes
- Otimização baseada em richnessScore do cliente

## ⚙️ Non-Functional Requirements

- **Performance**: Geração IA <30s, processamento assíncrono com feedback
- **Security**: Reutilização padrões segurança da Fase 7
- **Scalability**: Aproveitamento da infraestrutura IA existente

## 📚 Guidelines & Packages

- **Reference files**: 
  - Todo o conteúdo das fases anteriores
  - Padrões estabelecidos na Fase 7 para IA
  - `/docs/PRD Vortex Voult.md` - Seções de IA em planejamentos e vendas
- **Packages**: Reutilização da stack IA da Fase 7

## 🔐 Threat Model (Stub)

- **Reuse IA Security**: Aplicar padrões de segurança estabelecidos
- **Cross-feature Context**: Segurança na reutilização de contextos

## 🔢 Execution Plan

1. Integração IA na geração de planejamentos estratégicos
2. Upgrade criação automática de backlogs
3. Implementação geração IA de propostas
4. Sistema argumentos vendas com IA
5. Otimização baseada em richnessScore
6. Templates inteligentes e adaptativos
7. Monitoramento consumo créditos otimizado
8. Métricas qualidade outputs IA

---

**Observação Importante**: Todas as fases fazem referência constante aos arquivos em `/docs/` para garantir que o agente executor sempre consulte as especificações detalhadas, fluxogramas, schema do banco, e diretrizes visuais durante a implementação. Cada funcionalidade deve ser desenvolvida seguindo exatamente os padrões e estruturas definidas na documentação.