import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { isUserAdmin } from '@/utils/approval-system';

// Importar função de sincronização
const { syncUsersQuiet } = require('../../../../scripts/sync-users-auto.js');

/**
 * API para sincronização manual de usuários entre Clerk e Supabase
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
    const result = await syncUsersQuiet();

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

    // Executar verificação sem migração
    const result = await syncUsersQuiet();

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