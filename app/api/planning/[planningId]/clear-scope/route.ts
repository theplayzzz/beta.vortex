import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth/current-user';
import { prisma } from '@/lib/prisma/client';

// POST /api/planning/[planningId]/clear-scope - Limpar scope do planejamento
export async function POST(
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

    // Verificar se o planejamento existe e pertence ao usuário
    const planning = await prisma.strategicPlanning.findFirst({
      where: {
        id: planningId,
        userId: user.id,
      },
    });

    if (!planning) {
      return NextResponse.json(
        { error: 'Planning not found' },
        { status: 404 }
      );
    }

    // Limpar o campo scope
    await prisma.strategicPlanning.update({
      where: { id: planningId },
      data: {
        scope: null
      }
    });

    console.log(`✅ Scope limpo para planejamento ${planningId}`);

    return NextResponse.json({ 
      message: 'Scope limpo com sucesso',
      planningId: planningId
    });

  } catch (error) {
    console.error('Error clearing scope:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 