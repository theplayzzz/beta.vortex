import { auth as clerkAuth } from '@clerk/nextjs/server'
import { getUserIdFromClerkWithSync } from './user-sync'

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
 * COM SINCRONIZAÇÃO AUTOMÁTICA:
 * - Se usuário não existe no BD, sincroniza automaticamente
 * - Se email existe com ClerkId diferente, atualiza o ClerkId
 * - Preserva todos os dados existentes
 */
export async function getUserIdFromClerk(): Promise<string | null> {
  return await getUserIdFromClerkWithSync()
} 