'use client';

import Link from 'next/link';
import { Calendar, User, Building, MoreVertical, Star, Eye } from 'lucide-react';
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
  specificObjectives?: string | null;
  createdAt: string;
  updatedAt: string;
  Client: Client;
}

interface PlanningCardProps {
  planning: Planning;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isNew?: boolean;
  isHighlighted?: boolean;
  onMarkAsViewed?: () => void;
}

export function PlanningCard({ 
  planning, 
  onEdit, 
  onDelete,
  isNew = false,
  isHighlighted = false,
  onMarkAsViewed
}: PlanningCardProps) {
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
            href={`/planejamentos/${planning.id}`}
            className="block group-hover:text-sgbus-green transition-colors"
            onClick={() => {
              if (isNew && onMarkAsViewed) {
                onMarkAsViewed();
              }
            }}
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
        <div className="ml-4 flex items-center gap-2">
          {/* Botão "Marcar como visto" para planejamentos novos */}
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

        {/* Status e Badge de Processamento IA */}
        <div className="flex items-center gap-2">
          {/* Badge "Processando IA" - mostra quando specificObjectives está vazio */}
          {(!planning.specificObjectives) && (
            <div className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1 animate-pulse">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
              Processando IA
            </div>
          )}
          
          {/* Status do Planejamento */}
          <div className={`px-2 py-1 rounded text-xs font-medium border ${
            statusColors[planning.status as keyof typeof statusColors] || statusColors.DRAFT
          }`}>
            {statusLabels[planning.status as keyof typeof statusLabels] || planning.status}
          </div>
        </div>
      </div>

      {/* Efeito de glow para planejamentos destacados */}
      {isHighlighted && (
        <div className="absolute inset-0 rounded-lg bg-sgbus-green/5 pointer-events-none animate-pulse" />
      )}
    </div>
  );
} 