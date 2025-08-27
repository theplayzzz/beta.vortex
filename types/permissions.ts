export type UserApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type Modalidade = 'vendas' | 'clientes' | 'planejamentos' | 'propostas';

export interface UserPermissions {
  canAccessSales: boolean;
  canAccessClients: boolean;
  canAccessPlanning: boolean;
  canAccessProposals: boolean;
  canAccessAdmin: boolean;
  status: UserApprovalStatus;
  role: UserRole;
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
  ...MODALIDADE_ROUTES.vendas
];

export function getPermissionsForStatus(status: UserApprovalStatus, role: UserRole): UserPermissions {
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  
  if (isAdmin) {
    return {
      canAccessSales: true,
      canAccessClients: true,
      canAccessPlanning: true,
      canAccessProposals: true,
      canAccessAdmin: true,
      status,
      role
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
        role
      };
    
    case 'PENDING':
      return {
        canAccessSales: true, // PENDING users can access sales/coaching
        canAccessClients: false,
        canAccessPlanning: false,
        canAccessProposals: false,
        canAccessAdmin: false,
        status,
        role
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
        role
      };
  }
}