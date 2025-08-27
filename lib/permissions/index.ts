import { UserApprovalStatus, UserRole, Modalidade, UserPermissions, MODALIDADE_ROUTES, PENDING_ALLOWED_ROUTES, getPermissionsForStatus } from '@/types/permissions';

export function hasAccess(modalidade: Modalidade, permissions: UserPermissions | null): boolean {
  if (!permissions) return false;
  
  switch (modalidade) {
    case 'vendas':
      return permissions.canAccessSales;
    case 'clientes':
      return permissions.canAccessClients;
    case 'planejamentos':
      return permissions.canAccessPlanning;
    case 'propostas':
      return permissions.canAccessProposals;
    default:
      return false;
  }
}

export function getAllowedRoutesForUser(permissions: UserPermissions | null): string[] {
  if (!permissions) return ['/sign-in', '/sign-up'];
  
  const allowedRoutes: string[] = ['/', '/pending-approval', '/account-rejected', '/account-suspended'];
  
  if (permissions.canAccessSales) {
    allowedRoutes.push(...MODALIDADE_ROUTES.vendas);
  }
  
  if (permissions.canAccessClients) {
    allowedRoutes.push(...MODALIDADE_ROUTES.clientes);
  }
  
  if (permissions.canAccessPlanning) {
    allowedRoutes.push(...MODALIDADE_ROUTES.planejamentos);
  }
  
  if (permissions.canAccessProposals) {
    allowedRoutes.push(...MODALIDADE_ROUTES.propostas);
  }
  
  if (permissions.canAccessAdmin) {
    allowedRoutes.push('/admin');
  }
  
  return allowedRoutes;
}

export function isRouteAllowedForPending(pathname: string): boolean {
  return PENDING_ALLOWED_ROUTES.some(route => {
    if (route.endsWith('/*')) {
      return pathname.startsWith(route.slice(0, -2));
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

export function getModalidadeFromRoute(pathname: string): Modalidade | null {
  for (const [modalidade, routes] of Object.entries(MODALIDADE_ROUTES)) {
    if (routes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
      return modalidade as Modalidade;
    }
  }
  return null;
}

export { getPermissionsForStatus };