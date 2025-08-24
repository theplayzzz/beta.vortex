import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromClerk } from '@/lib/auth/auth-wrapper'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

const UpdateTranscriptionSessionSchema = z.object({
  connectTime: z.string().datetime().optional(),
  totalDuration: z.number().min(0).optional(),
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
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromClerk()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const session = await prisma.transcriptionSession.findFirst({
      where: {
        id: params.id,
        userId
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
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
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromClerk()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = UpdateTranscriptionSessionSchema.parse(body)

    const existingSession = await prisma.transcriptionSession.findFirst({
      where: {
        id: params.id,
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
    
    if (validatedData.totalDuration !== undefined) {
      updateData.totalDuration = validatedData.totalDuration
    }
    
    if (validatedData.analysisCount !== undefined) {
      updateData.analysisCount = validatedData.analysisCount
    }
    
    if (validatedData.analyses) {
      updateData.analyses = validatedData.analyses
    }

    const updatedSession = await prisma.transcriptionSession.update({
      where: {
        id: params.id
      },
      data: updateData
    })

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