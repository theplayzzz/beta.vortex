import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';

// GET /api/proposals/[id]/status - Verificar status de uma proposta específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Buscar proposta específica
    const proposal = await prisma.commercialProposal.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        Client: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Processar informações de status
    let statusInfo = {
      status: 'draft',
      message: 'Proposta em rascunho',
      isProcessing: false,
      isComplete: false,
      hasError: false,
      errorDetails: null,
      progress: 0
    };

    try {
      const generatedContent = JSON.parse(proposal.generatedContent || '{}');
      
      switch (generatedContent.status) {
        case 'generating':
          statusInfo = {
            status: 'generating',
            message: 'Gerando proposta com IA...',
            isProcessing: true,
            isComplete: false,
            hasError: false,
            errorDetails: null,
            progress: 25
          };
          break;
          
        case 'retrying':
          statusInfo = {
            status: 'retrying',
            message: 'Tentando novamente...',
            isProcessing: true,
            isComplete: false,
            hasError: false,
            errorDetails: null,
            progress: 50
          };
          break;
          
        case 'completed':
          statusInfo = {
            status: 'completed',
            message: 'Proposta gerada com sucesso!',
            isProcessing: false,
            isComplete: true,
            hasError: false,
            errorDetails: null,
            progress: 100
          };
          break;
          
        case 'error':
          statusInfo = {
            status: 'error',
            message: generatedContent.error || 'Erro na geração da proposta',
            isProcessing: false,
            isComplete: false,
            hasError: true,
            errorDetails: {
              error: generatedContent.error,
              errorType: generatedContent.errorType,
              retryCount: generatedContent.retryCount || 0,
              timestamp: generatedContent.timestamp
            },
            progress: 0
          };
          break;
          
        default:
          if (proposal.status === 'SENT' && proposal.proposalMarkdown) {
            statusInfo = {
              status: 'completed',
              message: 'Proposta gerada com sucesso!',
              isProcessing: false,
              isComplete: true,
              hasError: false,
              errorDetails: null,
              progress: 100
            };
          }
      }
    } catch (e) {
      // Se não conseguir fazer parse, assumir que está em draft
      if (proposal.status === 'SENT' && proposal.proposalMarkdown) {
        statusInfo = {
          status: 'completed',
          message: 'Proposta gerada com sucesso!',
          isProcessing: false,
          isComplete: true,
          hasError: false,
          errorDetails: null,
          progress: 100
        };
      }
    }

    return NextResponse.json({
      id: proposal.id,
      title: proposal.title,
      clientName: proposal.Client?.name || 'Cliente não encontrado',
      updatedAt: proposal.updatedAt,
      createdAt: proposal.createdAt,
      dbStatus: proposal.status,
      statusInfo,
      hasContent: !!proposal.proposalMarkdown,
      contentLength: proposal.proposalMarkdown?.length || 0
    });

  } catch (error) {
    console.error('Error fetching proposal status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 