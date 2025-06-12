import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';

// GET /api/proposals/status - Monitorar status das propostas
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Buscar propostas com problemas
    const failedProposals = await prisma.commercialProposal.findMany({
      where: {
        userId: user.id,
        status: 'DRAFT',
        generatedContent: {
          contains: '"status":"error"'
        }
      },
      include: {
        Client: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Processar dados das propostas com erro
    const processedProposals = failedProposals.map(proposal => {
      let errorInfo = null;
      try {
        const generatedContent = JSON.parse(proposal.generatedContent || '{}');
        if (generatedContent.status === 'error') {
          errorInfo = {
            error: generatedContent.error,
            errorType: generatedContent.errorType || 'unknown',
            retryCount: generatedContent.retryCount || 0,
            timestamp: generatedContent.timestamp
          };
        }
      } catch (e) {
        // Ignorar erros de parsing
      }

      return {
        id: proposal.id,
        title: proposal.title,
        clientName: proposal.Client?.name || 'Cliente não encontrado',
        updatedAt: proposal.updatedAt,
        errorInfo
      };
    }).filter(p => p.errorInfo !== null);

    // Estatísticas
    const stats = {
      totalFailed: processedProposals.length,
      timeoutErrors: processedProposals.filter(p => p.errorInfo?.errorType === 'timeout').length,
      networkErrors: processedProposals.filter(p => p.errorInfo?.errorType === 'network').length,
      otherErrors: processedProposals.filter(p => p.errorInfo?.errorType === 'unknown').length,
      recentErrors: processedProposals.filter(p => {
        const errorDate = new Date(p.errorInfo?.timestamp || 0);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return errorDate > hourAgo;
      }).length
    };

    return NextResponse.json({
      proposals: processedProposals,
      stats
    });

  } catch (error) {
    console.error('Error fetching proposal status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/proposals/status - Retry proposta com erro
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { proposalId } = body;

    if (!proposalId) {
      return NextResponse.json({ error: 'Proposal ID required' }, { status: 400 });
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Buscar proposta e verificar se pertence ao usuário
    const proposal = await prisma.commercialProposal.findFirst({
      where: {
        id: proposalId,
        userId: user.id,
      },
      include: {
        Client: true
      }
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Verificar se a proposta tem erro
    let hasError = false;
    try {
      const generatedContent = JSON.parse(proposal.generatedContent || '{}');
      hasError = generatedContent.status === 'error';
    } catch (e) {
      hasError = false;
    }

    if (!hasError) {
      return NextResponse.json({ error: 'Proposal does not have error status' }, { status: 400 });
    }

    // Resetar status para retry
    await prisma.commercialProposal.update({
      where: { id: proposalId },
      data: {
        generatedContent: JSON.stringify({
          status: 'retrying',
          message: 'Tentativa manual iniciada...',
          timestamp: new Date().toISOString()
        }),
        updatedAt: new Date()
      }
    });

    // Importar a função de processamento (assumindo que ela está exportada)
    // Como não podemos importar diretamente, vamos fazer uma nova chamada para a API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/proposals/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify({
        ...(proposal.formDataJSON as any),
        isRetry: true
      })
    });

    if (response.ok) {
      return NextResponse.json({ 
        message: 'Retry iniciado com sucesso',
        proposalId: proposalId
      });
    } else {
      return NextResponse.json({ 
        error: 'Falha ao iniciar retry'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error retrying proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 