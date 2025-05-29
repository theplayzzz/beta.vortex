# Plan 009 - Sistema de Refinamento e Aprovação de Tarefas Geradas por IA

## 📋 Resumo da Implementação

Este documento resume a implementação do Sistema de Refinamento e Aprovação de Tarefas Geradas por IA, conforme especificado no plano `plan-009-planejamento-refinado.md`.

## ✅ Componentes Implementados

### 1. Tipos TypeScript
- **Localização**: `types/planning.ts`
- **Conteúdo**: Interfaces para `TarefaAI`, `BacklogAI`, `Client` e `Planning`
- **Função**: Tipagem forte para todo o sistema

### 2. Componentes de Interface

#### TaskRefinementInterface.tsx
- **Localização**: `components/planning/TaskRefinementInterface.tsx`
- **Função**: Componente principal que substitui a exibição simples dos objetivos específicos
- **Características**:
  - Cabeçalho com contadores
  - Botão "Selecionar todas as tarefas"
  - Botão "Aprovar selecionadas (X)"
  - Integração com modais de edição

#### TaskRefinementList.tsx
- **Localização**: `components/planning/TaskRefinementList.tsx`
- **Função**: Lista de tarefas para refinamento
- **Características**:
  - Renderização de cards de tarefas
  - Estado vazio tratado
  - Passa eventos para componente pai

#### TaskCard.tsx
- **Localização**: `components/planning/TaskCard.tsx`
- **Função**: Card individual para cada tarefa
- **Características**:
  - Checkbox de seleção
  - Nome da tarefa (clicável para expandir)
  - Badge de prioridade colorido
  - Menu dropdown com opções de edição
  - Exibição condicional da descrição
  - Suporte a contexto adicional

#### EditTaskModal.tsx
- **Localização**: `components/planning/EditTaskModal.tsx`
- **Função**: Modal para edição de tarefas
- **Características**:
  - Campos para nome, descrição e prioridade
  - Validação de campos obrigatórios
  - Contador de caracteres
  - Salvamento automático

#### AddContextModal.tsx
- **Localização**: `components/planning/AddContextModal.tsx`
- **Função**: Modal para adição de contexto adicional
- **Características**:
  - Exibição da tarefa original
  - Campo de texto para contexto adicional
  - Preview do contexto
  - Limite de 500 caracteres

### 3. APIs Backend

#### approve-tasks/route.ts
- **Localização**: `app/api/planning/[planningId]/approve-tasks/route.ts`
- **Função**: Endpoint para aprovar tarefas selecionadas
- **Características**:
  - Validação de permissões
  - Filtragem de tarefas selecionadas
  - Envio de webhook para `REFINED_LIST_WEBHOOK_URL`
  - Atualização de status do planejamento

#### update-tasks/route.ts
- **Localização**: `app/api/planning/[planningId]/update-tasks/route.ts`
- **Função**: Endpoint para atualizar tarefas editadas
- **Características**:
  - Validação de estrutura de dados
  - Atualização do campo `specificObjectives`
  - Manutenção da integridade dos dados

### 4. Modificações nos Componentes Existentes

#### PlanningDetails.tsx
- **Modificações**:
  - Adicionada detecção de tarefas estruturadas
  - Integração com `TaskRefinementInterface`
  - Fallback para exibição simples de objetivos não estruturados
  - Estado local para atualizações em tempo real

#### index.ts
- **Modificações**:
  - Exportação dos novos componentes de refinamento
  - Organização das exportações

## 🗄️ Estrutura de Dados

### Campo `specificObjectives`
```json
{
  "nome_do_backlog": "string",
  "objetivo_do_backlog": "string",
  "tarefas": [
    {
      "nome": "string",
      "descricao": "string", 
      "prioridade": "alta" | "média" | "normal",
      "selecionada": boolean,
      "contexto_adicional": "string", // opcional
      "detalhamentos": [] // opcional
    }
  ]
}
```

### Payload de Webhook
```json
{
  "headers": {
    "content-type": "application/json"
  },
  "body": {
    "id": "planningId",
    "title": "Projeto: [nome do backlog]",
    "description": "Projeto gerado a partir do planejamento",
    "status": "pending",
    "priority": "high",
    "userId": "userId",
    "backlogId": "planningId",
    "tarefaId": "planningId",
    "planejamento-informações": [
      {
        "nome": "nome da tarefa",
        "descricao": "descrição + contexto adicional se houver",
        "prioridade": "prioridade selecionada"
      }
    ],
    "planning_id": "planningId",
    "projectName": "nome do projeto",
    "sourceBacklogId": "planningId",
    "linkedTaskId": "planningId"
  },
  "webhookUrl": "REFINED_LIST_WEBHOOK_URL",
  "executionMode": "production"
}
```

## 🧪 Dados de Teste

### Script de População
- **Localização**: `scripts/populate-planning-with-tasks.js`
- **Função**: Criar planejamento com tarefas estruturadas para teste
- **Uso**: `node scripts/populate-planning-with-tasks.js`

### Planejamento de Exemplo
- **Título**: "Planejamento Estratégico - Advocacia Digital"
- **Tarefas**: 10 tarefas de exemplo com diferentes prioridades
- **Status**: `AI_BACKLOG_VISIBLE`
- **URL de Teste**: Mostrada no output do script

## 🔄 Fluxo de Funcionamento

1. **Detecção**: Sistema verifica se `specificObjectives` contém tarefas estruturadas
2. **Renderização**: Se sim, exibe `TaskRefinementInterface` em vez da exibição simples
3. **Interação**: Usuário pode:
   - Selecionar/desselecionar tarefas
   - Editar nome, descrição e prioridade
   - Adicionar contexto adicional
   - Visualizar descrições em hover/clique
4. **Aprovação**: Ao clicar "Aprovar selecionadas":
   - Valida que há tarefas selecionadas
   - Envia webhook com tarefas aprovadas
   - Atualiza status do planejamento
   - Exibe feedback de sucesso/erro

## 🔧 Variáveis de Ambiente Necessárias

```env
REFINED_LIST_WEBHOOK_URL="https://webhook.example.com/endpoint"
WEBHOOK_SECRET="secret-key" # opcional
```

## 📊 Estados do Sistema

### Status de Planejamento
- `DRAFT`: Rascunho
- `AI_BACKLOG_VISIBLE`: Backlog IA gerado (estado para teste)
- `PENDING_AI_REFINED_LIST`: Aguardando processamento da lista refinada

### Estados de Interface
- **Loading**: Durante aprovação de tarefas
- **Error**: Em caso de falha na comunicação
- **Success**: Após aprovação bem-sucedida

## 🎯 Funcionalidades Implementadas

- ✅ **Interface de refinamento** para tarefas já geradas pela IA
- ✅ **Sistema de seleção e edição** com contexto personalizado
- ✅ **Interface de aprovação** com envio de webhook
- ✅ **Persistência de dados** no campo `specificObjectives`
- ✅ **Validações** frontend e backend
- ✅ **Tratamento de erros** adequado
- ✅ **Tipos TypeScript** para type safety

## 🚧 Não Implementado Neste Sprint

- Sistema de notificações em tempo real
- Polling/WebSocket para feedback do webhook
- Sistema de auditoria completo
- Retry automático em falhas
- Testes automatizados

## 🧑‍💻 Como Testar

1. Execute o script de população:
   ```bash
   node scripts/populate-planning-with-tasks.js
   ```

2. Inicie o servidor:
   ```bash
   npm run dev
   ```

3. Acesse a URL mostrada no output do script

4. Teste as funcionalidades:
   - Visualização das tarefas
   - Seleção/deseleção
   - Edição de tarefas
   - Adição de contexto
   - Aprovação (requer webhook configurado)

## 📝 Observações Técnicas

- Sistema compatível com estrutura existente
- Fallback para objetivos não estruturados
- Validação rigorosa de dados
- Interface responsiva (baseada no design system existente)
- Type safety completo com TypeScript 