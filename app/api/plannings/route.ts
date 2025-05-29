import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

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

    // Criar planejamento
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

    // 🆕 WEBHOOK DISPATCH
    try {
      const webhookPayload = {
        planning_id: planning.id,
        timestamp: new Date().toISOString(),
        client_info: {
          id: planning.Client.id,
          name: planning.Client.name,
          industry: planning.Client.industry || 'Não informado',
          richnessScore: planning.Client.richnessScore,
          businessDetails: planning.Client.businessDetails || 'Não informado',
          contactEmail: planning.Client.contactEmail || 'Não informado',
          website: planning.Client.website || 'Não informado',
          data_quality: planning.Client.richnessScore > 80 ? "alto" : planning.Client.richnessScore > 50 ? "médio" : "baixo"
        },
        form_submission_data: planning.formDataJSON || {},
        context_enrichment: {
          client_richness_level: planning.Client.richnessScore > 80 ? "alto" : planning.Client.richnessScore > 50 ? "médio" : "baixo",
          industry_specific_insights: true,
          personalization_level: planning.Client.richnessScore > 80 ? "avançado" : "intermediário",
          recommended_task_complexity: planning.Client.richnessScore > 80 ? "avançado" : "intermediário"
        },
        submission_metadata: {
          user_id: user.id,
          submitted_at: new Date().toISOString(),
          form_version: "1.0",
          session_id: `session_${planning.id}`
        }
      };

      // Dispatch webhook assíncrono
      if (process.env.PLANNING_WEBHOOK_URL) {
        console.log('📡 Enviando webhook para:', process.env.PLANNING_WEBHOOK_URL);
        console.log('📤 Payload do webhook:', JSON.stringify(webhookPayload, null, 2));
        
        const webhookResponse = await fetch(process.env.PLANNING_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': process.env.WEBHOOK_SECRET || '',
            'User-Agent': 'Vortex-Planning-System/1.0'
          },
          body: JSON.stringify(webhookPayload)
        });

        if (webhookResponse.ok) {
          console.log('✅ Webhook enviado com sucesso');
        } else {
          console.error('❌ Erro no webhook:', webhookResponse.status, await webhookResponse.text());
        }
      } else {
        console.warn('⚠️ PLANNING_WEBHOOK_URL não configurada - webhook não enviado');
      }
    } catch (webhookError) {
      console.error('❌ Erro ao enviar webhook:', webhookError);
      // Não falhar a criação do planejamento por erro no webhook
    }

    return NextResponse.json(planning, { status: 201 });

  } catch (error) {
    console.error('Error creating planning:', error);
    
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