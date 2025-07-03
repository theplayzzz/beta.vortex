/**
 * API Endpoint para Verificação Rápida de Status de Aprovação
 * Otimizada para polling frequente sem overhead desnecessário
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClerkClient } from '@clerk/backend'

/**
 * GET /api/user/approval-status
 * Retorna apenas o status de aprovação do usuário logado
 * Otimizada para polling (minimal response, cache headers)
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        authenticated: false
      }, { 
        status: 401,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    }

    // Buscar dados atualizados do Clerk
    const clerkClient = createClerkClient({ 
      secretKey: process.env.CLERK_SECRET_KEY! 
    })
    
    const user = await clerkClient.users.getUser(userId)
    const metadata = user.publicMetadata as any
    
    const approvalStatus = metadata?.approvalStatus || 'PENDING'
    const userRole = metadata?.role || 'USER'
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'

    // Resposta minimal para polling eficiente
    return NextResponse.json({
      authenticated: true,
      approvalStatus,
      role: userRole,
      isAdmin,
      timestamp: new Date().toISOString(),
      // Flags úteis para o frontend
      canAccessDashboard: approvalStatus === 'APPROVED',
      needsApproval: approvalStatus === 'PENDING',
      isRejected: approvalStatus === 'REJECTED',
      isSuspended: approvalStatus === 'SUSPENDED'
    }, {
      headers: {
        // Headers para polling eficiente
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache', 
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff'
      }
    })

  } catch (error) {
    console.error('[APPROVAL_STATUS_API] Error checking approval status:', error)
    
    return NextResponse.json({ 
      error: 'Failed to check approval status',
      authenticated: false,
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
} 