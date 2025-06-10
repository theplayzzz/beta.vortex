import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const authResult = auth()
    
    if (!authResult.userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }
    
    // Log detalhado para debug
    const debugData = {
      timestamp: new Date().toISOString(),
      userId: authResult.userId,
      sessionId: authResult.sessionId,
      sessionClaims: authResult.sessionClaims,
      publicMetadata: authResult.sessionClaims?.publicMetadata,
      approvalStatus: (authResult.sessionClaims?.publicMetadata as any)?.approvalStatus,
      role: (authResult.sessionClaims?.publicMetadata as any)?.role,
      dbUserId: (authResult.sessionClaims?.publicMetadata as any)?.dbUserId,
    }
    
    console.log('[FORCE REFRESH] Dados atuais do session:', JSON.stringify(debugData, null, 2))
    
    // Verificar se o status está correto
    const approvalStatus = (authResult.sessionClaims?.publicMetadata as any)?.approvalStatus
    
    if (approvalStatus === 'APPROVED') {
      return NextResponse.json({
        message: 'Session já está com status APPROVED',
        needsRefresh: false,
        currentStatus: approvalStatus,
        debugData,
        instructions: 'Tente acessar uma rota protegida novamente'
      })
    } else {
      return NextResponse.json({
        message: 'Session com status incorreto detectado',
        needsRefresh: true,
        currentStatus: approvalStatus,
        debugData,
        instructions: [
          '1. Faça LOGOUT completo da aplicação',
          '2. Aguarde 2-3 minutos',
          '3. Faça LOGIN novamente',
          '4. O session será atualizado automaticamente'
        ]
      })
    }
    
  } catch (error) {
    console.error('[FORCE REFRESH] Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = auth()
    
    const debugData = {
      timestamp: new Date().toISOString(),
      userId: authResult.userId,
      sessionId: authResult.sessionId,
      hasSessionClaims: !!authResult.sessionClaims,
      sessionClaims: authResult.sessionClaims,
      publicMetadata: authResult.sessionClaims?.publicMetadata,
      approvalStatus: (authResult.sessionClaims?.publicMetadata as any)?.approvalStatus,
      role: (authResult.sessionClaims?.publicMetadata as any)?.role,
      dbUserId: (authResult.sessionClaims?.publicMetadata as any)?.dbUserId,
      instructions: {
        ifPending: 'Status PENDING - faça logout/login',
        ifApproved: 'Status APPROVED - deveria funcionar',
        ifEmpty: 'Metadata vazio - problema no webhook'
      }
    }
    
    console.log('[DEBUG REFRESH] Session data:', JSON.stringify(debugData, null, 2))
    
    return NextResponse.json(debugData)
  } catch (error) {
    console.error('[DEBUG REFRESH] Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 