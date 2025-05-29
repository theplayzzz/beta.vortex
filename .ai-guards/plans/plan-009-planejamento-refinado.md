# Plan: Sistema de Refinamento e Aprovação de Tarefas Geradas por IA

## 📋 Contexto e Estrutura Atual

Antes de iniciar a implementação, é necessário entender a estrutura atual de dados através do Prisma e analisar alguns planejamentos existentes no banco de dados para compreender os padrões de dados.

### Análise Inicial Obrigatória
1. **Examinar Schema do Banco**:
   - Revisar modelos `StrategicPlanning`, `PlanningTask` e relacionamentos
   - Verificar campo `specificObjectives` onde ficam armazenadas as tarefas geradas pela IA
   - Analisar estrutura atual do JSON de tarefas

2. **Coletar Exemplos**:
   - Buscar 3-5 planejamentos existentes que já tenham `specificObjectives` preenchidos
   - Documentar variações na estrutura de dados
   - Identificar padrões de prioridades e descrições

## 🎯 Objetivos da Implementação

1. **Implementar interface de refinamento** para tarefas já geradas pela IA
2. **Sistema de seleção e edição** com capacidade de adicionar contexto personalizado
3. **Interface de aprovação** com envio de webhook para tarefas selecionadas
4. **Sistema de feedback em tempo real** com notificação quando webhook responder
5. **Sem reprocessamento por IA** nesta fase

## 📝 Estrutura de Dados Esperada

Com base no exemplo fornecido, as tarefas estão armazenadas no campo `specificObjectives` com a estrutura:

```json
{
  "nome_do_backlog": "string",
  "objetivo_do_backlog": "string", 
  "tarefas": [
    {
      "nome": "string",
      "descricao": "string",
      "prioridade": "alta" | "média" | "normal",
      "contexto_adicional": "string" // campo que será adicionado via interface
    }
  ]
}
```

## 🚀 Plano de Implementação

### Etapa 1: Preparação e Análise
- [ ] **1.1** Analisar schema do Prisma para entender relacionamentos
- [ ] **1.2** Buscar exemplos de planejamentos com `specificObjectives` preenchidos
- [ ] **1.3** Documentar variações na estrutura de dados encontradas

### Etapa 2: Substituir Aba "Objetivos Específicos"

#### 2.1 Modificar Interface Existente
- [ ] **2.1.1** Localizar componente atual da aba "Objetivos Específicos" no formulário de planejamento
- [ ] **2.1.2** Implementar detecção se `specificObjectives` possui tarefas geradas pela IA
- [ ] **2.1.3** Substituir conteúdo da aba quando tarefas estiverem disponíveis

#### 2.2 Layout da Interface de Refinamento
A nova interface da aba "Objetivos Específicos" terá:

**Cabeçalho:**
- Título: "📋 Lista de Tarefas Geradas"
- Subtítulo: "Selecione as tarefas que deseja incluir no projeto final."
- Botão "☑️ Selecionar todas as tarefas" (canto superior direito)
- Botão "✅ Aprovar selecionadas (X)" (destaque, canto superior direito)

**Lista de Tarefas:**
- Cards organizados em lista vertical
- Cada card contém:
  - Checkbox de seleção (esquerda)
  - Nome da tarefa (título principal)
  - Badges de prioridade coloridos (direita): 
    - `alta` = badge vermelho
    - `média` = badge laranja  
    - `normal` = badge azul
  - Menu de 3 pontos (⋮) com opções:
    - "✏️ Editar tarefa"
    - "📝 Adicionar contexto"
- **Descrição oculta**: Só aparece quando:
  - Hover sobre o card (tooltip)
  - Clicar em "Editar tarefa" 
  - Clicar em "Adicionar contexto"

**Rodapé:**
- Contador: "X de Y tarefas selecionadas"
- Botão secundário "Voltar" 
- Botão primário "Aprovar selecionadas" (repetido)

### Etapa 3: Criar Componentes de Interface

#### 3.1 Componente Principal de Refinamento
- [ ] **3.1.1** Criar componente `TaskRefinementInterface.tsx`:
  - Substituir conteúdo da aba quando `specificObjectives.tarefas` existir
  - Implementar verificação de permissões
  - Gerenciar estado de seleção de tarefas

#### 3.2 Componente Lista de Tarefas
- [ ] **3.2.1** Criar componente `TaskRefinementList.tsx`:
  - Lista todas as tarefas do `specificObjectives.tarefas`
  - Cards com layout descrito acima
  - Checkbox para seleção individual
  - Badges visuais para prioridades
  - Menu dropdown com opções de edição

#### 3.3 Componente Card de Tarefa
- [ ] **3.3.1** Criar componente `TaskCard.tsx`:
  - Layout: checkbox + título + badge prioridade + menu
  - Tooltip com descrição no hover
  - Estados visuais (selecionado/não selecionado)
  - Interações com menu dropdown

#### 3.4 Sistema de Seleção Global
- [ ] **3.4.1** Implementar checkbox "Selecionar todas as tarefas"
- [ ] **3.4.2** Contador de tarefas selecionadas em tempo real
- [ ] **3.4.3** Botão "Aprovar selecionadas (X)" que inicia processo de refinamento

### Etapa 4: Modais de Edição e Contexto

#### 4.1 Modal de Edição de Tarefa
- [ ] **4.1.1** Criar componente `EditTaskModal.tsx`:
  - Mostrar nome atual da tarefa (campo editável)
  - Mostrar descrição atual (textarea editável)
  - Dropdown de prioridade com as 3 opções existentes
  - Botões "Cancelar" e "Salvar alterações"
  - Salvar alterações atualiza o JSON `specificObjectives`

#### 4.2 Modal de Adição de Contexto
- [ ] **4.2.1** Criar componente `AddContextModal.tsx`:
  - Título: nome da tarefa
  - Mostrar descrição atual (read-only, em card destacado)
  - Campo textarea para contexto personalizado com placeholder:
    "Adicione informações específicas, requisitos especiais ou detalhes importantes para esta tarefa..."
  - Contador de caracteres (limite sugerido: 500)
  - Botões "Cancelar" e "Adicionar contexto"
  - Salvar adiciona/atualiza campo `contexto_adicional` na tarefa

### Etapa 5: Implementar Lógica de Atualização de Dados

#### 5.1 API de Atualização de Tarefas
- [ ] **5.1.1** Criar endpoint `app/api/planning/[planningId]/update-tasks/route.ts`:
  - Validar permissões do usuário
  - Atualizar campo `specificObjectives` no banco
  - Manter integridade da estrutura JSON
  - Retornar dados atualizados

#### 5.2 Estado Local e Sincronização
- [ ] **5.2.1** Implementar state management para lista de tarefas
- [ ] **5.2.2** Debounce para salvamento automático de edições
- [ ] **5.2.3** Indicadores visuais de salvamento (salvando/salvo/erro)

### Etapa 6: Sistema de Aprovação e Webhook

#### 6.1 API de Aprovação
- [ ] **6.1.1** Criar endpoint `app/api/planning/[planningId]/approve-tasks/route.ts`:
  - Validar que existem tarefas selecionadas
  - Filtrar apenas tarefas marcadas como selecionadas
  - Preparar payload para webhook
  - Enviar para `REFINED_LIST_WEBHOOK_URL`

#### 6.2 Estrutura do Payload
- [ ] **6.2.1** Implementar payload com estrutura similar ao exemplo fornecido:
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
    "planejamentoInformacoes": null,
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

### Etapa 7: Sistema de Feedback em Tempo Real

#### 7.1 Implementar Sistema de Notificações
- [ ] **7.1.1** Analisar padrão de mensagens existentes na aplicação:
  - Identificar biblioteca/componente usado para toasts/notificações
  - Documentar estrutura e estilo das mensagens
  - Verificar posicionamento e timing das notificações

#### 7.2 Componente de Notificação
- [ ] **7.2.1** Implementar notificação seguindo padrão existente:
  - **Durante envio**: "Enviando tarefas para processamento..." (loading)
  - **Sucesso**: "✅ Tarefas aprovadas enviadas com sucesso!" (success)
  - **Erro**: "❌ Erro ao enviar tarefas. Tente novamente." (error)

#### 7.3 Estados de Carregamento da Aprovação
- [ ] **7.3.1** Implementar estados visuais durante aprovação:
  - Botão "Aprovar" com loading spinner durante processamento
  - Desabilitar interface durante envio
  - Exibir progresso/feedback visual adequado

#### 7.4 Polling ou WebSocket para Feedback
- [ ] **7.4.1** Implementar sistema de verificação de resposta:
  - **Opção A - Polling**: Verificar status a cada 2-3 segundos após envio
  - **Opção B - WebSocket**: Conexão em tempo real para feedback imediato
  - **Opção C - Webhook Callback**: Endpoint para receber confirmação do webhook
  - Escolher a abordagem mais adequada ao padrão da aplicação

#### 7.5 API de Status de Processamento
- [ ] **7.5.1** Criar endpoint `app/api/planning/[planningId]/processing-status/route.ts`:
  - Retornar status atual do processamento
  - Campos: `status`, `message`, `timestamp`, `error`
  - Usado pelo polling ou como callback do webhook

### Etapa 8: Interface Visual e UX

#### 8.1 Design e Layout
- [ ] **8.1.1** Implementar layout descrito na seção 2.2
- [ ] **8.1.2** Usar cores do tema da aplicação existente
- [ ] **8.1.3** Manter consistência com outros componentes do formulário

#### 8.2 Estados de Interface
- [ ] **8.2.1** Estado de loading durante aprovação com feedback visual
- [ ] **8.2.2** Estados de erro com mensagens claras seguindo padrão
- [ ] **8.2.3** Feedback visual de sucesso após resposta do webhook
- [ ] **8.2.4** Tooltips informativos para descrições das tarefas

#### 8.3 Responsividade
- [ ] **8.3.1** Interface funcional em desktop
- [ ] **8.3.2** Adaptação para tablets e mobile
- [ ] **8.3.3** Modais responsivos
- [ ] **8.3.4** Cards de tarefa adaptáveis
- [ ] **8.3.5** Notificações responsivas em diferentes devices

### Etapa 9: Validações e Tratamento de Erros

#### 9.1 Validações Frontend
- [ ] **9.1.1** Validar que pelo menos uma tarefa está selecionada antes da aprovação
- [ ] **9.1.2** Validar campos obrigatórios nos modais de edição
- [ ] **9.1.3** Limites de caracteres para campos de texto

#### 9.2 Tratamento de Erros
- [ ] **9.2.1** Tratamento de falhas no webhook com notificação adequada
- [ ] **9.2.2** Recuperação de estado em caso de erro
- [ ] **9.2.3** Logs adequados para debugging
- [ ] **9.2.4** Timeout no webhook com mensagem específica
- [ ] **9.2.5** Retry automático em caso de falha de rede

### Etapa 10: Testes e Validação

#### 10.1 Configuração de Teste
- [ ] **10.1.1** Usar conta de teste:
  - **Login**: play-felix@hotmail.com  
  - **Senha**: 123Senha...

#### 10.2 Cenários de Teste Obrigatórios
- [ ] **10.2.1** **Visualização**: Conseguir acessar aba "Objetivos Específicos" e ver todas as tarefas
- [ ] **10.2.2** **Hover**: Verificar que descrição aparece no hover sobre os cards
- [ ] **10.2.3** **Seleção**: Conseguir selecionar tarefas individuais e usar "selecionar todos"
- [ ] **10.2.4** **Edição**: Abrir modal de edição, modificar nome/descrição/prioridade e salvar
- [ ] **10.2.5** **Contexto**: Abrir modal de contexto, adicionar texto e salvar
- [ ] **10.2.6** **Aprovação**: Selecionar algumas tarefas e aprovar com sucesso
- [ ] **10.2.7** **Webhook**: Verificar que webhook é disparado apenas com tarefas selecionadas
- [ ] **10.2.8** **Persistência**: Verificar que edições ficam salvas no banco de dados
- [ ] **10.2.9** **Feedback Visual**: Verificar notificação durante envio
- [ ] **10.2.10** **Notificação de Sucesso**: Confirmar que mensagem aparece quando webhook responde
- [ ] **10.2.11** **Notificação de Erro**: Simular falha e verificar mensagem de erro

#### 10.3 Testes de Edge Cases
- [ ] **10.3.1** Tentar aprovar sem nenhuma tarefa selecionada
- [ ] **10.3.2** Editar tarefa com campos vazios  
- [ ] **10.3.3** Teste com internet instável (simular falha de webhook)
- [ ] **10.3.4** Teste com planejamento sem tarefas geradas
- [ ] **10.3.5** Teste de timeout do webhook (resposta lenta)
- [ ] **10.3.6** Teste de múltiplos cliques no botão "Aprovar"

#### 10.4 Validação de Dados
- [ ] **10.4.1** Verificar integridade do JSON `specificObjectives` após edições
- [ ] **10.4.2** Confirmar que contexto adicional é incluído na descrição do webhook
- [ ] **10.4.3** Verificar que prioridades são mapeadas corretamente

#### 10.5 Testes do Sistema de Notificações
- [ ] **10.5.1** Verificar que notificação de loading aparece imediatamente
- [ ] **10.5.2** Confirmar que notificação de sucesso aparece após resposta do webhook
- [ ] **10.5.3** Testar notificação de erro em diferentes cenários de falha
- [ ] **10.5.4** Verificar que notificações seguem padrão visual da aplicação
- [ ] **10.5.5** Testar comportamento das notificações em dispositivos móveis

### Etapa 11: Documentação e Refinamentos

#### 11.1 Documentação Técnica
- [ ] **11.1.1** Documentar estrutura de dados utilizada
- [ ] **11.1.2** Documentar endpoints de API criados
- [ ] **11.1.3** Documentar formato do payload de webhook
- [ ] **11.1.4** Documentar sistema de notificações implementado

#### 11.2 Refinamentos de UX
- [ ] **11.2.1** Adicionar tooltips explicativos
- [ ] **11.2.2** Melhorar feedback visual de ações
- [ ] **11.2.3** Otimizar fluxo de aprovação
- [ ] **11.2.4** Ajustar timing das notificações se necessário

## ⚠️ Considerações Importantes

### Dados
- Todas as edições devem atualizar o campo `specificObjectives` no banco
- Manter retrocompatibilidade com estrutura existente
- Adicionar campos novos sem quebrar dados existentes

### Performance  
- Implementar debounce para salvamento automático
- Otimizar renderização de listas grandes de tarefas
- Cache local para evitar perda de edições
- Evitar polling excessivo para verificação de status

### Segurança
- Validar permissões em todos os endpoints
- Sanitizar dados de entrada nos modais
- Validar integridade do JSON antes de salvar
- Implementar rate limiting no polling

### UX Specific
- Descrições só aparecem em hover ou modais para manter interface limpa
- Feedback visual claro de quais tarefas estão selecionadas
- Contadores em tempo real para orientar o usuário
- Notificações não intrusivas mas visíveis
- States de loading claros durante processamento

### Sistema de Feedback
- Notificações devem seguir exatamente o padrão existente
- Timing adequado para não spam de notificações
- Estados claros: loading, success, error
- Recovery adequado em caso de falhas

## 🎯 Critérios de Sucesso

O sistema será considerado funcional quando:

1. **Visualização completa**: Usuário consegue ver todas as tarefas geradas pela IA na aba "Objetivos Específicos"
2. **Interação com descrições**: Descrições aparecem corretamente no hover e nos modais
3. **Edição funcional**: Pode modificar nome, descrição e prioridade de qualquer tarefa
4. **Contexto personalizável**: Pode adicionar contexto adicional a qualquer tarefa
5. **Seleção intuitiva**: Pode selecionar tarefas individualmente ou todas de uma vez
6. **Aprovação efetiva**: Webhook é disparado corretamente apenas com tarefas selecionadas
7. **Dados persistentes**: Todas as modificações são salvas no banco de dados
8. **Interface responsiva**: Funciona adequadamente em diferentes dispositivos
9. **Tratamento de erros**: Sistema se comporta adequadamente em cenários de falha
10. **Feedback em tempo real**: Notificações aparecem seguindo o padrão da aplicação
11. **Confirmação de sucesso**: Usuário recebe feedback claro quando webhook responde com sucesso

O processo termina com o envio bem-sucedido do webhook contendo apenas as tarefas aprovadas e seus contextos adicionais, seguido da confirmação visual para o usuário de que o processo foi concluído com sucesso.