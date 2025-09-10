import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getUserIdFromClerk } from '@/lib/auth/auth-wrapper'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log(`[DEBUG-ENDPOINT] 🔍 Requisição de debug para sessão: ${id}`)

    const userId = await getUserIdFromClerk()
    if (!userId) {
      console.log('[DEBUG-ENDPOINT] ❌ Usuário não autenticado')
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    console.log(`[DEBUG-ENDPOINT] ✅ Usuário autenticado: ${userId}`)

    // Buscar sessão com todos os detalhes
    const session = await prisma.transcriptionSession.findFirst({
      where: { 
        id,
        userId
      }
    })

    if (!session) {
      console.log(`[DEBUG-ENDPOINT] ❌ Sessão não encontrada: ${id}`)
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 404 }
      )
    }

    // Buscar outras sessões ativas do usuário
    const otherActiveSessions = await prisma.transcriptionSession.findMany({
      where: { 
        userId,
        isActive: true,
        id: { not: id }
      },
      select: { id: true, sessionName: true, totalDuration: true, updatedAt: true }
    })

    const debugInfo = {
      session: {
        id: session.id,
        sessionName: session.sessionName,
        isActive: session.isActive,
        totalDuration: session.totalDuration,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        connectTime: session.connectTime,
        disconnectTime: session.disconnectTime
      },
      otherActiveSessions: otherActiveSessions,
      timestamp: new Date().toISOString(),
      userId: userId
    }

    console.log(`[DEBUG-ENDPOINT] 📊 Informações coletadas:`, debugInfo)

    return NextResponse.json({
      success: true,
      data: debugInfo
    })

  } catch (error) {
    console.error('[DEBUG-ENDPOINT] 💀 Erro no endpoint de debug:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
