import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma/client'

// POST /api/clients/[clientId]/restore - Restaurar cliente deletado
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { clientId } = await params

    // Verificar se o cliente existe, está deletado e pertence ao usuário
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: userId,
        deletedAt: {
          not: null, // Deve estar deletado para poder restaurar
        },
      },
    })

    if (!existingClient) {
      return NextResponse.json({ 
        error: 'Cliente não encontrado ou não está arquivado' 
      }, { status: 404 })
    }

    // Restaurar cliente (remover deletedAt)
    const restoredClient = await prisma.client.update({
      where: {
        id: clientId,
      },
      data: {
        deletedAt: null,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            notes: true,
            attachments: true,
            strategicPlannings: true,
            tasks: true,
          },
        },
      },
    })

    return NextResponse.json({ 
      message: 'Cliente restaurado com sucesso',
      client: restoredClient 
    })
  } catch (error) {
    console.error('Erro ao restaurar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 