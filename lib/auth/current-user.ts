import { auth } from '@/lib/auth/auth-wrapper'
import { currentUser as clerkCurrentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma/client'
import type { User } from '@prisma/client'

/**
 * Obtém o usuário atual do banco de dados baseado no Clerk ID
 * Retorna null se o usuário não estiver autenticado ou não existir no banco
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Obtém o usuário atual do banco de dados ou cria se não existir
 * Útil para casos onde o webhook pode não ter sido processado ainda
 */
export async function getCurrentUserOrCreate(): Promise<User | null> {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return null
    }

    // Tentar encontrar o usuário no banco
    let user = await prisma.user.findUnique({
      where: { clerkId },
    })

    // Se não existir, criar baseado nos dados do Clerk
    if (!user) {
      const clerkUser = await clerkCurrentUser()
      
      if (!clerkUser) {
        return null
      }

      const primaryEmail = clerkUser.emailAddresses.find(
        email => email.id === clerkUser.primaryEmailAddressId
      )

      if (!primaryEmail) {
        throw new Error('No primary email found for user')
      }

      // Criar usuário no banco
      user = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: primaryEmail.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          profileImageUrl: clerkUser.imageUrl,
          creditBalance: 100, // Saldo inicial
          updatedAt: new Date(),
        },
      })

      // Criar transação de crédito inicial
      await prisma.creditTransaction.create({
        data: {
          userId: user.id,
          amount: 100,
          type: 'INITIAL_GRANT',
          description: 'Créditos iniciais de boas-vindas',
        },
      })
    }

    return user
  } catch (error) {
    console.error('Error getting or creating current user:', error)
    return null
  }
}

/**
 * Obtém apenas o ID do usuário atual do banco de dados
 * Mais eficiente quando só precisamos do ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })

    return user?.id || null
  } catch (error) {
    console.error('Error getting current user ID:', error)
    return null
  }
} 