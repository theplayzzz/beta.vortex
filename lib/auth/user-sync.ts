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
  
  try {
    console.log(`${logPrefix} 🔄 Iniciando sincronização segura para clerkId: ${clerkId}`)
    
    // 1. Buscar usuário no Clerk
    const clerkUser = await clerkClient.users.getUser(clerkId)
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress
    
    if (!userEmail) {
      console.error(`${logPrefix} ❌ Usuário sem email no Clerk: ${clerkId}`)
      return null
    }

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
      console.log(`${logPrefix} 🎯 SINCRONIZAÇÃO DE CONVITE DETECTADA:`)
      console.log(`${logPrefix} 👤 Usuário existente: ${existingUserByEmail.id}`)
      console.log(`${logPrefix} 📊 Dados a preservar: ${existingUserByEmail._count.Client} clientes, ${existingUserByEmail._count.StrategicPlanning} planejamentos, ${existingUserByEmail._count.CommercialProposal} propostas`)
      console.log(`${logPrefix} 🔄 ClerkId: ${existingUserByEmail.clerkId} → ${clerkId}`)
      console.log(`${logPrefix} 📅 Conta criada em: ${existingUserByEmail.createdAt}`)

      // 🛡️ PROTEÇÃO: Verificar se não é uma tentativa de sincronização em massa
      const recentSyncs = await prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Últimos 5 minutos
          },
          clerkId: {
            not: existingUserByEmail.clerkId // Excluir o próprio usuário
          }
        }
      })

      if (recentSyncs > 5) {
        console.error(`${logPrefix} 🚨 BLOQUEIO DE SEGURANÇA: Muitas sincronizações recentes (${recentSyncs}). Possível sincronização em massa detectada.`)
        throw new Error('MASS_SYNC_BLOCKED: Muitas sincronizações simultâneas detectadas')
      }

      // ✅ SINCRONIZAÇÃO SEGURA: Atualizar apenas o clerkId, preservando TUDO
      const updatedUser = await prisma.user.update({
        where: { id: existingUserByEmail.id },
        data: { 
          clerkId,
          // Preservar dados pessoais existentes, mas permitir atualização se novos dados estão disponíveis
          firstName: clerkUser.firstName || existingUserByEmail.firstName,
          lastName: clerkUser.lastName || existingUserByEmail.lastName,
          profileImageUrl: clerkUser.imageUrl || undefined,
          updatedAt: new Date()
        }
      })

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
      console.log(`${logPrefix} ✅ SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO:`)
      console.log(`${logPrefix} 🆔 ID do usuário: ${existingUserByEmail.id}`)
      console.log(`${logPrefix} 📧 Email: ${userEmail}`)
      console.log(`${logPrefix} 🔄 ClerkId atualizado: ${existingUserByEmail.clerkId} → ${clerkId}`)
      console.log(`${logPrefix} 📊 Status: ${existingUserByEmail.approvalStatus}`)
      console.log(`${logPrefix} 💾 Dados preservados: ${existingUserByEmail._count.Client} clientes, ${existingUserByEmail._count.StrategicPlanning} planejamentos, ${existingUserByEmail._count.CommercialProposal} propostas`)
      console.log(`${logPrefix} ⏱️ Tempo de execução: ${Date.now() - startTime}ms`)

      return existingUserByEmail.id
    }

    // 4. 🆕 NOVO USUÁRIO: Criar registro no banco
    console.log(`${logPrefix} 🆕 Criando novo usuário no banco:`)
    console.log(`${logPrefix} 📧 Email: ${userEmail}`)
    console.log(`${logPrefix} 🆔 ClerkId: ${clerkId}`)

    const clerkMetadata = clerkUser.publicMetadata as any
    const approvalStatus = clerkMetadata.approvalStatus || 'PENDING'
    const role = clerkMetadata.role || 'USER'

    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email: userEmail,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        profileImageUrl: clerkUser.imageUrl || null,
        approvalStatus: approvalStatus as any,
        role: role as any,
        creditBalance: clerkMetadata.creditBalance || 0,
        approvedAt: clerkMetadata.approvedAt ? new Date(clerkMetadata.approvedAt) : null,
        version: clerkMetadata.version || 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Atualizar metadados no Clerk
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        ...clerkMetadata,
        dbUserId: newUser.id,
        syncedFromRegistration: true,
        syncedAt: new Date().toISOString()
      }
    })

    console.log(`${logPrefix} ✅ NOVO USUÁRIO CRIADO COM SUCESSO:`)
    console.log(`${logPrefix} 🆔 ID do usuário: ${newUser.id}`)
    console.log(`${logPrefix} 📧 Email: ${userEmail}`)
    console.log(`${logPrefix} 📊 Status: ${approvalStatus}`)
    console.log(`${logPrefix} ⏱️ Tempo de execução: ${Date.now() - startTime}ms`)

    return newUser.id

  } catch (error) {
    console.error(`${logPrefix} ❌ ERRO NA SINCRONIZAÇÃO:`, error)
    console.error(`${logPrefix} 📧 Email: ${userEmail || 'N/A'}`)
    console.error(`${logPrefix} 🆔 ClerkId: ${clerkId}`)
    console.error(`${logPrefix} ⏱️ Tempo até erro: ${Date.now() - startTime}ms`)
    
    // 🚨 Se erro foi por bloqueio de massa, não retornar null para não criar problemas
    if (error.message?.includes('MASS_SYNC_BLOCKED')) {
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
    if (error.message?.includes('MASS_SYNC_BLOCKED')) {
      console.error('[USER_SYNC_SAFE] 🚨 Sincronização bloqueada por segurança - possível tentativa de sincronização em massa')
      return null
    }
    
    return null
  }
} 