'use client';

import { ProposalCard } from './ProposalCard';

interface Client {
  id: string;
  name: string;
  industry: string | null;
  richnessScore: number;
  businessDetails?: string | null;
  contactEmail?: string | null;
  website?: string | null;
}

interface Proposal {
  id: string;
  title: string;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'NEGOTIATION' | 'ARCHIVED';
  version: number;
  clientId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  
  // ✅ Campos da IA (únicos e definitivos)
  aiGeneratedContent: any | null;
  proposalHtml: string | null;
  proposalMarkdown: string | null;
  aiMetadata: any | null;
  
  // ✅ Dados do formulário e snapshot do cliente
  formDataJSON: any | null;
  clientSnapshot: any | null;
  
  Client?: Client;
  parsedContent?: any;
}

interface ProposalsListProps {
  proposals: Proposal[];
  isLoading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  highlightedId?: string;
  newProposalIds?: string[];
  onMarkAsViewed?: (id: string) => void;
}

export function ProposalsList({ 
  proposals, 
  isLoading,
  onEdit,
  onDelete,
  highlightedId,
  newProposalIds = [],
  onMarkAsViewed
}: ProposalsListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-eerie-black rounded-lg border border-accent/20 p-6 animate-pulse">
            <div className="h-4 bg-accent/20 rounded mb-3"></div>
            <div className="h-3 bg-accent/20 rounded mb-2"></div>
            <div className="h-3 bg-accent/20 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-seasalt mb-2">Nenhuma proposta encontrada</h3>
        <p className="text-seasalt/70">
          Suas propostas aparecerão aqui quando você criá-las
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          onEdit={onEdit}
          onDelete={onDelete}
          isHighlighted={proposal.id === highlightedId}
          isNew={newProposalIds.includes(proposal.id)}
          onMarkAsViewed={() => onMarkAsViewed?.(proposal.id)}
        />
      ))}
    </div>
  );
} 