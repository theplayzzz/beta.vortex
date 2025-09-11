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

/**
 * Upgrade user plan from NoUser to Basic when approved
 * 
 * @param userId - User ID to upgrade plan for
 * @returns Promise<PlanAssignmentResult>
 */
export async function upgradePlanOnApproval(userId: string): Promise<PlanAssignmentResult> {
  const logPrefix = '[PLAN_UPGRADE]';
  
  try {
    console.log(`${logPrefix} Starting plan upgrade for approved user: ${userId}`);
    
    // Check current active plan
    const currentPlan = await withDatabaseRetry(async () => {
      return prisma.userPlan.findFirst({
        where: { 
          userId, 
          isActive: true 
        },
        include: { Plan: true }
      });
    }, 'check current plan');
    
    if (!currentPlan) {
      console.log(`${logPrefix} ⚠️ User ${userId} has no active plan, assigning basic plan`);
      // If no plan, assign basic plan directly
      return await assignDefaultPlan(userId, 'APPROVED', 'USER');
    }
    
    // If already has basic plan or better, don't change
    if (currentPlan.Plan.name.includes('Básico') || 
        currentPlan.Plan.name.includes('Admin') || 
        currentPlan.Plan.name.includes('Ilimitado')) {
      console.log(`${logPrefix} ✅ User ${userId} already has adequate plan: ${currentPlan.Plan.name}`);
      return {
        success: true,
        planId: currentPlan.planId,
        planName: currentPlan.Plan.name
      };
    }
    
    console.log(`${logPrefix} Current plan: ${currentPlan.Plan.name}, upgrading to Basic`);
    
    // Find target basic plan
    const targetPlan = await withDatabaseRetry(async () => {
      // Try exact name match first
      let plan = await prisma.plan.findFirst({
        where: { 
          name: 'Plano Básico - 12 meses',
          isActive: true 
        }
      });
      
      // Fallback to any basic plan
      if (!plan) {
        console.log(`${logPrefix} ⚠️ Exact basic plan not found, trying fallbacks`);
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
      }
      
      return plan;
    }, 'find target basic plan');
    
    if (!targetPlan) {
      const errorMsg = 'Basic plan not found';
      console.error(`${logPrefix} ❌ ${errorMsg}`);
      return {
        success: false,
        error: errorMsg
      };
    }
    
    console.log(`${logPrefix} Target basic plan: ${targetPlan.name} (${targetPlan.id})`);
    
    // Use transaction to ensure atomicity
    const result = await withDatabaseRetry(async () => {
      return await prisma.$transaction(async (tx) => {
        // Deactivate current plan
        await tx.userPlan.update({
          where: { id: currentPlan.id },
          data: { 
            isActive: false,
            canceledAt: new Date(),
            cancelReason: 'Upgraded to basic plan after approval'
          }
        });
        
        // Calculate end date for new plan
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + targetPlan.durationMonths);
        
        // Create new plan
        const newUserPlan = await tx.userPlan.create({
          data: {
            userId,
            planId: targetPlan.id,
            startsAt: startDate,
            endsAt: endDate,
            isActive: true
          },
          include: { Plan: true }
        });
        
        return newUserPlan;
      });
    }, 'upgrade plan transaction');
    
    console.log(`${logPrefix} ✅ Successfully upgraded plan for user ${userId}: ${currentPlan.Plan.name} → ${result.Plan.name}`);
    
    return {
      success: true,
      planId: result.planId,
      planName: result.Plan.name
    };
    
  } catch (error: any) {
    console.error(`${logPrefix} ❌ Error upgrading plan for user ${userId}:`, {
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}