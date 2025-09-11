import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma/client'
import { 
  getBaseUrl, 
  getEnvironment, 
  getDefaultUserStatus, 
  isApprovalRequired,
  logApprovalAction,
  debugEnvironmentConfig,
  APPROVAL_STATUS 
} from '@/utils/approval-system'
import { clerkClient } from '@clerk/nextjs/server'
// 🆕 PLAN-025: Importar função de verificação automática
import { checkAutoApproval } from '@/utils/auto-approval-webhook'
// 🆕 PLAN-028: Importar retry mechanisms
import { withDatabaseRetry } from '@/utils/retry-mechanism'
// 🆕 FASE 2: Import plan assignment functions
import { assignDefaultPlan, upgradePlanOnApproval } from '@/utils/plan-assignment'

// 🆕 PLAN-025: Função para detectar tipo de cadastro
function getSignupType(data: ClerkWebhookEvent['data']) {
  if (data.external_accounts && data.external_accounts.length > 0) {
    const provider = data.external_accounts[0].provider
    return { type: 'oauth', provider }
  } else if (data.password_enabled) {
    return { type: 'email_password' }
  } else {
    return { type: 'unknown' }
  }
}

type ClerkWebhookEvent = {
  type: string
  data: {
    id: string
    email_addresses: Array<{
      email_address: string
      id: string
    }>
    first_name?: string
    last_name?: string
    image_url?: string
    public_metadata?: {
      approvalStatus?: string
      dbUserId?: string
      role?: string
    }
    private_metadata?: any
    // 🆕 PLAN-025: Incluir external_accounts para detectar tipo de cadastro
    external_accounts?: Array<{
      id: string
      provider: string
      email_address?: string
      verification?: {
        status: string
        strategy: string
      }
    }>
    password_enabled?: boolean
    username?: string
  }
}

export async function POST(req: NextRequest) {
  // 🚨 DEBUG: Log de entrada do webhook
  console.log(`[WEBHOOK_DEBUG] 🎯 Webhook recebido em: ${new Date().toISOString()}`)
  console.log(`[WEBHOOK_DEBUG] 📍 URL: ${req.url}`)
  console.log(`[WEBHOOK_DEBUG] 🔗 Method: ${req.method}`)
  
  // 🆕 PHASE 3: Debug de configuração de ambiente
  if (process.env.NODE_ENV === 'development') {
    debugEnvironmentConfig()
  }

  // Verificar se o webhook secret está configurado
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env')
  }

  // Obter headers usando NextRequest
  const svix_id = req.headers.get('svix-id')
  const svix_timestamp = req.headers.get('svix-timestamp')
  const svix_signature = req.headers.get('svix-signature')

  // Se não há headers, erro
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Obter o body
  const payload = await req.text()
  console.log(`[WEBHOOK_DEBUG] 📦 Payload recebido (${payload.length} chars)`)
  
  const body = JSON.parse(payload)
  console.log(`[WEBHOOK_DEBUG] 🔍 Evento tipo: ${body.type}`)
  console.log(`[WEBHOOK_DEBUG] 👤 User ID: ${body.data?.id}`)

  // Criar nova instância do Svix com o secret
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: ClerkWebhookEvent

  // Verificar o payload com os headers
  try {
    console.log(`[WEBHOOK_DEBUG] 🔐 Verificando assinatura...`)
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkWebhookEvent
    console.log(`[WEBHOOK_DEBUG] ✅ Assinatura verificada com sucesso`)
  } catch (err) {
    console.error('[WEBHOOK_DEBUG] ❌ Erro na verificação da assinatura:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Processar o evento
  const { type, data } = evt

  // 🆕 PHASE 3: Log de eventos para auditoria
  console.log(`[WEBHOOK] ${type} - User: ${data.id} - Environment: ${getEnvironment()}`)

  try {
    console.log(`[WEBHOOK_DEBUG] 🚀 Processando evento: ${type}`)
    switch (type) {
      case 'user.created':
        console.log(`[WEBHOOK_DEBUG] 👤 Iniciando handleUserCreated para: ${data.id}`)
        await handleUserCreated(data)
        console.log(`[WEBHOOK_DEBUG] ✅ handleUserCreated concluído para: ${data.id}`)
        break
      case 'user.updated':
        await handleUserUpdated(data)
        break
      case 'user.deleted':
        await handleUserDeleted(data)
        break
      default:
        console.log(`Unhandled webhook event type: ${type}`)
    }

    console.log(`[WEBHOOK_DEBUG] ✅ Webhook processado com sucesso: ${type}`)
    return NextResponse.json({ 
      message: 'Webhook processed successfully',
      type: type,
      userId: data.id,
      environment: getEnvironment(),
      baseUrl: getBaseUrl()
    })
  } catch (error) {
    console.error('[WEBHOOK_DEBUG] ❌ ERRO CRÍTICO no processamento:', error)
    console.error('[WEBHOOK_DEBUG] 📊 Stack trace:', error instanceof Error ? error.stack : 'Stack não disponível')
    console.error('[WEBHOOK_DEBUG] 📋 Evento tipo:', type)
    console.error('[WEBHOOK_DEBUG] 👤 User ID:', data.id)
    return new Response('Error processing webhook', { status: 500 })
  }
}

// 🆕 PHASE 3: Função atualizada para sistema de aprovação e sincronização de convites
async function handleUserCreated(data: ClerkWebhookEvent['data']) {
  const primaryEmail = data.email_addresses.find(email => email.id === data.email_addresses[0]?.id)
  
  if (!primaryEmail) {
    throw new Error('No primary email found for user')
  }

  console.log(`[USER_CREATED] 🔄 Processando usuário: ${primaryEmail.email_address} (ID: ${data.id})`)

  // 🔒 SINCRONIZAÇÃO SEGURA E INDIVIDUAL
  // Usar a função segura de sincronização que já tem todas as proteções
  try {
    const { syncUserWithDatabase } = await import('@/lib/auth/user-sync')
    const userId = await syncUserWithDatabase(data.id)
    
    if (userId) {
      console.log(`[USER_CREATED] ✅ Usuário sincronizado com sucesso via função segura: ${userId}`)
      return // Função segura já fez todo o trabalho necessário
    } else {
      console.log(`[USER_CREATED] ⚠️ Sincronização segura retornou null, continuando com criação normal`)
    }
  } catch (syncError: any) {
    // Se foi bloqueio de massa, não continuar
    if (syncError.message?.includes('MASS_SYNC_BLOCKED')) {
      console.error(`[USER_CREATED] 🚨 BLOQUEIO DE SEGURANÇA: ${syncError.message}`)
      throw new Error('USER_CREATION_BLOCKED: Sincronização em massa detectada e bloqueada')
    }
    
    console.error(`[USER_CREATED] ⚠️ Erro na sincronização segura, continuando com lógica de fallback: ${syncError.message}`)
  }

  // 🔍 FALLBACK: Verificação manual se a sincronização segura falhou
  const existingUser = await prisma.user.findFirst({
    where: { email: primaryEmail.email_address },
    select: { 
      id: true, 
      clerkId: true, 
      approvalStatus: true,
      _count: {
        select: {
          Client: true,
          StrategicPlanning: true,
          CommercialProposal: true
        }
      }
    }
  })

  if (existingUser && existingUser.clerkId !== data.id) {
    console.log(`[USER_CREATED] 🎯 FALLBACK - Usuário existente detectado:`)
    console.log(`[USER_CREATED] 👤 ID: ${existingUser.id}, Dados: ${existingUser._count.Client} clientes, ${existingUser._count.StrategicPlanning} planejamentos`)
    console.log(`[USER_CREATED] ⚠️ ATENÇÃO: Sincronização segura falhou, mas usuário existe. Possível problema no sistema.`)
    
    // Não fazer nada aqui - deixar para o administrador resolver manualmente
    // para evitar corrupção de dados
    return
  }

  // 🆕 PLAN-025: Detectar e logar tipo de cadastro
  const signupType = getSignupType(data)
  console.log(`[USER_CREATED] 📝 Tipo de cadastro: ${signupType.type}${signupType.provider ? ` (${signupType.provider})` : ''} para email: ${primaryEmail.email_address}`)

  // 🛡️ PRESERVAR: Lógica existente de determinação de status
  let initialStatus = isApprovalRequired() ? getDefaultUserStatus() : APPROVAL_STATUS.APPROVED
  let autoApprovalData: any = null

  // 🆕 PLAN-025: Verificação automática VIA WEBHOOK (apenas se seria PENDING)
  if (initialStatus === APPROVAL_STATUS.PENDING) {
    console.log(`[WEBHOOK_AUTO_APPROVAL] 🔍 Verificando aprovação automática para: ${primaryEmail.email_address}`)
    
    try {
      const autoCheck = await checkAutoApproval(primaryEmail.email_address)
      
      if (autoCheck.shouldApprove) {
        initialStatus = APPROVAL_STATUS.APPROVED
        autoApprovalData = autoCheck.webhookData
        console.log(`[WEBHOOK_AUTO_APPROVAL] ✅ Usuário pré-aprovado: ${primaryEmail.email_address}`)
      } else {
        console.log(`[WEBHOOK_AUTO_APPROVAL] ❌ Usuário não pré-aprovado: ${primaryEmail.email_address}`)
        if (autoCheck.error) {
          console.log(`[WEBHOOK_AUTO_APPROVAL] Erro: ${autoCheck.error}`)
        }
      }
    } catch (webhookError) {
      // 🛡️ CRÍTICO: Nunca falhar por causa do webhook
      console.error('[WEBHOOK_AUTO_APPROVAL] ⚠️ Verificação de webhook falhou, continuando com fluxo normal:', webhookError)
      // initialStatus permanece PENDING
    }
  }
  
  console.log(`[USER_CREATED] 🆕 Criando novo usuário com status: ${initialStatus}`)

  // 🆕 PLAN-028: OPERAÇÃO CRÍTICA COM RETRY
  const user = await withDatabaseRetry(async () => {
    return await prisma.user.create({
      data: {
        clerkId: data.id,
        email: primaryEmail.email_address,
        firstName: data.first_name || null,
        lastName: data.last_name || null,
        profileImageUrl: data.image_url || null,
        // 🆕 PHASE 3: Sistema de aprovação
        approvalStatus: initialStatus,
        creditBalance: initialStatus === APPROVAL_STATUS.APPROVED ? 100 : 0, // Créditos só para aprovados
        version: 0,
        updatedAt: new Date(),
        // 🆕 PLAN-025: Se aprovado automaticamente, registrar
        ...(autoApprovalData && {
          approvedAt: new Date(),
          approvedBy: 'SYSTEM_AUTO_WEBHOOK'
        })
      },
    })
  }, 'user creation')

  // 🆕 PHASE 3: Sincronizar metadata no Clerk
  try {
    await clerkClient.users.updateUserMetadata(data.id, {
      publicMetadata: {
        approvalStatus: initialStatus,
        dbUserId: user.id,
        role: 'USER',
        createdViaWebhook: true,
        createdAt: new Date().toISOString()
      }
    })
    console.log(`[METADATA_SYNC] ✅ Metadados do Clerk atualizados para usuário: ${data.id}`)
  } catch (metadataError) {
    console.error('[METADATA_SYNC] ⚠️ Erro ao atualizar metadados do Clerk:', metadataError)
    // Não falhar o webhook por erro de metadata
  }

  // 🆕 PLAN-028: TRANSAÇÃO DE CRÉDITOS COM RETRY
  if (initialStatus === APPROVAL_STATUS.APPROVED) {
    await withDatabaseRetry(async () => {
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
    }, 'credit transaction creation')
    console.log(`[CREDITS] ✅ Créditos iniciais concedidos ao usuário aprovado: ${user.id}`)
  } else {
    console.log(`[CREDITS] ⏸️ Créditos retidos - usuário pendente de aprovação: ${user.id}`)
  }

  // 🆕 PLAN-025: Log de moderação para aprovação automática
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
      })
    } catch (logError) {
      // 🛡️ Log não deve falhar o processo principal
      console.error('[WEBHOOK_AUTO_APPROVAL] ⚠️ Falha ao criar log de moderação:', logError)
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
      signupType: signupType.type,
      ...(signupType.provider && { signupProvider: signupType.provider }),
      ...(autoApprovalData && { webhookData: autoApprovalData })
    }
  })

  // 🆕 FASE 2: Atribuição automática de plano APÓS verificação de aprovação
  if (user.id && initialStatus) {
    try {
      const planResult = await assignDefaultPlan(user.id, initialStatus, 'USER')
      if (planResult.success) {
        console.log(`[WEBHOOK_PLAN_ASSIGNMENT] ✅ Plano atribuído: ${user.id} → ${initialStatus} → ${planResult.planName}`)
      } else {
        console.error(`[WEBHOOK_PLAN_ASSIGNMENT] ❌ Erro na atribuição: ${user.id} → ${planResult.error}`)
      }
    } catch (error: any) {
      console.error(`[WEBHOOK_PLAN_ASSIGNMENT] ❌ Erro na atribuição de plano:`, error)
      // Não falhar o webhook por erro de plano
    }
  }

  console.log(`[USER_CREATED] ✅ Usuário criado com sucesso: ${data.id} (${initialStatus})`)
}

// 🆕 PHASE 3: Função atualizada para sincronização de metadata
async function handleUserUpdated(data: ClerkWebhookEvent['data']) {
  const primaryEmail = data.email_addresses.find(email => email.id === data.email_addresses[0]?.id)
  
  if (!primaryEmail) {
    throw new Error('No primary email found for user')
  }

  // 🆕 PHASE 3: Verificar se há mudanças no status de aprovação no metadata
  const newApprovalStatus = data.public_metadata?.approvalStatus
  let shouldUpdateCredits = false

  try {
    // Buscar usuário atual
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: data.id },
    })

    if (!currentUser) {
      console.error(`User not found in database: ${data.id}`)
      return
    }

    // Preparar dados para atualização
    const updateData: any = {
      email: primaryEmail.email_address,
      firstName: data.first_name || null,
      lastName: data.last_name || null,
      profileImageUrl: data.image_url || null,
    }

    // 🆕 PHASE 3: Sincronizar status de aprovação se mudou
    if (newApprovalStatus && newApprovalStatus !== currentUser.approvalStatus) {
      console.log(`[APPROVAL_SYNC] Status change detected: ${currentUser.approvalStatus} -> ${newApprovalStatus}`)
      
      updateData.approvalStatus = newApprovalStatus
      updateData.version = currentUser.version + 1 // Optimistic concurrency control
      
      // Se aprovado pela primeira vez, liberar créditos
      if (newApprovalStatus === APPROVAL_STATUS.APPROVED && currentUser.creditBalance === 0) {
        updateData.creditBalance = 100
        shouldUpdateCredits = true
      }
      
      // Se rejeitado/suspenso, zerar créditos
      if ([APPROVAL_STATUS.REJECTED, APPROVAL_STATUS.SUSPENDED].includes(newApprovalStatus as any)) {
        updateData.creditBalance = 0
      }
    }

    // Atualizar usuário no banco
    const updatedUser = await prisma.user.update({
      where: { clerkId: data.id },
      data: updateData,
    })

    // 🆕 PHASE 3: Criar transação de créditos se necessário
    if (shouldUpdateCredits) {
      await prisma.creditTransaction.create({
        data: {
          userId: updatedUser.id,
          amount: 100,
          type: 'INITIAL_GRANT',
          description: 'Créditos liberados após aprovação',
        },
      })
      console.log(`[CREDITS] Credits granted after approval: ${updatedUser.id}`)
    }

    // 🆕 PHASE 3: Log de auditoria para mudanças de status
    if (newApprovalStatus && newApprovalStatus !== currentUser.approvalStatus) {
      logApprovalAction({
        action: 'STATUS_SYNCED',
        userId: updatedUser.id,
        moderatorId: 'SYSTEM',
        environment: getEnvironment(),
        timestamp: new Date(),
        metadata: {
          clerkId: data.id,
          previousStatus: currentUser.approvalStatus,
          newStatus: newApprovalStatus,
          creditsGranted: shouldUpdateCredits
        }
      })

      // Upgrade plan when status changes to APPROVED
      if (newApprovalStatus === APPROVAL_STATUS.APPROVED && currentUser.approvalStatus === 'PENDING') {
        try {
          const planResult = await upgradePlanOnApproval(updatedUser.id);
          if (planResult.success) {
            console.log(`[WEBHOOK_USER_UPDATE_PLAN] ✅ Plan upgraded after approval: ${updatedUser.id} → ${planResult.planName}`);
          } else {
            console.error(`[WEBHOOK_USER_UPDATE_PLAN] ❌ Plan upgrade failed: ${planResult.error}`);
          }
        } catch (planError: any) {
          console.error(`[WEBHOOK_USER_UPDATE_PLAN] ❌ Plan upgrade error (non-blocking):`, planError);
          // Don't fail webhook due to plan error
        }
      }
    }

    console.log(`[USER_UPDATED] User updated successfully: ${data.id}`)

  } catch (error) {
    console.error(`[USER_UPDATE_ERROR] Error updating user ${data.id}:`, error)
    throw error
  }
}

async function handleUserDeleted(data: ClerkWebhookEvent['data']) {
  try {
    // Buscar usuário para log antes de deletar
    const user = await prisma.user.findUnique({
      where: { clerkId: data.id },
    })

    if (user) {
      // 🆕 PHASE 3: Log de auditoria antes de deletar
      logApprovalAction({
        action: 'USER_DELETED',
        userId: user.id,
        moderatorId: 'SYSTEM',
        environment: getEnvironment(),
        timestamp: new Date(),
        metadata: {
          clerkId: data.id,
          email: user.email,
          approvalStatus: user.approvalStatus
        }
      })
    }

    // Deletar usuário do banco (cascade delete irá remover dados relacionados)
    await prisma.user.delete({
      where: { clerkId: data.id },
    })

    console.log(`[USER_DELETED] User deleted successfully: ${data.id}`)
  } catch (error) {
    console.error(`[USER_DELETE_ERROR] Error deleting user ${data.id}:`, error)
    throw error
  }
}

