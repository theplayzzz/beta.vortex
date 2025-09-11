import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { PlanningStatusSchema } from '@/lib/validations/enums';
import { usageTracker } from '@/lib/usage/usage-tracker';

const UpdateStatusSchema = z.object({
  status: PlanningStatusSchema,
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status } = UpdateStatusSchema.parse(body);

    console.log(`🔄 [UPDATE_STATUS] Atualizando status do planejamento ${id} para: ${status}`);

    // Buscar usuário no banco primeiro
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 📊 VALIDAÇÃO DE LIMITE: Verificar se pode finalizar planejamento
    if (status === 'COMPLETED') {
      try {
        const limitCheck = await usageTracker.checkLimit(user.id, 'plannings', 1)
        if (!limitCheck.canConsume) {
          console.warn(`⚠️ [UPDATE_STATUS] Limite de planejamentos excedido - atual: ${limitCheck.currentUsage}, limite: ${limitCheck.limit}`)
          return NextResponse.json(
            { 
              error: 'Limite de planejamentos excedido para o plano atual',
              details: {
                currentUsage: limitCheck.currentUsage,
                limit: limitCheck.limit,
                available: limitCheck.limit - limitCheck.currentUsage
              }
            },
            { status: 402 } // 402 Payment Required
          )
        }
        console.log(`✅ [UPDATE_STATUS] Validação de limite OK - pode finalizar planejamento`)
      } catch (limitError) {
        console.error(`❌ [UPDATE_STATUS] Erro ao verificar limite:`, limitError)
        // Em caso de erro na validação, prossegue (falback gracioso)
      }
    }

    // Verificar se o planejamento existe e pertence ao usuário
    const existingPlanning = await prisma.strategicPlanning.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingPlanning) {
      return NextResponse.json(
        { error: 'Planning not found or not owned by user' },
        { status: 404 }
      );
    }

    // Atualizar status do planejamento
    const updatedPlanning = await prisma.strategicPlanning.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
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

    console.log(`✅ [UPDATE_STATUS] Status atualizado com sucesso para: ${status}`);

    // 📊 TRACKING DE USO: Incrementar contador quando planejamento for COMPLETADO
    if (status === 'COMPLETED' && existingPlanning.status !== 'COMPLETED') {
      try {
        console.log(`📊 [USAGE_TRACKER] Planejamento finalizado - incrementando contador de uso`);
        await usageTracker.incrementPlanning(user.id, id);
        console.log(`✅ [USAGE_TRACKER] Contador de planejamentos incrementado com sucesso`);
      } catch (trackingError) {
        // Log do erro mas não falha a operação principal
        console.error(`❌ [USAGE_TRACKER] Erro ao incrementar contador de planejamentos:`, trackingError);
        // Continua a execução - tracking de uso não deve bloquear a funcionalidade principal
      }
    }

    return NextResponse.json({
      message: 'Status updated successfully',
      planning: updatedPlanning
    });

  } catch (error) {
    console.error('❌ [UPDATE_STATUS] Erro ao atualizar status:', error);
    
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