'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useProposal } from '@/hooks/use-proposals';
import { ProposalHeader } from './ProposalHeader';
import { ContentRenderer } from './ContentRenderer';
import { AIInsightsPanel } from './AIInsightsPanel';
import { ProposalActions } from './ProposalActions';
import { ProposalEmptyState } from './ProposalEmptyState';

interface ProposalViewerProps {
  proposalId: string;
}

export function ProposalViewer({ proposalId }: ProposalViewerProps) {
  const { data: proposal, isLoading, error } = useProposal(proposalId);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-sgbus-green mx-auto mb-4" />
            <p className="text-seasalt/70">Carregando proposta...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-seasalt mb-2">Erro ao carregar proposta</h3>
          <p className="text-seasalt/70 mb-6">{error.message}</p>
          <Link 
            href="/propostas"
            className="inline-flex items-center gap-2 px-4 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Propostas
          </Link>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-seasalt mb-2">Proposta não encontrada</h3>
          <p className="text-seasalt/70 mb-6">A proposta que você está procurando não existe ou foi removida.</p>
          <Link 
            href="/propostas"
            className="inline-flex items-center gap-2 px-4 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Propostas
          </Link>
        </div>
      </div>
    );
  }

  // Se não há conteúdo da IA ainda
  if (!proposal.aiGeneratedContent && !proposal.proposalHtml) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link 
            href="/propostas"
            className="flex items-center gap-2 text-seasalt/70 hover:text-seasalt transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Propostas
          </Link>
          <span className="text-seasalt/50">/</span>
          <span className="text-seasalt">{proposal.title}</span>
        </div>

        <ProposalHeader proposal={proposal} />
        <ProposalEmptyState proposal={proposal} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link 
          href="/propostas"
          className="flex items-center gap-2 text-seasalt/70 hover:text-seasalt transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Propostas
        </Link>
        <span className="text-seasalt/50">/</span>
        <span className="text-seasalt">{proposal.title}</span>
      </div>

      <ProposalHeader proposal={proposal} />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Conteúdo Principal */}
        <div className="lg:col-span-3">
          <ContentRenderer 
            htmlContent={proposal.proposalHtml}
            markdownContent={proposal.proposalMarkdown}
          />
        </div>
        
        {/* Sidebar com Insights */}
        <div className="lg:col-span-1">
          <AIInsightsPanel 
            insights={proposal.aiGeneratedContent?.ai_insights}
            metadata={proposal.aiGeneratedContent?.metadata}
            extraData={proposal.aiGeneratedContent?.dados_extras}
          />
        </div>
      </div>
      
      <ProposalActions proposalId={proposalId} proposal={proposal} />
    </div>
  );
} 