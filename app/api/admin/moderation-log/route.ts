import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { ModerationAction } from '@prisma/client';

// GET - Buscar histórico de moderação
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é admin
    const user = await clerkClient.users.getUser(userId);
    const isAdmin = user.publicMetadata?.role === 'ADMIN' || 
                   user.publicMetadata?.role === 'SUPER_ADMIN';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado - Apenas admins' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') as ModerationAction | null;
    const moderatorId = searchParams.get('moderatorId') || '';
    const targetUserId = searchParams.get('userId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    if (action) {
      where.action = action;
    }
    if (moderatorId) {
      where.moderatorId = moderatorId;
    }
    if (targetUserId) {
      where.userId = targetUserId;
    }

    // Buscar logs com paginação
    const [logs, totalCount] = await Promise.all([
      prisma.userModerationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          User: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              clerkId: true
            }
          },
          Moderator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              clerkId: true
            }
          }
        }
      }),
      prisma.userModerationLog.count({ where })
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar logs de moderação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 