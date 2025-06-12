---
id: plan-025
title: Sistema de Aprovação Automática via Webhook
createdAt: 2025-06-12
author: theplayzzz
status: draft
---

## 🧩 Scope

Implementar um sistema de aprovação automática de usuários através de webhook externo. Quando um usuário se registra, o sistema deve consultar um serviço externo para verificar se o usuário já foi pré-aprovado baseado no seu email. Se aprovado, o status deve ser atualizado automaticamente para "APPROVED" sem necessidade de intervenção manual de um admin.

Adicionalmente, toda vez que um usuário não aprovado fizer logout/login, uma nova verificação deve ser feita para garantir que usuários recém-aprovados externamente sejam automaticamente aprovados no sistema.

**⚠️ PRINCÍPIO FUNDAMENTAL: Esta implementação é ADITIVA - não deve quebrar nenhuma funcionalidade existente.**

## ✅ Functional Requirements

- Disparar webhook para APROVACAO_WEBHOOK_URL assim que um usuário se registrar
- O webhook deve enviar o email do usuário para verificação
- Processar resposta do webhook conforme critérios definidos nos testes
- Se webhook retornar erro 500 ou não contém "email contato", seguir fluxo normal de aprovação manual
- Se webhook retornar status 200 com campo "email contato", atualizar automaticamente o status do usuário para "APPROVED"
- Registrar no histórico de aprovação (UserModerationLog) quando aprovação for automática
- Implementar verificação automática no login/logout para usuários PENDING
- Manter compatibilidade com o fluxo de aprovação manual existente
- Nunca expor a URL do webhook diretamente no código
- **🛡️ GARANTIR que falhas no webhook não impeçam criação de usuários**

## ⚙️ Non-Functional Requirements

- Performance: Webhook deve ter timeout de 5 segundos máximo
- Security: URL do webhook deve vir sempre de variável de ambiente
- Reliability: Sistema deve funcionar mesmo se webhook estiver indisponível
- Logging: Registrar todas as tentativas de aprovação automática para auditoria
- Concurrency: Usar optimistic locking (campo version) para atualizações de status
- **🛡️ Backward Compatibility: Não quebrar funcionalidades existentes**

## 📚 Guidelines & Packages

- Usar a estrutura existente de webhooks do Clerk
- Manter consistência com o sistema de aprovação atual
- Usar variável de ambiente APROVACAO_WEBHOOK_URL do arquivo .env existente
- Implementar usando TypeScript e Next.js
- Usar Prisma para operações de banco de dados
- Seguir padrão de logging existente com prefixos [WEBHOOK_AUTO_APPROVAL]
- **🛡️ Preservar toda lógica existente de handleUserCreated**

## 🔐 Threat Model (Stub)

- URL do webhook nunca deve ser hardcoded no código
- Validação de integridade das respostas do webhook externo
- Prevenção contra ataques de timing
- Proteção contra manipulação de status de aprovação
- Logging adequado para auditoria de segurança

## 🛡️ **ANÁLISE DE COMPATIBILIDADE COM SISTEMA EXISTENTE**

### **✅ O que NÃO será alterado (Sistema atual funcionando):**

1. **handleUserCreated existente** - apenas adicionaremos verificação ANTES da criação
2. **handleUserUpdated** - permanece intacto
3. **handleUserDeleted** - permanece intacto  
4. **Sistema de moderação manual** - continua funcionando normalmente
5. **UserModerationLog** - apenas adicionaremos novos registros
6. **Créditos e transações** - lógica existente preservada
7. **Sincronização com Clerk** - mantida como está
8. **RLS e políticas de segurança** - não afetadas
9. **Interface de admin** - continua funcionando
10. **APIs existentes** - nenhuma alteração

### **✅ Modificações ADITIVAS apenas:**

1. **Adicionar função de verificação webhook** (novo arquivo)
2. **Adicionar verificação no início do handleUserCreated** (antes da criação do usuário)
3. **Adicionar verificação no login** (novo middleware/hook)
4. **Adicionar logs específicos** para aprovação automática
5. **Adicionar endpoint opcional** para verificação manual

### **🚨 Pontos Críticos de Atenção:**

1. **Timeout do webhook**: Se o webhook demorar >5s, deve seguir fluxo normal
2. **Falha na requisição**: Não deve impedir criação do usuário
3. **Error handling**: Todos os erros devem ser tratados sem quebrar o fluxo
4. **Logs**: Não devem interferir nos logs existentes
5. **Performance**: Verificação não deve tornar o registro lento

## 📊 Resultados dos Testes do Webhook

### **Teste 1 - Email NÃO na lista** (`ferramentas2@gruporugido.com`):
- **Status Code**: `500` ❌
- **Resposta**: 
```json
{
  "code": 0,
  "message": "No item to return got found"
}
```
- **Interpretação**: Usuário NÃO encontrado na lista de pré-aprovados

### **Teste 2 - Email NA lista** (`ferramentas@gruporugido.com`):
- **Status Code**: `200` ✅
- **Resposta**:
```json
{
  "row_number": 101,
  "nome contato": "",
  "email contato": "ferramentas@gruporugido.com",
  "telefone contato": "",
  "Comprovante": ""
}
```
- **Interpretação**: Usuário ENCONTRADO na lista de pré-aprovados (linha 101)

### **Critérios de Aprovação Automática:**
```javascript
// Lógica para determinar aprovação automática
function shouldAutoApprove(webhookResponse, statusCode) {
  // Se status 200 e resposta contém "email contato" = APROVAR
  if (statusCode === 200 && webhookResponse["email contato"]) {
    return true;
  }
  
  // Se status 500 ou não contém "email contato" = NÃO APROVAR
  return false;
}
```

## 🔍 Análise do Sistema Atual de Aprovação

### **Estrutura do Banco de Dados:**

**Tabela User:**
- `approvalStatus: ApprovalStatus @default(PENDING)` - Status atual do usuário
- `approvedAt: DateTime?` - Timestamp da aprovação
- `approvedBy: String?` - clerkId do admin que aprovou
- `rejectedAt: DateTime?` - Timestamp da rejeição
- `rejectedBy: String?` - clerkId do admin que rejeitou
- `rejectionReason: String?` - Motivo da rejeição
- `version: Int @default(0)` - Controle de concorrência otimista

**Tabela UserModerationLog (Histórico de Aprovação):**
- `userId: String` - ID do usuário moderado
- `moderatorId: String` - ID do moderador (será "SYSTEM" para aprovações automáticas)
- `action: ModerationAction` - Tipo da ação (APPROVE, REJECT, etc.)
- `previousStatus: ApprovalStatus` - Status anterior
- `newStatus: ApprovalStatus` - Novo status
- `reason: String?` - Motivo da ação
- `metadata: Json?` - Dados adicionais (será usado para marcar aprovações automáticas)
- `createdAt: DateTime` - Timestamp da ação

**Enums:**
```prisma
enum ApprovalStatus {
  PENDING, APPROVED, REJECTED, SUSPENDED
}

enum ModerationAction {
  APPROVE, REJECT, SUSPEND, UNSUSPEND, 
  RESET_TO_PENDING, UNSUSPEND_TO_APPROVED, 
  UNSUSPEND_TO_PENDING
}
```

## 🔢 Execution Plan

### **1. Criar função de verificação via webhook (NOVO ARQUIVO)**
```typescript
// utils/auto-approval-webhook.ts
interface WebhookResponse {
  "row_number"?: number;
  "nome contato"?: string;
  "email contato"?: string;
  "telefone contato"?: string;
  "Comprovante"?: string;
}

async function checkAutoApproval(email: string): Promise<{
  shouldApprove: boolean;
  webhookData?: WebhookResponse;
  error?: string;
}> {
  // 🛡️ SEGURANÇA: Se URL não configurada, seguir fluxo normal
  const webhookUrl = process.env.APROVACAO_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('[WEBHOOK_AUTO_APPROVAL] URL not configured, skipping auto approval');
    return { shouldApprove: false, error: 'APROVACAO_WEBHOOK_URL not configured' };
  }

  const payload = {
    event: "new_user_registered",
    data: {
      id: Math.floor(Math.random() * 1000),
      username: email,
      name: "Auto Check",
      email: email,
      aprovacao: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resetToken: null,
      resetTokenExpiry: null
    }
  };

  try {
    // 🛡️ TIMEOUT: 5 segundos máximo para não travar o sistema
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'vortex-auto-approval',
        'Accept': '*/*'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // 🛡️ TRATAMENTO: Não falhar se response não for JSON
    let data: any = {};
    try {
      data = await response.json();
    } catch (parseError) {
      console.log('[WEBHOOK_AUTO_APPROVAL] Response is not valid JSON, treating as not approved');
      return { shouldApprove: false, error: 'Invalid JSON response' };
    }

    // Critério: Status 200 + campo "email contato" presente
    const shouldApprove = response.status === 200 && data["email contato"];

    console.log(`[WEBHOOK_AUTO_APPROVAL] Status: ${response.status}, Should approve: ${shouldApprove}`);

    return {
      shouldApprove,
      webhookData: shouldApprove ? data : undefined
    };

  } catch (error) {
    // 🛡️ FALLBACK: Qualquer erro deve permitir que o usuário seja criado normalmente
    console.log('[WEBHOOK_AUTO_APPROVAL] Error checking auto approval (fallback to manual):', error);
    return { shouldApprove: false, error: (error as Error).message };
  }
}

export { checkAutoApproval, type WebhookResponse };
```

### **2. Modificar handleUserCreated (ADITIVO - não remove nada)**
```typescript
// app/api/webhooks/clerk/route.ts
// Importar a nova função
import { checkAutoApproval } from '@/utils/auto-approval-webhook';

async function handleUserCreated(data: ClerkWebhookEvent['data']) {
  const primaryEmail = data.email_addresses.find(email => email.id === data.email_addresses[0]?.id);
  
  if (!primaryEmail) {
    throw new Error('No primary email found for user');
  }

  // 🛡️ PRESERVAR: Lógica existente de determinação de status
  let initialStatus = isApprovalRequired() ? getDefaultUserStatus() : APPROVAL_STATUS.APPROVED;
  let autoApprovalData: any = null;

  // 🆕 ADICIONAR: Verificação automática VIA WEBHOOK (apenas se seria PENDING)
  if (initialStatus === APPROVAL_STATUS.PENDING) {
    console.log(`[WEBHOOK_AUTO_APPROVAL] Checking auto approval for: ${primaryEmail.email_address}`);
    
    try {
      const autoCheck = await checkAutoApproval(primaryEmail.email_address);
      
      if (autoCheck.shouldApprove) {
        initialStatus = APPROVAL_STATUS.APPROVED;
        autoApprovalData = autoCheck.webhookData;
        console.log(`[WEBHOOK_AUTO_APPROVAL] User pre-approved: ${primaryEmail.email_address}`);
      } else {
        console.log(`[WEBHOOK_AUTO_APPROVAL] User not pre-approved: ${primaryEmail.email_address}`);
        if (autoCheck.error) {
          console.log(`[WEBHOOK_AUTO_APPROVAL] Error: ${autoCheck.error}`);
        }
      }
    } catch (webhookError) {
      // 🛡️ CRÍTICO: Nunca falhar por causa do webhook
      console.error('[WEBHOOK_AUTO_APPROVAL] Webhook check failed, proceeding with normal flow:', webhookError);
      // initialStatus permanece PENDING
    }
  }

  console.log(`[USER_CREATED] Creating user with status: ${initialStatus}`);

  // 🛡️ PRESERVAR: Toda lógica existente de criação de usuário
  const user = await prisma.user.create({
    data: {
      clerkId: data.id,
      email: primaryEmail.email_address,
      firstName: data.first_name || null,
      lastName: data.last_name || null,
      profileImageUrl: data.image_url || null,
      approvalStatus: initialStatus,
      creditBalance: initialStatus === APPROVAL_STATUS.APPROVED ? 100 : 0,
      version: 0,
      updatedAt: new Date(),
      // 🆕 ADICIONAR: Se aprovado automaticamente, registrar
      ...(autoApprovalData && {
        approvedAt: new Date(),
        approvedBy: 'SYSTEM_AUTO_WEBHOOK'
      })
    },
  });

  // 🛡️ PRESERVAR: Lógica existente de sincronização com Clerk
  try {
    await clerkClient.users.updateUserMetadata(data.id, {
      publicMetadata: {
        approvalStatus: initialStatus,
        dbUserId: user.id,
        role: 'USER'
      }
    })
    console.log(`[METADATA_SYNC] Clerk metadata updated for user: ${data.id}`)
  } catch (metadataError) {
    console.error('Error updating Clerk metadata:', metadataError)
    // Não falhar o webhook por erro de metadata
  }

  // 🛡️ PRESERVAR: Lógica existente de créditos
  if (initialStatus === APPROVAL_STATUS.APPROVED) {
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: 100,
        type: 'INITIAL_GRANT',
        description: autoApprovalData ? 
          'Créditos iniciais - aprovação automática via webhook' : 
          'Créditos iniciais de boas-vindas',
      },
    })
    console.log(`[CREDITS] Initial credits granted to approved user: ${user.id}`)
  } else {
    console.log(`[CREDITS] Credits withheld - user pending approval: ${user.id}`)
  }

  // 🆕 ADICIONAR: Log de moderação para aprovação automática
  if (autoApprovalData) {
    try {
      await prisma.userModerationLog.create({
        data: {
          userId: user.id,
          moderatorId: user.id, // Sistema como moderador
          action: 'APPROVE',
          previousStatus: 'PENDING',
          newStatus: 'APPROVED',
          reason: 'Aprovação automática via webhook externo',
          metadata: {
            autoApproval: true,
            webhookResponse: autoApprovalData,
            environment: getEnvironment(),
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (logError) {
      // 🛡️ Log não deve falhar o processo principal
      console.error('[WEBHOOK_AUTO_APPROVAL] Failed to create moderation log:', logError);
    }
  }

  // 🛡️ PRESERVAR: Log de auditoria existente (com extensão)
  logApprovalAction({
    action: autoApprovalData ? 'USER_AUTO_APPROVED' : 'USER_CREATED',
    userId: user.id,
    moderatorId: autoApprovalData ? 'SYSTEM_AUTO_WEBHOOK' : 'SYSTEM',
    environment: getEnvironment(),
    timestamp: new Date(),
    metadata: {
      clerkId: data.id,
      email: primaryEmail.email_address,
      initialStatus,
      approvalRequired: isApprovalRequired(),
      autoApproval: !!autoApprovalData,
      ...(autoApprovalData && { webhookData: autoApprovalData })
    }
  });

  console.log(`[USER_CREATED] User created successfully: ${data.id} (${initialStatus})`);
}

// 🛡️ PRESERVAR: handleUserUpdated e handleUserDeleted permanecem INTACTOS
```

### **3. Implementar verificação no login (NOVO - não interfere no existente)**
```typescript
// utils/login-auto-approval-check.ts
import { checkAutoApproval } from './auto-approval-webhook';
import { prisma } from '@/lib/prisma/client';
import { clerkClient } from '@clerk/nextjs/server';

export async function checkPendingUserAutoApproval(clerkId: string): Promise<void> {
  try {
    // 🛡️ SEGURANÇA: Verificar se usuário existe e está PENDING
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { 
        id: true, 
        email: true, 
        approvalStatus: true, 
        version: true 
      }
    });

    if (!user || user.approvalStatus !== 'PENDING') {
      // Não é pendente, não precisa verificar
      return;
    }

    console.log(`[LOGIN_AUTO_APPROVAL] Checking auto approval for pending user: ${user.email}`);

    const autoCheck = await checkAutoApproval(user.email);

    if (autoCheck.shouldApprove) {
      console.log(`[LOGIN_AUTO_APPROVAL] User approved during login check: ${user.email}`);
      
      // 🛡️ TRANSAÇÃO: Usar optimistic locking
      try {
        const updatedUser = await prisma.user.update({
          where: { 
            id: user.id,
            version: user.version // Optimistic locking
          },
          data: {
            approvalStatus: 'APPROVED',
            approvedAt: new Date(),
            approvedBy: 'SYSTEM_AUTO_WEBHOOK',
            creditBalance: 100,
            version: user.version + 1
          }
        });

        // Criar transação de créditos
        await prisma.creditTransaction.create({
          data: {
            userId: user.id,
            amount: 100,
            type: 'INITIAL_GRANT',
            description: 'Créditos liberados após aprovação automática no login'
          }
        });

        // Log de moderação
        await prisma.userModerationLog.create({
          data: {
            userId: user.id,
            moderatorId: user.id,
            action: 'APPROVE',
            previousStatus: 'PENDING',
            newStatus: 'APPROVED',
            reason: 'Aprovação automática via webhook no login',
            metadata: {
              autoApproval: true,
              triggerEvent: 'LOGIN_CHECK',
              webhookResponse: autoCheck.webhookData,
              timestamp: new Date().toISOString()
            }
          }
        });

        // Sincronizar com Clerk
        await clerkClient.users.updateUserMetadata(clerkId, {
          publicMetadata: {
            approvalStatus: 'APPROVED',
            dbUserId: user.id,
            role: 'USER'
          }
        });

      } catch (updateError) {
        // 🛡️ CONFLITO: Provavelmente outro processo já atualizou
        console.log('[LOGIN_AUTO_APPROVAL] User may have been updated by another process:', updateError);
      }
    } else {
      console.log(`[LOGIN_AUTO_APPROVAL] User still not approved: ${user.email}`);
    }

  } catch (error) {
    // 🛡️ CRÍTICO: Nunca falhar o login por causa da verificação
    console.error('[LOGIN_AUTO_APPROVAL] Error checking auto approval on login (non-blocking):', error);
  }
}
```

### **4. Integrar no middleware (OPCIONAL - não obrigatório)**
```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";
import { checkPendingUserAutoApproval } from '@/utils/login-auto-approval-check';

export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up"],
  afterAuth: async (auth, req) => {
    // 🛡️ CRÍTICO: Não aguardar para não bloquear navegação
    if (auth.userId) {
      // Fire and forget - não bloqueia a requisição
      checkPendingUserAutoApproval(auth.userId).catch(error => {
        console.error('[MIDDLEWARE] Auto approval check failed:', error);
      });
    }
  }
});
```

### **5. Endpoint para verificação manual (OPCIONAL)**
```typescript
// app/api/check-auto-approval/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkPendingUserAutoApproval } from '@/utils/login-auto-approval-check';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 🛡️ NÃO AGUARDAR: Fire and forget
    checkPendingUserAutoApproval(userId).catch(console.error);
    
    return NextResponse.json({ success: true, message: 'Auto approval check initiated' });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to initiate auto approval check' 
    }, { status: 500 });
  }
}
```

### **6. Testes e validação**
- ✅ Testar com email pré-aprovado (deve aprovar automaticamente)
- ✅ Testar com email não aprovado (deve manter PENDING)
- ✅ Testar timeout do webhook (deve manter PENDING)
- ✅ Testar webhook indisponível (deve manter PENDING)
- ✅ Verificar logs no UserModerationLog
- ✅ Testar verificação no login/logout
- ✅ **Validar que fluxo manual continua funcionando EXATAMENTE igual**
- ✅ **Validar que usuários existentes não são afetados**
- ✅ Verificar que URL do webhook não está exposta no código

## 🔧 Considerações de Implementação

### **🛡️ Garantias de Compatibilidade:**
1. **Zero Breaking Changes**: Nenhuma função existente é alterada, apenas estendida
2. **Graceful Degradation**: Se webhook falhar, sistema funciona normalmente
3. **Timeout Protection**: Webhook nunca pode travar o sistema
4. **Error Isolation**: Erros no webhook não afetam funcionalidades existentes
5. **Backward Compatibility**: Usuários existentes não são afetados

### **🔒 Segurança:**
- URL do webhook sempre vem de `process.env.APROVACAO_WEBHOOK_URL`
- Timeout de 5 segundos para evitar travamentos
- Logs detalhados para auditoria
- Uso de optimistic locking para evitar race conditions
- **Nunca falhar o processo principal por causa do webhook**

### **⚡ Performance:**
- Verificação de login não bloqueia a navegação
- Cache de resultados não implementado (decisão de negócio)
- Webhook rápido conforme testes realizados
- **Fire and forget** para verificações não críticas

### **🔄 Confiabilidade:**
- Sistema funciona mesmo se webhook estiver offline
- Fallback sempre para aprovação manual
- Múltiplas oportunidades de verificação (registro + login)
- **Degradação graceful em todos os cenários de erro**

### **📊 Monitoramento:**
- Logs prefixados com `[WEBHOOK_AUTO_APPROVAL]` e `[LOGIN_AUTO_APPROVAL]`
- Registro completo no `UserModerationLog` 
- Metadata JSON com detalhes da resposta do webhook
- Auditoria completa de todas as aprovações automáticas
- **Separação clara entre logs automáticos e manuais**
