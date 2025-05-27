import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma/client'
import { supabase, STORAGE_BUCKET, generateUniqueFileName, isAllowedFileType, MAX_FILE_SIZE, MAX_TOTAL_SIZE } from '@/lib/supabase/client'

// GET /api/clients/[clientId]/attachments - Listar anexos do cliente
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

    // Buscar anexos do cliente
    const attachments = await prisma.clientAttachment.findMany({
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

    return NextResponse.json({ attachments })
  } catch (error) {
    console.error('Erro ao buscar anexos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/clients/[clientId]/attachments - Upload de arquivos
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

    // Verificar tamanho total atual dos anexos
    const currentAttachments = await prisma.clientAttachment.findMany({
      where: {
        clientId: clientId,
        userId: userId,
      },
      select: {
        sizeBytes: true,
      },
    })

    const currentTotalSize = currentAttachments.reduce(
      (total, attachment) => total + (attachment.sizeBytes || 0),
      0
    )

    const formData = await request.formData()
    const files = formData.getAll('files')

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validar arquivos
    const uploadedFiles: any[] = []
    let totalNewSize = 0

    for (const file of files) {
      // Verificar se é um arquivo válido
      if (!(file instanceof File)) {
        continue
      }

      // Validar tipo
      if (!isAllowedFileType(file.type)) {
        return NextResponse.json(
          { error: `Tipo de arquivo não permitido: ${file.type}` },
          { status: 400 }
        )
      }

      // Validar tamanho individual
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Arquivo muito grande: ${file.name} (máx 25MB)` },
          { status: 400 }
        )
      }

      totalNewSize += file.size
    }

    // Validar tamanho total
    if (currentTotalSize + totalNewSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: 'Limite total de 30MB por cliente excedido' },
        { status: 400 }
      )
    }

    // Upload dos arquivos
    for (const file of files) {
      // Verificar se é um arquivo válido
      if (!(file instanceof File)) {
        continue
      }

      try {
        const fileName = generateUniqueFileName(file.name, userId)
        const fileBuffer = await file.arrayBuffer()

        // Upload para Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: false,
          })

        if (uploadError) {
          console.error('Erro no upload:', uploadError)
          return NextResponse.json(
            { error: `Erro ao fazer upload do arquivo: ${file.name}` },
            { status: 500 }
          )
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(fileName)

        // Salvar no banco
        const attachment = await prisma.clientAttachment.create({
          data: {
            id: crypto.randomUUID(),
            fileName: file.name,
            fileUrl: urlData.publicUrl,
            fileType: file.type,
            sizeBytes: file.size,
            clientId: clientId,
            userId: userId,
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

        uploadedFiles.push(attachment)
      } catch (fileError) {
        console.error(`Erro ao processar arquivo ${file.name}:`, fileError)
        return NextResponse.json(
          { error: `Erro ao processar arquivo: ${file.name}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ 
      attachments: uploadedFiles,
      message: `${uploadedFiles.length} arquivo(s) enviado(s) com sucesso`
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 