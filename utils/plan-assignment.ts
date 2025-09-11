import { prisma } from '@/lib/prisma/client';
import { withDatabaseRetry } from './retry-mechanism';

interface PlanAssignmentResult {
  success: boolean;
  planId?: string;
  planName?: string;
  error?: string;
}

/**
 * Assign default plan to user based on approval status
 * 
 * @param userId - User ID to assign plan to
 * @param approvalStatus - Current approval status of user
 * @param userRole - User role (USER, ADMIN, etc)
 * @returns Promise<PlanAssignmentResult>
 */
export async function assignDefaultPlan(
  userId: string, 
  approvalStatus: string, 
  userRole: string
): Promise<PlanAssignmentResult> {
  const logPrefix = '[PLAN_ASSIGNMENT]';
  
  try {
    console.log(`${logPrefix} Starting plan assignment for user: ${userId}, status: ${approvalStatus}, role: ${userRole}`);
    
    // Check if user already has an active plan
    const existingPlan = await withDatabaseRetry(async () => {
      return prisma.userPlan.findFirst({
        where: { 
          userId, 
          isActive: true 
        },
        include: { Plan: true }
      });
    }, 'check existing plan');
    
    if (existingPlan) {
      console.log(`${logPrefix} ✅ User ${userId} already has active plan: ${existingPlan.Plan.name}`);
      return {
        success: true,
        planId: existingPlan.planId,
        planName: existingPlan.Plan.name
      };
    }
    
    // Determine target plan name based on status and role
    let targetPlanName: string;
    
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      targetPlanName = 'Plano Admin Ilimitado - 12 meses';
    } else {
      switch (approvalStatus) {
        case 'PENDING':
          targetPlanName = 'NoUser';
          break;
        case 'APPROVED':
          targetPlanName = 'Plano Básico - 12 meses';
          break;
        case 'REJECTED':
        case 'SUSPENDED':
          targetPlanName = 'NoUser';
          break;
        default:
          targetPlanName = 'NoUser';
      }
    }
    
    console.log(`${logPrefix} Target plan for user ${userId}: ${targetPlanName}`);
    
    // Find the target plan
    const targetPlan = await withDatabaseRetry(async () => {
      // Try exact name match first
      let plan = await prisma.plan.findFirst({
        where: { 
          name: targetPlanName,
          isActive: true 
        }
      });
      
      // Fallback strategies if exact match not found
      if (!plan) {
        console.log(`${logPrefix} ⚠️ Exact plan name not found: ${targetPlanName}, trying fallbacks`);
        
        if (targetPlanName.includes('NoUser')) {
          // Try alternative NoUser plan names
          plan = await prisma.plan.findFirst({
            where: { 
              OR: [
                { name: { contains: 'NoUser', mode: 'insensitive' } },
                { name: { contains: 'Plano NoUser', mode: 'insensitive' } }
              ],
              isActive: true 
            },
            orderBy: { displayOrder: 'asc' }
          });
        } else if (targetPlanName.includes('Básico')) {
          // Try alternative basic plan names
          plan = await prisma.plan.findFirst({
            where: { 
              OR: [
                { name: { contains: 'Básico', mode: 'insensitive' } },
                { name: { contains: 'Basic', mode: 'insensitive' } }
              ],
              isActive: true 
            },
            orderBy: { displayOrder: 'asc' }
          });
        } else if (targetPlanName.includes('Admin')) {
          // Try alternative admin plan names
          plan = await prisma.plan.findFirst({
            where: { 
              OR: [
                { name: { contains: 'Admin', mode: 'insensitive' } },
                { name: { contains: 'Ilimitado', mode: 'insensitive' } }
              ],
              isActive: true 
            },
            orderBy: { displayOrder: 'desc' }
          });
        }
      }
      
      return plan;
    }, 'find target plan');
    
    if (!targetPlan) {
      const errorMsg = `Target plan not found: ${targetPlanName}`;
      console.error(`${logPrefix} ❌ ${errorMsg}`);
      return {
        success: false,
        error: errorMsg
      };
    }
    
    console.log(`${logPrefix} Found target plan: ${targetPlan.name} (${targetPlan.id})`);
    
    // Calculate end date based on plan duration
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + targetPlan.durationMonths);
    
    // Create UserPlan
    const userPlan = await withDatabaseRetry(async () => {
      return prisma.userPlan.create({
        data: {
          userId,
          planId: targetPlan.id,
          startsAt: startDate,
          endsAt: endDate,
          isActive: true
        },
        include: { Plan: true }
      });
    }, 'create user plan');
    
    console.log(`${logPrefix} ✅ Successfully assigned plan to user ${userId}: ${userPlan.Plan.name}`);
    
    return {
      success: true,
      planId: userPlan.planId,
      planName: userPlan.Plan.name
    };
    
  } catch (error: any) {
    console.error(`${logPrefix} ❌ Error assigning plan to user ${userId}:`, {
      error: error.message,
      code: error.code,
      approvalStatus,
      userRole,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}