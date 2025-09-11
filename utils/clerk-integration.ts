/**
 * 🆕 PHASE 3: Clerk Integration & Environment Utilities
 * Utilitários para integração dinâmica entre Clerk e sistema de aprovação
 */

import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma/client'
import { ApprovalStatus } from '@prisma/client'
import { 
  getBaseUrl, 
  getEnvironment, 
  APPROVAL_STATUS,
  MODERATION_ACTION,
  logApprovalAction 
} from './approval-system'
// 🆕 FASE 2: Import plan assignment function
import { assignDefaultPlan } from './plan-assignment'

// ==========================================
// CONFIGURAÇÃO DINÂMICA DE WEBHOOKS
// ==========================================

/**
 * Retorna a URL do webhook do Clerk baseada no ambiente
 * Detecta automaticamente se está em local, preview ou produção
 */
export function getClerkWebhookUrl(): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/api/webhooks/clerk`
}

/**
 * Configuração de webhooks por ambiente
 */
export function getWebhookConfig() {
  const environment = getEnvironment()
  const webhookUrl = getClerkWebhookUrl()
  
  return {
    environment,
    webhookUrl,
    baseUrl: getBaseUrl(),
    isProduction: environment === 'production',
    isPreview: environment === 'preview',
    isDevelopment: environment === 'development'
  }
}

/**
 * Gera configuração de webhook para o painel do Clerk
 */
export function generateClerkWebhookConfig() {
  const config = getWebhookConfig()
  
  return {
    url: config.webhookUrl,
    description: `Vortex ${config.environment} environment webhook`,
    events: [
      'user.created',
      'user.updated', 
      'user.deleted'
    ],
    headers: {
      'X-Environment': config.environment,
      'X-Base-URL': config.baseUrl
    }
  }
}

// ==========================================
// SINCRONIZAÇÃO DE METADATA CLERK
// ==========================================

/**
 * Sincroniza metadata do Clerk com status de aprovação
 */
export async function syncClerkMetadata(
  clerkId: string,
  approvalStatus: string,
  additionalData: Record<string, any> = {}
): Promise<boolean> {
  try {
    const metadata = {
      approvalStatus,
      lastSyncedAt: new Date().toISOString(),
      environment: getEnvironment(),
      ...additionalData
    }

    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: metadata
    })

    console.log(`[CLERK_SYNC] Metadata updated for user ${clerkId}:`, metadata)
    return true
  } catch (error) {
    console.error(`[CLERK_SYNC_ERROR] Failed to sync metadata for ${clerkId}:`, error)
    return false
  }
}

/**
 * Atualiza status de aprovação no Clerk e banco simultaneamente
 */
export async function updateUserApprovalStatus(
  userId: string,
  newStatus: string,
  moderatorId: string,
  reason?: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const previousStatus = user.approvalStatus

    // Atualizar no banco com optimistic concurrency control
    const updatedUser = await prisma.user.update({
      where: { 
        id: userId,
        version: user.version // Optimistic locking
      },
      data: {
        approvalStatus: newStatus as ApprovalStatus,
        version: user.version + 1,
        ...(newStatus === APPROVAL_STATUS.APPROVED && {
          approvedAt: new Date(),
          approvedBy: moderatorId
        }),
        ...(newStatus === APPROVAL_STATUS.REJECTED && {
          rejectedAt: new Date(),
          rejectedBy: moderatorId,
          rejectionReason: reason
        })
      }
    })

    // Sincronizar com Clerk
    const syncSuccess = await syncClerkMetadata(user.clerkId, newStatus, {
      dbUserId: userId,
      moderatedBy: moderatorId,
      moderatedAt: new Date().toISOString()
    })

    if (!syncSuccess) {
      console.warn(`[APPROVAL_WARNING] Database updated but Clerk sync failed for user ${userId}`)
    }

    // Liberar/remover créditos baseado no status
    if (newStatus === APPROVAL_STATUS.APPROVED && user.creditBalance === 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { creditBalance: 100 }
      })

      await prisma.creditTransaction.create({
        data: {
          userId,
          amount: 100,
          type: 'INITIAL_GRANT',
          description: 'Créditos liberados após aprovação manual'
        }
      })
    }

    // Log de auditoria
    logApprovalAction({
      action: 'STATUS_UPDATED',
      userId,
      moderatorId,
      environment: getEnvironment(),
      timestamp: new Date(),
      metadata: {
        previousStatus,
        newStatus,
        reason,
        clerkSyncSuccess: syncSuccess
      }
    })

    // Criar log de moderação
    await prisma.userModerationLog.create({
      data: {
        userId,
        moderatorId,
        action: newStatus === APPROVAL_STATUS.APPROVED ? MODERATION_ACTION.APPROVE : 
               newStatus === APPROVAL_STATUS.REJECTED ? MODERATION_ACTION.REJECT :
               newStatus === APPROVAL_STATUS.SUSPENDED ? MODERATION_ACTION.SUSPEND :
               MODERATION_ACTION.RESET_TO_PENDING,
        previousStatus,
        newStatus: newStatus as ApprovalStatus,
        reason,
        metadata: {
          environment: getEnvironment(),
          clerkSyncSuccess: syncSuccess,
          timestamp: new Date().toISOString()
        }
      }
    })

    // 🆕 FASE 2: Atribuição automática de plano quando muda para APPROVED
    if (newStatus === APPROVAL_STATUS.APPROVED && previousStatus === 'PENDING') {
      try {
        const hasActivePlan = await prisma.userPlan.findFirst({
          where: { userId, isActive: true }
        })
        if (!hasActivePlan) {
          const planResult = await assignDefaultPlan(userId, 'APPROVED', 'USER')
          if (planResult.success) {
            console.log(`[CLERK_INTEGRATION_PLAN_ASSIGNMENT] ✅ Plano atribuído após aprovação: ${userId} → ${planResult.planName}`)
          } else {
            console.error(`[CLERK_INTEGRATION_PLAN_ASSIGNMENT] ❌ Erro na atribuição: ${planResult.error}`)
          }
        } else {
          console.log(`[CLERK_INTEGRATION_PLAN_ASSIGNMENT] ✅ Usuário já possui plano ativo`)
        }
      } catch (planError: any) {
        console.error(`[CLERK_INTEGRATION_PLAN_ASSIGNMENT] ❌ Erro na atribuição de plano:`, planError)
        // Não falhar aprovação por erro de plano
      }
    }

    return { success: true, user: updatedUser }

  } catch (error) {
    console.error(`[APPROVAL_ERROR] Failed to update approval status:`, error)
    return { success: false, error: (error as Error).message }
  }
}

// ==========================================
// VALIDAÇÃO E VERIFICAÇÃO
// ==========================================

/**
 * Verifica se um usuário existe no Clerk
 */
export async function verifyClerkUser(clerkId: string): Promise<boolean> {
  try {
    const user = await clerkClient.users.getUser(clerkId)
    return !!user
  } catch (error) {
    console.error(`[CLERK_VERIFY] User ${clerkId} not found in Clerk:`, error)
    return false
  }
}

/**
 * Sincroniza todos os usuários entre banco e Clerk
 */
export async function syncAllUsersMetadata(): Promise<{
  total: number;
  synced: number;
  failed: number;
  errors: string[];
}> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      clerkId: true,
      approvalStatus: true,
      email: true
    }
  })

  let synced = 0
  let failed = 0
  const errors: string[] = []

  for (const user of users) {
    try {
      const success = await syncClerkMetadata(user.clerkId, user.approvalStatus, {
        dbUserId: user.id,
        email: user.email
      })
      
      if (success) {
        synced++
      } else {
        failed++
        errors.push(`Failed to sync user ${user.clerkId}`)
      }
    } catch (error) {
      failed++
      errors.push(`Error syncing user ${user.clerkId}: ${(error as Error).message}`)
    }
  }

  console.log(`[BULK_SYNC] Completed: ${synced} synced, ${failed} failed of ${users.length} total`)
  
  return {
    total: users.length,
    synced,
    failed,
    errors
  }
}

// ==========================================
// WEBHOOK TESTING
// ==========================================

/**
 * Gera payload de teste para webhook do Clerk
 */
export function generateTestWebhookPayload(type: 'user.created' | 'user.updated' | 'user.deleted') {
  const baseData = {
    id: `test_user_${Date.now()}`,
    email_addresses: [{
      email_address: `test${Date.now()}@example.com`,
      id: 'email_1'
    }],
    first_name: 'Test',
    last_name: 'User',
    image_url: 'https://example.com/avatar.jpg'
  }

  switch (type) {
    case 'user.created':
      return {
        type: 'user.created',
        data: baseData
      }
    
    case 'user.updated':
      return {
        type: 'user.updated',
        data: {
          ...baseData,
          public_metadata: {
            approvalStatus: APPROVAL_STATUS.APPROVED,
            dbUserId: 'test_db_user_id'
          }
        }
      }
    
    case 'user.deleted':
      return {
        type: 'user.deleted',
        data: { id: baseData.id }
      }
    
    default:
      throw new Error(`Unknown webhook type: ${type}`)
  }
}

/**
 * Testa conectividade com webhook
 */
export async function testWebhookConnectivity(): Promise<{
  success: boolean;
  url: string;
  environment: string;
  error?: string;
}> {
  const config = getWebhookConfig()
  
  try {
    // Simular um teste de conectividade
    const testUrl = `${config.baseUrl}/api/health`
    
    return {
      success: true,
      url: config.webhookUrl,
      environment: config.environment
    }
  } catch (error) {
    return {
      success: false,
      url: config.webhookUrl,
      environment: config.environment,
      error: (error as Error).message
    }
  }
}

// ==========================================
// TIPOS E INTERFACES
// ==========================================

export interface ClerkUserData {
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
}

export interface WebhookConfig {
  environment: string
  webhookUrl: string
  baseUrl: string
  isProduction: boolean
  isPreview: boolean
  isDevelopment: boolean
}

export interface ApprovalUpdateResult {
  success: boolean
  user?: any
  error?: string
} 