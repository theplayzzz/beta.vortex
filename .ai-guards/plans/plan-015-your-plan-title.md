---
id: plan-015
title: Otimização do Processo de Submissão de Planejamentos - Objetivos Específicos
createdAt: 2025-06-03
author: theplayzzz
status: draft
---

## 🧩 Scope

Otimizar o processo de submissão de formulários de planejamento para que o loading não fique rodando até a resposta do webhook. Implementar sistema de identificação automática quando os "Objetivos Específicos" gerados por IA chegarem ao banco de dados, com tratamento adequado de erros via webhook e redirecionamento rápido.

## ✅ Functional Requirements

- **RF01**: Submissão de formulário deve ser concluída imediatamente após envio para o banco
- **RF02**: Aba "Objetivos Específicos" deve detectar automaticamente quando dados são inseridos no banco
- **RF03**: Sistema deve aguardar 30-90 segundos para geração de IA sem bloquear UI
- **RF04**: Webhook deve servir apenas para notificação de erros da API externa
- **RF05**: Em caso de erro no webhook, exibir mensagem de erro indicando ao usuário para criar outro planejamento
- **RF06**: Limpar localStorage e redirecionar usuário imediatamente após submissão bem-sucedida
- **RF07**: Mostrar feedback visual adequado durante processo de geração de IA

## ⚙️ Non-Functional Requirements

- **Performance**: Submissão deve ser concluída o mais rápido possivel
- **UX**: Loading não deve bloquear navegação após submissão inicial
- **Confiabilidade**: Sistema deve funcionar mesmo com falhas na API externa
- **Responsividade**: Polling deve iniciar após submit, encerrar com sucesso na chegada das informações ou encerrar quando der erro
- **Timeout**: Webhook deve ter timeout adequado para evitar travamentos

## 📚 Guidelines & Packages

- Seguir padrões existentes do projeto React/Next.js
- Utilizar TanStack Query para gerenciamento de estado e cache
- Implementar polling otimizado para verificação de dados
- Manter consistência com sistema de toasts atual
- Utilizar TypeScript para tipagem segura dos payloads

## 🔐 Threat Model (Stub)

- **Falha na API externa**: Webhook pode falhar, sistema deve continuar funcionando
- **Timeout de geração IA**: Dados podem demorar mais que esperado
- **Perda de dados**: localStorage pode ser limpo prematuramente
- **Estado inconsistente**: UI pode mostrar dados desatualizados

## 🔢 Execution Plan

### 1. **Análise do Código Atual de Submissão**
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

### 2. **Implementar Submissão Otimizada**
- **Processo**: Manter preparação de payload e chamada API existente
- **Estado**: Finalizar loading após submissão inicial (não aguardar webhook)
- **Feedback**: Toast de sucesso imediato + indicador de processamento de IA
- **Redirecionamento**: Imediato para `/planejamentos?highlight=${createdPlanning.id}`

### 3. **Implementar Sistema de Polling para Objetivos Específicos**
- Criar hook customizado `useSpecificObjectivesPolling(planningId)`
- Polling com intervalos inteligentes (2s iniciais, depois 5s)
- Parar polling após receber dados ou timeout (90 segundos)
- Atualizar cache do TanStack Query automaticamente

### 4. **Modificar Aba Objetivos Específicos**
- Adicionar indicador visual quando dados estão sendo gerados
- Mostrar skeleton/loading específico para conteúdo de IA
- Detectar automaticamente quando dados chegam (via polling)
- Animação suave de transição quando dados aparecem

### 5. **Implementar Tratamento de Webhook de Erro**
- Endpoint específico para receber notificações de falha da API externa
- Atualizar status no banco quando houver erro
- Notificar usuário via toast sobre falha na geração
- Exibir mensagem clara: "Erro na geração de objetivos específicos. Tente criar um novo planejamento."
- Botão "Tentar Novamente" para reprocessar objetivos específicos

### 6. **Adicionar Sistema de Fallback e Recuperação**
- Se polling não detectar dados em 90s, mostrar opção manual
- Botão para verificar novamente ou reportar problema
- Em caso de erro crítico, redirecionar para `/clientes` com toast explicativo
- Em caso de erro crítico, exibir toast com orientação para criar novo planejamento
- Manter dados do formulário em cache para recuperação

### 7. **Melhorias na UX**
- Toast de confirmação: "Planejamento criado! Objetivos específicos sendo gerados..."
- Indicador na lista de planejamentos: badge "Processando IA"
- Página do planejamento: seção dedicada ao status da geração
- Feedback visual contínuo sem bloquear navegação

### 8. **Testes e Validação**
- Testar cenário de sucesso normal (dados em 30-60s)
- Testar timeout (dados nunca chegam)
- Testar falha de webhook
- Testar navegação durante processamento
- Validar performance do polling

### 9. **Monitoramento e Logs**
- Adicionar logs para tempo de geração de IA
- Métricas de taxa de sucesso do webhook
- Alertas para timeouts frequentes
- Dashboard de performance do sistema
