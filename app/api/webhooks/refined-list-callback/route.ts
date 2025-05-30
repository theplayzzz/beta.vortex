import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

// Schema para validação do payload do webhook
const RefinedListCallbackSchema = z.object({
  planning_id: z.string(),
  status: z.enum(['success', 'error']),
  refined_tasks: z.array(z.object({
    nome: z.string(),
    descricao: z.string(),
    prioridade: z.enum(['alta', 'média', 'normal']),
    output: z.string().optional(),
  })).optional(),
  error_message: z.string().optional(),
});

// POST /api/webhooks/refined-list-callback - Receber dados refinados do webhook externo
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook de planejamento refinado recebido');

    // Verificar autorização do webhook
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.WEBHOOK_SECRET;
    
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      console.log('❌ Webhook não autorizado');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📄 Payload recebido:', JSON.stringify(body, null, 2));

    const { planning_id, status, refined_tasks, error_message } = RefinedListCallbackSchema.parse(body);

    console.log('🆔 Planning ID:', planning_id);
    console.log('📊 Status:', status);

    // Buscar planejamento no banco
    const planning = await prisma.strategicPlanning.findUnique({
      where: { id: planning_id }
    });

    if (!planning) {
      console.log('❌ Planejamento não encontrado:', planning_id);
      return NextResponse.json({ error: 'Planning not found' }, { status: 404 });
    }

    if (status === 'success' && refined_tasks) {
      console.log('✅ Processamento bem-sucedido, atualizando planejamento...');
      
      // 🧹 PRIMEIRO: Limpar scope existente se houver
      if (planning.scope) {
        console.log('🧹 Limpando scope existente antes de atualizar...');
        await prisma.strategicPlanning.update({
          where: { id: planning_id },
          data: { scope: null }
        });
        console.log('✅ Scope limpo com sucesso');
      }

      // ✅ SEGUNDO: Atualizar com novos dados
      const scopeData = {
        generated_at: new Date().toISOString(),
        tasks: refined_tasks,
        version: '1.0'
      };

      const updatedPlanning = await prisma.strategicPlanning.update({
        where: { id: planning_id },
        data: {
          status: 'AI_REFINED_LIST_VISIBLE',
          scope: JSON.stringify(scopeData)
        }
      });

      console.log('✅ Planejamento atualizado com lista refinada');
      
      return NextResponse.json({ 
        message: 'Planejamento atualizado com sucesso',
        planning_id,
        tasks_count: refined_tasks.length
      });
      
    } else if (status === 'error') {
      console.log('❌ Erro no processamento:', error_message);
      
      await prisma.strategicPlanning.update({
        where: { id: planning_id },
        data: {
          status: 'DRAFT'
        }
      });

      return NextResponse.json({ 
        message: 'Erro processado',
        planning_id,
        error: error_message
      });
    }

    return NextResponse.json({ 
      message: 'Status processado',
      planning_id,
      status
    });

  } catch (error) {
    console.error('❌ Erro no webhook callback:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Payload inválido', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET para debug/health check
export async function GET() {
  return NextResponse.json({
    message: 'Webhook de planejamento refinado funcionando',
    timestamp: new Date().toISOString()
  });
} 