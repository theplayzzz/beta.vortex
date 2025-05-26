---
id: plan-003
title: GESTÃO DE CLIENTES
createdAt: 2025-05-26
author: theplayzzz
status: draft

## 🎯 Objetivos da Fase 3

Implementar sistema completo de gestão de clientes como funcionalidade central do Vortex Vault, incluindo remodelação do sidebar para suportar navegação de clientes, seguindo rigorosamente o **ClientFlow** definido nos documentos de referência e implementando operações CRUD completas com soft delete.

## 📋 Tarefas de Execução

### 🔥 TAREFA 1: Remodelação do Sidebar - Seção Clientes
**Prioridade: CRÍTICA**

#### Especificações da Remodelação
- **Adicionar item "Clientes"** na estrutura de navegação do sidebar
- **Submenu de Clientes** deve incluir:
  - Lista de Clientes
  - Novo Cliente
  - Clientes Arquivados (soft deleted)
- **Integração com ClientFlow**: Link "Novo Cliente" deve abrir o modal de criação rápida
- **Indicadores visuais**: Ícone apropriado e contadores (ex: número total de clientes ativos)
- **Estados ativos**: Highlighting quando em páginas relacionadas a clientes

#### Arquivos de Referência OBRIGATÓRIOS
- `/root/Vortex/precedent/docs/analise-estrutura-visual.md` - Padrões do sidebar existente
- `/root/Vortex/precedent/docs/Flowchart Vortex.mmd` - Seção "GESTÃO COMPLETA DE CLIENTES"

#### Implementação Required
- Atualizar estrutura de menu items no sidebar
- Adicionar roteamento para páginas de clientes
- Manter animações e comportamento responsivo existente
- Preservar persistência do estado collapsed/expanded no localStorage

---

### 🔥 TAREFA 2: ClientFlow - Modal de Criação Rápida
**Prioridade: CRÍTICA**

#### Especificações de Implementação
- **Triggers do Modal**: Deve abrir em todos os pontos especificados no flowchart
- **Campos obrigatórios**: Seguir exatamente o modelo Client do schema
- **Auto-save**: Implementar salvamento contínuo em localStorage durante digitação
- **Validação**: Nome obrigatório, outros campos opcionais com feedback visual
- **Comportamento**: Retornar cliente criado para funcionalidade de origem

#### Arquivos de Referência OBRIGATÓRIOS
- `/root/Vortex/precedent/docs/Schema prisma.txt` - Modelo Client completo
- `/root/Vortex/precedent/docs/Flowchart Vortex.mmd` - Seção "FLUXO COMUM: CLIENTE"
- `/root/Vortex/precedent/docs/guia-de-cores-e-estilos.md` - Design system para modal

#### Funcionalidades Required
- Modal reutilizável entre diferentes funcionalidades
- Seleção de cliente existente OU criação de novo cliente
- Indicador visual de richnessScore durante seleção
- Integração com Radix UI Dialog já disponível no projeto
- Estados de loading e erro com feedback adequado

---

### 🔥 TAREFA 3: Página de Perfil Completo do Cliente
**Prioridade: CRÍTICA**

#### RichnessScore - Sistema Completo
- **Algoritmo de cálculo**: Baseado em 13 campos opcionais do schema Client
- **Indicador visual**: Barra de progresso 0-100% com cores gradient
- **Atualização automática**: Recálculo em tempo real durante preenchimento
- **Motivação**: Messaging que incentiva preenchimento sem ser punitivo

#### Seções de Enriquecimento Progressivo
- **13 seções expandíveis** conforme campos do schema Client
- **Rich text editors** para campos de texto longo
- **Auto-save** contínuo em todos os formulários
- **Indicadores visuais** de seções preenchidas vs vazias

#### Arquivos de Referência OBRIGATÓRIOS
- `/root/Vortex/precedent/docs/Schema prisma.txt` - Todos os campos do modelo Client
- `/root/Vortex/precedent/docs/PRD Vortex Voult.md` - Seção 2.1 "Cadastro e Contexto do Cliente"
- `/root/Vortex/precedent/docs/guia-de-cores-e-estilos.md` - Cores para richnessScore ranges

#### Implementação Required
- Header com richnessScore prominente
- Seções colapsáveis/expansíveis para cada grupo de campos
- Editor rich text para campos TEXT do banco
- Vinculação com conteúdo relacionado (planejamentos, chats, propostas)

---

### 🔥 TAREFA 4: Sistema de Notas e Anexos
**Prioridade: ALTA**

#### ClientNote - Sistema Completo
- **CRUD completo** para notas vinculadas ao cliente
- **Rich text editor** para formatação avançada
- **Timestamps** automáticos de criação e edição
- **Autor tracking** (userId do criador)

#### ClientAttachment - Upload de Arquivos
- **Integração Supabase Storage** para armazenamento de arquivos
- **RLS policies** para segurança por usuário
- **Tipos permitidos**: PDF, DOC, DOCX, JPG, PNG, TXT
- **Upload com progress** e validação de tamanho

#### Arquivos de Referência OBRIGATÓRIOS
- `/root/Vortex/precedent/docs/Schema prisma.txt` - Modelos ClientNote e ClientAttachment
- Credenciais Supabase já configuradas no .env
- `/root/Vortex/precedent/docs/PRD Vortex Voult.md` - Seção sobre anexos

#### Implementação Required
- Interface de upload drag-and-drop
- Visualização/preview de arquivos anexados
- Sistema de busca dentro das notas
- Organização temporal das notas

---

### 🔥 TAREFA 5: Lista de Clientes com Filtros Avançados
**Prioridade: ALTA**

#### Interface de Lista
- **Grid responsivo** para display de clientes
- **Client cards** com informações essenciais e richnessScore
- **Paginação** para performance com muitos clientes
- **Estados vazios** quando não há clientes

#### Sistema de Filtros
- **Busca por nome** com debounce
- **Filtro por industry** (multi-select)
- **Range de richnessScore** (slider 0-100)
- **Ordenação** por nome, richnessScore, ou data de criação
- **Filtros combinados** com URL state management

#### Arquivos de Referência OBRIGATÓRIOS
- `/root/Vortex/precedent/docs/Flowchart Vortex.mmd` - Seção sobre lista de clientes
- `/root/Vortex/precedent/docs/guia-de-cores-e-estilos.md` - Design dos cards

#### Implementação Required
- TanStack Query para caching e synchronization
- URLs que reflitam estado dos filtros (bookmarkable)
- Performance otimizada para centenas de clientes
- Actions por card (editar, deletar, criar planejamento, iniciar chat)

---

### 🔥 TAREFA 6: Operações de Edição e Soft Delete
**Prioridade: ALTA**

#### Funcionalidade de Edição
- **Edição inline** em campos simples
- **Modal/página dedicada** para edição completa
- **Versionamento** de mudanças importantes
- **Validação** antes de salvar alterações

#### Sistema de Soft Delete
- **Implementação de soft delete**: Campo `deletedAt` no modelo Client (adicionar se necessário)
- **Não remoção física**: Manter dados no banco para auditoria
- **Filtros automáticos**: Excluir clientes "deletados" das listagens normais
- **Página de recuperação**: Interface para restaurar clientes deletados
- **Cascade behavior**: Como tratar planejamentos/chats/propostas de clientes deletados

#### Arquivos de Referência OBRIGATÓRIOS
- `/root/Vortex/precedent/docs/Schema prisma.txt` - Verificar estrutura atual do modelo Client
- `/root/Vortex/precedent/docs/PRD Vortex Voult.md` - Seção sobre gestão de dados

#### Implementação Required
- Confirmação de exclusão com warning sobre impacto
- Logs de auditoria para operações de delete/restore
- Interface administrativa para clientes arquivados
- Políticas de retenção de dados

---

### 🔥 TAREFA 7: Integração com Sistema de Busca Global
**Prioridade: MÉDIA**

#### Funcionalidade de Busca
- **Inclusão na busca global** do header existente
- **Resultados categorizados** (clientes aparecem como categoria)
- **Preview rico** com richnessScore e informações relevantes
- **Deep linking** para perfil do cliente

#### Arquivos de Referência OBRIGATÓRIOS
- `/root/Vortex/precedent/docs/Flowchart Vortex.mmd` - Seção "BUSCA GLOBAL UNIFICADA"
- `/root/Vortex/precedent/docs/analise-estrutura-visual.md` - Implementação atual do header

#### Implementação Required
- Integração com sistema de busca existente no header
- Indexação de campos searchable (name, industry, businessDetails)
- Performance otimizada com debounce e caching
- Highlighting de termos encontrados nos resultados

---

## 🔗 Pontos de Integração Críticos

### ClientFlow Integration Points
- **Dashboard**: Botão "+" universal deve incluir opção "Novo Cliente"
- **Planejamento**: Obrigatório vincular cliente antes de criar planejamento
- **Chat IA**: Obrigatório selecionar cliente antes de iniciar conversa
- **Propostas**: Opcional vincular cliente ao criar proposta
- **Tarefas**: Opcional vincular cliente em tarefas avulsas

### Database Operations Required
- Hooks TanStack Query para todas as operações CRUD
- Middleware para soft delete automático em queries
- Sincronização cliente-usuario via Clerk userId
- Relacionamentos cascade-safe com outras entidades

## 🚨 Validações Críticas OBRIGATÓRIAS

### ✅ Schema Compliance
- Verificar se todas as tabelas Client, ClientNote, ClientAttachment existem
- Validar foreign keys e relacionamentos
- Testar RLS policies no Supabase
- Confirmar tipos de dados corretos para todos os campos

### ✅ ClientFlow Behavior
- Modal abre corretamente em todos os pontos de trigger
- Cliente selecionado/criado é retornado para funcionalidade origem
- Auto-save funciona sem impactar performance da UI
- Validações e estados de erro funcionam corretamente

### ✅ RichnessScore Accuracy
- Cálculo preciso baseado em campos preenchidos vs vazios
- Atualização em tempo real durante edição
- Indicador visual responsivo e motivacional
- Performance otimizada para recálculos frequentes

### ✅ Soft Delete Implementation
- Clientes deletados não aparecem em listagens normais
- Funcionalidades dependentes lidam corretamente com clientes deletados
- Interface de recuperação funciona corretamente
- Auditoria e logs adequados

## 🎯 Definition of Done - Fase 3

### Critérios de Aceitação Técnicos
- [ ] **Sidebar remodelado** com seção Clientes funcional
- [ ] **ClientFlow Modal** operacional em todos os pontos de integração
- [ ] **CRUD completo** para clientes, notas e anexos
- [ ] **RichnessScore** calculado e exibido corretamente
- [ ] **Sistema de filtros** na lista de clientes funcional
- [ ] **Soft delete** implementado com interface de recuperação
- [ ] **Busca global** inclui clientes nos resultados
- [ ] **Mobile responsive** em todos os componentes
- [ ] **Performance otimizada** para operações frequentes

### Critérios de Aceitação de Negócio
- [ ] **Fluxo completo**: Usuário consegue criar, editar, buscar e "excluir" clientes
- [ ] **Motivação**: Sistema incentiva preenchimento completo de informações
- [ ] **Eficiência**: ClientFlow acelera criação de outras funcionalidades
- [ ] **Segurança**: RLS e soft delete protegem dados adequadamente
- [ ] **Escalabilidade**: Sistema suporta centenas de clientes por usuário

### Integration Testing
- [ ] **ClientFlow testado** em criação de planejamentos
- [ ] **Busca global** retorna clientes corretamente
- [ ] **Sidebar navigation** funciona em todas as telas
- [ ] **Performance** mantida com aumento de dados
- [ ] **Cross-browser** compatibility validada

---

## 📚 Arquivos de Referência Consolidados

### Documentação OBRIGATÓRIA para Consulta
1. `/root/Vortex/precedent/docs/Schema prisma.txt` - Estrutura de dados
2. `/root/Vortex/precedent/docs/Flowchart Vortex.mmd` - Fluxos e comportamentos
3. `/root/Vortex/precedent/docs/PRD Vortex Voult.md` - Especificações funcionais
4. `/root/Vortex/precedent/docs/analise-estrutura-visual.md` - Padrões de interface
5. `/root/Vortex/precedent/docs/guia-de-cores-e-estilos.md` - Design system

### Dependências Técnicas
- **Modelos Prisma**: Client, ClientNote, ClientAttachment, User
- **Packages disponíveis**: @radix-ui/react-dialog, @supabase/supabase-js
- **TanStack Query** para state management e caching
- **Supabase Storage** para upload de anexos
- **Clerk userId** para relacionamento user-cliente

**Próximo Passo**: Iniciar implementação com Tarefa 1 (Remodelação do Sidebar) pois estabelece foundation de navegação para todas as outras funcionalidades de clientes.
