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

### 1. **Análise e Refatoração do Submit Atual**
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

**Problemas identificados no fluxo atual:**
- Não há validação prévia com navegação para erros
- Webhook não está separado da submissão principal
- Redirecionamento pode estar aguardando mais que necessário

### 2. **Implementar Validação com Navegação Automática**
- **Validação Prévia**: Executar validação completa antes do submit
- **Detecção de Erros**: Identificar primeira aba/campo com erro
- **Navegação Automática**: Mover usuário para aba problemática
- **Destaque Visual**: Aplicar estilo de erro no campo específico
- **Feedback**: Toast explicativo sobre o que corrigir

### 3. **Separar Ações de Banco e Webhook**
```typescript
const handleFormSubmit = async (formData: PlanningFormData) => {
  // 1. Validação com navegação automática
  const validationResult = validateFormWithNavigation(formData);
  if (!validationResult.isValid) {
    navigateToErrorTab(validationResult.errorTab);
    highlightErrorField(validationResult.errorField);
    return;
  }

  try {
    setIsSubmitting(true);
    
    const submissionPayload = prepareFinalSubmissionPayload(client, formData, sessionId);

    // AÇÃO 1: Salvar no banco (prioritária)
    const createdPlanning = await createPlanningMutation.mutateAsync({
      title: submissionPayload.title,
      description: submissionPayload.description,
      clientId: submissionPayload.clientId,
      formDataJSON: submissionPayload.formDataJSON,
      clientSnapshot: submissionPayload.clientSnapshot,
    });

    // AÇÃO 2: Webhook independente (fire-and-forget)
    triggerWebhookAsync(submissionPayload, createdPlanning.id);

    // Sucesso imediato + redirecionamento
    toast.success("Planejamento criado com sucesso!");
    localStorage.removeItem(`planning-form-draft-${client.id}`);
    router.push(`/planejamentos?highlight=${createdPlanning.id}`);
    
  } catch (error) {
    // Apenas erro de banco afeta o usuário
  }
};
```

### 4. **Implementar Webhook Fire-and-Forget**
- **Função Independente**: `triggerWebhookAsync()` não bloqueia fluxo
- **URL**: Utilizar `PLANNING_WEBHOOK_URL` configurada
- **Payload**: Enviar submissionPayload + planningId
- **Tratamento**: Logs internos apenas, sem afetar UX
- **Retry**: Sistema interno de retry se necessário

### 5. **Otimizar Lista de Planejamentos**
- **Source Única**: Buscar dados apenas do banco de dados
- **Cache Atualizado**: TanStack Query invalidar cache após criação
- **Highlight**: Funcionalidade existente para destacar item criado
- **Status Visual**: Badge opcional para "Processando IA" baseado em specificObjectives

### 6. **Implementar Sistema de Polling Condicional**
```typescript
const useSpecificObjectivesPolling = (planningId: string, initialData: any) => {
  const [shouldPoll, setShouldPoll] = useState(false);

  useEffect(() => {
    // Só inicia polling se:
    // 1. Planejamento carregado
    // 2. specificObjectives está vazio/null
    if (planningId && !initialData?.specificObjectives) {
      setShouldPoll(true);
    }
  }, [planningId, initialData]);

  const { data } = useQuery({
    queryKey: ['planning-objectives', planningId],
    queryFn: () => fetchPlanningObjectives(planningId),
    enabled: shouldPoll,
    refetchInterval: (data) => {
      // Para polling se dados chegaram
      if (data?.specificObjectives) {
        setShouldPoll(false);
        return false;
      }
      return 3000; // 3s interval
    },
    // Timeout de 90s
    refetchIntervalInBackground: false,
  });

  // Timeout manual
  useEffect(() => {
    if (shouldPoll) {
      const timeout = setTimeout(() => {
        setShouldPoll(false);
      }, 90000);
      return () => clearTimeout(timeout);
    }
  }, [shouldPoll]);

  return { data, isPolling: shouldPoll };
};
```

### 7. **Modificar Aba Objetivos Específicos**
- **Estado Inicial**: Verificar se specificObjectives existe no carregamento
- **Conditional Render**: 
  - Se existe → Mostrar dados normalmente
  - Se não existe → Mostrar loading + iniciar polling
- **Transição Suave**: Animação quando dados chegam via polling
- **Estado de Erro**: Após timeout, mostrar mensagem e botões de ação

### 8. **Implementar Tratamento de Timeout**
```typescript
const ObjectivesTab = ({ planning }) => {
  const { data, isPolling } = useSpecificObjectivesPolling(planning.id, planning);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  if (planning.specificObjectives || data?.specificObjectives) {
    return <ObjectivesContent data={planning.specificObjectives || data.specificObjectives} />;
  }

  if (hasTimedOut) {
    return (
      <ErrorState 
        message="Houve um problema na geração dos objetivos específicos"
        actions={[
          { label: "Atualizar Página", action: () => window.location.reload() },
          { label: "Criar Novo Planejamento", action: () => router.push('/planejamentos/novo') }
        ]}
      />
    );
  }

  if (isPolling) {
    return <LoadingState message="Gerando objetivos específicos..." />;
  }

  return null;
};
```

### 9. **Remover Dependências de Webhook do Fluxo Principal**
**Itens a remover/ajustar:**
- ❌ Loading que aguarda resposta de webhook
- ❌ Redirecionamento condicionado a webhook
- ❌ Estado de submissão dependente de API externa
- ❌ Cache invalidation baseada em webhook response
- ❌ Feedback de erro de webhook afetando submit

**Manter apenas:**
- ✅ Logs internos de webhook para debugging
- ✅ Retry interno se webhook falhar
- ✅ Metrics para monitoramento de webhook

### 10. **Testes Específicos do Novo Fluxo**

#### **10.1. Testes de Validação e Navegação**
- **Erro na Aba 1**: Verificar navegação automática e highlight
- **Erro na Aba 3**: Testar navegação para aba específica
- **Múltiplos Erros**: Validar navegação para primeiro erro encontrado
- **Formulário Válido**: Confirmar passagem direto para submit

#### **10.2. Testes de Submissão Independente**
- **Banco Sucesso + Webhook Sucesso**: Fluxo normal completo
- **Banco Sucesso + Webhook Falha**: Usuário não deve ser afetado
- **Banco Falha**: Usuário deve ver erro, webhook não executar
- **Webhook Timeout**: Verificar que não afeta redirecionamento

#### **10.3. Testes de Polling Condicional**
- **specificObjectives Existe**: Polling não deve iniciar
- **specificObjectives Vazio**: Polling deve iniciar automaticamente
- **Dados Chegam (30s)**: Polling deve parar e mostrar dados
- **Timeout (90s)**: Polling deve parar e mostrar erro
- **Navegação Durante Polling**: Estado deve persistir

#### **10.4. Testes de Integração PLANNING_WEBHOOK_URL**
- **Payload Correto**: Verificar estrutura enviada para webhook
- **Resposta de Sucesso**: Confirmar que dados chegam no banco
- **Resposta de Erro**: Validar que aplicação continua funcionando
- **Webhook Indisponível**: Sistema deve continuar normalmente

### 11. **Monitoramento Independente**
- **Métricas de Banco**: Taxa de sucesso de salvamento
- **Métricas de Webhook**: Taxa de sucesso independente
- **Tempo de Polling**: Média de tempo até recebimento de dados
- **Taxa de Timeout**: Frequência de casos que excedem 90s
- **Performance**: Tempo de redirecionamento após salvamento
