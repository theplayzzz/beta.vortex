import { UserApprovalStatus, UserRole, Modalidade, UserPermissions, MODALIDADE_ROUTES, PENDING_ALLOWED_ROUTES, getPermissionsForStatus, UserPlanAccess, PlanLimits } from '@/types/permissions';
import { prisma } from '@/lib/prisma/client';
import { withDatabaseRetry } from '@/utils/retry-mechanism';

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

/**
 * Get active plan for a user by userId
 * 
 * @param userId - Database user ID
 * @returns Promise<UserPlanAccess>
 */
export async function getUserActivePlan(userId: string): Promise<UserPlanAccess> {
  try {
    const activePlan = await withDatabaseRetry(async () => {
      return prisma.userPlan.findFirst({
        where: { 
          userId, 
          isActive: true 
        },
        include: { Plan: true }
      });
    }, `get active plan for user ${userId}`);
    
    if (!activePlan) {
      return {
        hasActivePlan: false,
        planLimits: null,
        isNoUserPlan: false
      };
    }
    
    const isNoUserPlan = activePlan.Plan.name.toLowerCase().includes('nouser');
    
    return {
      hasActivePlan: true,
      planLimits: {
        maxPlanningsMonth: activePlan.Plan.maxPlanningsMonth,
        maxTranscriptionMinMonth: activePlan.Plan.maxTranscriptionMinMonth,
        maxProposalsMonth: activePlan.Plan.maxProposalsMonth,
        planName: activePlan.Plan.name,
        planId: activePlan.Plan.id
      },
      isNoUserPlan
    };
    
  } catch (error: any) {
    console.error('[PERMISSIONS] Error getting user active plan:', error);
    // Return default structure on error
    return {
      hasActivePlan: false,
      planLimits: null,
      isNoUserPlan: false
    };
  }
}

/**
 * Get active plan for a user by clerkId
 * 
 * @param clerkId - Clerk user ID
 * @returns Promise<UserPlanAccess>
 */
export async function getUserActivePlanByClerkId(clerkId: string): Promise<UserPlanAccess> {
  try {
    // First find the user by clerkId
    const user = await withDatabaseRetry(async () => {
      return prisma.user.findUnique({
        where: { clerkId }
      });
    }, `find user by clerkId ${clerkId}`);
    
    if (!user) {
      console.warn('[PERMISSIONS] User not found for clerkId:', clerkId);
      return {
        hasActivePlan: false,
        planLimits: null,
        isNoUserPlan: false
      };
    }
    
    // Get active plan using userId
    return getUserActivePlan(user.id);
    
  } catch (error: any) {
    console.error('[PERMISSIONS] Error getting user active plan by clerkId:', error);
    return {
      hasActivePlan: false,
      planLimits: null,
      isNoUserPlan: false
    };
  }
}

/**
 * Check if user has access to a specific feature based on plan limits
 * 
 * @param modalidade - Feature to check access for
 * @param permissions - Current user permissions
 * @returns boolean
 */
export function checkPlanLimits(modalidade: Modalidade, permissions: UserPermissions | null): boolean {
  if (!permissions || !permissions.planLimits) {
    return false;
  }
  
  const limits = permissions.planLimits;
  
  switch (modalidade) {
    case 'vendas':
      return limits.maxTranscriptionMinMonth > 0;
    case 'clientes':
      return true; // Always true for active plans (except NoUser which is handled in permissions)
    case 'planejamentos':
      return limits.maxPlanningsMonth > 0;
    case 'propostas':
      return limits.maxProposalsMonth > 0;
    default:
      return false;
  }
}