# CORREÇÃO: Loop Infinito no Sistema de Polling

**Data**: 14/06/2025  
**Problema**: "Maximum update depth exceeded" - Loop infinito no useEffect  
**Status**: ✅ **CORRIGIDO**

## 🚨 **PROBLEMA IDENTIFICADO**

### **Erro Apresentado:**
```
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, 
but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.
```

### **Causa Raiz:**
**Dependências do useEffect** causando re-execuções infinitas:

```typescript
// ❌ DEPENDÊNCIAS PROBLEMÁTICAS
}, [proposal, isLoading, isWaitingForAI, pollingInterval, timeoutId, refetch, needsAIProcessing, proposalId, proposal?.status, proposal?.proposalMarkdown, proposal?.proposalHtml, proposal?.aiGeneratedContent]);
```

**Problemas identificados:**
1. **`proposal`** - Objeto completo que muda a cada render
2. **`pollingInterval`** e **`timeoutId`** - Estados que mudam dentro do próprio useEffect
3. **`refetch`** - Função que muda a cada render
4. **`needsAIProcessing`** - Função que muda a cada render

## 🔧 **CORREÇÃO IMPLEMENTADA**

### **1. Dependências Simplificadas**
```typescript
// ✅ DEPENDÊNCIAS CORRIGIDAS
}, [proposal?.id, proposal?.status, proposal?.proposalMarkdown, proposal?.proposalHtml, proposal?.aiGeneratedContent, isLoading, isWaitingForAI, proposalId]);
```

**Mudanças:**
- ❌ Removido `proposal` (objeto completo)
- ✅ Mantido apenas propriedades específicas `proposal?.id`, `proposal?.status`, etc.
- ❌ Removido `pollingInterval` e `timeoutId` (estados internos)
- ❌ Removido `refetch` (função instável)
- ❌ Removido `needsAIProcessing` (função instável)

### **2. Função Simplificada**
```typescript
// ANTES: Função complexa com múltiplas dependências
const needsAIProcessing = useCallback((proposal: any) => {
  // Lógica complexa com isRecentProposal
}, [isRecentProposal]);

// DEPOIS: Função simples e estável
const shouldStartPolling = useCallback((proposal: any) => {
  if (!proposal?.createdAt) return false;
  
  const createdAt = new Date(proposal.createdAt).getTime();
  const now = Date.now();
  const isRecent = (now - createdAt) < RECENT_PROPOSAL_THRESHOLD_MS;
  
  return isRecent;
}, [RECENT_PROPOSAL_THRESHOLD_MS]);
```

**Benefícios:**
- ✅ **Dependência estável**: `RECENT_PROPOSAL_THRESHOLD_MS` é constante
- ✅ **Lógica inline**: Sem dependência de outras funções
- ✅ **Performance**: Menos re-criações da função

### **3. Remoção de Funções Desnecessárias**
```typescript
// ❌ REMOVIDO: Função que causava dependências circulares
const isRecentProposal = useCallback((proposal: any) => {
  // ...
}, [RECENT_PROPOSAL_THRESHOLD_MS]);
```

## 📊 **RESULTADO DA CORREÇÃO**

### **Antes:**
- ❌ **Loop infinito**: useEffect executando constantemente
- ❌ **Performance degradada**: Re-renders excessivos
- ❌ **Console error**: "Maximum update depth exceeded"
- ❌ **Sistema travado**: Interface não responsiva

### **Depois:**
- ✅ **Execução controlada**: useEffect executa apenas quando necessário
- ✅ **Performance otimizada**: Sem re-renders desnecessários
- ✅ **Sem erros**: Console limpo
- ✅ **Sistema estável**: Interface responsiva

## 🎯 **LIÇÕES APRENDIDAS**

### **1. Dependências do useEffect**
- ❌ **Evitar objetos completos** como dependências
- ✅ **Usar propriedades específicas** (`obj?.prop`)
- ❌ **Evitar funções instáveis** como dependências
- ✅ **Usar useCallback** para funções estáveis

### **2. Estados Internos**
- ❌ **Não incluir estados** que mudam dentro do próprio useEffect
- ✅ **Gerenciar estados** através de refs ou outros padrões

### **3. Funções Auxiliares**
- ❌ **Evitar dependências circulares** entre funções
- ✅ **Consolidar lógica** em funções simples e estáveis

## 🔄 **FLUXO CORRIGIDO**

1. **useEffect executa** apenas quando propriedades específicas mudam
2. **shouldStartPolling** verifica se proposta é recente
3. **Polling inicia** se necessário
4. **Estados internos** gerenciados sem afetar dependências
5. **Polling para** quando detecta conteúdo
6. **Sem re-execuções** desnecessárias

**Resultado**: Sistema de polling **estável** e **performático** sem loops infinitos. 