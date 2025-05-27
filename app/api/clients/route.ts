import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromClerk } from '@/lib/auth/auth-wrapper'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

// Schema para criação de cliente
const CreateClientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  industry: z.string().optional(),
  serviceOrProduct: z.string().optional(),
  initialObjective: z.string().optional(),
})

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
    const userId = await getUserIdFromClerk()
    
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

    // 🚀 OTIMIZAÇÃO 1: Verificar se precisa buscar industries (apenas na primeira página sem filtros)
    const needsIndustries = validatedFilters.page === 1 && 
                           !validatedFilters.search && 
                           (!validatedFilters.industry || validatedFilters.industry.length === 0)

    // 🚀 OTIMIZAÇÃO 2: Usar LIMIT+1 para verificar próxima página em vez de COUNT quando possível
    const useOptimizedPagination = validatedFilters.page > 1 && !validatedFilters.search && 
                                  (!validatedFilters.industry || validatedFilters.industry.length === 0)
    
    const limitPlusOne = validatedFilters.limit + 1

    // 🚀 OTIMIZAÇÃO 3: Combinar queries com Promise.all otimizado
    const queries = []

    // Query principal de clientes
    queries.push(
      prisma.client.findMany({
        where: whereConditions,
        orderBy: orderBy,
        skip: offset,
        take: useOptimizedPagination ? limitPlusOne : validatedFilters.limit,
        select: {
          id: true,
          name: true,
          industry: true,
          serviceOrProduct: true,
          initialObjective: true,
          contactEmail: true,
          richnessScore: true,
          isViewed: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              ClientNote: true,
              ClientAttachment: true,
            },
          },
        },
      })
    )

    // Query de contagem (apenas quando necessário)
    if (!useOptimizedPagination) {
      queries.push(
        prisma.client.count({
          where: whereConditions,
        })
      )
    } else {
      queries.push(Promise.resolve(0)) // Placeholder
    }

    // Query de industries (apenas quando necessário)
    if (needsIndustries) {
      queries.push(
        prisma.client.findMany({
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
      )
    } else {
      queries.push(Promise.resolve([])) // Placeholder
    }

    // Executar todas as queries em paralelo
    const results = await Promise.all(queries)
    const clientsRaw = results[0] as any[]
    const totalCount = results[1] as number
    const industriesRaw = results[2] as { industry: string | null }[]

    // Processar resultados da paginação otimizada
    let clients, hasNextPage, totalPages

    if (useOptimizedPagination) {
      hasNextPage = clientsRaw.length > validatedFilters.limit
      clients = hasNextPage ? clientsRaw.slice(0, validatedFilters.limit) : clientsRaw
      totalPages = hasNextPage ? validatedFilters.page + 1 : validatedFilters.page
    } else {
      clients = clientsRaw
      hasNextPage = validatedFilters.page < Math.ceil(totalCount / validatedFilters.limit)
      totalPages = Math.ceil(totalCount / validatedFilters.limit)
    }

    const hasPreviousPage = validatedFilters.page > 1

    return NextResponse.json({
      clients,
      pagination: {
        page: validatedFilters.page,
        limit: validatedFilters.limit,
        totalCount: useOptimizedPagination ? null : totalCount, // null quando não calculado
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
      filters: {
        industries: needsIndustries ? industriesRaw.map(i => i.industry).filter(Boolean) : [],
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

// POST /api/clients - Criar novo cliente
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromClerk()
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Validar dados
    const validatedData = CreateClientSchema.parse(body)

    // Calcular richnessScore inicial (baseado em todos os 16 campos possíveis)
    const allFields = [
      'industry', 'serviceOrProduct', 'initialObjective', 'contactEmail', 
      'contactPhone', 'website', 'address', 'businessDetails', 'targetAudience',
      'marketingObjectives', 'historyAndStrategies', 'challengesOpportunities',
      'competitors', 'resourcesBudget', 'toneOfVoice', 'preferencesRestrictions'
    ]
    
    const filledFields = allFields.filter(field => {
      const value = validatedData[field as keyof typeof validatedData]
      return value && value.toString().trim().length > 0
    })

    const initialRichnessScore = Math.round((filledFields.length / allFields.length) * 100)

    // Criar cliente
    const client = await prisma.client.create({
      data: {
        name: validatedData.name,
        industry: validatedData.industry || null,
        serviceOrProduct: validatedData.serviceOrProduct || null,
        initialObjective: validatedData.initialObjective || null,
        richnessScore: initialRichnessScore,
        userId: userId,
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

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao criar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 