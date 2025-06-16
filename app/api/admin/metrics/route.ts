import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { metrics } from '@/utils/monitoring';
import { checkDatabaseHealth } from '@/utils/database-health';
import { PerformanceLogger } from '@/utils/structured-logging';
import { withDatabaseRetry } from '@/utils/retry-mechanism';

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

async function getConnectionPoolMetrics() {
  try {
    const dbHealth = await checkDatabaseHealth();

    return {
      status: dbHealth.status,
      latency: dbHealth.latency,
      connectionPool: dbHealth.connectionPool,
      lastCheck: dbHealth.timestamp,
      configuration: {
        databaseUrl: !!process.env.DATABASE_URL,
        directUrl: !!process.env.DIRECT_URL,
        hasPooling: process.env.DATABASE_URL?.includes('pgbouncer=true') || false,
        hasConnectionLimit: process.env.DATABASE_URL?.includes('connection_limit=') || false,
        hasPoolTimeout: process.env.DATABASE_URL?.includes('pool_timeout=') || false
      }
    };
  } catch (error: any) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function getApprovalSystemMetrics() {
  try {
    const [
      totalUsers,
      pendingUsers,
      approvedUsers,
      rejectedUsers,
      suspendedUsers,
      recentApprovals,
      autoApprovals
    ] = await Promise.all([
      withDatabaseRetry(() => prisma.user.count(), 'total users count'),
      withDatabaseRetry(() => prisma.user.count({ where: { approvalStatus: 'PENDING' } }), 'pending users count'),
      withDatabaseRetry(() => prisma.user.count({ where: { approvalStatus: 'APPROVED' } }), 'approved users count'),
      withDatabaseRetry(() => prisma.user.count({ where: { approvalStatus: 'REJECTED' } }), 'rejected users count'),
      withDatabaseRetry(() => prisma.user.count({ where: { approvalStatus: 'SUSPENDED' } }), 'suspended users count'),
      withDatabaseRetry(() => prisma.user.count({
        where: {
          approvedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
          }
        }
      }), 'recent approvals count'),
      withDatabaseRetry(() => prisma.user.count({
        where: {
          approvedBy: 'SYSTEM_AUTO_WEBHOOK',
          approvedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
          }
        }
      }), 'auto approvals count')
    ]);

    const approvalRate = totalUsers > 0 ? (approvedUsers / totalUsers) * 100 : 0;
    const autoApprovalRate = recentApprovals > 0 ? (autoApprovals / recentApprovals) * 100 : 0;

    return {
      totalUsers,
      statusBreakdown: {
        pending: pendingUsers,
        approved: approvedUsers,
        rejected: rejectedUsers,
        suspended: suspendedUsers
      },
      metrics: {
        approvalRate: Math.round(approvalRate * 100) / 100,
        autoApprovalRate: Math.round(autoApprovalRate * 100) / 100,
        recentApprovals24h: recentApprovals,
        autoApprovals24h: autoApprovals
      },
      webhookConfiguration: {
        configured: !!process.env.APROVACAO_WEBHOOK_URL,
        url: process.env.APROVACAO_WEBHOOK_URL ? 'configured' : 'not_configured'
      }
    };
  } catch (error: any) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function getPerformanceMetrics() {
  try {
    const performanceData = PerformanceLogger.getMetrics();
    
    // Calcular estatísticas agregadas
    const operations = Object.keys(performanceData);
    const totalOperations = operations.reduce((sum, op) => sum + performanceData[op].count, 0);
    const totalErrors = operations.reduce((sum, op) => sum + performanceData[op].totalErrors, 0);
    const overallErrorRate = totalOperations > 0 ? (totalErrors / totalOperations) * 100 : 0;
    
    // Identificar operações mais lentas
    const slowestOperations = operations
      .map(op => ({
        operation: op,
        averageDuration: performanceData[op].averageDuration,
        maxDuration: performanceData[op].maxDuration,
        errorRate: performanceData[op].errorRate * 100
      }))
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 5);

    return {
      summary: {
        totalOperations,
        totalErrors,
        overallErrorRate: Math.round(overallErrorRate * 100) / 100,
        uniqueOperations: operations.length
      },
      slowestOperations,
      detailedMetrics: performanceData,
      thresholds: {
        warningDuration: 1000, // 1s
        errorDuration: 3000,    // 3s
        maxErrorRate: 5         // 5%
      }
    };
  } catch (error: any) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function getSystemHealthMetrics() {
  try {
    const [
      dbHealth,
      creditSystemHealth,
      recentErrors
    ] = await Promise.all([
      checkDatabaseHealth(),
      getCreditSystemHealth(),
      getRecentErrors()
    ]);

    return {
      database: {
        status: dbHealth.status,
        latency: dbHealth.latency,
        lastCheck: dbHealth.timestamp
      },
      creditSystem: creditSystemHealth,
      recentErrors,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION,
        hasRequiredEnvVars: !![
          process.env.DATABASE_URL,
          process.env.DIRECT_URL,
          process.env.CLERK_SECRET_KEY,
          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        ].every(Boolean)
      }
    };
  } catch (error: any) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function getCreditSystemHealth() {
  try {
    const [
      totalCreditsIssued,
      totalCreditsConsumed,
      usersWithCredits,
      recentTransactions
    ] = await Promise.all([
      withDatabaseRetry(() => prisma.creditTransaction.aggregate({
        where: { amount: { gt: 0 } },
        _sum: { amount: true }
      }), 'total credits issued'),
      withDatabaseRetry(() => prisma.creditTransaction.aggregate({
        where: { amount: { lt: 0 } },
        _sum: { amount: true }
      }), 'total credits consumed'),
      withDatabaseRetry(() => prisma.user.count({
        where: { creditBalance: { gt: 0 } }
      }), 'users with credits'),
      withDatabaseRetry(() => prisma.creditTransaction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
          }
        }
      }), 'recent transactions')
    ]);

    return {
      totalCreditsIssued: totalCreditsIssued._sum.amount || 0,
      totalCreditsConsumed: Math.abs(totalCreditsConsumed._sum.amount || 0),
      usersWithCredits,
      recentTransactions24h: recentTransactions,
      status: 'healthy'
    };
  } catch (error: any) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

async function getRecentErrors() {
  try {
    // Esta é uma implementação simplificada
    // Em produção, você poderia integrar com um sistema de logging como Sentry
    return {
      count24h: 0, // Placeholder
      criticalErrors: 0, // Placeholder
      lastError: null, // Placeholder
      note: 'Error tracking not implemented - consider integrating with Sentry or similar'
    };
  } catch (error: any) {
    return {
      status: 'error',
      error: error.message
    };
  }
} 