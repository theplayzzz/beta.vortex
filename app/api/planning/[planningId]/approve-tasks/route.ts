import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth/current-user';
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
    console.log('🚀 [APPROVE-TASKS] Início da requisição');
    
    const userId = await getCurrentUserId();
    
    if (!userId) {
      console.log('❌ [APPROVE-TASKS] Usuário não autenticado');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('✅ [APPROVE-TASKS] Usuário autenticado - Database ID:', userId);

    const params = await context.params;
    const planningId = params.planningId;
    console.log('📋 [APPROVE-TASKS] Planning ID:', planningId);

    // getCurrentUserId já retorna o ID do banco, não precisa buscar novamente

    // Parse request body
    console.log('📥 [APPROVE-TASKS] Parseando request body...');
    const body = await request.json();
    console.log('📄 [APPROVE-TASKS] Body recebido:', JSON.stringify(body, null, 2));
    
    const { approvedTasks } = ApproveTasksSchema.parse(body);
    console.log('✅ [APPROVE-TASKS] Schema validado - Tarefas aprovadas:', approvedTasks.length);

    // Verificar se o planejamento existe e pertence ao usuário
    console.log('🔍 [APPROVE-TASKS] Buscando planejamento no banco...');
    const planning = await prisma.strategicPlanning.findFirst({
      where: {
        id: planningId,
        userId: userId,
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
      console.log('❌ [APPROVE-TASKS] Planejamento não encontrado ou não pertence ao usuário');
      return NextResponse.json(
        { error: 'Planning not found' },
        { status: 404 }
      );
    }
    console.log('✅ [APPROVE-TASKS] Planejamento encontrado:', planning.title);

    // Validar que existem tarefas selecionadas
    const selectedTasks = approvedTasks.filter(task => task.selecionada);
    
    if (selectedTasks.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma tarefa selecionada para aprovação' },
        { status: 400 }
      );
    }

    // Preparar payload para webhook
    const callbackUrl = `http://5.161.64.137:3003/api/webhooks/refined-list-callback`;
    
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
        userId: userId,
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
        linkedTaskId: planningId,
        callback_url: callbackUrl,
        webhook_secret: process.env.WEBHOOK_SECRET || null
      },
      webhookUrl: process.env.REFINED_LIST_WEBHOOK_URL,
      executionMode: 'production'
    };

    // 🧹 PASSO 1: LIMPEZA SEGURA DO SCOPE (dados obsoletos)
    console.log('🧹 PASSO 1: Limpando scope existente...');
    try {
      await prisma.strategicPlanning.update({
        where: { id: planningId },
        data: {
          scope: null, // ✅ Limpa dados anteriores
          status: 'PENDING_AI_REFINED_LIST'
        }
      });
      console.log('✅ Scope limpo e status atualizado - PROCESSO LIMPO GARANTIDO!');
    } catch (cleanupError) {
      // ✅ Se limpeza falhar, ainda continua (tolerante a erro)
      console.warn('⚠️ Erro na limpeza (continuando):', cleanupError);
      await prisma.strategicPlanning.update({
        where: { id: planningId },
        data: {
          status: 'PENDING_AI_REFINED_LIST'
        }
      });
      console.log('✅ Status atualizado (sem limpeza) - POLLING GARANTIDO!');
    }

    // ✅ PASSO 2: Webhook opcional (não pode falhar)
    const webhookUrl = process.env.REFINED_LIST_WEBHOOK_URL;
    let webhookStatus = 'not_attempted';

    if (webhookUrl) {
      try {
        console.log('📡 Tentando enviar webhook...');
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

        webhookStatus = webhookResponse.ok ? 'success' : 'failed';
        console.log(`📡 Webhook status: ${webhookStatus}`);
        
        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text();
          console.error('⚠️ Webhook erro (ignorado):', errorText);
        }

      } catch (webhookError) {
        console.error('⚠️ Webhook erro (ignorado):', webhookError);
        webhookStatus = 'error';
      }
    } else {
      console.log('⚠️ Webhook URL não configurada (ignorado)');
      webhookStatus = 'not_configured';
    }

    // ✅ SEMPRE retorna sucesso (polling garantido)
    return NextResponse.json({ 
      message: 'Tarefas aprovadas - processamento iniciado',
      selectedTasksCount: selectedTasks.length,
      totalTasksCount: approvedTasks.length,
      webhookStatus,
      pollingStatus: 'ACTIVE'
    });

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