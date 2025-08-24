import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromClerk } from '@/lib/auth/auth-wrapper'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

const CreateTranscriptionSessionSchema = z.object({
  sessionName: z.string().min(1, 'Nome da sessão é obrigatório'),
  companyName: z.string().min(1, 'Nome da empresa é obrigatório').max(90, 'Máximo de 90 caracteres'),
  industry: z.string().min(1, 'Indústria é obrigatória'),
  customIndustry: z.string().optional(),
  revenue: z.string().min(1, 'Faturamento é obrigatório'),
  spinQuestions: z.object({
    situation: z.string().min(1, 'Situação é obrigatória').max(500, 'Máximo de 500 caracteres'),
    problem: z.string().min(1, 'Problema é obrigatório').max(500, 'Máximo de 500 caracteres'),
    implication: z.string().min(1, 'Implicação é obrigatória').max(500, 'Máximo de 500 caracteres'),
    solutionNeed: z.string().min(1, 'Solução é obrigatória').max(500, 'Máximo de 500 caracteres')
  })
})

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromClerk()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CreateTranscriptionSessionSchema.parse(body)

    const session = await prisma.transcriptionSession.create({
      data: {
        sessionName: validatedData.sessionName,
        companyName: validatedData.companyName,
        industry: validatedData.industry,
        customIndustry: validatedData.customIndustry,
        revenue: validatedData.revenue,
        spinQuestions: validatedData.spinQuestions,
        analysisCount: 0,
        analyses: [],
        userId
      }
    })

    return NextResponse.json({ 
      success: true, 
      sessionId: session.id,
      session 
    })

  } catch (error) {
    console.error('Erro ao criar sessão de transcrição:', error)
    
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