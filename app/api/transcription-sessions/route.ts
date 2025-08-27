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
  agentType: z.enum(['GENERALISTA', 'ESPECIALISTA']).default('ESPECIALISTA'),
  spinQuestions: z.object({
    situation: z.string().min(1, 'Situação é obrigatória').max(500, 'Máximo de 500 caracteres'),
    problem: z.string().min(1, 'Problema é obrigatório').max(500, 'Máximo de 500 caracteres'),
    implication: z.string().min(1, 'Implicação é obrigatória').max(500, 'Máximo de 500 caracteres'),
    solutionNeed: z.string().min(1, 'Solução é obrigatória').max(500, 'Máximo de 500 caracteres')
  })
})

// Helper function to get date range based on period
function getDateRangeStart(period: string): Date {
  const now = new Date()
  
  switch (period) {
    case 'today':
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return today
    
    case 'thisWeek':
      const thisWeek = new Date()
      const dayOfWeek = thisWeek.getDay()
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday as start of week
      thisWeek.setDate(thisWeek.getDate() - daysToSubtract)
      thisWeek.setHours(0, 0, 0, 0)
      return thisWeek
    
    case 'thisMonth':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    
    default:
      // Default to this week
      const defaultWeek = new Date()
      const defaultDayOfWeek = defaultWeek.getDay()
      const defaultDaysToSubtract = defaultDayOfWeek === 0 ? 6 : defaultDayOfWeek - 1
      defaultWeek.setDate(defaultWeek.getDate() - defaultDaysToSubtract)
      defaultWeek.setHours(0, 0, 0, 0)
      return defaultWeek
  }
}

// Helper function to calculate aggregated metrics
function calculateMetrics(sessions: any[]) {
  const totalSessions = sessions.length
  const totalDurationSeconds = sessions.reduce((acc, s) => acc + (s.totalDuration || 0), 0)
  const totalAnalyses = sessions.reduce((acc, s) => acc + (s.analysisCount || 0), 0)
  
  // Format total duration
  const totalHours = Math.floor(totalDurationSeconds / 3600)
  const totalMinutes = Math.floor((totalDurationSeconds % 3600) / 60)
  const transcriptionTime = totalHours > 0 
    ? `${totalHours}h ${totalMinutes}m`
    : `${totalMinutes}min`
  
  return {
    totalSessions,
    transcriptionTime,
    analysesCompleted: totalAnalyses
  }
}

// GET /api/transcription-sessions - List sessions with period filtering and metrics
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromClerk()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'thisWeek'
    
    // Calculate date range based on period
    const dateRangeStart = getDateRangeStart(period)
    
    const whereConditions = {
      userId,
      deletedAt: null, // Only non-deleted sessions
      createdAt: {
        gte: dateRangeStart
      }
    }
    
    const sessions = await prisma.transcriptionSession.findMany({
      where: whereConditions,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sessionName: true,
        companyName: true,
        totalDuration: true,
        analysisCount: true,
        analyses: true,
        createdAt: true,
        connectTime: true
      }
    })
    
    // Calculate aggregated metrics
    const metrics = calculateMetrics(sessions)
    
    // Serialize dates to strings for Next.js compatibility
    const serializedSessions = sessions.map(session => ({
      ...session,
      createdAt: session.createdAt.toISOString(),
      connectTime: session.connectTime?.toISOString() || null
    }))
    
    return NextResponse.json({ sessions: serializedSessions, metrics })

  } catch (error) {
    console.error('Erro ao buscar sessões de transcrição:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

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
        agentType: validatedData.agentType,
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