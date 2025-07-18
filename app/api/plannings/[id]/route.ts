import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

// Schema para atualização de planejamento
const UpdatePlanningSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').optional(),
  description: z.string().optional(),
  specificObjectives: z.string().optional(),
  scope: z.string().optional(),
  successMetrics: z.string().optional(),
  budget: z.string().optional(),
  toneOfVoice: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  formDataJSON: z.any().optional(),
  clientSnapshot: z.any().optional(),
});

// GET /api/plannings/[id] - Buscar planejamento específico
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 API GET /api/plannings/[id] chamada');
    
    const { userId } = auth();
    console.log('🔐 Auth resultado:', { userId: userId || 'NULL' });
    
    if (!userId) {
      console.log('❌ Usuário não autenticado - retornando 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    console.log('📋 Parâmetros:', { planningId: params.id });

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    console.log('👤 Usuário no banco:', user ? `ID: ${user.id}` : 'NÃO ENCONTRADO');

    if (!user) {
      console.log('❌ Usuário não encontrado no banco - retornando 404');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Buscar planejamento
    console.log('🔍 Buscando planejamento...');
    const planning = await prisma.strategicPlanning.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            industry: true,
            richnessScore: true,
            contactEmail: true,
            website: true,
          },
        },
        PlanningTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            startDate: true,
            endDate: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    console.log('📋 Planejamento encontrado:', planning ? `ID: ${planning.id}, Status: ${planning.status}` : 'NÃO ENCONTRADO');

    if (!planning) {
      console.log('❌ Planejamento não encontrado ou não pertence ao usuário - retornando 404');
      return NextResponse.json(
        { error: 'Planning not found' },
        { status: 404 }
      );
    }

    console.log('✅ Retornando planejamento com sucesso');
    return NextResponse.json(planning);

  } catch (error) {
    console.error('❌ Erro na API GET /api/plannings/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/plannings/[id] - Atualizar planejamento
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;

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
    const data = UpdatePlanningSchema.parse(body);

    // Verificar se o planejamento existe e pertence ao usuário
    const existingPlanning = await prisma.strategicPlanning.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingPlanning) {
      return NextResponse.json(
        { error: 'Planning not found' },
        { status: 404 }
      );
    }

    // Atualizar planejamento
    const planning = await prisma.strategicPlanning.update({
      where: {
        id: params.id,
      },
      data,
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
    });

    return NextResponse.json(planning);

  } catch (error) {
    console.error('Error updating planning:', error);
    
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

// DELETE /api/plannings/[id] - Deletar planejamento
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verificar se o planejamento existe e pertence ao usuário
    const existingPlanning = await prisma.strategicPlanning.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingPlanning) {
      return NextResponse.json(
        { error: 'Planning not found' },
        { status: 404 }
      );
    }

    // Deletar planejamento (cascade irá deletar tasks relacionadas)
    await prisma.strategicPlanning.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: 'Planning deleted successfully' });

  } catch (error) {
    console.error('Error deleting planning:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 