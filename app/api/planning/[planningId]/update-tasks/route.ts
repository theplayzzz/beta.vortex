import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth/current-user';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

// Schema para validação da estrutura de tarefas
const UpdateTasksSchema = z.object({
  nome_do_backlog: z.string(),
  objetivo_do_backlog: z.string(),
  tarefas: z.array(z.object({
    nome: z.string(),
    descricao: z.string(),
    prioridade: z.enum(['alta', 'média', 'normal']),
    selecionada: z.boolean().optional(),
    contexto_adicional: z.string().optional(),
    detalhamentos: z.array(z.object({
      texto: z.string(),
      origem: z.string(),
    })).optional(),
  }))
});

// PUT /api/planning/[planningId]/update-tasks - Atualizar tarefas do planejamento
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ planningId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const planningId = params.planningId;

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
    const tasksData = UpdateTasksSchema.parse(body);

    // Verificar se o planejamento existe e pertence ao usuário
    const existingPlanning = await prisma.strategicPlanning.findFirst({
      where: {
        id: planningId,
        userId: user.id,
      },
    });

    if (!existingPlanning) {
      return NextResponse.json(
        { error: 'Planning not found' },
        { status: 404 }
      );
    }

    // Atualizar o campo specificObjectives
    const updatedPlanning = await prisma.strategicPlanning.update({
      where: {
        id: planningId,
      },
      data: {
        specificObjectives: JSON.stringify(tasksData),
        updatedAt: new Date(),
      },
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

    return NextResponse.json({
      message: 'Tarefas atualizadas com sucesso',
      planning: updatedPlanning
    });

  } catch (error) {
    console.error('Error updating tasks:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 