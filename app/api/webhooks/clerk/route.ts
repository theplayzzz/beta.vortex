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
  }
}

export async function POST(req: NextRequest) {
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
  const body = JSON.parse(payload)

  // Criar nova instância do Svix com o secret
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: ClerkWebhookEvent

  // Verificar o payload com os headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkWebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Processar o evento
  const { type, data } = evt

  // 🆕 PHASE 3: Log de eventos para auditoria
  console.log(`[WEBHOOK] ${type} - User: ${data.id} - Environment: ${getEnvironment()}`)

  try {
    switch (type) {
      case 'user.created':
        await handleUserCreated(data)
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

    return NextResponse.json({ 
      message: 'Webhook processed successfully',
      environment: getEnvironment(),
      baseUrl: getBaseUrl()
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response('Error processing webhook', { status: 500 })
  }
}

// 🆕 PHASE 3: Função atualizada para sistema de aprovação
async function handleUserCreated(data: ClerkWebhookEvent['data']) {
  const primaryEmail = data.email_addresses.find(email => email.id === data.email_addresses[0]?.id)
  
  if (!primaryEmail) {
    throw new Error('No primary email found for user')
  }

  // 🆕 Determinar status inicial baseado na configuração
  const initialStatus = isApprovalRequired() ? getDefaultUserStatus() : APPROVAL_STATUS.APPROVED
  
  console.log(`[USER_CREATED] Creating user with status: ${initialStatus}`)

  // Criar usuário no banco com status de aprovação
  const user = await prisma.user.create({
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
    },
  })

  // 🆕 PHASE 3: Sincronizar metadata no Clerk
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

  // 🆕 PHASE 3: Criar transação de crédito apenas para usuários aprovados
  if (initialStatus === APPROVAL_STATUS.APPROVED) {
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: 100,
        type: 'INITIAL_GRANT',
        description: 'Créditos iniciais de boas-vindas',
      },
    })
    console.log(`[CREDITS] Initial credits granted to approved user: ${user.id}`)
  } else {
    console.log(`[CREDITS] Credits withheld - user pending approval: ${user.id}`)
  }

  // 🆕 PHASE 3: Log de auditoria
  logApprovalAction({
    action: 'USER_CREATED',
    userId: user.id,
    moderatorId: 'SYSTEM',
    environment: getEnvironment(),
    timestamp: new Date(),
    metadata: {
      clerkId: data.id,
      email: primaryEmail.email_address,
      initialStatus,
      approvalRequired: isApprovalRequired()
    }
  })

  console.log(`[USER_CREATED] User created successfully: ${data.id} (${initialStatus})`)
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

