/**
 * 🆕 PLAN-025: Sistema de Verificação Automática no Login
 * Função para verificar se usuários PENDING devem ser aprovados automaticamente durante o login
 */

import { checkAutoApproval } from './auto-approval-webhook'
import { prisma } from '@/lib/prisma/client'
import { clerkClient } from '@clerk/nextjs/server'
import { getEnvironment } from './approval-system'
// 🆕 FASE 2: Import plan assignment function
import { assignDefaultPlan } from './plan-assignment'

/**
 * Verifica se um usuário pendente deve ser aprovado automaticamente durante o login
 * Esta função é chamada de forma não-bloqueante para não afetar a experiência do usuário
 * 
 * @param clerkId ID do usuário no Clerk
 */
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
    })

    if (!user || user.approvalStatus !== 'PENDING') {
      // Não é pendente, não precisa verificar
      return
    }

    console.log(`[LOGIN_AUTO_APPROVAL] Checking auto approval for pending user: ${user.email}`)

    const autoCheck = await checkAutoApproval(user.email)

    if (autoCheck.shouldApprove) {
      console.log(`[LOGIN_AUTO_APPROVAL] User approved during login check: ${user.email}`)
      
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
        })

        // Criar transação de créditos
        await prisma.creditTransaction.create({
          data: {
            userId: user.id,
            amount: 100,
            type: 'INITIAL_GRANT',
            description: 'Créditos liberados após aprovação automática no login'
          }
        })

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
              webhookResponse: autoCheck.webhookData ? JSON.parse(JSON.stringify(autoCheck.webhookData)) : null,
              timestamp: new Date().toISOString()
            }
          }
        })

        // Sincronizar com Clerk
        await clerkClient.users.updateUserMetadata(clerkId, {
          publicMetadata: {
            approvalStatus: 'APPROVED',
            dbUserId: user.id,
            role: 'USER'
          }
        })

        console.log(`[LOGIN_AUTO_APPROVAL] User successfully approved and credits granted: ${user.email}`)

        // 🆕 FASE 2: Atribuição automática de plano após aprovação automática
        try {
          const hasActivePlan = await prisma.userPlan.findFirst({
            where: { userId: user.id, isActive: true }
          })
          if (!hasActivePlan) {
            const planResult = await assignDefaultPlan(user.id, 'APPROVED', 'USER')
            if (planResult.success) {
              console.log(`[LOGIN_AUTO_APPROVAL_PLAN_ASSIGNMENT] ✅ Plano atribuído após aprovação automática: ${planResult.planName}`)
            } else {
              console.error(`[LOGIN_AUTO_APPROVAL_PLAN_ASSIGNMENT] ❌ Erro na atribuição: ${planResult.error}`)
            }
          } else {
            console.log(`[LOGIN_AUTO_APPROVAL_PLAN_ASSIGNMENT] ✅ Usuário já possui plano ativo`)
          }
        } catch (planError: any) {
          console.error(`[LOGIN_AUTO_APPROVAL_PLAN_ASSIGNMENT] ❌ Não falhar aprovação:`, planError)
          // Não falhar o processo de aprovação por erro de plano
        }

      } catch (updateError) {
        // 🛡️ CONFLITO: Provavelmente outro processo já atualizou
        console.log('[LOGIN_AUTO_APPROVAL] User may have been updated by another process:', updateError)
      }
    } else {
      console.log(`[LOGIN_AUTO_APPROVAL] User still not approved: ${user.email}`)
    }

  } catch (error) {
    // 🛡️ CRÍTICO: Nunca falhar o login por causa da verificação
    console.error('[LOGIN_AUTO_APPROVAL] Error checking auto approval on login (non-blocking):', error)
  }
}

/**
 * Wrapper para execução assíncrona não-blocante da verificação
 * Usado em middlewares e hooks para não afetar a performance
 * 
 * @param clerkId ID do usuário no Clerk
 */
export function triggerAutoApprovalCheck(clerkId: string): void {
  // Fire and forget - não bloqueia execução
  checkPendingUserAutoApproval(clerkId).catch(error => {
    console.error('[LOGIN_AUTO_APPROVAL] Background check failed:', error)
  })
}

/**
 * Versão otimizada para Edge Runtime (middleware)
 * Faz uma chamada fetch interna simples sem aguardar resposta
 * 
 * @param clerkId ID do usuário no Clerk
 * @param baseUrl URL base da aplicação
 */
export function triggerAutoApprovalCheckEdge(clerkId: string, baseUrl: string): void {
  // Fire and forget - não bloqueia middleware
  fetch(`${baseUrl}/api/check-auto-approval`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Call': 'true', // Identificar como chamada interna
    },
    body: JSON.stringify({ 
      clerkId: clerkId,
      internal: true 
    })
  }).catch(error => {
    console.error('[MIDDLEWARE] Auto approval fetch failed:', error)
  })
} 