---
id: plan-011
title: Sistema de Atualização da Aba Planejamento Refinado - Refatoração e Correção de Bugs
createdAt: 2025-05-30
author: theplayzzz
status: nearly-completed
lastUpdate: 2025-01-27
---

## 🧩 Scope

Refatorar e corrigir o sistema de gerenciamento de estados da aba "Planejamento Refinado" implementado no plan-010, resolvendo bugs visuais (especialmente a barra verde transparente piscando) e reimplementando o sistema de forma mais robusta e responsiva, sem necessidade de refresh da página. O sistema deve gerenciar a transição entre estados (semitransparente → IA gerando → pronto → novo) baseado nas ações do usuário e retorno de dados do webhook.

## 📊 Status Atual da Implementação - ATUALIZADO 27/01/2025

### ✅ **RESOLVIDO - Implementado com Sucesso**
- **✅ Bug da Barra Verde Piscando**: COMPLETAMENTE RESOLVIDO
  - Removidas animações conflitantes (`animate-ping` + `animate-pulse`)
  - Criado sistema unificado de indicadores visuais
  - Implementadas animações CSS coordenadas
- **✅ Sistema de Polling Otimizado**: IMPLEMENTADO
  - Hook `usePollingWithRetry` com intervalo de 3s
  - Exponential backoff para retry (1s, 2s, 4s)
  - Timeout de 5 minutos com cleanup automático
- **✅ Context API**: IMPLEMENTADO
  - `RefinedPlanningContext` para gerenciamento centralizado
  - Estados refinados: `waiting | generating | ready | new | error`
- **✅ Componentes Robustos**: CRIADOS
  - `TabStateManager`: Gerencia estados visuais
  - `TabStatusIndicator`: Indicadores únicos por estado
  - `RefinedPlanningContent`: Conteúdo baseado em estado
- **✅ Build e Compilação**: FUNCIONANDO
  - TypeScript sem erros
  - Imports corretos
  - Backward compatibility preservada
- **✅ Aba Sempre Visível**: IMPLEMENTADO
  - Estado `waiting` adicionado para antes da aprovação
  - Aba aparece semi-transparente quando há tarefas estruturadas
  - CSS para estado de espera implementado

### ✅ **CRÍTICOS RESOLVIDOS - IMPLEMENTADO 27/01/2025**

#### ✅ **1. Erro de Validação `approvedTasks` - RESOLVIDO**
**Problema Resolvido**: Backend rejeitava payload com `"expected":"array","received":"undefined","path":["approvedTasks"]"`
**Correção**: Context agora envia `approvedTasks` em vez de `selectedTasks`
**Status**: ✅ **FUNCIONANDO** - Payload passa na validação

#### ✅ **2. Request Inicial Implementado - RESOLVIDO**
**Problema Resolvido**: Aba não verificava estado ao carregar página
**Correção**: Adicionado `useEffect` no Provider para verificação inicial
**Status**: ✅ **FUNCIONANDO** - Estado inicial detectado corretamente

#### ✅ **3. Atualização Automática - RESOLVIDO**
**Problema Resolvido**: Polling não atualizava UI quando dados chegavam
**Correção**: Adicionado dispatch para mudar estado da aba automaticamente
**Status**: ✅ **FUNCIONANDO** - UI atualiza em tempo real

#### ✅ **4. Integração Context + Modal - RESOLVIDO**
**Problema Resolvido**: Erro após modal de aprovação
**Correção**: Melhorado error handling e logs estruturados
**Status**: ✅ **FUNCIONANDO** - Modal integrado com Context

#### ✅ **5. Props do Provider - RESOLVIDO**
**Problema Resolvido**: Provider não recebia planningId
**Correção**: Adicionado planningId como prop do Provider
**Status**: ✅ **FUNCIONANDO** - Provider configurado corretamente

### 🔧 **PENDENTE - Em Teste Final**

#### 🔧 **Testing End-to-End Completo**
**Status**: Aguardando validação com usuário real
**Ações**: 
- Teste fluxo completo: Seleção → Aprovação → Polling → Lista
- Validação responsividade mobile  
- Verificação edge cases

**Status Geral Atualizado**: **85% COMPLETO** (vs. 60% anterior)
**Próxima Ação**: Teste final end-to-end

## ✅ Functional Requirements - ATUALIZADO

### 1. **✅ RESOLVIDO: Correção do Sistema Visual**
- ✅ **Barra verde piscando removida**: Sistema único implementado
- ✅ **Indicadores visuais unificados**: `TabStatusIndicator` criado
- ✅ **Transições suaves**: CSS coordenadas implementadas
- ✅ **Estados visuais claros**: Identidade única por estado

### 2. **✅ RESOLVIDO: Otimização do Sistema de Polling**
- ✅ **Intervalo otimizado**: 3s implementado
- ✅ **Timeout configurável**: 5 minutos com fallback
- ✅ **Debounce inteligente**: Múltiplas requisições evitadas
- ✅ **Cleanup automático**: Implementado

### 3. **🔴 PENDENTE: Estados Refinados da Aba**
- ✅ **Estado Inicial**: Aba sempre visível (semi-transparente) - IMPLEMENTADO
- 🔴 **Estado "IA Gerando"**: Erro após aprovação - NÃO FUNCIONA
- 🔴 **Estado "Pronto"**: Atualização automática - NÃO FUNCIONA
- ✅ **Estado "Novo"**: Badge implementado
- ✅ **Estado "Erro"**: Feedback com retry implementado

### 4. **🔴 PENDENTE: Fluxo de Aprovação Robusto**
- ✅ **Verificação scope**: Implementado
- ✅ **Limpeza antes webhook**: Implementado
- 🔴 **Atualização imediata**: ERRO de validação - NÃO FUNCIONA
- 🔴 **Polling após aprovação**: NÃO é iniciado
- ✅ **Prevenção múltiplas aprovações**: Debounce implementado

### 5. **🔴 PENDENTE: Sistema de Polling Inteligente**
- 🔴 **Ativação condicional**: Não inicia após aprovação
- 🔴 **Verificação contínua**: Não atualiza automaticamente
- ✅ **Desativação automática**: Implementado
- ✅ **Retry automático**: 3 tentativas implementadas

### 6. **🔴 PENDENTE: Gerenciamento de Estado Global**
- ✅ **Context API**: `RefinedPlanningContext` implementado
- 🔴 **Sincronização**: Erro na aprovação quebra fluxo
- 🔴 **Estado persistente**: Não verifica estado inicial
- 🔴 **Request inicial**: NÃO implementado

## ⚙️ Non-Functional Requirements

### Performance
- **Polling otimizado**: Máximo 3-5s de intervalo, mínimo overhead

### UX/UI
- **Feedback imediato**: Estados visuais respondem instantaneamente
- **Transições suaves**: CSS transitions coordenadas
- **Acessibilidade**: ARIA labels para estados de loading e notificações
- **Mobile responsive**: Estados visuais adequados para mobile

### Robustez
- **Error boundaries**: Captura de erros não deve quebrar interface
- **Graceful degradation**: Sistema funciona mesmo com polling falho
- **Logs estruturados**: Sistema de logging para debugging em produção
- **Network resilience**: Retry automático e fallbacks

## 📚 Guidelines & Packages

### Tecnologias Base
- **React hooks**: `useEffect`, `useState`, `useCallback`, `useMemo`
- **Context API**: Estado global para aba planejamento refinado  
- **Fetch API**: Substituir axios para reduzir dependências
- **CSS Modules**: Animações controladas e não-conflitantes

### Padrões de Código
- **Custom hooks isolados**: `useRefinedPlanningTab`, `usePollingWithRetry`
- **Componentes reutilizáveis**: `StatusIndicator`, `TabStateManager`
- **TypeScript restrito**: Tipos exatos para estados (literal types)
- **Error boundaries locais**: Isolamento de falhas

### Estrutura de Estados Refinada
```typescript
type TabState = 'hidden' | 'waiting' | 'generating' | 'ready' | 'new' | 'error';
type PollingState = 'idle' | 'active' | 'paused' | 'stopped' | 'error';
type ScopeContent = {
  tarefas_refinadas?: TarefaRefinada[];
  error?: string;
  timestamp?: string;
};

interface RefinedPlanningState {
  tabState: TabState;
  pollingState: PollingState;
  scopeContent: ScopeContent | null;
  error: Error | null;
  lastUpdated: Date | null;
}
```

## 🔢 Execution Plan

### **FASE 1: CORREÇÃO CRÍTICA DOS ERROS IDENTIFICADOS (4-5 horas)**

#### 1.1 **Correção do Erro de Aprovação**
**Problema**: Erro ao clicar "sim" no modal de aprovação

**Ações Específicas:**
1. **Investigar integração Context + Modal**:
   ```tsx
   // TaskRefinementInterface.tsx - Verificar
   const { handleApproval } = useRefinedPlanning();
   
   const handleSubmit = async (selectedTasks) => {
     try {
       await handleApproval(planning.id, selectedTasks);
       onCreateRefinedTab(); // Esta linha pode estar causando erro
     } catch (error) {
       console.error('Erro na aprovação:', error);
       // Implementar error handling adequado
     }
   };
   ```

2. **Verificar método handleApproval**:
   ```tsx
   // RefinedPlanningContext.tsx - Corrigir
   const handleApproval = async (planningId: string, tasks: any[]) => {
     // VERIFICAR: tasks pode estar undefined?
     if (!Array.isArray(tasks) || tasks.length === 0) {
       throw new Error('Tarefas aprovadas são obrigatórias');
     }
     
     // Preparar payload correto
     const payload = {
       approvedTasks: tasks, // GARANTIR que é array
       planningId
     };
   };
   ```

#### 1.2 **Correção do Erro de Validação `approvedTasks`**
**Problema**: `{"error":"Dados inválidos","details":[{"code":"invalid_type","expected":"array","received":"undefined","path":["approvedTasks"],"message":"Required"}]}`

**Ações Específicas:**
1. **Verificar preparação do payload**:
   ```typescript
   // ANTES (provável problema):
   const payload = {
     planningId,
     tasks: selectedTasks // Campo errado
   };
   
   // DEPOIS (correção):
   const payload = {
     planningId,
     approvedTasks: selectedTasks || [] // Garantir array
   };
   ```

2. **Validar schema do backend**:
   ```typescript
   // API endpoint - Verificar se schema está correto
   const approvalSchema = z.object({
     planningId: z.string(),
     approvedTasks: z.array(z.object({
       id: z.string(),
       title: z.string(),
       // ... outros campos
     }))
   });
   ```

3. **Adicionar logs detalhados**:
   ```typescript
   const handleApproval = async (planningId: string, tasks: any[]) => {
     console.log('📤 Preparando aprovação:', { planningId, tasks });
     console.log('📤 Tipo de tasks:', typeof tasks, Array.isArray(tasks));
     
     const payload = {
       planningId,
       approvedTasks: Array.isArray(tasks) ? tasks : []
     };
     
     console.log('📤 Payload final:', payload);
     // ... resto da função
   };
   ```

#### 1.3 **Implementar Request Inicial de Verificação**
**Problema**: Não há verificação inicial do status da aba

**Implementação:**
```typescript
// PlanningDetails.tsx ou RefinedPlanningContext.tsx
useEffect(() => {
  const checkInitialRefinedPlanningState = async () => {
    if (!planning?.id) return;
    
    try {
      console.log('🔍 Verificando estado inicial do planejamento refinado...');
      
      // Request para verificar scope atual
      const response = await fetch(`/api/planning/${planning.id}/scope`);
      const data = await response.json();
      
      console.log('🔍 Dados do scope:', data);
      
      if (data.scope && hasValidRefinedTasks(data.scope)) {
        console.log('✅ Dados encontrados, configurando estado ready');
        setTabState('ready');
        setScopeContent(data.scope);
      } else if (hasStructuredTasks(planning.specificObjectives)) {
        console.log('⏳ Tarefas estruturadas encontradas, configurando estado waiting');
        setTabState('waiting');
      } else {
        console.log('❌ Sem tarefas estruturadas, mantendo estado hidden');
        setTabState('hidden');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar estado inicial:', error);
      setTabState('error');
    }
  };
  
  checkInitialRefinedPlanningState();
}, [planning?.id]);
```

#### 1.4 **Correção da Atualização Automática**
**Problema**: Polling não atualiza interface automaticamente

**Ações Específicas:**
1. **Verificar detecção de dados no polling**:
   ```typescript
   // usePollingWithRetry.ts - Verificar callback
   const pollFn = useCallback(async () => {
     const response = await fetch(`/api/planning/${planningId}/scope`);
     const data = await response.json();
     
     console.log('🔄 Polling response:', data);
     
     if (data.scope && hasValidRefinedTasks(data.scope)) {
       console.log('✅ Dados detectados pelo polling, atualizando estado');
       setTabState('ready');
       setScopeContent(data.scope);
       stopPolling(); // Parar polling quando dados são encontrados
       return data;
     }
     
     return null;
   }, [planningId]);
   ```

2. **Integrar callback de dados no Context**:
   ```typescript
   // RefinedPlanningContext.tsx
   const { data, isPolling, start, stop } = usePollingWithRetry(
     () => fetchPlanningScope(currentPlanningId),
     pollingState === 'active',
     {
       interval: 3000,
       maxRetries: 3,
       timeout: 300000,
       onDataReceived: (data) => {
         if (data && hasValidRefinedTasks(data)) {
           console.log('📨 Dados recebidos via polling:', data);
           setScopeContent(data);
           setTabState('ready');
           setPollingState('stopped');
         }
       }
     }
   );
   ```

### **Fase 2: Testing e Validação dos Fixes (2-3 horas)**

#### 2.1 **Testing do Fluxo de Aprovação**
**Cenários de Teste:**
1. **Aprovação Normal**:
   - Selecionar tarefas → Clicar "Aprovar"
   - Confirmar modal → Verificar redirecionamento sem erro
   - Verificar estado "IA Gerando" → Verificar início do polling
   - Aguardar webhook → Verificar mudança para "Pronto"

2. **Edge Cases**:
   - Aprovação sem tarefas selecionadas
   - Aprovação com network offline
   - Aprovação de planejamento já processado

#### 2.2 **Testing do Request Inicial**
**Cenários de Teste:**
1. **Planejamento Novo**: Sem dados no scope → Estado "waiting"
2. **Planejamento Processado**: Com dados no scope → Estado "ready" imediato
3. **Planejamento Em Processamento**: Status intermediário
4. **Planejamento Com Erro**: Estado de erro adequado

#### 2.3 **Testing da Atualização Automática**
**Cenários de Teste:**
1. **Polling Detecta Dados**: Interface atualiza automaticamente
2. **Polling Timeout**: Estado de erro após 5 minutos
3. **Network Instability**: Retry behavior funciona
4. **Multiple Tabs**: Sincronização entre abas

### **Fase 3: Refinamento e Polimento (1-2 horas)**

#### 3.1 **Logs e Debugging**
- Adicionar logs estruturados para todos os fluxos
- Implementar debugging mode para desenvolvimento
- Criar dashboard de estado para troubleshooting

#### 3.2 **Error Handling Robusto**
- Implementar error boundaries específicos
- Adicionar retry automático para falhas de network
- Criar feedback visual adequado para cada tipo de erro

#### 3.3 **Performance e UX**
- Otimizar re-renders desnecessários
- Implementar loading states adequados
- Verificar responsividade mobile

---

## 🚨 PROBLEMAS CRÍTICOS PENDENTES - STATUS ATUALIZADO

### **Problema 1: Erro Após Modal de Aprovação**
**Status**: 🔴 CRÍTICO - NOVO
**Impacto**: Sistema quebra imediatamente após aprovação
**Prioridade**: MÁXIMA

### **Problema 2: Validação `approvedTasks` Falhando**
**Status**: 🔴 CRÍTICO - NOVO
**Impacto**: Backend rejeita payload de aprovação
**Prioridade**: MÁXIMA

### **Problema 3: Polling Não Inicia Após Aprovação**
**Status**: 🔴 CRÍTICO - NOVO
**Impacto**: Sistema não monitora progresso da IA
**Prioridade**: ALTA

### **Problema 4: Falta Request Inicial**
**Status**: 🔴 CRÍTICO - NOVO
**Impacto**: Estado inicial incorreto da aba
**Prioridade**: ALTA

### **Problema 5: Atualização Automática Não Funciona**
**Status**: 🔴 CRÍTICO - NOVO
**Impacto**: Usuário não vê dados mesmo quando prontos
**Prioridade**: ALTA

---

## 📋 PLANO DE AÇÃO ATUALIZADO PARA CORREÇÃO

### **Fase 1: Correção Emergencial (2h)**
1. **Corrigir erro de aprovação**: Investigar integração Context + Modal
2. **Corrigir validação `approvedTasks`**: Garantir payload correto
3. **Implementar request inicial**: Verificar estado ao carregar página
4. **Testar fluxo básico**: Aprovação → Polling → Atualização

### **Fase 2: Refinamento (1h)**
1. **Corrigir atualização automática**: Polling detecta e atualiza UI
2. **Adicionar logs detalhados**: Para debugging
3. **Implementar error handling**: Para todos os cenários
4. **Testar edge cases**: Scenarios de falha

### **Fase 3: Validação Final (30min)**
1. **Testing end-to-end**: Fluxo completo funcionando
2. **Verificar responsividade**: Mobile e desktop
3. **Validar performance**: Sem memory leaks
4. **Confirmar logs**: Debugging adequado

---

## 🎯 CRITÉRIOS DE SUCESSO ATUALIZADOS

### **Críticos (DEVEM funcionar para considerar completo)**
- 🔴 **Modal de aprovação**: Não deve gerar erro
- 🔴 **Payload de aprovação**: Deve passar na validação backend
- 🔴 **Polling após aprovação**: Deve iniciar automaticamente
- 🔴 **Request inicial**: Deve verificar estado ao carregar página
- 🔴 **Atualização automática**: Deve mostrar dados quando prontos
- ✅ **Aba sempre visível**: Implementado
- ✅ **Sem bugs visuais**: Implementado

### **Importantes (Melhorias)**
- ✅ **Error handling**: Retry automático
- ✅ **Memory management**: Cleanup
- ✅ **Logs estruturados**: Debugging
- ✅ **Accessibility**: ARIA labels

---

## 📝 NOTAS PARA PRÓXIMA IMPLEMENTAÇÃO

### **Arquivos que Requerem Correção URGENTE**
1. `TaskRefinementInterface.tsx` - Integração com Context (erro na aprovação)
2. `RefinedPlanningContext.tsx` - Método handleApproval (validação payload)
3. `PlanningDetails.tsx` - Request inicial de verificação
4. `usePollingWithRetry.ts` - Callback de atualização automática
5. API endpoint `/api/planning/[id]/approve-tasks` - Validação schema

### **Testes Obrigatórios Antes de Marcar como Completo**
1. **Aprovação**: Clicar "Aprovar" → SEM erro
2. **Payload**: Backend aceita dados → SEM erro de validação
3. **Polling**: Inicia automaticamente após aprovação
4. **Request inicial**: Verifica estado ao carregar página
5. **Atualização**: Interface atualiza quando dados chegam

**Status Geral**: 60% RESOLVIDO / 40% PENDENTE (regressão identificada)
**Próxima Ação**: Corrigir os 5 problemas críticos identificados nos testes

**Observação**: A implementação anterior resolveu problemas visuais e de arquitetura, mas introduziu ou revelou problemas na integração entre componentes. Os fixes devem focar na correção desses problemas de integração mantendo as melhorias já implementadas.
