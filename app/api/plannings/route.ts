import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';
import { webhookService } from '@/lib/planning/webhookService';

// Schema para validação de filtros
const FiltersSchema = z.object({
  status: z.string().optional().nullable().transform(val => val || undefined),
  clientId: z.string().optional().nullable().transform(val => val || undefined),
  search: z.string().optional().nullable().transform(val => val || undefined),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// Schema para criação de planejamento
const CreatePlanningSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  formDataJSON: z.any().optional(),
  clientSnapshot: z.any().optional(),
});

// GET /api/plannings - Listar planejamentos do usuário
export async function GET(request: NextRequest) {
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
        { description: { contains: filters.search, mode: 'insensitive' } },
        { Client: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit;

    // Fetch plannings with client data
    const [plannings, total] = await Promise.all([
      prisma.strategicPlanning.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          specificObjectives: true,
          createdAt: true,
          updatedAt: true,
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
      prisma.strategicPlanning.count({ where }),
    ]);

    return NextResponse.json({
      plannings,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    });

  } catch (error) {
    console.error('Error fetching plannings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/plannings - Criar novo planejamento
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
    const data = CreatePlanningSchema.parse(body);

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

    // ✅ AÇÃO 1: SALVAR NO BANCO (PRIORITÁRIA)
    console.log('💾 Criando planejamento no banco de dados...');
    const planning = await prisma.strategicPlanning.create({
      data: {
        title: data.title,
        description: data.description,
        clientId: data.clientId,
        userId: user.id,
        formDataJSON: data.formDataJSON,
        clientSnapshot: data.clientSnapshot || client,
        status: 'DRAFT',
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

    console.log('✅ Planejamento criado no banco:', planning.id);

    // ✅ AÇÃO 2: WEBHOOK INDEPENDENTE (FIRE-AND-FORGET)
    console.log('📡 Disparando webhook de forma assíncrona...');
    
    // Disparo totalmente assíncrono - não aguarda nem bloqueia a resposta
    webhookService.triggerWebhookAsync(
      planning.id,
      client,
      data.formDataJSON,
      user.id
    ).catch(error => {
      // Log interno apenas - não afeta a resposta
      console.error(`🚨 Erro interno no webhook service para planning ${planning.id}:`, error);
    });

    console.log('🚀 Resposta sendo enviada imediatamente (webhook processando em background)');

    // ✅ RESPOSTA IMEDIATA - Webhook não influencia o resultado
    return NextResponse.json(planning, { status: 201 });

  } catch (error) {
    console.error('❌ Erro ao criar planejamento:', error);
    
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