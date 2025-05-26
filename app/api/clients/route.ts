import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

// Schema para validação dos filtros
const ClientFiltersSchema = z.object({
  search: z.string().optional(),
  industry: z.array(z.string()).optional(),
  richnessScoreMin: z.coerce.number().min(0).max(100).optional(),
  richnessScoreMax: z.coerce.number().min(0).max(100).optional(),
  sortBy: z.enum(['name', 'richnessScore', 'createdAt', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(12),
  includeArchived: z.coerce.boolean().optional().default(false),
})

// GET /api/clients - Listar clientes com filtros
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Extrair parâmetros da URL
    const { searchParams } = new URL(request.url)
    const filters = {
      search: searchParams.get('search') || undefined,
      industry: searchParams.getAll('industry').filter(Boolean),
      richnessScoreMin: searchParams.get('richnessScoreMin') || undefined,
      richnessScoreMax: searchParams.get('richnessScoreMax') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      includeArchived: searchParams.get('includeArchived') || undefined,
    }

    // Validar filtros
    const validatedFilters = ClientFiltersSchema.parse(filters)

    // Construir condições WHERE
    const whereConditions: any = {
      userId: userId,
    }

    // Filtro de busca por nome
    if (validatedFilters.search) {
      whereConditions.name = {
        contains: validatedFilters.search,
        mode: 'insensitive',
      }
    }

    // Filtro por setor
    if (validatedFilters.industry && validatedFilters.industry.length > 0) {
      whereConditions.industry = {
        in: validatedFilters.industry,
      }
    }

    // Filtro por richnessScore
    if (validatedFilters.richnessScoreMin !== undefined || validatedFilters.richnessScoreMax !== undefined) {
      whereConditions.richnessScore = {}
      
      if (validatedFilters.richnessScoreMin !== undefined) {
        whereConditions.richnessScore.gte = validatedFilters.richnessScoreMin
      }
      
      if (validatedFilters.richnessScoreMax !== undefined) {
        whereConditions.richnessScore.lte = validatedFilters.richnessScoreMax
      }
    }

    // Filtro de arquivados (soft delete)
    if (!validatedFilters.includeArchived) {
      whereConditions.deletedAt = null
    }

    // Configurar ordenação
    const orderBy: any = {}
    orderBy[validatedFilters.sortBy] = validatedFilters.sortOrder

    // Calcular offset para paginação
    const offset = (validatedFilters.page - 1) * validatedFilters.limit

    // Buscar clientes com contagem total
    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany({
        where: whereConditions,
        orderBy: orderBy,
        skip: offset,
        take: validatedFilters.limit,
        select: {
          id: true,
          name: true,
          industry: true,
          serviceOrProduct: true,
          initialObjective: true,
          contactEmail: true,
          richnessScore: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              notes: true,
              attachments: true,
            },
          },
        },
      }),
      prisma.client.count({
        where: whereConditions,
      }),
    ])

    // Buscar setores únicos para filtros
    const industries = await prisma.client.findMany({
      where: {
        userId: userId,
        industry: {
          not: null,
        },
      },
      select: {
        industry: true,
      },
      distinct: ['industry'],
      orderBy: {
        industry: 'asc',
      },
    })

    // Calcular metadados de paginação
    const totalPages = Math.ceil(totalCount / validatedFilters.limit)
    const hasNextPage = validatedFilters.page < totalPages
    const hasPreviousPage = validatedFilters.page > 1

    return NextResponse.json({
      clients,
      pagination: {
        page: validatedFilters.page,
        limit: validatedFilters.limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
      filters: {
        industries: industries.map(i => i.industry).filter(Boolean),
        appliedFilters: validatedFilters,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Filtros inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao buscar clientes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 