import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromClerk } from '@/lib/auth/auth-wrapper'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

// Schema para atualização de cliente
const UpdateClientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  industry: z.string().optional(),
  serviceOrProduct: z.string().optional(),
  initialObjective: z.string().optional(),
  contactEmail: z.string().email('E-mail inválido').optional(),
  contactPhone: z.string().optional(),
  website: z.string().url('URL inválida').optional(),
  address: z.string().optional(),
  businessDetails: z.string().optional(),
  targetAudience: z.string().optional(),
  marketingObjectives: z.string().optional(),
  historyAndStrategies: z.string().optional(),
  challengesOpportunities: z.string().optional(),
  competitors: z.string().optional(),
  resourcesBudget: z.string().optional(),
  toneOfVoice: z.string().optional(),
  preferencesRestrictions: z.string().optional(),
})

// GET /api/clients/[clientId] - Obter cliente específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const userId = await getUserIdFromClerk()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { clientId } = await params

    // Buscar cliente (incluindo deletados se especificado)
    const { searchParams } = new URL(request.url)
    const includeDeleted = searchParams.get('includeDeleted') === 'true'

    const whereCondition: any = {
      id: clientId,
      userId: userId,
    }

    if (!includeDeleted) {
      whereCondition.deletedAt = null
    }

    const client = await prisma.client.findFirst({
      where: whereCondition,
      include: {
        _count: {
          select: {
            ClientNote: true,
            ClientAttachment: true,
            StrategicPlanning: true,
            PlanningTask: true,
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Marcar como visualizado se ainda não foi
    if (!client.isViewed) {
      await prisma.client.update({
        where: { id: clientId },
        data: { isViewed: true }
      })
      client.isViewed = true
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/clients/[clientId] - Atualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const userId = await getUserIdFromClerk()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { clientId } = await params
    const body = await request.json()

    // Validar dados
    const validatedData = UpdateClientSchema.parse(body)

    // Verificar se o cliente existe e pertence ao usuário
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: userId,
        deletedAt: null, // Não permitir editar clientes deletados
      },
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Calcular novo richnessScore
    const fields = [
      'industry', 'serviceOrProduct', 'initialObjective', 'contactEmail', 
      'contactPhone', 'website', 'address', 'businessDetails', 'targetAudience',
      'marketingObjectives', 'historyAndStrategies', 'challengesOpportunities',
      'competitors', 'resourcesBudget', 'toneOfVoice', 'preferencesRestrictions'
    ]

    const updatedData = { ...existingClient, ...validatedData }
    const filledFields = fields.filter(field => {
      const value = updatedData[field as keyof typeof updatedData]
      return value && value.toString().trim().length > 0
    })

    const newRichnessScore = Math.round((filledFields.length / fields.length) * 100)

    // Atualizar cliente
    const updatedClient = await prisma.client.update({
      where: {
        id: clientId,
      },
      data: {
        ...validatedData,
        richnessScore: newRichnessScore,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            ClientNote: true,
            ClientAttachment: true,
            StrategicPlanning: true,
            PlanningTask: true,
          },
        },
      },
    })

    return NextResponse.json({ client: updatedClient })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[clientId] - Soft delete do cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const userId = await getUserIdFromClerk()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { clientId } = await params

    // Verificar se o cliente existe e pertence ao usuário
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: userId,
        deletedAt: null, // Só pode deletar se não estiver já deletado
      },
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Fazer soft delete
    const deletedClient = await prisma.client.update({
      where: {
        id: clientId,
      },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ 
      message: 'Cliente arquivado com sucesso',
      client: deletedClient 
    })
  } catch (error) {
    console.error('Erro ao arquivar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 