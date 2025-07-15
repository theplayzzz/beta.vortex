/**
 * 🆕 PLAN-025: Endpoint para Verificação Manual de Aprovação Automática
 * Permite que usuários solicitem uma nova verificação de aprovação automática
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { triggerAutoApprovalCheck } from '@/utils/login-auto-approval-check'

/**
 * POST /api/check-auto-approval
 * Endpoint para iniciar verificação manual de aprovação automática
 */
export async function POST(req: NextRequest) {
  try {
    let userId: string | null = null
    
    // Verificar se é chamada interna do middleware
    const body = await req.json().catch(() => ({}))
    const isInternalCall = req.headers.get('X-Internal-Call') === 'true'
    
    if (isInternalCall && body.clerkId) {
      // Chamada interna do middleware
      userId = body.clerkId
      console.log('[API_AUTO_APPROVAL] Internal call from middleware for user:', userId)
    } else {
      // Chamada normal do frontend
      const authResult = await auth()
      userId = authResult.userId
      
      if (!userId) {
        return NextResponse.json({ 
          success: false,
          error: 'Unauthorized - Login required' 
        }, { status: 401 })
      }
    }

    // 🛡️ NÃO AGUARDAR: Fire and forget para não bloquear resposta
    if (userId) {
      triggerAutoApprovalCheck(userId)
    } else {
      return NextResponse.json({ 
        success: false,
        error: 'User ID not found' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Verificação de aprovação automática iniciada. Se você estiver na lista pré-aprovada, seu status será atualizado em instantes.',
      timestamp: new Date().toISOString(),
      userId: userId
    })
    
  } catch (error) {
    console.error('[API_AUTO_APPROVAL] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to initiate auto approval check' 
    }, { status: 500 })
  }
}

/**
 * GET /api/check-auto-approval
 * Informações sobre o endpoint
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    name: 'Auto Approval Check API',
    description: 'Endpoint para verificação de aprovação automática via webhook externo',
    version: '1.0.0',
    methods: ['POST'],
    usage: {
      method: 'POST',
      description: 'Inicia verificação não-bloqueante para usuários PENDING',
      authentication: 'Clerk session required',
      response: 'Confirmation message'
    },
    plan: 'PLAN-025'
  })
} 