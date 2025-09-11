import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { PlanningStatusSchema } from '@/lib/validations/enums';

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