import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma/client'
import { CreateClientNoteSchema } from '@/lib/validations/client-notes'
import { z } from 'zod'

// GET /api/clients/[clientId]/notes - Listar notas do cliente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { clientId } = await params

    // Verificar se o cliente pertence ao usuário
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: userId,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Buscar notas do cliente
    const notes = await prisma.clientNote.findMany({
      where: {
        clientId: clientId,
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Erro ao buscar notas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/clients/[clientId]/notes - Criar nova nota
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
    const body = await request.json()

    // Validar dados
    const validatedData = CreateClientNoteSchema.parse({
      ...body,
      clientId,
    })

    // Verificar se o cliente pertence ao usuário
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: userId,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Criar nota
    const note = await prisma.clientNote.create({
      data: {
        content: validatedData.content,
        clientId: validatedData.clientId,
        userId: userId,
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
    })

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao criar nota:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 