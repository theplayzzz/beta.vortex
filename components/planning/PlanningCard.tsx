'use client';

import Link from 'next/link';
import { Calendar, User, Building, MoreVertical } from 'lucide-react';
import { RichnessScoreBadge } from './RichnessScoreBadge';

interface Client {
  id: string;
  name: string;
  industry?: string;
  richnessScore: number;
}

interface Planning {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  Client: Client;
}

interface PlanningCardProps {
  planning: Planning;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function PlanningCard({ planning, onEdit, onDelete }: PlanningCardProps) {
  const statusColors = {
    DRAFT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ACTIVE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
    ARCHIVED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  const statusLabels = {
    DRAFT: 'Rascunho',
    ACTIVE: 'Ativo',
    COMPLETED: 'Concluído',
    ARCHIVED: 'Arquivado',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-eerie-black rounded-lg border border-accent/20 p-6 hover:border-sgbus-green/50 transition-colors group">
      {/* Header do Card */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link 
            href={`/planejamentos/${planning.id}`}
            className="block group-hover:text-sgbus-green transition-colors"
          >
            <h3 className="text-lg font-semibold text-seasalt mb-1 line-clamp-2">
              {planning.title}
            </h3>
          </Link>
          {planning.description && (
            <p className="text-seasalt/70 text-sm line-clamp-2">
              {planning.description}
            </p>
          )}
        </div>
        
        {/* Menu de Ações */}
        <div className="ml-4">
          <button className="p-2 text-seasalt/50 hover:text-seasalt transition-colors opacity-0 group-hover:opacity-100">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Informações do Cliente */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-night rounded-lg">
        <Building className="h-4 w-4 text-sgbus-green flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-seasalt font-medium text-sm truncate">
            {planning.Client.name}
          </p>
          <p className="text-seasalt/70 text-xs">
            {planning.Client.industry || 'Setor não informado'}
          </p>
        </div>
        <RichnessScoreBadge score={planning.Client.richnessScore} />
      </div>

      {/* Footer do Card */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          {/* Data de Criação */}
          <div className="flex items-center gap-2 text-seasalt/70">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(planning.createdAt)}</span>
          </div>
        </div>

        {/* Status */}
        <div className={`px-2 py-1 rounded text-xs font-medium border ${
          statusColors[planning.status as keyof typeof statusColors] || statusColors.DRAFT
        }`}>
          {statusLabels[planning.status as keyof typeof statusLabels] || planning.status}
        </div>
      </div>
    </div>
  );
} 