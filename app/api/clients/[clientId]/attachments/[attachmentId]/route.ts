import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma/client'
import { supabase, STORAGE_BUCKET } from '@/lib/supabase/client'

// DELETE /api/clients/[clientId]/attachments/[attachmentId] - Deletar anexo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string; attachmentId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { clientId, attachmentId } = await params

    // Verificar se o anexo pertence ao usuário e cliente
    const existingAttachment = await prisma.clientAttachment.findFirst({
      where: {
        id: attachmentId,
        clientId: clientId,
        userId: userId,
      },
    })

    if (!existingAttachment) {
      return NextResponse.json({ error: 'Anexo não encontrado' }, { status: 404 })
    }

    // Extrair o caminho do arquivo da URL
    const url = new URL(existingAttachment.fileUrl)
    const filePath = url.pathname.split('/').slice(-2).join('/') // userId/filename

    try {
      // Deletar do Supabase Storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath])

      if (storageError) {
        console.error('Erro ao deletar do storage:', storageError)
        // Continua mesmo com erro no storage para limpar o banco
      }
    } catch (storageError) {
      console.error('Erro ao deletar do storage:', storageError)
      // Continua mesmo com erro no storage
    }

    // Deletar do banco
    await prisma.clientAttachment.delete({
      where: {
        id: attachmentId,
      },
    })

    return NextResponse.json({ message: 'Anexo deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar anexo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 