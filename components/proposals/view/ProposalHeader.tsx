'use client';

import { Building, Calendar, User } from 'lucide-react';
import { ProposalStatusBadge } from '../ProposalStatusBadge';
import { RichnessScoreBadge } from '@/components/planning/RichnessScoreBadge';
import { Proposal } from '@/hooks/use-proposals';

interface ProposalHeaderProps {
  proposal: Proposal;
}

export function ProposalHeader({ proposal }: ProposalHeaderProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
      {/* Título e Status */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-seasalt mb-2">{proposal.title}</h1>
          <div className="flex items-center gap-4">
            <ProposalStatusBadge status={proposal.status} />
            <span className="text-seasalt/70 text-sm">Versão {proposal.version}</span>
          </div>
        </div>
      </div>

      {/* Informações do Cliente */}
      {proposal.Client && (
        <div className="bg-night rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sgbus-green font-semibold flex items-center gap-2">
              <Building className="h-4 w-4" />
              Informações do Cliente
            </h3>
            <RichnessScoreBadge score={proposal.Client.richnessScore} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-seasalt font-medium">{proposal.Client.name}</p>
              <p className="text-seasalt/70 text-sm">
                {proposal.Client.industry || 'Setor não informado'}
              </p>
            </div>
            
            {proposal.Client.contactEmail && (
              <div>
                <p className="text-seasalt/70 text-sm">E-mail</p>
                <p className="text-seasalt text-sm">{proposal.Client.contactEmail}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadados da Proposta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2 text-seasalt/70">
          <Calendar className="h-4 w-4" />
          <div>
            <p className="text-seasalt/50">Criado em</p>
            <p className="text-seasalt">{formatDate(proposal.createdAt)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-seasalt/70">
          <Calendar className="h-4 w-4" />
          <div>
            <p className="text-seasalt/50">Atualizado em</p>
            <p className="text-seasalt">{formatDate(proposal.updatedAt)}</p>
          </div>
        </div>

        {proposal.aiMetadata && (
          <div className="flex items-center gap-2 text-seasalt/70">
            <User className="h-4 w-4" />
            <div>
              <p className="text-seasalt/50">Modelo IA</p>
              <p className="text-seasalt">{proposal.aiMetadata.modelUsed}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 