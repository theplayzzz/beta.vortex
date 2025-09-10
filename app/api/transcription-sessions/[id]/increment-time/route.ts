import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromClerk } from '@/lib/auth/auth-wrapper'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

const IncrementTimeSchema = z.object({
  increment: z.number().min(1).max(300).default(15), // Entre 1s e 5min, padrão 15s
  source: z.string().optional().default('client-15s-timer'),
  metadata: z.record(z.any()).optional()
})

export async function POST(
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

    // Suporte para JSON e FormData (sendBeacon)
    let body
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // FormData do sendBeacon
      const formData = await request.formData()
      const dataString = formData.get('data') as string
      body = JSON.parse(dataString)
    } else {
      // JSON normal
      body = await request.json()
    }
    
    const validatedData = IncrementTimeSchema.parse(body)
    const { increment, source, metadata } = validatedData

    console.log(`[AUDIT] Incrementando ${increment}s na sessão ${id} (fonte: ${source})`)

    // Validação de segurança - verificar se sessão existe e pertence ao usuário
    const session = await prisma.transcriptionSession.findFirst({
      where: { 
        id,
        userId
      },
      select: { 
        id: true,
        isActive: true, 
        totalDuration: true,
        sessionName: true
      }
    })
    
    if (!session) {
      console.warn(`[AUDIT] Tentativa de incremento em sessão inexistente/não autorizada: ${id} por usuário ${userId}`)
      return NextResponse.json({ error: 'Sessão não encontrada ou não autorizada' }, { status: 404 })
    }
    
    // Validação de estado - sessão deve estar ativa para aceitar incrementos
    if (!session.isActive) {
      console.warn(`[AUDIT] Tentativa de incremento em sessão inativa: ${id}`)
      return NextResponse.json({ 
        error: 'Sessão não está ativa - incrementos não são permitidos',
        sessionState: 'inactive' 
      }, { status: 400 })
    }

    // Rate limiting simples - máximo 1 incremento por 10 segundos para prevenir spam
    const tenSecondsAgo = new Date(Date.now() - 10000)
    const recentIncrement = await prisma.transcriptionSession.findFirst({
      where: {
        id,
        updatedAt: {
          gte: tenSecondsAgo
        }
      }
    })

    if (recentIncrement && source === 'client-15s-timer') {
      console.warn(`[AUDIT] Rate limit: incremento muito recente na sessão ${id}`)
      return NextResponse.json({ 
        error: 'Rate limit: aguarde alguns segundos antes do próximo incremento',
        rateLimited: true 
      }, { status: 429 })
    }
    
    // Incrementar tempo com proteção contra duplicação usando transação atômica
    const updatedSession = await prisma.transcriptionSession.update({
      where: { id },
      data: {
        totalDuration: {
          increment: increment
        },
        lastUpdateAt: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        totalDuration: true,
        sessionName: true,
        isActive: true
      }
    })

    // Log detalhado para auditoria
    console.log(`[AUDIT] Sessão ${id} (${updatedSession.sessionName}): incremento de ${increment}s aplicado com sucesso`)
    console.log(`[AUDIT] Total atual: ${updatedSession.totalDuration}s | Fonte: ${source} | User: ${userId}`)
    
    // Log de metadata se fornecido
    if (metadata) {
      console.log(`[AUDIT] Metadata do incremento:`, metadata)
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        sessionId: updatedSession.id,
        sessionName: updatedSession.sessionName,
        totalDuration: updatedSession.totalDuration,
        lastIncrement: increment,
        incrementSource: source,
        isActive: updatedSession.isActive,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error(`[ERROR] Falha ao incrementar tempo na sessão:`, error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados de incremento inválidos', 
        details: error.errors 
      }, { status: 400 })
    }

    // Tratamento especial para erros de concorrência do Prisma
    if (error instanceof Error && error.message.includes('RecordNotFound')) {
      return NextResponse.json({ 
        error: 'Sessão foi removida durante a operação' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Suporte para outros métodos HTTP para debugging (apenas em desenvolvimento)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Método não permitido em produção' }, { status: 405 })
  }

  const { id } = await params
  
  try {
    const session = await prisma.transcriptionSession.findUnique({
      where: { id },
      select: {
        id: true,
        sessionName: true,
        totalDuration: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastUpdateAt: true
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      debug: true,
      session,
      incrementEndpoint: `/api/transcription-sessions/${id}/increment-time`,
      lastUpdate: session.lastUpdateAt || session.updatedAt
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro ao buscar informações da sessão',
      debug: true 
    }, { status: 500 })
  }
}
