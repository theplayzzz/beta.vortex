import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isUserAdmin } from '@/utils/approval-system';
import { syncUserWithDatabase } from '@/lib/auth/user-sync';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * Função para sincronizar todos os usuários aprovados
 */
async function syncAllApprovedUsers() {
  try {
    // Buscar usuários aprovados no Clerk
    const clerkUsers = await clerkClient.users.getUserList({ limit: 500 });
    const users = Array.isArray(clerkUsers) ? clerkUsers : (clerkUsers?.data || []);
    
    const approvedUsers = users.filter(user => {
      const metadata = user.publicMetadata as any;
      return metadata?.approvalStatus === 'APPROVED';
    });

    let syncedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const user of approvedUsers) {
      try {
        const result = await syncUserWithDatabase(user.id);
        if (result) {
          syncedCount++;
        } else {
          errorCount++;
          errors.push(`Falha ao sincronizar: ${user.id}`);
        }
      } catch (error) {
        errorCount++;
        errors.push(`Erro em ${user.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    return {
      status: errorCount === 0 ? 'success' : 'partial',
      message: `Sincronizados: ${syncedCount}, Erros: ${errorCount}`,
      details: {
        totalApproved: approvedUsers.length,
        synced: syncedCount,
        errors: errorCount,
        errorDetails: errors
      }
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      details: {}
    };
  }
}

/**
 * API para sincronização manual de usuários entre Clerk e banco de dados
 * Restrito apenas para administradores
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (!isUserAdmin(userId)) {
      return NextResponse.json(
        { error: 'Acesso negado - apenas administradores' },
        { status: 403 }
      );
    }

    console.log(`[ADMIN_SYNC] Sincronização iniciada por admin: ${userId}`);

    // Executar sincronização
    const result = await syncAllApprovedUsers();

    console.log(`[ADMIN_SYNC] Resultado: ${result.status} - ${result.message}`);

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
      initiatedBy: userId
    });

  } catch (error) {
    console.error('[ADMIN_SYNC] Erro:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno durante sincronização', 
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Verificar status de sincronização
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (!isUserAdmin(userId)) {
      return NextResponse.json(
        { error: 'Acesso negado - apenas administradores' },
        { status: 403 }
      );
    }

    // Executar verificação de sincronização
    const result = await syncAllApprovedUsers();

    return NextResponse.json({
      status: result.status,
      message: result.message,
      timestamp: new Date().toISOString(),
      checkedBy: userId
    });

  } catch (error) {
    console.error('[ADMIN_SYNC_CHECK] Erro:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro durante verificação', 
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 