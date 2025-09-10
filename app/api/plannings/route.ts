import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requirePermission } from '@/lib/auth/api-permission-check';
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
    console.log('🔍 [API] GET /api/plannings iniciado');
    
    // Verificar permissão para acessar planejamentos
    const userId = await requirePermission('planejamentos');
    console.log('🔍 [API] Auth resultado - userId (DB ID):', { userId });

    // ✅ CORREÇÃO: requirePermission já retorna o ID do banco de dados
    // Não precisamos fazer busca adicional, userId já é o ID correto

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = FiltersSchema.parse({
      status: searchParams.get('status'),
      clientId: searchParams.get('clientId'),
      search: searchParams.get('search'),
      page: searchParams.get('page') || '1', // ✅ CORREÇÃO: Valor padrão quando null
      limit: searchParams.get('limit') || '10', // ✅ CORREÇÃO: Valor padrão quando null
    });

    // Build where clause
    const where: any = {
      userId: userId,
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
    console.log('🔍 [API] Buscando planejamentos no banco...');
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

    console.log('✅ [API] Planejamentos encontrados:', plannings.length);
    console.log('✅ [API] Total de planejamentos:', total);

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
    console.error('❌ [API] Error fetching plannings:', error);
    console.error('❌ [API] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST /api/plannings - Criar novo planejamento
export async function POST(request: NextRequest) {
  try {
    // Verificar permissão para criar planejamentos
    const userId = await requirePermission('planejamentos');

    // ✅ CORREÇÃO: requirePermission já retorna o ID do banco de dados

    // Parse request body
    const body = await request.json();
    const data = CreatePlanningSchema.parse(body);

    // Verificar se o cliente existe e pertence ao usuário
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        userId: userId,
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
        userId: userId,
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
    console.log('📡 Webhook habilitado - enviando para IA externa...');
    
    // ✅ CORREÇÃO: Atualizar status para PENDING_AI_BACKLOG_GENERATION após enviar webhook
    const webhookPromise = webhookService.triggerWebhookAsync(
      planning.id,
      client,
      data.formDataJSON,
      userId
    );

    // Atualizar status após iniciar webhook (não aguarda conclusão)
    console.log('🔄 Atualizando status para PENDING_AI_BACKLOG_GENERATION...');
    const updatedPlanning = await prisma.strategicPlanning.update({
      where: { id: planning.id },
      data: { status: 'PENDING_AI_BACKLOG_GENERATION' },
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

    console.log('✅ Status atualizado - IA processando objetivos específicos');

    // Capturar erros de webhook sem afetar resposta
    webhookPromise.catch((error: any) => {
      console.error(`🚨 Erro interno no webhook service para planning ${planning.id}:`, error);
    });

    console.log('🚀 Resposta sendo enviada imediatamente (webhook processando em background)');

    // ✅ RESPOSTA IMEDIATA - Webhook não influencia o resultado
    return NextResponse.json(updatedPlanning, { status: 201 });

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