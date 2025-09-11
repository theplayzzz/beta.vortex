import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma/client'
import { getUserIdFromClerkWithSync } from '@/lib/auth/user-sync'
import { BonusType } from '@prisma/client'

export async function POST() {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = await getUserIdFromClerkWithSync()
    
    if (!userId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Check if user has already claimed this bonus
    const existingClaim = await prisma.userBonusClaims.findUnique({
      where: {
        unique_user_bonus_type: {
          userId,
          bonusType: BonusType.PLANNING_PROMO
        }
      }
    })

    if (existingClaim) {
      return NextResponse.json(
        { error: 'Bônus já foi resgatado anteriormente' }, 
        { status: 400 }
      )
    }

    // Get current month period (YYYY-MM format)
    const now = new Date()
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Get user's active plan to determine limits for usage record creation
    const userPlan = await prisma.userPlan.findFirst({
      where: {
        userId,
        isActive: true
      },
      include: {
        Plan: true
      }
    })

    const planLimits = userPlan ? {
      maxPlanningsMonth: userPlan.Plan.maxPlanningsMonth,
      maxProposalsMonth: userPlan.Plan.maxProposalsMonth,
      maxTranscriptionMinMonth: userPlan.Plan.maxTranscriptionMinMonth
    } : {
      maxPlanningsMonth: 0,
      maxProposalsMonth: 0,
      maxTranscriptionMinMonth: 0
    }

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create the bonus claim record
      const bonusClaim = await tx.userBonusClaims.create({
        data: {
          userId,
          bonusType: BonusType.PLANNING_PROMO,
          amount: 2,
          claimedAt: new Date()
        }
      })

      // Get or create current month usage record
      let usage = await tx.usageMonthly.findUnique({
        where: {
          userId_periodMonth: {
            userId,
            periodMonth: currentPeriod
          }
        }
      })

      if (!usage) {
        usage = await tx.usageMonthly.create({
          data: {
            userId,
            periodMonth: currentPeriod,
            usedPlannings: 0,
            usedProposals: 0,
            usedTranscriptionMinutes: 0,
            limitSnapshotPlannings: planLimits.maxPlanningsMonth,
            limitSnapshotProposals: planLimits.maxProposalsMonth,
            limitSnapshotTranscriptionMinutes: planLimits.maxTranscriptionMinMonth,
            bonusPlannings: 2,
            bonusProposals: 0,
            bonusTranscriptionMinutes: 0
          }
        })
      } else {
        // Update existing usage record to add bonus plannings
        usage = await tx.usageMonthly.update({
          where: {
            id: usage.id
          },
          data: {
            bonusPlannings: usage.bonusPlannings + 2
          }
        })
      }

      return { bonusClaim, usage }
    })

    console.log('BONUS_CLAIM_SUCCESS:', {
      userId,
      bonusType: BonusType.PLANNING_PROMO,
      amount: 2,
      periodMonth: currentPeriod,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Bônus de 2 planejamentos resgatado com sucesso!',
      bonus: {
        type: 'planning',
        amount: 2,
        claimedAt: result.bonusClaim.claimedAt
      }
    })

  } catch (error) {
    console.error('BONUS_CLAIM_ERROR:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { error: 'Erro interno do servidor. Tente novamente.' },
      { status: 500 }
    )
  }
}