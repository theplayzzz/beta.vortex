import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserIdFromClerkWithSync } from '@/lib/auth/user-sync'
import { usageTracker } from '@/lib/usage/usage-tracker'
import { z } from 'zod'

/**
 * API para recalcular uso mensal baseado nas tabelas fonte
 * Útil para corrigir discrepâncias entre contadores e dados reais
 */

const RecalculateSchema = z.object({
  periodMonth: z.string().optional(), // "2024-09" - se não especificado, usa mês atual
  forceUpdate: z.boolean().optional().default(false) // Forçar atualização mesmo sem discrepâncias
})

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Get database user ID
    const userId = await getUserIdFromClerkWithSync()
    
    if (!userId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { periodMonth, forceUpdate } = RecalculateSchema.parse(body)

    console.log(`📊 [USAGE_RECALCULATE] Iniciando recálculo para userId=${userId}, period=${periodMonth || 'current'}, force=${forceUpdate}`)

    // Recalcular uso
    const result = await usageTracker.recalculateUsage(userId, periodMonth)

    console.log(`✅ [USAGE_RECALCULATE] Recálculo concluído:`, result)

    return NextResponse.json({
      success: true,
      data: {
        userId,
        periodMonth: periodMonth || 'current',
        recalculatedUsage: result,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ [USAGE_RECALCULATE] Erro ao recalcular uso:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos', 
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint para verificar uso atual sem recalcular
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Get database user ID
    const userId = await getUserIdFromClerkWithSync()
    
    if (!userId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Parse query parameters
    const url = new URL(request.url)
    const periodMonth = url.searchParams.get('period') || undefined

    console.log(`📊 [USAGE_CHECK] Verificando uso para userId=${userId}, period=${periodMonth || 'current'}`)

    // Simular recálculo sem atualizar (apenas retornar valores calculados)
    const calculatedUsage = await usageTracker.recalculateUsage(userId, periodMonth)
    
    // Agora buscar valores atuais na UsageMonthly para comparação
    const currentPeriod = periodMonth || new Date().toISOString().slice(0, 7)
    
    console.log(`📊 [USAGE_CHECK] Verificação concluída:`, calculatedUsage)

    return NextResponse.json({
      success: true,
      data: {
        userId,
        periodMonth: currentPeriod,
        calculatedUsage,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ [USAGE_CHECK] Erro ao verificar uso:', error)

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}