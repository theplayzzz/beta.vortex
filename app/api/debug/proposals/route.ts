import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    console.log('🔍 [DEBUG API] ClerkId recebido:', userId);
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: { clerkId: null }
      }, { status: 401 });
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    console.log('🔍 [DEBUG API] Usuário encontrado:', user);

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found in database',
        debug: { 
          clerkId: userId,
          userFound: false 
        }
      }, { status: 404 });
    }

    // Buscar todas as propostas deste usuário (sem filtros)
    const allProposals = await prisma.commercialProposal.findMany({
      where: { userId: user.id },
      include: {
        Client: {
          select: {
            id: true,
            name: true,
            industry: true,
          }
        }
      }
    });

    console.log('🔍 [DEBUG API] Propostas encontradas:', allProposals.length);

    // Verificar se há propostas gerais no banco
    const totalProposalsInDb = await prisma.commercialProposal.count();
    
    console.log('🔍 [DEBUG API] Total de propostas no banco:', totalProposalsInDb);

    return NextResponse.json({
      success: true,
      debug: {
        clerkId: userId,
        user: {
          id: user.id,
          email: user.email,
          clerkId: user.clerkId
        },
        proposalsForUser: allProposals.length,
        totalProposalsInDb,
        proposals: allProposals.map(p => ({
          id: p.id,
          title: p.title,
          status: p.status,
          userId: p.userId,
          clientId: p.clientId,
          clientName: p.Client?.name
        }))
      }
    });

  } catch (error) {
    console.error('❌ [DEBUG API] Erro:', error);
    return NextResponse.json({
      error: 'Internal server error',
      debug: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name
      }
    }, { status: 500 });
  }
} 