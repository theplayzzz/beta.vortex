import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { metrics } from '@/utils/monitoring';

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
    const timeRange = searchParams.get('timeRange') || '24h';

    // Calcular período baseado no timeRange
    const now = new Date();
    let since: Date;
    
    switch (timeRange) {
      case '1h':
        since = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Buscar dados do banco para métricas reais
    const [
      totalUsers,
      pendingUsers,
      approvedUsers,
      rejectedUsers,
      suspendedUsers,
      recentModerationActions,
      recentRegistrations
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.user.count({ where: { approvalStatus: 'APPROVED' } }),
      prisma.user.count({ where: { approvalStatus: 'REJECTED' } }),
      prisma.user.count({ where: { approvalStatus: 'SUSPENDED' } }),
      prisma.userModerationLog.count({
        where: { createdAt: { gte: since } }
      }),
      prisma.user.count({
        where: { createdAt: { gte: since } }
      })
    ]);

    // Calcular tempo médio de aprovação
    const avgApprovalTimeQuery = await prisma.$queryRaw<{ avg: number }[]>`
      SELECT EXTRACT(EPOCH FROM AVG(approved_at - created_at)) * 1000 as avg
      FROM "User" 
      WHERE approval_status = 'APPROVED' 
      AND approved_at IS NOT NULL 
      AND created_at >= ${since}
    `;
    
    const avgApprovalTime = avgApprovalTimeQuery[0]?.avg || 0;

    // Buscar distribuição de ações por período
    const actionsDistribution = await prisma.userModerationLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: since } },
      _count: { action: true }
    });

    // Buscar registros por dia (últimos 7 dias)
    const registrationsByDay = await prisma.$queryRaw<
      { date: string; count: number }[]
    >`
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::int as count
      FROM "User"
      WHERE created_at >= ${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Buscar top moderadores
    const topModerators = await prisma.userModerationLog.groupBy({
      by: ['moderatorId'],
      where: { createdAt: { gte: since } },
      _count: { moderatorId: true },
      orderBy: { _count: { moderatorId: 'desc' } },
      take: 5
    });

    // Buscar dados dos moderadores
    const moderatorDetails = await Promise.all(
      topModerators.map(async (mod) => {
        const moderator = await prisma.user.findUnique({
          where: { id: mod.moderatorId },
          select: { 
            firstName: true, 
            lastName: true, 
            email: true,
            clerkId: true
          }
        });
        
        return {
          id: mod.moderatorId,
          name: moderator ? `${moderator.firstName} ${moderator.lastName}`.trim() : 'Unknown',
          email: moderator?.email || 'unknown@example.com',
          actions: mod._count.moderatorId
        };
      })
    );

    // Métricas em tempo real do sistema de monitoring
    const runtimeMetrics = metrics.exportAllMetrics();
    const approvalMetrics = metrics.generateMetricsReport();

    // Estatísticas de performance (simuladas para demonstração)
    const performanceStats = {
      averageMiddlewareTime: 35,
      averageApiResponseTime: 120,
      webhookSuccessRate: 98.5,
      systemUptime: Math.floor((Date.now() - (Date.now() % (24 * 60 * 60 * 1000))) / 1000)
    };

    // Alertas ativos (baseados em thresholds)
    const activeAlerts = [];
    
    if (pendingUsers > 50) {
      activeAlerts.push({
        type: 'warning',
        message: `${pendingUsers} usuários aguardando aprovação`,
        severity: 'medium'
      });
    }
    
    if (avgApprovalTime > 86400000) { // > 24 horas
      activeAlerts.push({
        type: 'error',
        message: 'Tempo médio de aprovação muito alto',
        severity: 'high'
      });
    }

    const response = {
      timestamp: new Date().toISOString(),
      timeRange,
      period: {
        since: since.toISOString(),
        until: now.toISOString()
      },
      
      // Métricas principais
      overview: {
        totalUsers,
        pendingUsers,
        approvedUsers,
        rejectedUsers,
        suspendedUsers,
        approvalRate: totalUsers > 0 ? ((approvedUsers / totalUsers) * 100).toFixed(1) : '0',
        avgApprovalTimeHours: (avgApprovalTime / (1000 * 60 * 60)).toFixed(1)
      },

      // Atividade recente
      recentActivity: {
        newRegistrations: recentRegistrations,
        moderationActions: recentModerationActions,
        actionsDistribution: actionsDistribution.map(action => ({
          action: action.action,
          count: action._count.action
        }))
      },

      // Tendências (registros por dia)
      trends: {
        registrationsByDay: registrationsByDay.map(day => ({
          date: day.date,
          registrations: day.count
        }))
      },

      // Top moderadores
      moderators: moderatorDetails,

      // Métricas de runtime
      runtime: {
        ...runtimeMetrics,
        ...approvalMetrics
      },

      // Performance
      performance: performanceStats,

      // Alertas ativos
      alerts: activeAlerts,

      // Metadata
      metadata: {
        generatedAt: new Date().toISOString(),
        queriedBy: userId,
        systemVersion: '1.0.0',
        environment: process.env.VERCEL_ENV || 'development'
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, max-age=60', // Cache por 1 minuto
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 