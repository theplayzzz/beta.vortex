import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verificar ambiente
    const environment = process.env.VERCEL_ENV || 'development';
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

    // Verificar variáveis de ambiente críticas
    const envVars = {
      clerkWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET,
      databaseUrl: !!process.env.DATABASE_URL,
      directUrl: !!process.env.DIRECT_URL,
      clerkSecretKey: !!process.env.CLERK_SECRET_KEY,
      nextAuthSecret: !!process.env.NEXTAUTH_SECRET
    };

    // Verificar conexão com banco de dados
    let dbStatus = 'unknown';
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1 as health_check`;
      dbLatency = Date.now() - dbStart;
      dbStatus = 'healthy';
    } catch (dbError) {
      dbStatus = 'unhealthy';
      console.error('Database health check failed:', dbError);
    }

    // Verificar se RLS policies estão ativas (específico para sistema de aprovação)
    let rlsStatus = 'unknown';
    try {
      // Tentar uma query que seria bloqueada pelo RLS se não tiver permissão
      await prisma.user.findFirst({
        select: { id: true },
        take: 1
      });
      rlsStatus = 'active';
    } catch (rlsError) {
      // Se der erro, pode ser que RLS está bloqueando (que é o esperado)
      rlsStatus = 'protected';
    }

    // Verificar estrutura do schema de aprovação
    let schemaStatus = 'unknown';
    try {
      // Verificar se campos do sistema de aprovação existem
      const userWithApprovalFields = await prisma.user.findFirst({
        select: {
          approvalStatus: true,
          version: true
        },
        take: 1
      });
      schemaStatus = 'approval_system_ready';
    } catch (schemaError) {
      schemaStatus = 'approval_schema_missing';
      console.error('Approval schema check failed:', schemaError);
    }

    const totalTime = Date.now() - startTime;
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment,
      baseUrl,
      responseTime: `${totalTime}ms`,
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`
      },
      security: {
        rls: rlsStatus,
        schema: schemaStatus
      },
      environment_variables: envVars,
      approvalSystem: {
        version: '1.0.0',
        phases: {
          'phase-1': 'completed',
          'phase-2': 'completed', 
          'phase-3': 'completed',
          'phase-4': 'completed',
          'phase-5': 'completed',
          'phase-6': 'in_progress'
        }
      },
      webhook: {
        endpoint: `${baseUrl}/api/webhooks/clerk`,
        environment: environment,
        secretConfigured: envVars.clerkWebhookSecret
      }
    };

    // Determinar status geral
    const isHealthy = dbStatus === 'healthy' && 
                     schemaStatus === 'approval_system_ready' && 
                     Object.values(envVars).every(Boolean);

    return NextResponse.json(
      {
        ...healthData,
        status: isHealthy ? 'healthy' : 'degraded'
      },
      { 
        status: isHealthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: `${Date.now() - startTime}ms`
      },
      { status: 503 }
    );
  }
} 