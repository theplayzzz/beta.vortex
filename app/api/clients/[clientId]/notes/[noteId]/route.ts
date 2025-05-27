import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma/client'
import { UpdateClientNoteSchema } from '@/lib/validations/client-notes'
import { z } from 'zod'

// PUT /api/clients/[clientId]/notes/[noteId] - Atualizar nota
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; noteId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { clientId, noteId } = await params
    const body = await request.json()

    // Validar dados
    const validatedData = UpdateClientNoteSchema.parse(body)

    // Verificar se a nota pertence ao usuário e cliente
    const existingNote = await prisma.clientNote.findFirst({
      where: {
        id: noteId,
        clientId: clientId,
        userId: userId,
      },
    })

    if (!existingNote) {
      return NextResponse.json({ error: 'Nota não encontrada' }, { status: 404 })
    }

    // Atualizar nota
    const updatedNote = await prisma.clientNote.update({
      where: {
        id: noteId,
      },
      data: {
        content: validatedData.content,
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

    return NextResponse.json({ note: updatedNote })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar nota:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[clientId]/notes/[noteId] - Deletar nota
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; noteId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { clientId, noteId } = await params

    // Verificar se a nota pertence ao usuário e cliente
    const existingNote = await prisma.clientNote.findFirst({
      where: {
        id: noteId,
        clientId: clientId,
        userId: userId,
      },
    })

    if (!existingNote) {
      return NextResponse.json({ error: 'Nota não encontrada' }, { status: 404 })
    }

    // Deletar nota
    await prisma.clientNote.delete({
      where: {
        id: noteId,
      },
    })

    return NextResponse.json({ message: 'Nota deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar nota:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 