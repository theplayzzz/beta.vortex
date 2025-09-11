export type UserApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type Modalidade = 'vendas' | 'clientes' | 'planejamentos' | 'propostas';

export interface PlanLimits {
  maxPlanningsMonth: number;
  maxTranscriptionMinMonth: number;
  maxProposalsMonth: number;
  planName: string;
  planId: string;
}

export interface UserPlanAccess {
  hasActivePlan: boolean;
  planLimits: PlanLimits | null;
  isNoUserPlan: boolean;
}

export interface UserPermissions {
  canAccessSales: boolean;
  canAccessClients: boolean;
  canAccessPlanning: boolean;
  canAccessProposals: boolean;
  canAccessAdmin: boolean;
  status: UserApprovalStatus;
  role: UserRole;
  planAccess: UserPlanAccess;
  planLimits: PlanLimits | null;
}

export interface PermissionsContextType {
  permissions: UserPermissions | null;
  isLoading: boolean;
  checkAccess: (modalidade: Modalidade) => boolean;
  getAllowedRoutes: () => string[];
  refreshPermissions: () => Promise<void>;
}

export const MODALIDADE_ROUTES: Record<Modalidade, string[]> = {
  vendas: ['/coach/capture', '/coach/capture/pre-session', '/coach/capture/daily-co', '/coach/capture/dashboard'],
  clientes: ['/clientes'],
  planejamentos: ['/planejamentos'],
  propostas: ['/propostas']
};

export const PENDING_ALLOWED_ROUTES = [
  '/',
  '/pending-approval',
  '/account-rejected',
  '/account-suspended',
  '/acesso-negado'
  // Removidas: rotas de vendas/coaching - agora via plano
];

export function getPermissionsForStatus(status: UserApprovalStatus, role: UserRole): UserPermissions {
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  
  // Default plan access for compatibility
  const defaultPlanAccess: UserPlanAccess = {
    hasActivePlan: false,
    planLimits: null,
    isNoUserPlan: false
  };
  
  if (isAdmin) {
    return {
      canAccessSales: true,
      canAccessClients: true,
      canAccessPlanning: true,
      canAccessProposals: true,
      canAccessAdmin: true,
      status,
      role,
      planAccess: defaultPlanAccess,
      planLimits: null
    };
  }
  
  switch (status) {
    case 'APPROVED':
      return {
        canAccessSales: true,
        canAccessClients: true,
        canAccessPlanning: true,
        canAccessProposals: true,
        canAccessAdmin: false,
        status,
        role,
        planAccess: defaultPlanAccess,
        planLimits: null
      };
    
    case 'PENDING':
      return {
        canAccessSales: true, // PENDING users can access sales/coaching
        canAccessClients: false,
        canAccessPlanning: false,
        canAccessProposals: false,
        canAccessAdmin: false,
        status,
        role,
        planAccess: defaultPlanAccess,
        planLimits: null
      };
    
    case 'REJECTED':
    case 'SUSPENDED':
    default:
      return {
        canAccessSales: false,
        canAccessClients: false,
        canAccessPlanning: false,
        canAccessProposals: false,
        canAccessAdmin: false,
        status,
        role,
        planAccess: defaultPlanAccess,
        planLimits: null
      };
  }
}

export function getPermissionsForStatusAndPlan(
  status: UserApprovalStatus, 
  role: UserRole, 
  planAccess: UserPlanAccess
): UserPermissions {
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  
  // Admins have total access regardless of plan
  if (isAdmin) {
    return {
      canAccessSales: true,
      canAccessClients: true,
      canAccessPlanning: true,
      canAccessProposals: true,
      canAccessAdmin: true,
      status,
      role,
      planAccess,
      planLimits: planAccess.planLimits
    };
  }
  
  // REJECTED/SUSPENDED blocks everything regardless of plan
  if (status === 'REJECTED' || status === 'SUSPENDED') {
    return {
      canAccessSales: false,
      canAccessClients: false,
      canAccessPlanning: false,
      canAccessProposals: false,
      canAccessAdmin: false,
      status,
      role,
      planAccess,
      planLimits: planAccess.planLimits
    };
  }
  
  // APPROVED/PENDING + plan verification
  // No active plan = no access to anything
  if (!planAccess.hasActivePlan) {
    return {
      canAccessSales: false,
      canAccessClients: false,
      canAccessPlanning: false,
      canAccessProposals: false,
      canAccessAdmin: false,
      status,
      role,
      planAccess,
      planLimits: planAccess.planLimits
    };
  }
  
  // NoUser plan = no access to anything
  if (planAccess.isNoUserPlan) {
    return {
      canAccessSales: false,
      canAccessClients: false,
      canAccessPlanning: false,
      canAccessProposals: false,
      canAccessAdmin: false,
      status,
      role,
      planAccess,
      planLimits: planAccess.planLimits
    };
  }
  
  // Other plans = access based on limits
  const limits = planAccess.planLimits;
  if (!limits) {
    return {
      canAccessSales: false,
      canAccessClients: false,
      canAccessPlanning: false,
      canAccessProposals: false,
      canAccessAdmin: false,
      status,
      role,
      planAccess,
      planLimits: planAccess.planLimits
    };
  }
  
  return {
    canAccessSales: limits.maxTranscriptionMinMonth > 0,
    canAccessClients: true, // Always true for active plans (except NoUser)
    canAccessPlanning: limits.maxPlanningsMonth > 0,
    canAccessProposals: limits.maxProposalsMonth > 0,
    canAccessAdmin: false,
    status,
    role,
    planAccess,
    planLimits: planAccess.planLimits
  };
}