# 🔄 Sequência Lógica de Execução - Submit do Formulário de Propostas

## 📋 Visão Geral
Fluxo completo de execução quando o usuário clica em "Gerar Proposta" no formulário multi-etapas.

---

## 🚀 FASE 1: PREPARAÇÃO E VALIDAÇÃO (Síncrono)
**Duração estimada**: 100-300ms
**Objetivo**: Validar dados antes de qualquer processamento

### 1.1 Captura dos Dados do Formulário
```typescript
const formData = form.getValues(); // React Hook Form
const clientData = selectedClient; // Cliente selecionado
const userId = await auth(); // Clerk Auth
```

### 1.2 Validação Completa com Navegação Automática
```typescript
// Adaptar de /lib/planning/formValidation.ts
const validationResult = validateFormWithNavigationProposals(formData);

if (!validationResult.isValid) {
  // Navegar automaticamente para primeira aba com erro
  setCurrentTab(validationResult.errorTab);
  
  // Mostrar toast específico
  toast.error(`Há ${validationResult.totalErrors} erro(s) em "${validationResult.errorTabName}"`);
  
  // Destacar campos com erro
  highlightErrorFields(validationResult.errors);
  
  return; // PARAR EXECUÇÃO
}
```

### 1.3 Preparação do Payload
```typescript
const submissionPayload = {
  // Dados básicos
  titulo_proposta: formData.titulo_proposta,
  tipo_proposta: formData.tipo_proposta,
  clientId: clientData.id,
  
  // Dados completos do formulário
  formDataJSON: formData,
  
  // Snapshot do cliente para preservar dados históricos
  clientSnapshot: {
    id: clientData.id,
    name: clientData.name,
    industry: clientData.industry,
    richnessScore: clientData.richnessScore,
    businessDetails: clientData.businessDetails,
    contactEmail: clientData.contactEmail,
    website: clientData.website,
    snapshotAt: new Date().toISOString()
  }
};
```

---

## 🗄️ FASE 2: SALVAMENTO NO BANCO (Síncrono - Prioritário)
**Duração estimada**: 200-500ms
**Objetivo**: Garantir que os dados estejam salvos antes de qualquer processamento externo

### 2.1 Criação da Proposta Inicial
```typescript
const proposal = await prisma.commercialProposal.create({
  data: {
    title: submissionPayload.titulo_proposta,
    clientId: submissionPayload.clientId,
    userId: user.id,
    status: 'DRAFT', // Status inicial
    
    // 🔥 CRÍTICO: Salvar dados do formulário
    formDataJSON: submissionPayload.formDataJSON,
    clientSnapshot: submissionPayload.clientSnapshot,
    
    // Status temporário do processamento
    generatedContent: JSON.stringify({
      status: 'processing',
      message: 'Enviando para IA externa...',
      timestamp: new Date().toISOString()
    })
  },
  include: {
    Client: true,
    User: true
  }
});
```

### 2.2 Confirmação de Salvamento
```typescript
if (!proposal || !proposal.id) {
  throw new Error('Falha ao salvar proposta no banco de dados');
}

// Log para debug
console.log('✅ Proposta salva no banco:', proposal.id);
```

---

## 📡 FASE 3: WEBHOOK ASSÍNCRONO (Fire-and-Forget)
**Duração**: 3-30 segundos (não bloqueia o usuário)
**Objetivo**: Processar proposta com IA externa em background

### 3.1 Preparação do Payload do Webhook
```typescript
const webhookPayload = {
  proposal_id: proposal.id,
  timestamp: new Date().toISOString(),
  
  user_info: {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email
  },
  
  client_info: {
    id: proposal.Client.id,
    name: proposal.Client.name,
    industry: proposal.Client.industry,
    richnessScore: proposal.Client.richnessScore,
    businessDetails: proposal.Client.businessDetails,
    contactEmail: proposal.Client.contactEmail,
    website: proposal.Client.website,
    data_quality: proposal.Client.richnessScore > 80 ? "alto" : "médio"
  },
  
  proposal_requirements: formData,
  
  context_enrichment: {
    client_richness_level: proposal.Client.richnessScore > 80 ? "alto" : "médio",
    industry_specific_insights: true,
    personalization_level: "avançado",
    recommended_complexity: "avançado",
    services_count: formData.servicos_incluidos.length,
    urgency_level: formData.urgencia_projeto
  },
  
  submission_metadata: {
    user_id: user.id,
    submitted_at: new Date().toISOString(),
    form_version: "1.0",
    session_id: `proposal_${proposal.id}`
  }
};
```

### 3.2 Disparo do Webhook (Assíncrono)
```typescript
// 🔥 IMPORTANTE: Não aguardar resposta - Fire and Forget
setTimeout(async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    const webhookResponse = await fetch(process.env.PROPOSTA_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.WEBHOOK_SECRET,
        'X-Origin-Domain': process.env.NEXT_PUBLIC_APP_URL
      },
      body: JSON.stringify(webhookPayload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (webhookResponse.ok) {
      const result = await webhookResponse.json();
      await processWebhookSuccess(proposal.id, result);
    } else {
      await processWebhookError(proposal.id, webhookResponse);
    }
    
  } catch (error) {
    await processWebhookError(proposal.id, error);
  }
}, 100); // Delay mínimo para não bloquear resposta ao usuário
```

---

## ✅ FASE 4: RESPOSTA IMEDIATA AO USUÁRIO (Síncrono)
**Duração estimada**: 50-100ms
**Objetivo**: Fornecer feedback imediato independente do webhook

### 4.1 Limpeza de Dados Temporários
```typescript
// Limpar localStorage após sucesso
localStorage.removeItem(`proposal-form-draft-${clientData.id}`);

// Adicionar flag "novo" para destacar na listagem
const newProposals = JSON.parse(localStorage.getItem('new-proposals') || '[]');
newProposals.push(proposal.id);
localStorage.setItem('new-proposals', JSON.stringify(newProposals));
```

### 4.2 Feedback Visual Imediato
```typescript
// Toast de sucesso imediato
toast.success(
  'Proposta criada com sucesso!',
  `"${proposal.title}" foi salva. O conteúdo será gerado automaticamente pela IA.`,
  {
    duration: 4000,
    action: {
      label: 'Visualizar',
      onClick: () => router.push(`/propostas/${proposal.id}`)
    }
  }
);
```

### 4.3 Redirecionamento Imediato
```typescript
// Redirecionar IMEDIATAMENTE (não aguardar webhook)
router.push(`/propostas/${proposal.id}?status=processing`);
```

---

## 🔄 FASE 5: PROCESSAMENTO EM BACKGROUND (Assíncrono)
**Objetivo**: Processar resposta da IA quando disponível

### 5.1 Processamento de Sucesso do Webhook
```typescript
async function processWebhookSuccess(proposalId: string, webhookResult: any) {
  try {
    // Extrair conteúdo markdown da resposta
    const markdownContent = webhookResult.generated_content?.markdown_content;
    
    if (!markdownContent) {
      throw new Error('Resposta do webhook não contém markdown_content');
    }
    
    // Atualizar proposta no banco
    await prisma.commercialProposal.update({
      where: { id: proposalId },
      data: {
        status: 'SENT', // Proposta completada
        
        // Salvar resposta completa da IA
        aiGeneratedContent: webhookResult,
        
        // Salvar markdown para edição
        proposalMarkdown: markdownContent,
        
        // Converter para HTML para visualização
        proposalHtml: convertMarkdownToHtml(markdownContent),
        
        // Metadata da geração
        aiMetadata: webhookResult.generated_content?.metadata,
        
        // Status de sucesso
        generatedContent: JSON.stringify({
          status: 'completed',
          message: 'Proposta gerada com sucesso pela IA',
          completedAt: new Date().toISOString()
        }),
        
        updatedAt: new Date()
      }
    });
    
    // 📁 Salvar em /concluido (se sucesso)
    await saveToCompletedDirectory(proposalId, markdownContent);
    
    console.log('✅ Webhook processado com sucesso:', proposalId);
    
  } catch (error) {
    console.error('❌ Erro ao processar sucesso do webhook:', error);
    await processWebhookError(proposalId, error);
  }
}
```

### 5.2 Processamento de Erro do Webhook
```typescript
async function processWebhookError(proposalId: string, error: any) {
  try {
    await prisma.commercialProposal.update({
      where: { id: proposalId },
      data: {
        status: 'DRAFT', // Manter como rascunho para retry manual
        
        generatedContent: JSON.stringify({
          status: 'error',
          message: 'Erro na comunicação com IA externa',
          error: error.message || 'Erro desconhecido',
          timestamp: new Date().toISOString(),
          retryable: true
        }),
        
        updatedAt: new Date()
      }
    });
    
    console.error('❌ Erro no webhook para proposta:', proposalId, error);
    
  } catch (updateError) {
    console.error('❌ Erro crítico ao salvar erro do webhook:', updateError);
  }
}
```

---

## 📋 FASE 6: INTEGRAÇÃO COM PLANEJAMENTO (Opcional)
**Objetivo**: Vincular proposta ao contexto de planejamento

### 6.1 Identificação do Planejamento Ativo
```typescript
// Buscar planejamento ativo para o mesmo cliente
const activePlanning = await prisma.strategicPlanning.findFirst({
  where: {
    clientId: proposal.clientId,
    userId: proposal.userId,
    status: 'ACTIVE'
  },
  orderBy: { updatedAt: 'desc' }
});
```

### 6.2 Atualização do Contexto do Planejamento
```typescript
if (activePlanning && markdownContent) {
  // Adicionar proposta ao contexto do planejamento
  const currentContext = activePlanning.formDataJSON || {};
  
  const updatedContext = {
    ...currentContext,
    propostas_geradas: [
      ...(currentContext.propostas_geradas || []),
      {
        proposta_id: proposal.id,
        titulo: proposal.title,
        markdown: markdownContent,
        gerada_em: new Date().toISOString(),
        status: 'disponível'
      }
    ]
  };
  
  await prisma.strategicPlanning.update({
    where: { id: activePlanning.id },
    data: {
      formDataJSON: updatedContext,
      updatedAt: new Date()
    }
  });
}
```

---

## 📁 FASE 7: ARMAZENAMENTO DE SUCESSOS
**Objetivo**: Salvar propostas bem-sucedidas para referência

### 7.1 Salvamento em /concluido
```typescript
async function saveToCompletedDirectory(proposalId: string, markdownContent: string) {
  try {
    const proposal = await prisma.commercialProposal.findUnique({
      where: { id: proposalId },
      include: { Client: true, User: true }
    });
    
    if (!proposal) return;
    
    const fileName = `proposta-${proposalId}-${proposal.Client.name.replace(/[^a-zA-Z0-9]/g, '-')}.md`;
    const filePath = path.join(process.cwd(), '.ai-guards', 'propostas', 'concluido', fileName);
    
    const fileContent = `---
id: ${proposal.id}
title: ${proposal.title}
client: ${proposal.Client.name}
user: ${proposal.User.email}
created_at: ${proposal.createdAt.toISOString()}
completed_at: ${new Date().toISOString()}
status: completed
---

${markdownContent}
`;
    
    await fs.writeFile(filePath, fileContent, 'utf8');
    console.log('📁 Proposta salva em /concluido:', fileName);
    
  } catch (error) {
    console.error('❌ Erro ao salvar em /concluido:', error);
  }
}
```

---

## 🎯 RESUMO DA SEQUÊNCIA

### ✅ Fluxo de Sucesso Completo:
1. **Validação** (100ms) → **Salvamento** (300ms) → **Resposta ao usuário** (100ms)
2. **Webhook assíncrono** (3-30s) → **Processamento IA** → **Atualização banco**
3. **Integração planejamento** → **Salvamento /concluido**

### ⏱️ Timeline do Usuário:
- **0-500ms**: Validação e salvamento
- **500ms**: Redirecionamento para página da proposta
- **1-30s**: Processamento em background (usuário já pode usar o sistema)

### 🔒 Garantias de Integridade:
- **Dados sempre salvos**: Mesmo se webhook falhar, dados do formulário ficam preservados
- **Não bloqueante**: Webhook não impede fluxo do usuário
- **Recuperável**: Erros de webhook podem ser reprocessados manualmente
- **Auditável**: Todos os passos são logados e rastreáveis

### 🚨 Pontos Críticos:
1. **Validação completa** antes de qualquer processamento
2. **Salvamento prioritário** no banco antes do webhook
3. **Webhook assíncrono** para não bloquear usuário
4. **Tratamento robusto de erros** em cada etapa
5. **Feedback imediato** independente do processamento externo 