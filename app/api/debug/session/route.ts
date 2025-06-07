import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return NextResponse.json({
        authenticated: false,
        message: 'Usuário não autenticado'
      }, { status: 401 });
    }

    // Buscar dados atuais do Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    const publicMetadata = clerkUser.publicMetadata || {};

    // Dados da sessão atual (JWT)
    const sessionMetadata = (sessionClaims?.publicMetadata as any) || {};

    // Comparar dados
    const comparison = {
      userId,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      
      // Dados do JWT (sessionClaims)
      session: {
        approvalStatus: sessionMetadata.approvalStatus,
        role: sessionMetadata.role,
        dbUserId: sessionMetadata.dbUserId,
        lastSync: sessionMetadata.lastSync
      },
      
      // Dados atuais do Clerk
      clerk: {
        approvalStatus: publicMetadata.approvalStatus,
        role: publicMetadata.role,
        dbUserId: publicMetadata.dbUserId,
        lastSync: publicMetadata.lastSync,
        lastDebugFix: (publicMetadata as any).lastDebugFix
      },
      
      // Verificação da lógica do middleware
      middleware: {
        isAdmin: sessionMetadata.role === 'ADMIN' || sessionMetadata.role === 'SUPER_ADMIN',
        shouldBypassApproval: sessionMetadata.role === 'ADMIN' || sessionMetadata.role === 'SUPER_ADMIN',
        approvalStatus: sessionMetadata.approvalStatus || 'PENDING'
      },
      
      // Diagnóstico
      issues: [] as string[]
    };

    // Detectar problemas
    if (comparison.session.approvalStatus !== comparison.clerk.approvalStatus) {
      comparison.issues.push('Session and Clerk approval status mismatch');
    }
    
    if (comparison.session.role !== comparison.clerk.role) {
      comparison.issues.push('Session and Clerk role mismatch');
    }
    
    if (!comparison.session.approvalStatus && comparison.clerk.approvalStatus) {
      comparison.issues.push('Session missing approval status');
    }
    
    if (!comparison.session.role && comparison.clerk.role) {
      comparison.issues.push('Session missing role');
    }

    // Recomendações
    const recommendations = [];
    
    if (comparison.issues.length > 0) {
      recommendations.push('Fazer logout/login para renovar JWT token');
      recommendations.push('Limpar cookies do navegador');
    }
    
         if ((publicMetadata as any).lastDebugFix && !(sessionMetadata as any).lastDebugFix) {
       recommendations.push('JWT token anterior à última correção - logout/login necessário');
     }

     return NextResponse.json({
       authenticated: true,
       timestamp: new Date().toISOString(),
       comparison,
       recommendations,
       debug: {
         hasIssues: comparison.issues.length > 0,
         needsRefresh: (publicMetadata as any).lastDebugFix && !(sessionMetadata as any).lastDebugFix
       }
    });

  } catch (error) {
    console.error('[DEBUG_SESSION] Error:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 