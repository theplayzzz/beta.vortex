---
id: plan-010
title: Sistema de Aprovação com Planejamento Refinado
createdAt: 2025-05-29
author: theplayzzz
status: draft
---

## 🧩 Scope

Implementar melhorias no sistema de aprovação de planejamentos, incluindo pop-up de confirmação, nova aba de "Planejamento Refinado" com loading dinâmico e integração com webhook para exibição de tarefas refinadas pela IA.

## ✅ Functional Requirements

### Pop-up de Confirmação
- Exibir pop-up ao clicar no botão "Aprovar Selecionadas"
- Bloquear ambos os botões de aprovação durante exibição do pop-up
- Mensagem: "Tem certeza que deseja aprovar estes planejamentos? Os créditos serão descontados" (apenas informativa)
- Botões: "Sim" e "Cancelar"
- Fechar pop-up ao clicar em "Cancelar" sem ações adicionais

### Nova Aba "Planejamento Refinado"
- Criar nova aba ao lado direito da aba "Objetivos Específicos"
- Ativar automaticamente a nova aba após confirmação
- Exibir balão informativo: "IA está gerando..."
- Mostrar animação de loading
- Destacar visualmente a nova aba

### Sistema de Loading e Resposta
- Parar loading independentemente da resposta do webhook
- Voltar à tela de planejamento após aprovação sem aguardar webhook
- Encerrar loading apenas quando webhook responder
- Substituir balão por: "Planejamento refinado pronto"
- Exibir notificação no sistema: "Planejamento refinado está pronto"

### Lista de Tarefas Refinadas
- Exibir lista similar ao ClickUp com tarefas refinadas
- Cada item da lista deve ser clicável
- Ao clicar, abrir nova tela com detalhes da tarefa (descrição/briefing)
- Integração com dados do banco (tabela scop → strategicplanning)

## ⚙️ Non-Functional Requirements

- **Performance**: Loading deve iniciar imediatamente após confirmação
- **Responsividade**: Interface deve responder em menos de 300ms ao clicar
- **Usabilidade**: Pop-up deve ser intuitivo e não invasivo
- **Consistência**: Manter padrão visual das abas existentes

## 📚 Guidelines & Packages

- Seguir padrões de UI/UX já estabelecidos no projeto
- Utilizar componentes de modal/pop-up existentes ou criar seguindo design system
- Implementar animações suaves para transições
- Manter acessibilidade (ARIA labels, navegação por teclado)

## 🔐 Threat Model (Stub)

- Validar permissões antes de permitir aprovação
- Sanitizar dados recebidos do webhook
- Implementar timeout para requisições de webhook

## 🔢 Execution Plan

### 1. Implementação do Pop-up de Confirmação
**Objetivo**: Criar confirmação antes da aprovação com bloqueio de interface

**Ações Específicas**:
- Criar componente `ConfirmationModal.tsx` com props: `isOpen`, `onConfirm`, `onCancel`, `message`
- Implementar estado `isModalOpen` no componente pai dos botões de aprovação
- Adicionar handler `handleApprovalClick()` que:
  - Define `setIsModalOpen(true)`
  - Define `setButtonsDisabled(true)` para ambos os botões
  - Exibe modal com mensagem exata: "Tem certeza que deseja aprovar estes planejamentos? Os créditos serão descontados"
- Implementar `handleConfirm()`:
  - Fechar modal: `setIsModalOpen(false)`
  - **MANTER botões desabilitados até webhook responder**
  - Disparar webhook de aprovação existente
  - Executar `createRefinedPlanningTab()`
- Implementar `handleCancel()`:
  - Fechar modal: `setIsModalOpen(false)`
  - Reabilitar botões: `setButtonsDisabled(false)`
  - Nenhuma ação adicional

### 2. Criação da Nova Aba "Planejamento Refinado"
**Objetivo**: Adicionar nova aba que ativa automaticamente após confirmação

**Ações Específicas**:
- Localizar componente de tabs onde está "Objetivos Específicos"
- Adicionar nova tab no array de tabs:
  ```javascript
  {
    id: 'planejamento-refinado',
    label: 'Planejamento Refinado',
    position: 'after-objetivos-especificos',
    highlighted: true
  }
  ```
- Implementar função `createRefinedPlanningTab()`:
  - Adicionar nova aba ao estado de tabs
  - Definir `setActiveTab('planejamento-refinado')`
  - Aplicar classe CSS `tab-highlighted` para destaque visual
  - Inicializar estado `isGenerating: true`
- Criar componente `RefinedPlanningTab.tsx` com estados:
  - `isLoading: boolean`
  - `balloonMessage: string`
  - `tasks: TaskRefinada[]`
  - `isReady: boolean`

### 3. Sistema de Loading e Feedback Visual
**Objetivo**: Gerenciar estados visuais até receber confirmação do webhook

**Ações Específicas**:
- Implementar `LoadingBalloon.tsx` com animação CSS
- No `handleConfirm()`, após criar a aba:
  - Definir `setBalloonMessage("IA está gerando...")`
  - Ativar `setIsLoading(true)`
  - Adicionar animação de loading (spinner/dots)
  - **IMPORTANTE**: Manter botões desabilitados até webhook responder
  - Aba fica em loading até webhook confirmar que dados foram salvos no Supabase
- Estados do balão:
  - Inicial: "IA está gerando..." (com animação)
  - Pós-webhook: "Planejamento refinado pronto" (estático, 3s depois some)

### 4. Integração com Webhook e Banco de Dados Supabase
**Objetivo**: Usar webhook apenas como indicador de salvamento no banco

**Ações Específicas**:
- **Webhook Response Handler**:
  - Webhook serve APENAS como indicador que dados foram salvos no Supabase
  - Estrutura webhook simples:
    ```json
    {
      "status": "saved",
      "planning_id": "string",
      "message": "Planejamento refinado salvo com sucesso"
    }
    ```
- Implementar `handleWebhookResponse()`:
  - Quando webhook responder com status "saved":
    - `setIsLoading(false)`
    - `setBalloonMessage("Planejamento refinado pronto")`
    - **Reabilitar botões**: `setButtonsDisabled(false)`
    - Buscar dados reais do Supabase: `fetchRefinedPlanningFromDatabase(planning_id)`
    - Disparar notificação sistema: `showNotification("Planejamento refinado está pronto")`
    - Após 3s, esconder balão: `setTimeout(() => setBalloonMessage(""), 3000)`

**Integração com Supabase**:
- Implementar `fetchRefinedPlanningFromDatabase(planning_id)`:
  ```javascript
  const { data, error } = await supabase
    .from('strategicplanning')
    .select('scop')
    .eq('id', planning_id)
    .single();
  
  if (data && data.scop) {
    const refinedData = JSON.parse(data.scop);
    setTasks(refinedData.tarefas_refinadas);
    setIsReady(true);
  }
  ```
- Configurar Real-time listener para tabela `strategicplanning` (backup)
- Parser para extrair JSON da coluna `scop`
- Validação de dados antes de exibir na interface

### 5. Lista de Tarefas Estilo ClickUp
**Objetivo**: Replicar organização visual e funcional do ClickUp

**Ações Específicas**:
- Criar componente `TaskList.tsx` com layout ClickUp:
  ```jsx
  <div className="clickup-task-container">
    <div className="task-list-header">
      <div className="list-title">Tarefas Refinadas</div>
      <div className="task-count">{tasks.length} tarefas</div>
    </div>
    
    {tasks.map(task => (
      <TaskItem 
        key={task.nome}
        task={task}
        onClick={() => openTaskDetails(task)}
        className="clickup-task-item"
      />
    ))}
  </div>
  ```

**Estrutura Visual ClickUp**:
- **TaskItem.tsx** deve replicar:
  - Checkbox à esquerda (visual apenas, não funcional inicialmente)
  - Ícone de prioridade com cores:
    - 🔴 Alta (vermelho `#E53E3E`)
    - 🟡 Média (amarelo `#D69E2E`) 
    - 🟢 Normal (verde `#38A169`)
  - Nome da tarefa em fonte medium
  - Tags de status (se necessário)
  - Hover effect com fundo `#F7FAFC`
  - Border-left colorido baseado na prioridade

**CSS Classes Específicas**:
```css
.clickup-task-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #E2E8F0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickup-task-item:hover {
  background-color: #F7FAFC;
}

.priority-alta { border-left: 4px solid #E53E3E; }
.priority-media { border-left: 4px solid #D69E2E; }
.priority-normal { border-left: 4px solid #38A169; }
```

- Implementar `openTaskDetails(task)`:
  - Abrir modal/sidebar similar ao ClickUp
  - Layout com 3 seções principais:
    1. **Header**: Nome + badge prioridade + ações
    2. **Descrição**: Campo `descricao` formatado
    3. **Output Detalhado**: Campo `output` renderizado como markdown

### 6. Modal de Detalhes da Tarefa (Estilo ClickUp)
**Objetivo**: Criar visualização detalhada similar ao ClickUp

**Estrutura do TaskDetailsModal**:
```jsx
<div className="task-modal-overlay">
  <div className="task-modal-content clickup-style">
    {/* Header */}
    <div className="task-header">
      <div className="task-title-row">
        <PriorityIcon priority={task.prioridade} />
        <h1 className="task-name">{task.nome}</h1>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="task-meta">
        <span className="priority-badge priority-{task.prioridade}">
          {task.prioridade.toUpperCase()}
        </span>
      </div>
    </div>

    {/* Content */}
    <div className="task-content">
      <section className="task-description">
        <h3>Descrição</h3>
        <p>{task.descricao}</p>
      </section>
      
      <section className="task-output">
        <h3>Detalhamento</h3>
        <div className="markdown-content">
          {renderMarkdown(task.output)}
        </div>
      </section>
    </div>

    {/* Footer */}
    <div className="task-footer">
      <button className="btn-secondary" onClick={onClose}>
        Voltar à Lista
      </button>
    </div>
  </div>
</div>
```

### 7. Fluxo Completo de Estados Atualizado
**Estados Detalhados**:

1. **Estado Inicial**:
   - Botões "Aprovar Selecionadas" ativos
   - Aba "Planejamento Refinado" não existe

2. **Estado Pop-up Ativo**:
   - Modal visível com mensagem específica
   - Ambos botões desabilitados (`disabled: true`)

3. **Estado Pós-Confirmação (Loading)**:
   - Modal fechado
   - Nova aba "Planejamento Refinado" criada e ativa
   - Balão "IA está gerando..." visível
   - Loading animation ativa
   - **Botões PERMANECEM desabilitados**
   - Sistema aguarda webhook de confirmação

4. **Estado Pós-Webhook (Busca no Banco)**:
   - Webhook confirma salvamento no Supabase
   - Sistema busca dados reais do banco
   - Loading para, balão muda para "pronto"
   - **Botões reabilitados**: `setButtonsDisabled(false)`

5. **Estado Final**:
   - Lista ClickUp visível com tarefas do Supabase
   - Cada item clicável para modal de detalhes
   - Sistema totalmente funcional

### 8. Tratamento de Erros e Fallbacks

**Cenários de Erro**:
- **Webhook não responde**: 
  - Manter loading indefinidamente
  - Adicionar polling opcional a cada 30s para verificar banco
- **Webhook com erro**:
  - Reabilitar botões: `setButtonsDisabled(false)`
  - Parar loading, exibir "Erro ao gerar planejamento refinado"
  - Botão "Tentar novamente"
- **Dados não encontrados no Supabase**:
  - Exibir "Dados não encontrados, tente novamente"
  - Manter interface funcional
- **Falha na busca do banco**:
  - Log do erro, retry automático 1x
  - Se falhar, exibir erro e reabilitar botões

### 9. Configurações Técnicas Específicas

**Supabase Query Otimizada**:
```javascript
const fetchRefinedPlanningFromDatabase = async (planningId) => {
  try {
    const { data, error } = await supabase
      .from('strategicplanning')
      .select(`
        id,
        scop,
        created_at,
        updated_at
      `)
      .eq('id', planningId)
      .order('updated_at', { ascending: false })
      .single();

    if (error) throw error;
    
    if (data?.scop) {
      const parsedData = JSON.parse(data.scop);
      return parsedData.tarefas_refinadas || [];
    }
    
    return [];
  } catch (error) {
    console.error('Erro ao buscar planejamento refinado:', error);
    throw error;
  }
};
```

**Webhook Listener**:
```javascript
const setupWebhookListener = (planningId) => {
  websocket.on('planning-saved', async (response) => {
    if (response.planning_id === planningId && response.status === 'saved') {
      try {
        const tasks = await fetchRefinedPlanningFromDatabase(planningId);
        handlePlanningReady(tasks);
      } catch (error) {
        handlePlanningError(error);
      }
    }
  });
};
```

### 10. Testes com Conta Específica

**Configuração de Teste**:
- **Login**: play-felix@hotmail.com  
- **Senha**: 123Senha...
- **Ambiente**: Frontend de desenvolvimento/produção
- **Webhook**: Já configurado no arquivo `.env` do projeto

**Webhook e Integração**:
- O webhook já está configurado e funcionando no ambiente
- Ao aprovar planejamentos, o webhook automaticamente:
  - Recebe o planejamento existente
  - Processa e cria a lista detalhada refinada
  - Salva os dados organizados na coluna `scop` da tabela `strategicplanning`
  - Retorna confirmação de salvamento para a interface
- **Tempo de processamento**: Processo normal leva de 2 a 3 minutos
- A **lista refinada** é a organização estruturada dos dados presentes na coluna `scop`

**Preparação dos Dados de Teste**:
- Usar planejamentos já existentes no sistema para executar os testes
- Criar planejamentos refinados a partir dos planejamentos disponíveis
- Garantir que existam dados na coluna `scop` para validar a exibição

**Fluxo Completo de Teste (End-to-End)**:

1. **Criação de Cliente**:
   - Fazer login com a conta de teste
   - Navegar para seção de criação de cliente
   - Criar um novo cliente com dados de teste
   - Validar salvamento no banco

2. **Criação de Planejamento**:
   - Acessar a área de planejamentos
   - Criar novo planejamento para o cliente criado
   - Adicionar objetivos e itens específicos
   - Salvar planejamento inicial

3. **Edição de Planejamento**:
   - Abrir planejamento criado
   - Editar objetivos específicos
   - Adicionar/remover itens do planejamento
   - Salvar alterações

4. **Aprovação de Planejamento**:
   - Selecionar itens para aprovação
   - Clicar em "Aprovar Selecionadas"
   - Testar pop-up de confirmação
   - Confirmar aprovação e aguardar processamento

5. **Validação da Lista Refinada**:
   - Verificar criação automática da aba "Planejamento Refinado"
   - Observar loading e estados visuais
   - Aguardar resposta do webhook
   - Validar exibição da lista organizada do campo `scop`
   - Testar navegação e detalhes das tarefas

**Cenários de Teste Específicos**:

1. **Teste Básico de Aprovação**:
   - Login com conta especificada
   - Navegar para planejamento com itens selecionados
   - Clicar "Aprovar Selecionadas"
   - Verificar pop-up e confirmação

2. **Teste de Fluxo Completo**:
   - Confirmar aprovação no pop-up
   - Verificar criação da nova aba
   - Observar loading e balão informativo
   - Aguardar webhook processar (2-3 min normal)
   - Validar lista ClickUp e detalhes das tarefas

3. **Teste de Estados de Botão**:
   - Verificar botões desabilitados durante processo
   - Confirmar reabilitação apenas após webhook
   - Testar cancelamento no pop-up

4. **Teste de Integração Supabase**:
   - Verificar dados salvos na tabela `strategicplanning`
   - Validar estrutura JSON na coluna `scop`
   - Confirmar exibição correta na interface
   - Testar busca e parsing dos dados organizados

5. **Teste de Interface ClickUp**:
   - Validar layout similar ao ClickUp
   - Testar cores e prioridades das tarefas
   - Verificar hover effects e interações
   - Abrir modal de detalhes de cada tarefa

**Validação dos Dados no Banco**:
```sql
-- Query para verificar dados refinados salvos
SELECT 
  id,
  scop,
  created_at,
  updated_at
FROM strategicplanning 
WHERE scop IS NOT NULL 
ORDER BY updated_at DESC;
```

**Estrutura Esperada na Coluna `scop`**:
```json
{
  "tarefas_refinadas": [
    {
      "nome": "Nome da Tarefa Refinada",
      "descricao": "Descrição detalhada da tarefa",
      "prioridade": "alta|média|normal",
      "output": "Conteúdo detalhado em markdown com objetivos, execução e conclusão"
    }
  ]
}
```

**Critérios de Sucesso**:
- Pop-up funciona corretamente
- Botões só reabilitam após webhook responder
- Nova aba aparece com loading
- Webhook processa e salva dados no Supabase (coluna `scop`)
- Dados são buscados e exibidos corretamente da coluna `scop`
- Interface ClickUp é visualmente similar
- Modal de detalhes funciona perfeitamente
- Conta de teste acessa todas as funcionalidades
- Fluxo completo (criação → edição → aprovação → refinamento) funciona end-to-end

**Observações Importantes**:
- O webhook está configurado no `.env` e pronto para uso
- Não há necessidade de configuração adicional do webhook
- O tempo de 2-3 minutos para processamento é normal
- A lista refinada vem diretamente da organização dos dados em `scop`
- Usar planejamentos existentes para facilitar os testes
- Testar com dados reais do sistema para validação completa