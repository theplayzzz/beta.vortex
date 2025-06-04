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

## **🔧 CORREÇÃO DO PROBLEMA IDENTIFICADO** ⚠️ 

### **❌ PROBLEMA REPORTADO:**
- Usuário conseguiu submeter formulário com campos vazios
- Navegação automática não funcionou
- Validação não detectou campos obrigatórios

### **🔍 CAUSA RAIZ IDENTIFICADA:**
O **React Hook Form** estava interceptando a submissão com seu próprio `zodResolver(planningFormSchema)` **ANTES** da nossa validação customizada ser executada. Quando havia erros de validação, o `handleFormSubmit` nem era chamado.

### **✅ CORREÇÃO IMPLEMENTADA:**
1. **Removido `zodResolver`** do React Hook Form em `PlanningForm.tsx`
2. **Simplificado `handleFormSubmit`** para chamar diretamente nossa validação customizada
3. **Mantida validação customizada** no `PlanningFormWithClient.tsx` como única fonte de validação

### **📁 ARQUIVOS MODIFICADOS:**
- ```components/planning/PlanningForm.tsx```:
  - ❌ Removido: `resolver: zodResolver(planningFormSchema)`
  - ❌ Removido: Validação duplicada complexa no `handleFormSubmit`  
  - ✅ Simplificado: `handleFormSubmit` chama diretamente `onSubmit(data)`

### **🧪 TESTE OBRIGATÓRIO - VERIFICAR CORREÇÃO:**

#### **🔥 TESTE CRÍTICO 1: Campo Vazio na Primeira Aba**
1. **Acesse**: `/planejamentos/novo` com cliente válido
2. **Deixe VAZIO**: Campo "Título do Planejamento" (primeira aba)  
3. **Navegue para**: Qualquer outra aba (ex: Marketing)
4. **Clique**: "🚀 Finalizar Planejamento"

**✅ RESULTADO ESPERADO AGORA:**
- ❌ **Toast vermelho**: "Formulário incompleto" + "Navegando para Informações Básicas"
- 🎯 **Navegação automática**: Sistema vai automaticamente para Aba 1
- 🟢 **Campo destacado**: "Título" com outline verde por 2 segundos
- 🚫 **Submissão interrompida**: NÃO deve criar planejamento

#### **🔥 TESTE CRÍTICO 2: Campo Vazio em Aba Posterior**  
1. **Preencha**: "Informações Básicas" e "Detalhes do Setor" corretamente
2. **Deixe VAZIO**: "Maturidade de Marketing" (aba Marketing)
3. **Vá para**: Aba "Comercial" e preencha
4. **Clique**: "🚀 Finalizar Planejamento"

**✅ RESULTADO ESPERADO:**
- ❌ **Toast**: "Formulário incompleto" + "Navegando para Marketing"  
- 🎯 **Navegação**: Automática para Aba 3 (Marketing)
- 🟢 **Campo destacado**: Dropdown "Maturidade Marketing"
- 🚫 **Submissão interrompida**

#### **✅ TESTE CONTROLE: Formulário Completamente Válido**
1. **Preencha TODOS** os campos obrigatórios em todas as abas
2. **Clique**: "🚀 Finalizar Planejamento"

**✅ RESULTADO ESPERADO:**
- 🔵 **Toast azul**: "Criando planejamento..." + "Salvando dados no banco"
- ⚙️ **Loading**: Spinner com overlay
- ✅ **Submissão executada**: Planejamento deve ser criado
- 🔄 **Redirecionamento**: Para `/planejamentos` 
- 🟢 **Toast verde**: "Planejamento criado com sucesso!"

### **🔍 LOGS DE DEBUG PARA VERIFICAÇÃO:**
Abra **Developer Tools (F12)** e monitore o console:

**Para formulário COM ERRO:**
```
🚨 INÍCIO - PlanningFormWithClient.handleFormSubmit CHAMADO!
🔍 Executando validação prévia...
🔍 validateFormWithNavigation: Iniciando validação completa...
❌ validateFormWithNavigation: Erros encontrados: 1
🎯 validateFormWithNavigation: Primeira aba com erro: Informações Básicas (índice 0)
📍 validateFormWithNavigation: Primeiro campo com erro: titulo_planejamento
❌ Validação falhou, executando navegação automática...
🎯 DEBUG - Tentando navegar para aba: 0
✅ DEBUG - Navegação executada via currentTabRef
🚫 Submissão cancelada devido a erros de validação
🚫 DEBUG - RETURN executado, função deve parar aqui
```

**Para formulário VÁLIDO:**
```
🚨 INÍCIO - PlanningFormWithClient.handleFormSubmit CHAMADO!
🔍 Executando validação prévia...
✅ validateFormWithNavigation: Formulário totalmente válido
✅ Validação prévia passou - formulário está válido
🚨 setIsSubmitting(true) executado
📤 Enviando planejamento: [dados do payload]
🚨 Chamando createPlanningMutation.mutateAsync...
✅ Planejamento criado: [dados do planejamento]
🔄 Redirecionando imediatamente para a listagem...
```

### **⚠️ SE A CORREÇÃO NÃO FUNCIONOU:**
Se ainda conseguir submeter com campos vazios:
1. **Verifique console**: Deve mostrar os logs acima
2. **Reporte exatamente**: Qual teste falhou e quais logs apareceram  
3. **Inclua screenshot**: Do console no momento do teste

### **📊 STATUS DA CORREÇÃO:**
- 🔧 **Problema identificado**: ✅ React Hook Form interceptando validação
- 🔧 **Correção implementada**: ✅ Removido zodResolver + simplificado fluxo  
- 🧪 **Testes necessários**: ⏳ **AGUARDANDO VERIFICAÇÃO DO USUÁRIO**