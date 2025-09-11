import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma/client'
import { getUserIdFromClerkWithSync } from '@/lib/auth/user-sync'

export interface UsageStats {
  plannings: {
    used: number
    limit: number
    available: number
    percentage: number
  }
  proposals: {
    used: number
    limit: number
    available: number
    percentage: number
  }
  transcriptionMinutes: {
    used: number
    limit: number
    available: number
    percentage: number
  }
  clients: {
    total: number
  }
  planInfo: {
    name: string
    hasActivePlan: boolean
    isNoUserPlan: boolean
  }
  currentPeriod: string
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Get database user ID
    const userId = await getUserIdFromClerkWithSync()
    
    if (!userId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Get current month period (YYYY-MM format)
    const now = new Date()
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Get user's active plan
    const userPlan = await prisma.userPlan.findFirst({
      where: {
        userId,
        isActive: true
      },
      include: {
        Plan: true
      }
    })

    // Default values for no plan
    let planLimits = {
      maxPlanningsMonth: 0,
      maxProposalsMonth: 0,
      maxTranscriptionMinMonth: 0
    }
    let planInfo = {
      name: 'Nenhum Plano',
      hasActivePlan: false,
      isNoUserPlan: false
    }

    if (userPlan) {
      planLimits = {
        maxPlanningsMonth: userPlan.Plan.maxPlanningsMonth,
        maxProposalsMonth: userPlan.Plan.maxProposalsMonth,
        maxTranscriptionMinMonth: userPlan.Plan.maxTranscriptionMinMonth
      }
      planInfo = {
        name: userPlan.Plan.name,
        hasActivePlan: true,
        isNoUserPlan: userPlan.Plan.name.toLowerCase().includes('nouser')
      }
    }

    // Get or create usage record for current month
    let usage = await prisma.usageMonthly.findUnique({
      where: {
        userId_periodMonth: {
          userId,
          periodMonth: currentPeriod
        }
      }
    })

    // Create usage record if doesn't exist
    if (!usage) {
      usage = await prisma.usageMonthly.create({
        data: {
          userId,
          periodMonth: currentPeriod,
          usedPlannings: 0,
          usedProposals: 0,
          usedTranscriptionMinutes: 0,
          limitSnapshotPlannings: planLimits.maxPlanningsMonth,
          limitSnapshotProposals: planLimits.maxProposalsMonth,
          limitSnapshotTranscriptionMinutes: planLimits.maxTranscriptionMinMonth
        }
      })
    }

    // Get total clients count (not limited by plan)
    const clientsCount = await prisma.client.count({
      where: {
        userId,
        deletedAt: null
      }
    })

    // Calculate usage statistics
    const calculateStats = (used: number, limit: number) => {
      const available = Math.max(0, limit - used)
      const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0
      return { used, limit, available, percentage }
    }

    const stats: UsageStats = {
      plannings: calculateStats(usage.usedPlannings, planLimits.maxPlanningsMonth),
      proposals: calculateStats(usage.usedProposals, planLimits.maxProposalsMonth),
      transcriptionMinutes: calculateStats(usage.usedTranscriptionMinutes, planLimits.maxTranscriptionMinMonth),
      clients: {
        total: clientsCount
      },
      planInfo,
      currentPeriod
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching usage stats:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}