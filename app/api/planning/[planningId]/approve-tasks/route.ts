import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

// Schema para validação das tarefas aprovadas
const ApproveTasksSchema = z.object({
  approvedTasks: z.array(z.object({
    nome: z.string(),
    descricao: z.string(),
    prioridade: z.enum(['alta', 'média', 'normal']),
    selecionada: z.boolean(),
    contexto_adicional: z.string().optional(),
  }))
});

// POST /api/planning/[planningId]/approve-tasks - Aprovar tarefas selecionadas
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ planningId: string }> }
) {
  try {
    const { userId } = await auth();
    
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
    const { approvedTasks } = ApproveTasksSchema.parse(body);

    // Verificar se o planejamento existe e pertence ao usuário
    const planning = await prisma.strategicPlanning.findFirst({
      where: {
        id: planningId,
        userId: user.id,
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

    if (!planning) {
      return NextResponse.json(
        { error: 'Planning not found' },
        { status: 404 }
      );
    }

    // Validar que existem tarefas selecionadas
    const selectedTasks = approvedTasks.filter(task => task.selecionada);
    
    if (selectedTasks.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma tarefa selecionada para aprovação' },
        { status: 400 }
      );
    }

    // Preparar payload para webhook
    const webhookPayload = {
      headers: {
        'content-type': 'application/json'
      },
      body: {
        id: planningId,
        title: `Projeto: ${planning.title}`,
        description: 'Projeto gerado a partir do planejamento',
        status: 'pending',
        priority: 'high',
        userId: user.id,
        backlogId: planningId,
        tarefaId: planningId,
        planejamentoInformacoes: null,
        'planejamento-informações': selectedTasks.map(task => ({
          nome: task.nome,
          descricao: task.contexto_adicional 
            ? `${task.descricao}\n\nContexto adicional: ${task.contexto_adicional}`
            : task.descricao,
          prioridade: task.prioridade
        })),
        planning_id: planningId,
        projectName: planning.title,
        sourceBacklogId: planningId,
        linkedTaskId: planningId
      },
      webhookUrl: process.env.REFINED_LIST_WEBHOOK_URL,
      executionMode: 'production'
    };

    // Enviar webhook
    const webhookUrl = process.env.REFINED_LIST_WEBHOOK_URL;
    
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL não configurada' },
        { status: 500 }
      );
    }

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.WEBHOOK_SECRET && {
            'Authorization': `Bearer ${process.env.WEBHOOK_SECRET}`
          })
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!webhookResponse.ok) {
        console.error('Webhook error:', await webhookResponse.text());
        return NextResponse.json(
          { error: 'Falha ao enviar tarefas para processamento' },
          { status: 500 }
        );
      }

      // Atualizar status do planejamento
      await prisma.strategicPlanning.update({
        where: { id: planningId },
        data: {
          status: 'PENDING_AI_REFINED_LIST'
        }
      });

      return NextResponse.json({ 
        message: 'Tarefas aprovadas e enviadas para processamento',
        selectedTasksCount: selectedTasks.length,
        totalTasksCount: approvedTasks.length
      });

    } catch (webhookError) {
      console.error('Webhook request failed:', webhookError);
      return NextResponse.json(
        { error: 'Erro ao comunicar com o serviço de processamento' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error approving tasks:', error);
    
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