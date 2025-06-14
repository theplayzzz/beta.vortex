'use client';

import Link from 'next/link';
import { Calendar, Building, MoreVertical, Star, Eye, FileCheck } from 'lucide-react';
import { RichnessScoreBadge } from '@/components/planning/RichnessScoreBadge';
import { ProposalStatusBadge } from './ProposalStatusBadge';

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

interface ProposalCardProps {
  proposal: Proposal;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isNew?: boolean;
  isHighlighted?: boolean;
  onMarkAsViewed?: () => void;
}

export function ProposalCard({ 
  proposal, 
  onEdit, 
  onDelete,
  isNew = false,
  isHighlighted = false,
  onMarkAsViewed
}: ProposalCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Determinar classes CSS baseadas nos estados
  const getCardClasses = () => {
    let classes = "bg-eerie-black rounded-lg border p-6 hover:border-sgbus-green/50 transition-all duration-300 group relative";
    
    if (isHighlighted) {
      classes += " border-sgbus-green shadow-lg shadow-sgbus-green/20 animate-pulse";
    } else if (isNew) {
      classes += " border-sgbus-green/40 shadow-md shadow-sgbus-green/10";
    } else {
      classes += " border-accent/20";
    }
    
    return classes;
  };

  return (
    <div className={getCardClasses()}>
      {/* Badge "Novo" */}
      {isNew && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-sgbus-green text-night px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
            <Star className="h-3 w-3" />
            NOVO
          </div>
        </div>
      )}

      {/* Badge "Destacado" */}
      {isHighlighted && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-sgbus-green text-night px-2 py-1 rounded-full text-xs font-bold animate-bounce shadow-lg">
            ✨ CRIADO
          </div>
        </div>
      )}

      {/* Header do Card */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link 
            href={`/propostas/${proposal.id}`}
            className="block group-hover:text-sgbus-green transition-colors"
            onClick={() => {
              if (isNew && onMarkAsViewed) {
                onMarkAsViewed();
              }
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <FileCheck className="h-4 w-4 text-sgbus-green" />
              <h3 className="text-lg font-semibold text-seasalt line-clamp-2">
                {proposal.title}
              </h3>
            </div>
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-seasalt/70 text-sm">Versão {proposal.version}</span>
            <ProposalStatusBadge status={proposal.status} size="sm" />
          </div>
        </div>
        
        {/* Menu de Ações */}
        <div className="ml-4 flex items-center gap-2">
          {/* Botão "Marcar como visto" para propostas novas */}
          {isNew && onMarkAsViewed && (
            <button
              onClick={onMarkAsViewed}
              className="p-2 text-sgbus-green hover:text-sgbus-green/80 transition-colors opacity-0 group-hover:opacity-100"
              title="Marcar como visto"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          
          <button className="p-2 text-seasalt/50 hover:text-seasalt transition-colors opacity-0 group-hover:opacity-100">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Informações do Cliente */}
      {proposal.Client && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-night rounded-lg">
          <Building className="h-4 w-4 text-sgbus-green flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-seasalt font-medium text-sm truncate">
              {proposal.Client.name}
            </p>
            <p className="text-seasalt/70 text-xs">
              {proposal.Client.industry || 'Setor não informado'}
            </p>
          </div>
          <RichnessScoreBadge score={proposal.Client.richnessScore} />
        </div>
      )}

      {/* Footer do Card */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          {/* Data de Criação */}
          <div className="flex items-center gap-2 text-seasalt/70">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(proposal.createdAt)}</span>
          </div>
        </div>

        {/* Status (repetido aqui para consistência visual) */}
        <ProposalStatusBadge status={proposal.status} size="sm" />
      </div>

      {/* Efeito de glow para propostas destacadas */}
      {isHighlighted && (
        <div className="absolute inset-0 rounded-lg bg-sgbus-green/5 pointer-events-none animate-pulse" />
      )}
    </div>
  );
} 