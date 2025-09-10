import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth/current-user'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

// Schema para validação da busca
const SearchSchema = z.object({
  q: z.string().min(2, 'Query deve ter pelo menos 2 caracteres').max(100),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
})

interface SearchResult {
  id: string;
  type: 'client' | 'note' | 'attachment';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  metadata?: {
    clientName?: string;
    createdAt?: string;
    richnessScore?: number;
    fileType?: string;
    sizeBytes?: number;
  };
}

// GET /api/search - Busca global
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Extrair e validar parâmetros
    const { searchParams } = new URL(request.url)
    const params = {
      q: searchParams.get('q') || '',
      limit: searchParams.get('limit') || undefined,
    }

    const { q: query, limit } = SearchSchema.parse(params)

    const results: SearchResult[] = []

    // Buscar clientes
    const clients = await prisma.client.findMany({
      where: {
        userId: userId,
        deletedAt: null,
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            industry: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            serviceOrProduct: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            initialObjective: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        industry: true,
        serviceOrProduct: true,
        initialObjective: true,
        richnessScore: true,
        createdAt: true,
      },
      take: Math.floor(limit * 0.5), // 50% dos resultados para clientes
      orderBy: [
        { richnessScore: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Adicionar clientes aos resultados
    clients.forEach(client => {
      results.push({
        id: client.id,
        type: 'client',
        title: client.name,
        subtitle: client.industry || undefined,
        description: client.serviceOrProduct || client.initialObjective || undefined,
        url: `/clientes/${client.id}`,
        metadata: {
          richnessScore: client.richnessScore,
          createdAt: client.createdAt.toISOString(),
        },
      })
    })

    // Buscar notas (com consulta separada para o cliente)
    const notes = await prisma.clientNote.findMany({
      where: {
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        clientId: true,
        userId: true,
      },
      take: Math.floor(limit * 0.3), // 30% dos resultados para notas
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Para cada nota, buscar informações do cliente e usuário
    for (const note of notes) {
      const client = await prisma.client.findFirst({
        where: {
          id: note.clientId,
          userId: userId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
        },
      })

      const user = await prisma.user.findFirst({
        where: {
          id: note.userId,
        },
        select: {
          firstName: true,
          lastName: true,
        },
      })

      if (client && user) {
        // Truncar conteúdo para preview
        const preview = note.content.length > 150 
          ? note.content.substring(0, 150) + '...'
          : note.content

        results.push({
          id: note.id,
          type: 'note',
          title: `Nota de ${user.firstName} ${user.lastName}`,
          subtitle: client.name,
          description: preview,
          url: `/clientes/${client.id}#nota-${note.id}`,
          metadata: {
            clientName: client.name,
            createdAt: note.createdAt.toISOString(),
          },
        })
      }
    }

    // Buscar anexos (com consulta separada para o cliente)
    const attachments = await prisma.clientAttachment.findMany({
      where: {
        fileName: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        sizeBytes: true,
        createdAt: true,
        clientId: true,
      },
      take: Math.floor(limit * 0.2), // 20% dos resultados para anexos
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Para cada anexo, buscar informações do cliente
    for (const attachment of attachments) {
      const client = await prisma.client.findFirst({
        where: {
          id: attachment.clientId,
          userId: userId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
        },
      })

      if (client) {
        results.push({
          id: attachment.id,
          type: 'attachment',
          title: attachment.fileName,
          subtitle: client.name,
          description: `Arquivo ${attachment.fileType}`,
          url: `/clientes/${client.id}#anexo-${attachment.id}`,
          metadata: {
            clientName: client.name,
            createdAt: attachment.createdAt.toISOString(),
            fileType: attachment.fileType,
            sizeBytes: attachment.sizeBytes || 0,
          },
        })
      }
    }

    // Ordenar resultados por relevância (clientes primeiro, depois por data)
    results.sort((a, b) => {
      // Priorizar clientes
      if (a.type === 'client' && b.type !== 'client') return -1
      if (b.type === 'client' && a.type !== 'client') return 1
      
      // Depois ordenar por data de criação (mais recente primeiro)
      const dateA = new Date(a.metadata?.createdAt || 0)
      const dateB = new Date(b.metadata?.createdAt || 0)
      return dateB.getTime() - dateA.getTime()
    })

    return NextResponse.json({
      results: results.slice(0, limit),
      query,
      totalFound: results.length,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro na busca global:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 