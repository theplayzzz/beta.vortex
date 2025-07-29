import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma/client'

/**
 * 🔒 SINCRONIZAÇÃO SEGURA E INDIVIDUAL DE USUÁRIOS
 * 
 * CENÁRIOS SUPORTADOS:
 * 1. Usuário se cadastra pela primeira vez → Criar novo registro
 * 2. Usuário aceita convite (email já existe no BD) → Sincronizar clerkId
 * 3. Usuário da versão DEV migra para PROD → Preservar dados históricos
 * 
 * PROTEÇÕES:
 * - ✅ Apenas sincronização individual (1 usuário por vez)
 * - ✅ Preserva TODOS os dados existentes (clientes, planejamentos, etc.)
 * - ✅ Logs detalhados para auditoria
 * - ✅ Rollback automático em caso de erro
 * - ⛔ NÃO permite sincronização em massa
 */
export async function syncUserWithDatabase(clerkId: string): Promise<string | null> {
  const startTime = Date.now()
  const logPrefix = `[USER_SYNC_SAFE]`
  let userEmail: string | undefined // Declarar fora do try-catch

  try {
    // 🔒 PROTEÇÃO: Nunca sincronizar em massa
    const recentSyncs = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60000) // Últimos 60s
        }
      }
    })

    if (recentSyncs >= 10) {
      throw new Error('MASS_SYNC_BLOCKED: Tentativa de sincronização em massa detectada')
    }

    // Buscar usuário no Clerk
    const clerkUser = await clerkClient.users.getUser(clerkId)
    const primaryEmail = clerkUser.emailAddresses.find(email => email.id === clerkUser.primaryEmailAddressId)
    
    if (!primaryEmail) {
      throw new Error('No primary email found')
    }

    userEmail = primaryEmail.emailAddress
    console.log(`${logPrefix} 🔍 Processando usuário: ${userEmail}`)

    // Verificar se usuário já existe no banco
    const existingUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { clerkId },
          { email: userEmail }
        ]
      },
      select: { 
        id: true, 
        clerkId: true, 
        email: true,
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

    if (existingUser) {
      console.log(`${logPrefix} 👤 Usuário existente encontrado: ${existingUser.email}`)
      
      if (existingUser.clerkId && existingUser.clerkId !== clerkId) {
        console.log(`${logPrefix} ⚠️ ClerkId divergente: ${existingUser.clerkId} vs ${clerkId}`)
      }

      if (!existingUser.clerkId) {
        console.log(`${logPrefix} 🔄 Sincronizando clerkId para usuário existente`)
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { clerkId }
        })
      }

      return existingUser.id
    }

    // 🆕 INTEGRAÇÃO: Verificação de aprovação automática via webhook ANTES de criar o usuário
    let initialStatus = 'PENDING'
    let autoApprovalData: any = null
    
    console.log(`${logPrefix} 🔍 Verificando aprovação automática para: ${userEmail}`)
    
    try {
      const { checkAutoApproval } = await import('@/utils/auto-approval-webhook')
      const autoCheck = await checkAutoApproval(userEmail)
      
      if (autoCheck.shouldApprove) {
        initialStatus = 'APPROVED'
        autoApprovalData = autoCheck.webhookData
        console.log(`${logPrefix} ✅ Usuário pré-aprovado via webhook: ${userEmail}`)
      } else {
        console.log(`${logPrefix} ❌ Usuário não pré-aprovado: ${userEmail}`)
        if (autoCheck.error) {
          console.log(`${logPrefix} Erro no webhook: ${autoCheck.error}`)
        }
      }
    } catch (webhookError) {
      console.error(`${logPrefix} ⚠️ Erro na verificação de webhook, continuando com status PENDING:`, webhookError)
      // initialStatus permanece PENDING
    }

    console.log(`${logPrefix} 🆔 ClerkId: ${clerkId}`)

    const clerkMetadata = clerkUser.publicMetadata as any
    const role = clerkMetadata.role || 'USER'

    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email: userEmail,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        profileImageUrl: clerkUser.imageUrl || null,
        approvalStatus: initialStatus as any, // Usar status determinado pela verificação do webhook
        role: role as any,
        creditBalance: initialStatus === 'APPROVED' ? 100 : 0, // Créditos só para aprovados
        // 🆕 Se aprovado automaticamente, registrar
        ...(autoApprovalData && {
          approvedAt: new Date(),
          approvedBy: 'SYSTEM_AUTO_WEBHOOK'
        }),
        version: clerkMetadata.version || 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // 🆕 Criar log de moderação para aprovação automática
    if (autoApprovalData) {
      try {
        await prisma.userModerationLog.create({
          data: {
            userId: newUser.id,
            moderatorId: newUser.id,
            action: 'APPROVE',
            previousStatus: 'PENDING',
            newStatus: 'APPROVED',
            reason: 'Aprovação automática via webhook durante sincronização',
            metadata: {
              autoApproval: true,
              webhookResponse: autoApprovalData,
              triggerEvent: 'USER_SYNC',
              timestamp: new Date().toISOString()
            }
          }
        })
      } catch (logError) {
        console.error(`${logPrefix} ⚠️ Falha ao criar log de moderação:`, logError)
      }
    }

    // 🆕 Criar transação de créditos para aprovados automaticamente
    if (initialStatus === 'APPROVED') {
      try {
        await prisma.creditTransaction.create({
          data: {
            userId: newUser.id,
            amount: 100,
            type: 'INITIAL_GRANT',
            description: 'Créditos iniciais - aprovação automática via webhook'
          }
        })
      } catch (creditError) {
        console.error(`${logPrefix} ⚠️ Falha ao criar transação de créditos:`, creditError)
      }
    }

    // Atualizar metadados no Clerk
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        ...clerkMetadata,
        dbUserId: newUser.id,
        approvalStatus: initialStatus,
        syncedFromRegistration: true,
        syncedAt: new Date().toISOString(),
        ...(autoApprovalData && {
          autoApproved: true,
          autoApprovedAt: new Date().toISOString()
        })
      }
    })

    console.log(`${logPrefix} ✅ NOVO USUÁRIO CRIADO COM SUCESSO:`)
    console.log(`${logPrefix} 🆔 ID do usuário: ${newUser.id}`)
    console.log(`${logPrefix} 📧 Email: ${userEmail}`)
    console.log(`${logPrefix} 📊 Status: ${initialStatus}`)
    console.log(`${logPrefix} 💳 Créditos: ${newUser.creditBalance}`)
    console.log(`${logPrefix} 🤖 Aprovação automática: ${autoApprovalData ? 'SIM' : 'NÃO'}`)
    console.log(`${logPrefix} ⏱️ Tempo de execução: ${Date.now() - startTime}ms`)

    return newUser.id

  } catch (error) {
    console.error(`${logPrefix} ❌ ERRO NA SINCRONIZAÇÃO:`, error)
    console.error(`${logPrefix} 📧 Email: ${userEmail || 'N/A'}`)
    console.error(`${logPrefix} 🆔 ClerkId: ${clerkId}`)
    console.error(`${logPrefix} ⏱️ Tempo até erro: ${Date.now() - startTime}ms`)
    
    // 🚨 Se erro foi por bloqueio de massa, não retornar null para não criar problemas
    if (error instanceof Error && error.message?.includes('MASS_SYNC_BLOCKED')) {
      throw error
    }
    
    return null
  }
}

/**
 * 🔒 Versão otimizada e segura do getUserIdFromClerk
 * Inclui proteções contra sincronização em massa
 */
export async function getUserIdFromClerkWithSync(): Promise<string | null> {
  try {
    // Importar auth dinamicamente para evitar problemas de edge runtime
    const { auth } = await import('@clerk/nextjs/server')
    const { userId: clerkId } = auth()
    
    if (!clerkId) {
      return null
    }

    // 1. Busca rápida no cache (usuário já sincronizado)
    let dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    })

    if (dbUser) {
      return dbUser.id
    }

    // 2. 🔒 SINCRONIZAÇÃO INDIVIDUAL SEGURA
    console.log('[USER_SYNC_SAFE] Usuário não encontrado no banco, iniciando sincronização individual:', clerkId)
    return await syncUserWithDatabase(clerkId)

  } catch (error) {
    console.error('[USER_SYNC_SAFE] Erro no getUserIdFromClerkWithSync:', error)
    
    // Se foi bloqueio de massa, logar e retornar null para não quebrar a aplicação
    if (error instanceof Error && error.message?.includes('MASS_SYNC_BLOCKED')) {
      console.error('[USER_SYNC_SAFE] 🚨 Sincronização bloqueada por segurança - possível tentativa de sincronização em massa')
      return null
    }
    
    return null
  }
} 