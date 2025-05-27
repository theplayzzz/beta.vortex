import { auth as clerkAuth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma/client'

/**
 * Wrapper para o auth() do Clerk que é compatível com Next.js 15
 * Implementa o lookup correto: clerkId → User.id → Client.userId
 */
export async function auth() {
  try {
    const clerkResult = await clerkAuth()
    return clerkResult
  } catch (error) {
    // Se houver erro relacionado a APIs dinâmicas, retornar estado não autenticado
    if (error instanceof Error && error.message.includes('headers()')) {
      return { userId: null }
    }
    throw error
  }
}

/**
 * Obtém o userId do banco de dados baseado no clerkId
 * Fluxo: clerkId → User.id (para usar em queries Client)
 */
export async function getUserIdFromClerk(): Promise<string | null> {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    })

    return user?.id || null
  } catch (error) {
    console.error('Error getting userId from clerkId:', error)
    return null
  }
} 