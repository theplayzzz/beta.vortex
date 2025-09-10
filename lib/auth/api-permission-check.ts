import { auth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/backend';
import { Modalidade, getPermissionsForStatus } from '@/types/permissions';
import { getUserIdFromClerkWithSync } from '@/lib/auth/user-sync';

export interface ApiPermissionResult {
  allowed: boolean;
  userId: string | null;
  error?: string;
}

/**
 * Middleware para verificar permissões de API baseado na modalidade
 */
export async function checkApiPermissions(requiredModalidade: Modalidade): Promise<ApiPermissionResult> {
  try {
    // Verificar autenticação
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return {
        allowed: false,
        userId: null,
        error: 'Usuário não autenticado'
      };
    }

    // Obter o ID do usuário no banco de dados (com sincronização automática)
    const dbUserId = await getUserIdFromClerkWithSync();
    
    if (!dbUserId) {
      return {
        allowed: false,
        userId: null,
        error: 'Usuário não encontrado no banco de dados'
      };
    }

    // Buscar dados do usuário no Clerk
    const clerkClient = createClerkClient({ 
      secretKey: process.env.CLERK_SECRET_KEY! 
    });
    
    const user = await clerkClient.users.getUser(clerkId);
    const metadata = user.publicMetadata as any;
    
    const userStatus = metadata?.approvalStatus || 'PENDING';
    const userRole = metadata?.role || 'USER';
    
    // Verificar se é admin (admins têm acesso a tudo)
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      return {
        allowed: true,
        userId: dbUserId
      };
    }
    
    // Obter permissões baseadas no status
    const permissions = getPermissionsForStatus(userStatus, userRole);
    
    // Verificar acesso à modalidade específica
    let hasAccess = false;
    switch (requiredModalidade) {
      case 'vendas':
        hasAccess = permissions.canAccessSales;
        break;
      case 'clientes':
        hasAccess = permissions.canAccessClients;
        break;
      case 'planejamentos':
        hasAccess = permissions.canAccessPlanning;
        break;
      case 'propostas':
        hasAccess = permissions.canAccessProposals;
        break;
      default:
        hasAccess = false;
    }
    
    if (!hasAccess) {
      return {
        allowed: false,
        userId: dbUserId,
        error: `Usuário ${userStatus} não tem acesso à modalidade ${requiredModalidade}`
      };
    }
    
    return {
      allowed: true,
      userId: dbUserId
    };
    
  } catch (error) {
    console.error('[API_PERMISSION_CHECK] Erro ao verificar permissões:', error);
    return {
      allowed: false,
      userId: null,
      error: 'Erro interno ao verificar permissões'
    };
  }
}

/**
 * Helper para uso rápido em rotas de API
 */
export async function requirePermission(requiredModalidade: Modalidade): Promise<string> {
  const result = await checkApiPermissions(requiredModalidade);
  
  if (!result.allowed) {
    throw new Error(result.error || 'Acesso negado');
  }
  
  return result.userId!;
}