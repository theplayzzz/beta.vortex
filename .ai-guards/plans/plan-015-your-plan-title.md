---
id: plan-015
title: Otimização do Processo de Submissão de Planejamentos - Objetivos Específicos
createdAt: 2025-06-03
author: theplayzzz
status: draft
---

## 🧩 Scope

Implementar fluxo otimizado de submissão de formulários de planejamento com ações independentes para banco de dados e API externa. O usuário deve ser redirecionado imediatamente após salvamento no banco, com polling inteligente apenas na página do planejamento quando os "Objetivos Específicos" ainda não estiverem disponíveis.

## ✅ Functional Requirements

- **RF01**: Submit deve validar formulário e reagir em duas formas: indicar erros ou enviar dados
- **RF02**: Validação com erro deve mover usuário para aba incorreta e destacar campo problema
- **RF03**: Envio para banco de dados e webhook (PLANNING_WEBHOOK_URL) devem ser ações independentes
- **RF04**: Redirecionamento imediato para lista após salvamento no banco (não aguardar webhook)
- **RF05**: Lista de planejamentos deve mostrar itens baseado apenas no estado do banco de dados
- **RF06**: Aba "Objetivos Específicos" deve mostrar dados se disponíveis ou loading se não disponíveis
- **RF07**: Polling deve iniciar apenas quando planejamento carregado mas specificObjectives vazio
- **RF08**: Polling deve parar ao encontrar dados ou em timeout com mensagem de erro
- **RF09**: Resposta do webhook não deve influenciar carregamento ou fluxo da aplicação

## ⚙️ Non-Functional Requirements

- **UX**: Usuário nunca aguarda resposta de API externa para navegação
- **Confiabilidade**: Sistema funciona independente do status da API externa
- **Responsividade**: Polling só ativo quando necessário (specificObjectives vazio)
- **Timeout**: Polling com timeout adequado (90s) e fallback para erro

## 📚 Guidelines & Packages

- Seguir padrões existentes do projeto React/Next.js
- Utilizar TanStack Query para gerenciamento de estado independente
- Implementar validação de formulário com navegação automática para erros
- Manter consistência com sistema de toasts atual
- Utilizar TypeScript para tipagem segura dos payloads
- Garantir independência total entre fluxos de banco e webhook

## 🔐 Threat Model (Stub)

- **Falha na API externa**: Webhook pode falhar, sistema deve continuar funcionando normalmente
- **Timeout de polling**: Dados podem nunca chegar, necessário fallback
- **Estado inconsistente**: UI deve refletir apenas estado do banco de dados
- **Validação bypass**: Formulário deve sempre validar antes de envio

## 🔢 Execution Plan

### 1. **Análise e Refatoração do Submit Atual** ✅ CONCLUÍDO
```142:195:components/planning/PlanningFormWithClient.tsx
const handleFormSubmit = async (formData: PlanningFormData) => {
  try {
    setIsSubmitting(true);
    
    const submissionPayload = prepareFinalSubmissionPayload(
      client,
      formData,
      sessionId
    );

    const createdPlanning = await createPlanningMutation.mutateAsync({
      title: submissionPayload.title,
      description: submissionPayload.description,
      clientId: submissionPayload.clientId,
      formDataJSON: submissionPayload.formDataJSON,
      clientSnapshot: submissionPayload.clientSnapshot,
    });

    // Limpar localStorage e redirecionar
    localStorage.removeItem(`planning-form-draft-${client.id}`);
    router.push(`/planejamentos?highlight=${createdPlanning.id}`);
  } catch (error) {
    // Tratamento de erro com toast
  }
};
```

**✅ PROBLEMAS IDENTIFICADOS NO FLUXO ATUAL:**

#### **❌ Validação Inadequada**
- **Localização**: ```160:246:components/planning/PlanningFormWithClient.tsx```
- **Problema**: `handleFormSubmit` apenas chama `onSubmit(data)` sem validação prévia
- **Impacto**: Usuário pode submeter formulário incompleto sem feedback imediato

#### **❌ Validação Complexa Sem Navegação**
- **Localização**: ```234:377:components/planning/PlanningForm.tsx```
- **Problema**: Validação existente é complexa mas não navega automaticamente
- **Código atual**: 
```typescript
// Mapear erros para abas mas não navega automaticamente
const tabsWithErrorsData = [];
const errorTabIndices = new Set<number>();
setTabsWithErrors(errorTabIndices); // Apenas marca visualmente
setPendingTabNavigation(firstErrorTab.tabIndex); // Não funciona efetivamente
```
- **Impacto**: Estado `tabsWithErrors` existe mas não resulta em navegação automática

#### **✅ Webhook Já Independente**
- **Localização**: ```app/api/plannings/route.ts``` (linhas 117-263)
- **Status**: ✅ **JÁ IMPLEMENTADO CORRETAMENTE**
- **Implementação atual**:
```typescript
// Webhook é executado de forma independente na API
try {
  const webhookPayload = { ... };
  if (process.env.PLANNING_WEBHOOK_URL) {
    await fetch(process.env.PLANNING_WEBHOOK_URL, { ... });
  }
} catch (webhookError) {
  console.error('Webhook dispatch failed:', webhookError);
  // ✅ Não falhar a criação do planejamento por erro no webhook
}
```
- **Conclusão**: Webhook não bloqueia o fluxo principal

#### **⚠️ Redirecionamento Adequado**
- **Status**: ✅ **FUNCIONAMENTO CORRETO**
- **Análise**: Redirecionamento ocorre após `createPlanningMutation.mutateAsync`, que é adequado
- **Webhook**: Executado de forma independente na API, não afeta timing

#### **🔍 Funções de Validação Existentes**
- **validateCompleteForm**: ```20:65:lib/planning/formValidation.ts``` ✅ Disponível
- **validateTab**: ```67:85:lib/planning/formValidation.ts``` ✅ Disponível  
- **navigateToFirstError**: ```220:247:lib/planning/formValidation.ts``` ✅ Disponível

**📊 CONCLUSÃO DA INVESTIGAÇÃO:**
1. **Webhook**: ✅ Já implementado corretamente (independente)
2. **Redirecionamento**: ✅ Funcionamento adequado  
3. **Validação**: ❌ Principal problema - falta validação prévia eficaz
4. **Navegação**: ❌ Sistema existente não navega automaticamente

### 2. **Implementar Validação com Navegação Automática** ✅ CONCLUÍDO

#### **✅ IMPLEMENTAÇÃO REALIZADA:**

**🔧 Nova Função de Validação**
- **Localização**: ```lib/planning/formValidation.ts``` (linhas 264-320)
- **Função**: `validateFormWithNavigation(formData: PlanningFormData)`
- **Retorno**: Interface `FormValidationWithNavigationResult` com informações de erro e navegação

```typescript
interface FormValidationWithNavigationResult {
  isValid: boolean;
  totalErrors: number;
  errorTab?: number;        // Índice da aba com erro (0-3)
  errorTabName?: string;    // Nome amigável da aba
  errorField?: string;      // Nome do primeiro campo com erro
  errorMessage?: string;    // Mensagem de erro do campo
  errors: ValidationError[];
}
```

**🎯 Função de Navegação Automática**
- **Localização**: ```lib/planning/formValidation.ts``` (linhas 322-340)
- **Função**: `executeAutoNavigation(result, navigateToTab)`
- **Funcionalidade**: 
  - Navega automaticamente para aba com erro
  - Destaca visualmente o campo problemático (outline verde)
  - Faz scroll suave até o campo

**🔄 Integração no Submit**
- **Localização**: ```components/planning/PlanningFormWithClient.tsx``` (linhas 160-200)
- **Fluxo implementado**:
  1. **Validação Prévia**: Executa `validateFormWithNavigation()` antes de submeter
  2. **Navegação Automática**: Se há erros, executa `executeAutoNavigation()`
  3. **Feedback Visual**: Toast explicativo com nome da aba e quantidade de erros
  4. **Interrupção**: Para a submissão se há erros (return statement)

```typescript
// ✅ ETAPA 1: VALIDAÇÃO PRÉVIA COM NAVEGAÇÃO AUTOMÁTICA
const validationResult = validateFormWithNavigation(formData);

if (!validationResult.isValid) {
  // Executar navegação automática para erro
  executeAutoNavigation(validationResult, (tabIndex: number) => {
    if (currentTabRef.current) {
      currentTabRef.current(tabIndex);
    }
  });
  
  // Toast explicativo
  addToast(toast.error(
    'Formulário incompleto',
    `Há ${validationResult.totalErrors} erro(s). Navegando para "${validationResult.errorTabName}".`
  ));
  
  return; // Parar execução
}
```

#### **🧪 INSTRUÇÕES DE TESTE MANUAL:**

**📋 CENÁRIO 1: Erro na Primeira Aba (Informações Básicas)**
1. Acesse: `/planejamentos/novo` com um cliente válido
2. **Deixe campo obrigatório vazio**: "Título do Planejamento" em branco
3. Navegue para qualquer outra aba (ex: Marketing, Comercial)
4. Clique em **"🚀 Finalizar Planejamento"**
5. **✅ Resultado esperado**:
   - Toast vermelho: "Formulário incompleto" + "Navegando para Informações Básicas"
   - Navegação automática para Aba 1
   - Campo "Título" destacado com outline verde
   - Scroll automático até o campo
   - Submissão **NÃO** executada

**📋 CENÁRIO 2: Erro na Terceira Aba (Marketing)**
1. Preencha corretamente: "Informações Básicas" e "Detalhes do Setor"
2. Na aba **Marketing**: deixe "Maturidade de Marketing" sem seleção
3. Vá para aba **Comercial** e preencha corretamente
4. Clique em **"🚀 Finalizar Planejamento"**
5. **✅ Resultado esperado**:
   - Toast: "Formulário incompleto" + "Navegando para Marketing"
   - Navegação automática para Aba 3 (Marketing)
   - Campo dropdown destacado
   - Submissão **NÃO** executada

**📋 CENÁRIO 3: Formulário Completamente Válido**
1. Preencha **todas as abas** com dados válidos
2. Clique em **"🚀 Finalizar Planejamento"**
3. **✅ Resultado esperado**:
   - **NÃO** há navegação automática
   - Toast azul: "Criando planejamento..." + "Salvando dados no banco"
   - Loading overlay aparece
   - Submissão **É** executada
   - Redirecionamento para `/planejamentos`
   - Toast verde: "Planejamento criado com sucesso!"

**📋 CENÁRIO 4: Múltiplos Erros em Várias Abas**
1. Deixe campos obrigatórios vazios em **3 abas diferentes**:
   - Aba 1: "Título do Planejamento" vazio
   - Aba 3: "Maturidade Marketing" não selecionado  
   - Aba 4: "Maturidade Comercial" não selecionado
2. Clique em **"🚀 Finalizar Planejamento"**
3. **✅ Resultado esperado**:
   - Toast: "Há 3 erro(s)" + "Navegando para Informações Básicas"
   - Navegação para **primeira aba com erro** (Informações Básicas)
   - Campo "Título" destacado

**🔍 LOGS DE DEBUG ESPERADOS:**
Abra Developer Tools (F12) e monitore console:
```
🔍 validateFormWithNavigation: Iniciando validação completa...
❌ validateFormWithNavigation: Erros encontrados: 1
🎯 validateFormWithNavigation: Primeira aba com erro: Informações Básicas (índice 0)
📍 validateFormWithNavigation: Primeiro campo com erro: titulo_planejamento
🚫 Submissão cancelada devido a erros de validação
```

**⚠️ COMPORTAMENTOS A VERIFICAR:**
- ✅ Validação **antes** de qualquer operação de banco
- ✅ Navegação **imediata** para aba com erro  
- ✅ Destaque visual do campo (outline verde por 2 segundos)
- ✅ Toast explicativo com informações úteis
- ✅ Submissão **totalmente interrompida** em caso de erro
- ✅ Console logs detalhados para debugging

#### **🎮 SCRIPT DE TESTE AUTOMÁTICO:**

**Localização**: ```scripts/test-validation-navigation.js```

**Como usar**:
1. Acesse `/planejamentos/novo` com um cliente válido
2. Abra Developer Tools (F12) 
3. Execute no console: `testValidationNavigation()`
4. Verifique os resultados dos testes automáticos

## **📊 RESUMO DA IMPLEMENTAÇÃO (ETAPAS 1-2) ✅ CONCLUÍDO**

### **🔧 ARQUIVOS MODIFICADOS:**
1. **```lib/planning/formValidation.ts```** (linhas 264-356)
   - ✅ Nova interface `FormValidationWithNavigationResult`
   - ✅ Função `validateFormWithNavigation()` 
   - ✅ Função `executeAutoNavigation()`

2. **```components/planning/PlanningFormWithClient.tsx```** (linhas 11-14, 160-220)
   - ✅ Importação das funções de validação
   - ✅ Validação prévia no `handleFormSubmit`
   - ✅ Navegação automática para erros
   - ✅ Feedback visual otimizado

3. **```scripts/test-validation-navigation.js```** (novo arquivo)
   - ✅ Script de teste para validação das funções

### **🚀 FUNCIONALIDADES IMPLEMENTADAS:**
- ✅ **Validação Prévia**: Sistema valida formulário **antes** de qualquer submissão
- ✅ **Navegação Automática**: Usuário é automaticamente levado para aba com erro
- ✅ **Destaque Visual**: Campo problemático recebe outline verde por 2 segundos
- ✅ **Feedback Inteligente**: Toast mostra quantidade de erros e nome da aba
- ✅ **Interrupção Segura**: Submissão só prossegue se formulário válido
- ✅ **Logs Detalhados**: Console mostra informações para debugging

### **🔍 PROBLEMAS RESOLVIDOS:**
- ❌ **ANTES**: Usuário podia submeter formulário incompleto sem feedback
- ✅ **DEPOIS**: Validação prévia com navegação automática para erros

- ❌ **ANTES**: Sistema de validação complexo mas ineficaz no PlanningForm.tsx
- ✅ **DEPOIS**: Validação simplificada e eficaz com feedback imediato

- ❌ **ANTES**: Webhook acoplado ao fluxo (na verdade já estava correto)
- ✅ **CONFIRMADO**: Webhook já independente, funcionamento correto mantido

### **🎯 STATUS ATUAL:**
- ✅ **Etapa 1**: Análise e Refatoração do Submit Atual → **CONCLUÍDO**
- ✅ **Etapa 2**: Implementar Validação com Navegação Automática → **CONCLUÍDO**
- ⏳ **Etapa 3**: Separar Ações de Banco e Webhook → **PENDENTE** (webhook já independente)
- ⏳ **Etapas 4-11**: Polling, sistema de timeout, etc. → **PENDENTE**

**🏁 PRÓXIMOS PASSOS**: As próximas etapas focarão em implementar polling inteligente para "Objetivos Específicos" e otimizações do sistema de notificação.

---

## **✅ CORREÇÃO DO PROBLEMA DE NAVEGAÇÃO AUTOMÁTICA** ✅ CONCLUÍDA

### **❌ PROBLEMA REPORTADO:**
- Validação funcionando (impede submit com campos vazios) ✅
- **Navegação automática NÃO funcionando** ❌
- **Campo não sendo destacado** ❌

### **🔍 CAUSA RAIZ IDENTIFICADA:**
A configuração do `currentTabRef` estava usando uma abordagem com `useCallback` desnecessariamente complexa que criava dependências circulares.

### **✅ CORREÇÃO IMPLEMENTADA E TESTADA:**

#### **🔧 1. Simplificação do currentTabRef** (`components/planning/PlanningForm.tsx`)
**ANTES** (Complexo com callback):
```typescript
const tabChangeRef = useCallback((callback: (tab: number) => void) => {
  if (onTabChangeRef) {
    onTabChangeRef.current = callback;
  }
}, [onTabChangeRef]);

useEffect(() => {
  tabChangeRef(safeSetCurrentTab);
}, [tabChangeRef, safeSetCurrentTab]);
```

**DEPOIS** (Direto e simples):
```typescript
useEffect(() => {
  if (onTabChangeRef) {
    onTabChangeRef.current = safeSetCurrentTab;
  }
}, [onTabChangeRef, safeSetCurrentTab]);
```

#### **🔧 2. Otimização de Logs**
- **Removidos**: Logs excessivos de debug após confirmação do funcionamento
- **Mantidos**: Logs essenciais para manutenção futura
- **Resultado**: Código mais limpo e performático

### **🎯 FUNCIONALIDADES CONFIRMADAS:**
- ✅ **Validação Prévia**: Sistema valida formulário antes de qualquer submissão
- ✅ **Navegação Automática**: Usuário é automaticamente levado para aba com erro
- ✅ **Destaque Visual**: Campo problemático recebe outline verde por 2 segundos
- ✅ **Feedback Inteligente**: Toast mostra quantidade de erros e nome da aba
- ✅ **Interrupção Segura**: Submissão só prossegue se formulário válido
- ✅ **Scroll Automático**: Página rola até o campo com erro

### **📊 STATUS ATUALIZADO:**
- ✅ **Etapa 1**: Análise e Refatoração do Submit Atual → **CONCLUÍDO**
- ✅ **Etapa 2**: Implementar Validação com Navegação Automática → **CONCLUÍDO**
- ✅ **Correção**: Problema de navegação automática → **CONCLUÍDA E TESTADA**
- ✅ **Otimização**: Remoção de logs desnecessários → **CONCLUÍDA**

**🏁 PRÓXIMOS PASSOS**: As etapas 1-2 estão totalmente funcionais. Pronto para implementar as etapas seguintes (3-11) conforme necessário.