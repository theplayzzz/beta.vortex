import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromClerk } from '@/lib/auth/auth-wrapper'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

const UpdateTranscriptionSessionSchema = z.object({
  connectTime: z.string().datetime().optional(),
  totalDuration: z.number().min(0).optional(),
  isActive: z.boolean().optional(), // ADICIONADO: necessário para sistema de ativação
  analysisCount: z.number().min(0).optional(),
  analyses: z.array(z.object({
    timestamp: z.string().datetime(),
    type: z.string(),
    content: z.any(),
    creditsUsed: z.number().optional()
  })).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[TRANSCRIPTION-SESSION-GET] Iniciando busca de sessão...')
    const userId = await getUserIdFromClerk()
    console.log('[TRANSCRIPTION-SESSION-GET] UserId obtido:', userId)
    
    if (!userId) {
      console.error('[TRANSCRIPTION-SESSION-GET] UserId não encontrado - retornando 401')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Await params to get the actual values
    const { id } = await params

    // TEMPORÁRIO: Buscar sessão por ID primeiro, depois verificar ownership
    const session = await prisma.transcriptionSession.findFirst({
      where: {
        id: id
      },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    // TEMPORÁRIO: Log para debug de ownership
    console.log('🔍 Session ownership debug:', {
      sessionId: session.id,
      sessionUserId: session.userId,
      requestUserId: userId,
      sessionOwner: session.User?.email
    })

    // TEMPORÁRIO: Permitir acesso se sessão existe (para teste de duplicação)
    // TODO: Restaurar verificação de ownership após testes
    if (session.userId !== userId) {
      console.warn('⚠️ TEMPORÁRIO: Permitindo acesso cross-user para teste de duplicação')
    }

    return NextResponse.json({ 
      success: true, 
      session 
    })

  } catch (error) {
    console.error('Erro ao buscar sessão de transcrição:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromClerk()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Await params to get the actual values
    const { id } = await params

    const body = await request.json()
    const validatedData = UpdateTranscriptionSessionSchema.parse(body)

    const existingSession = await prisma.transcriptionSession.findFirst({
      where: {
        id: id,
        userId
      }
    })

    if (!existingSession) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    const updateData: any = {}
    
    if (validatedData.connectTime) {
      updateData.connectTime = new Date(validatedData.connectTime)
    }
    
    // totalDuration pode ser atualizado por webhooks OU por sistema incremental de 15s
    if (validatedData.totalDuration !== undefined) {
      updateData.totalDuration = validatedData.totalDuration
    }
    
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive
    }
    
    if (validatedData.analysisCount !== undefined) {
      updateData.analysisCount = validatedData.analysisCount
    }
    
    if (validatedData.analyses) {
      updateData.analyses = validatedData.analyses
    }

    const updatedSession = await prisma.transcriptionSession.update({
      where: {
        id: id
      },
      data: updateData
    })
    
    console.log(`[PATCH] Sessão ${id} atualizada com sucesso`)

    return NextResponse.json({ 
      success: true, 
      session: updatedSession 
    })

  } catch (error) {
    console.error('Erro ao atualizar sessão de transcrição:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromClerk()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Await params to get the actual values
    const { id } = await params

    // Verify ownership and that session is not already deleted
    const existingSession = await prisma.transcriptionSession.findFirst({
      where: { 
        id, 
        userId, 
        deletedAt: null 
      }
    })

    if (!existingSession) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    // Perform soft delete by setting deletedAt timestamp
    await prisma.transcriptionSession.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    return NextResponse.json({ message: 'Sessão excluída com sucesso' })

  } catch (error) {
    console.error('Erro ao excluir sessão de transcrição:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}