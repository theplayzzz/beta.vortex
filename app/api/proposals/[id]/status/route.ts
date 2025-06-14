import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma/client';

interface ErrorDetails {
  error: any;
  errorType: any;
  retryCount: number;
  timestamp: any;
}

interface StatusInfo {
  status: string;
  message: string;
  isProcessing: boolean;
  isComplete: boolean;
  hasError: boolean;
  errorDetails: ErrorDetails | null;
  progress: number;
}

// GET /api/proposals/[id]/status - Verificar status de uma proposta específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Aguardar resolução dos parâmetros
    const { id } = await params;

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
        id: id,
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

    // 🔥 NOVA LÓGICA: PRIORIZAR CAMPOS NOVOS PARA STATUS
    let statusInfo: StatusInfo = {
      status: 'draft',
      message: 'Proposta em rascunho',
      isProcessing: false,
      isComplete: false,
      hasError: false,
      errorDetails: null,
      progress: 0
    };

    // ✅ VERIFICAÇÃO PRIMÁRIA: Usar campos novos como fonte de verdade
    const hasAIContent = !!(proposal.proposalMarkdown || proposal.proposalHtml || proposal.aiGeneratedContent);
    const isProposalSent = proposal.status === 'SENT';
    
    if (isProposalSent && hasAIContent) {
      // ✅ PROPOSTA PRONTA: IA processou e salvou conteúdo
      statusInfo = {
        status: 'completed',
        message: 'Proposta gerada com sucesso!',
        isProcessing: false,
        isComplete: true,
        hasError: false,
        errorDetails: null,
        progress: 100
      };
    } else if (isProposalSent && !hasAIContent) {
      // ⚠️ PROPOSTA ENVIADA MAS SEM CONTEÚDO: Possível erro ou ainda processando
      // Verificar se é recente (menos de 3 minutos) para considerar como processando
      const createdAt = new Date(proposal.createdAt).getTime();
      const now = Date.now();
      const isRecent = (now - createdAt) < (3 * 60 * 1000); // 3 minutos
      
      if (isRecent) {
        statusInfo = {
          status: 'generating',
          message: 'Aguardando processamento da IA...',
          isProcessing: true,
          isComplete: false,
          hasError: false,
          errorDetails: null,
          progress: 75
        };
      } else {
        // Proposta antiga sem conteúdo - possível erro
        statusInfo = {
          status: 'error',
          message: 'Erro no processamento da IA - conteúdo não foi gerado',
          isProcessing: false,
          isComplete: false,
          hasError: true,
          errorDetails: {
            error: 'Timeout ou falha na geração de conteúdo',
            errorType: 'ai_processing_timeout',
            retryCount: 0,
            timestamp: new Date().toISOString()
          },
          progress: 0
        };
      }
    } else {
      // 📋 PROPOSTA EM DRAFT: Verificar se há informações de erro no campo legado
      try {
        const generatedContent = JSON.parse(proposal.generatedContent || '{}');
        
        if (generatedContent.status === 'error' || generatedContent.status === 'legacy_error') {
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
        } else if (generatedContent.status === 'generating' || generatedContent.status === 'legacy_generating' || generatedContent.status === 'retrying') {
          statusInfo = {
            status: generatedContent.status === 'retrying' ? 'retrying' : 'generating',
            message: generatedContent.status === 'retrying' ? 'Tentando novamente...' : 'Gerando proposta com IA...',
            isProcessing: true,
            isComplete: false,
            hasError: false,
            errorDetails: null,
            progress: generatedContent.status === 'retrying' ? 50 : 25
          };
        }
        // ⚠️ IGNORAR generatedContent.status === 'completed' ou 'legacy_completed'
        // Apenas os campos novos (proposalMarkdown, etc.) determinam se está completo
      } catch (e) {
        // Erro no parse do generatedContent - manter status draft
        console.warn(`Erro ao fazer parse do generatedContent para proposta ${proposal.id}:`, e);
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
      hasContent: hasAIContent,
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