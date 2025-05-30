import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

// Schema para validação de filtros
const FiltersSchema = z.object({
  status: z.string().optional().nullable().transform(val => val || undefined),
  clientId: z.string().optional().nullable().transform(val => val || undefined),
  search: z.string().optional().nullable().transform(val => val || undefined),
  page: z
    .string()
    .optional()
    .nullable()
    .transform(val => {
      if (!val) return 1;
      const num = parseInt(val);
      return isNaN(num) || num < 1 ? 1 : num;
    }),
  limit: z
    .string()
    .optional()
    .nullable()
    .transform(val => {
      if (!val) return 10;
      const num = parseInt(val);
      return isNaN(num) || num < 1 ? 10 : num > 100 ? 100 : num;
    }),
});

// Schema para criação de proposta
const CreateProposalSchema = z.object({
  titulo_proposta: z.string().min(1, 'Título é obrigatório'),
  tipo_proposta: z.string().min(1, 'Tipo é obrigatório'),
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  modalidade_entrega: z.string().min(1, 'Modalidade é obrigatória'),
  servicos_incluidos: z.array(z.string()).min(1, 'Pelo menos um serviço é obrigatório'),
  urgencia_projeto: z.string().min(1, 'Urgência é obrigatória'),
  tomador_decisao: z.string().min(1, 'Tomador de decisão é obrigatório'),
  descricao_objetivo: z.string().optional(),
  prazo_estimado: z.string().optional(),
  orcamento_estimado: z.string().optional(),
  requisitos_especiais: z.string().optional(),
  concorrentes_considerados: z.string().optional(),
  contexto_adicional: z.string().optional(),
});

// GET /api/proposals - Listar propostas do usuário
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = FiltersSchema.parse({
      status: searchParams.get('status'),
      clientId: searchParams.get('clientId'),
      search: searchParams.get('search'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    // Build where clause
    const where: any = {
      userId: user.id,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { Client: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit;

    // Fetch proposals with client data
    const [proposals, total] = await Promise.all([
      prisma.commercialProposal.findMany({
        where,
        include: {
          Client: {
            select: {
              id: true,
              name: true,
              industry: true,
              richnessScore: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: filters.limit,
      }),
      prisma.commercialProposal.count({ where }),
    ]);

    return NextResponse.json({
      proposals,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    });

  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/proposals - Criar nova proposta (rascunho inicial)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const data = CreateProposalSchema.parse(body);

    // Verificar se o cliente existe e pertence ao usuário
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        userId: user.id,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or not owned by user' },
        { status: 404 }
      );
    }

    // Criar proposta inicial como rascunho
    const proposal = await prisma.commercialProposal.create({
      data: {
        title: data.titulo_proposta,
        clientId: data.clientId,
        userId: user.id,
        status: 'DRAFT',
        updatedAt: new Date(),
        // Dados do formulário como JSON - salvos no generatedContent temporariamente
        generatedContent: JSON.stringify({
          formData: {
            titulo_proposta: data.titulo_proposta,
            tipo_proposta: data.tipo_proposta,
            modalidade_entrega: data.modalidade_entrega,
            servicos_incluidos: data.servicos_incluidos,
            urgencia_projeto: data.urgencia_projeto,
            tomador_decisao: data.tomador_decisao,
            descricao_objetivo: data.descricao_objetivo,
            prazo_estimado: data.prazo_estimado,
            orcamento_estimado: data.orcamento_estimado,
            requisitos_especiais: data.requisitos_especiais,
            concorrentes_considerados: data.concorrentes_considerados,
            contexto_adicional: data.contexto_adicional,
          },
          clientSnapshot: client,
          status: 'draft'
        }),
      },
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            industry: true,
            richnessScore: true,
            businessDetails: true,
            contactEmail: true,
            website: true,
          },
        },
      },
    });

    return NextResponse.json(proposal, { status: 201 });

  } catch (error) {
    console.error('Error creating proposal:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 