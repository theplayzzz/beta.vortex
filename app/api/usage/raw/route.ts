import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';
import { getUserIdFromClerkWithSync } from '@/lib/auth/user-sync';

export interface RawUsageData {
  usedPlannings: number;
  limitSnapshotPlannings: number;
  bonusPlannings: number;
  usedProposals: number;
  limitSnapshotProposals: number;
  bonusProposals: number;
  usedTranscriptionMinutes: number;
  limitSnapshotTranscriptionMinutes: number;
  bonusTranscriptionMinutes: number;
  periodMonth: string;
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Get database user ID
    const userId = await getUserIdFromClerkWithSync();
    
    if (!userId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Get current month period (YYYY-MM format)
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get usage record for current month
    const usage = await prisma.usageMonthly.findUnique({
      where: {
        userId_periodMonth: {
          userId,
          periodMonth: currentPeriod
        }
      },
      select: {
        usedPlannings: true,
        limitSnapshotPlannings: true,
        bonusPlannings: true,
        usedProposals: true,
        limitSnapshotProposals: true,
        bonusProposals: true,
        usedTranscriptionMinutes: true,
        limitSnapshotTranscriptionMinutes: true,
        bonusTranscriptionMinutes: true,
        periodMonth: true,
      }
    });

    if (!usage) {
      // Return default values if no usage record exists
      const defaultUsage: RawUsageData = {
        usedPlannings: 0,
        limitSnapshotPlannings: 0,
        bonusPlannings: 0,
        usedProposals: 0,
        limitSnapshotProposals: 0,
        bonusProposals: 0,
        usedTranscriptionMinutes: 0,
        limitSnapshotTranscriptionMinutes: 0,
        bonusTranscriptionMinutes: 0,
        periodMonth: currentPeriod,
      };
      
      return NextResponse.json(defaultUsage);
    }

    return NextResponse.json(usage);

  } catch (error) {
    console.error('Error fetching raw usage data:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
