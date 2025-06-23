import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma/client'

/**
 * Sincroniza automaticamente um usuário do Clerk com o banco de dados
 * LÓGICA:
 * - Se email NÃO existe no BD → CRIAR novo usuário
 * - Se email JÁ existe no BD → SINCRONIZAR (atualizar ClerkId)
 * - Preserva todos os dados existentes (clientes, planejamentos, etc.)
 */
export async function syncUserWithDatabase(clerkId: string): Promise<string | null> {
  try {
    // 1. Buscar usuário no Clerk
    const clerkUser = await clerkClient.users.getUser(clerkId)
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress
    
    if (!userEmail) {
      console.error('[USER_SYNC] Usuário sem email no Clerk:', clerkId)
      return null
    }

    // 2. Verificar se usuário já existe no banco
    let dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    })

    if (dbUser) {
      // Usuário já existe com o ClerkId correto
      return dbUser.id
    }

    // 3. Verificar se existe usuário com mesmo email mas ClerkId diferente
    const existingUserByEmail = await prisma.user.findFirst({
      where: { email: userEmail },
      select: { id: true, clerkId: true, approvalStatus: true }
    })

    if (existingUserByEmail) {
      // Atualizar ClerkId do usuário existente
      console.log('[USER_SYNC] Atualizando ClerkId do usuário existente:', {
        email: userEmail,
        oldClerkId: existingUserByEmail.clerkId,
        newClerkId: clerkId
      })

      await prisma.user.update({
        where: { id: existingUserByEmail.id },
        data: { 
          clerkId,
          updatedAt: new Date()
        }
      })

      // Atualizar metadados no Clerk se necessário
      const metadata = clerkUser.publicMetadata as any
      if (!metadata.dbUserId || metadata.dbUserId !== existingUserByEmail.id) {
        await clerkClient.users.updateUserMetadata(clerkId, {
          publicMetadata: {
            ...metadata,
            dbUserId: existingUserByEmail.id,
            syncedFromInvite: true,
            syncedAt: new Date().toISOString()
          }
        })
      }

      return existingUserByEmail.id
    }

    // 4. Criar novo usuário no banco
    console.log('[USER_SYNC] Criando novo usuário no banco:', {
      email: userEmail,
      clerkId
    })

    const clerkMetadata = clerkUser.publicMetadata as any
    const approvalStatus = clerkMetadata.approvalStatus || 'PENDING'
    const role = clerkMetadata.role || 'USER'

    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email: userEmail,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
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
        syncedFromInvite: true,
        syncedAt: new Date().toISOString()
      }
    })

    console.log('[USER_SYNC] Usuário criado com sucesso:', {
      dbUserId: newUser.id,
      email: userEmail,
      clerkId
    })

    return newUser.id

  } catch (error) {
    console.error('[USER_SYNC] Erro na sincronização:', error)
    return null
  }
}

/**
 * Versão otimizada do getUserIdFromClerk com sincronização automática
 */
export async function getUserIdFromClerkWithSync(): Promise<string | null> {
  try {
    // Importar auth dinamicamente para evitar problemas de edge runtime
    const { auth } = await import('@clerk/nextjs/server')
    const { userId: clerkId } = auth()
    
    if (!clerkId) {
      return null
    }

    // 1. Tentar buscar usuário no banco primeiro (cache hit)
    let dbUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    })

    if (dbUser) {
      return dbUser.id
    }

    // 2. Se não encontrou, sincronizar automaticamente
    console.log('[USER_SYNC] Usuário não encontrado no banco, sincronizando:', clerkId)
    return await syncUserWithDatabase(clerkId)

  } catch (error) {
    console.error('[USER_SYNC] Erro no getUserIdFromClerkWithSync:', error)
    return null
  }
} 