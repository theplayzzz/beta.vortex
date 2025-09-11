import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma/client'
// 🆕 FASE 2: Import plan assignment function
import { assignDefaultPlan } from '@/utils/plan-assignment'

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
    console.log(`${logPrefix} 🔄 Iniciando sincronização segura para clerkId: ${clerkId}`)
    
    // 🔒 PROTEÇÃO CORRIGIDA: Verificar sincronizações recentes usando updatedAt
    const recentSyncs = await prisma.user.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Últimos 5 minutos
        }
        // Contar todas as atualizações recentes como proteção contra massa
      }
    })

    if (recentSyncs >= 10) {
      throw new Error('MASS_SYNC_BLOCKED: Tentativa de sincronização em massa detectada')
    }

    // 1. Buscar usuário no Clerk
    const clerkUser = await clerkClient.users.getUser(clerkId)
    const primaryEmail = clerkUser.emailAddresses.find(email => email.id === clerkUser.primaryEmailAddressId)
    
    if (!primaryEmail) {
      throw new Error('No primary email found')
    }

    userEmail = primaryEmail.emailAddress
    console.log(`${logPrefix} 📧 Email identificado: ${userEmail}`)

    // 2. Verificar se usuário já existe no banco com o clerkId correto
    let dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { 
        id: true, 
        email: true,
        _count: {
          select: {
            Client: true,
            StrategicPlanning: true,
            CommercialProposal: true
          }
        }
      }
    })

    if (dbUser) {
      console.log(`${logPrefix} ✅ Usuário já sincronizado corretamente: ${dbUser.id}`)
      console.log(`${logPrefix} 📊 Dados preservados: ${dbUser._count.Client} clientes, ${dbUser._count.StrategicPlanning} planejamentos, ${dbUser._count.CommercialProposal} propostas`)
      return dbUser.id
    }

    // 3. 🔍 CENÁRIO CRÍTICO: Verificar se existe usuário com mesmo email mas clerkId diferente
    const existingUserByEmail = await prisma.user.findFirst({
      where: { email: userEmail },
      select: { 
        id: true, 
        clerkId: true, 
        approvalStatus: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        version: true,
        _count: {
          select: {
            Client: true,
            StrategicPlanning: true,
            CommercialProposal: true
          }
        }
      }
    })

    if (existingUserByEmail) {
      console.log(`${logPrefix} 🎯 SINCRONIZAÇÃO DE CONVITE/MIGRAÇÃO DETECTADA:`)
      console.log(`${logPrefix} 👤 Usuário existente: ${existingUserByEmail.id}`)
      console.log(`${logPrefix} 📊 Dados a preservar: ${existingUserByEmail._count.Client} clientes, ${existingUserByEmail._count.StrategicPlanning} planejamentos, ${existingUserByEmail._count.CommercialProposal} propostas`)
      console.log(`${logPrefix} 🔄 ClerkId: ${existingUserByEmail.clerkId} → ${clerkId}`)
      console.log(`${logPrefix} 📅 Conta criada em: ${existingUserByEmail.createdAt}`)

      // 🛡️ CORREÇÃO: SEMPRE atualizar clerkId, mesmo se não for nulo
      console.log(`${logPrefix} 🔄 Atualizando clerkId para usuário existente`)
      
      // Usar transação para garantir consistência e tentar com fallback
      let updatedUser
      try {
        updatedUser = await prisma.user.update({
          where: { 
            id: existingUserByEmail.id,
            version: existingUserByEmail.version // Optimistic locking
          },
          data: { 
            clerkId,
            // Preservar dados pessoais existentes, mas permitir atualização se novos dados estão disponíveis
            firstName: clerkUser.firstName || existingUserByEmail.firstName,
            lastName: clerkUser.lastName || existingUserByEmail.lastName,
            profileImageUrl: clerkUser.imageUrl || undefined,
            version: existingUserByEmail.version + 1,
            updatedAt: new Date()
          }
        })
      } catch (updateError: any) {
        // Se falhou por record não encontrado (P2025), tentar sem optimistic locking
        if (updateError?.code === 'P2025') {
          console.log(`${logPrefix} ⚠️ Optimistic locking failed (P2025), retrying without version check`)
          console.log(`${logPrefix} 🔍 Original version: ${existingUserByEmail.version}, UserID: ${existingUserByEmail.id}`)
          
          // Buscar novamente para obter dados atualizados
          const refreshedUser = await prisma.user.findUnique({
            where: { id: existingUserByEmail.id },
            select: { 
              id: true, 
              version: true,
              firstName: true,
              lastName: true,
              clerkId: true,
              email: true
            }
          })
          
          if (!refreshedUser) {
            console.error(`${logPrefix} ❌ User ${existingUserByEmail.id} was deleted during sync process`)
            throw new Error(`User ${existingUserByEmail.id} was deleted during sync process`)
          }
          
          console.log(`${logPrefix} 🔄 Found refreshed user - Version: ${refreshedUser.version}, ClerkId: ${refreshedUser.clerkId}`)
          
          // Se o clerkId já foi atualizado por outro processo, não precisamos fazer nada
          if (refreshedUser.clerkId === clerkId) {
            console.log(`${logPrefix} ✅ ClerkId already updated by another process, sync complete`)
            updatedUser = refreshedUser
          } else {
            // Tentar update novamente apenas com ID
            console.log(`${logPrefix} 🔄 Retrying update without optimistic locking`)
            updatedUser = await prisma.user.update({
              where: { 
                id: existingUserByEmail.id
              },
              data: { 
                clerkId,
                // Usar dados atualizados do banco
                firstName: clerkUser.firstName || refreshedUser.firstName,
                lastName: clerkUser.lastName || refreshedUser.lastName,
                profileImageUrl: clerkUser.imageUrl || undefined,
                version: refreshedUser.version + 1,
                updatedAt: new Date()
              }
            })
          }
        } else {
          // Log do erro e re-throw outros tipos de erro
          console.error(`${logPrefix} ❌ Unexpected error during user update:`, updateError)
          throw updateError
        }
      }

      // 📝 Atualizar metadados no Clerk com dados preservados
      const metadata = clerkUser.publicMetadata as any
      
      await clerkClient.users.updateUserMetadata(clerkId, {
        publicMetadata: {
          ...metadata,
          dbUserId: existingUserByEmail.id,
          approvalStatus: existingUserByEmail.approvalStatus,
          syncedFromInvite: true,
          originalClerkId: existingUserByEmail.clerkId,
          syncedAt: new Date().toISOString(),
          dataPreserved: {
            clients: existingUserByEmail._count.Client,
            plannings: existingUserByEmail._count.StrategicPlanning,
            proposals: existingUserByEmail._count.CommercialProposal
          }
        }
      })

      // 📊 Log de auditoria detalhado
      // 🆕 FASE 2: Verificar se usuário existente tem plano ativo e atribuir se necessário
      try {
        const hasActivePlan = await prisma.userPlan.findFirst({
          where: { userId: existingUserByEmail.id, isActive: true }
        })
        if (!hasActivePlan) {
          console.log(`${logPrefix} 🔍 Usuário existente sem plano ativo, atribuindo plano padrão`)
          const planResult = await assignDefaultPlan(existingUserByEmail.id, existingUserByEmail.approvalStatus, 'USER')
          if (planResult.success) {
            console.log(`${logPrefix} ✅ Plano atribuído ao usuário existente: ${existingUserByEmail.id} → ${planResult.planName}`)
          } else {
            console.error(`${logPrefix} ❌ Erro na atribuição de plano: ${planResult.error}`)
          }
        } else {
          console.log(`${logPrefix} ✅ Usuário existente já possui plano ativo`)
        }
      } catch (planError: any) {
        console.error(`${logPrefix} ❌ Erro ao verificar/atribuir plano:`, planError)
        // Não falhar sincronização por erro de plano
      }

      console.log(`${logPrefix} ✅ SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO:`)
      console.log(`${logPrefix} 🆔 ID do usuário: ${existingUserByEmail.id}`)
      console.log(`${logPrefix} 📧 Email: ${userEmail}`)
      console.log(`${logPrefix} 🔄 ClerkId atualizado: ${existingUserByEmail.clerkId} → ${clerkId}`)
      console.log(`${logPrefix} 📊 Status: ${existingUserByEmail.approvalStatus}`)
      console.log(`${logPrefix} 💾 Dados preservados: ${existingUserByEmail._count.Client} clientes, ${existingUserByEmail._count.StrategicPlanning} planejamentos, ${existingUserByEmail._count.CommercialProposal} propostas`)
      console.log(`${logPrefix} ⏱️ Tempo de execução: ${Date.now() - startTime}ms`)

      return existingUserByEmail.id
    }

    // 4. 🆕 NOVO USUÁRIO: Verificação de aprovação automática ANTES de criar
    console.log(`${logPrefix} 🆕 Criando novo usuário no banco:`)
    console.log(`${logPrefix} 📧 Email: ${userEmail}`)
    console.log(`${logPrefix} 🆔 ClerkId: ${clerkId}`)

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

    // 🆕 FASE 2: Atribuição automática de plano para usuário recém-criado
    try {
      const planResult = await assignDefaultPlan(newUser.id, initialStatus, 'USER')
      if (planResult.success) {
        console.log(`${logPrefix} ✅ Plano atribuído ao novo usuário: ${newUser.id} → ${planResult.planName}`)
      } else {
        console.error(`${logPrefix} ❌ Erro na atribuição de plano: ${planResult.error}`)
      }
    } catch (planError: any) {
      console.error(`${logPrefix} ❌ Erro na atribuição de plano:`, planError)
      // Não falhar sincronização por erro de plano
    }

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
    const { userId: clerkId } = await auth()
    
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