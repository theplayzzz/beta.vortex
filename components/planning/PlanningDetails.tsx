'use client';

import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Edit3, 
  MoreVertical,
  Clock
} from 'lucide-react';
import { FormDataDisplay } from './FormDataDisplay';
import { RichnessScoreBadge } from './RichnessScoreBadge';

interface Client {
  id: string;
  name: string;
  industry?: string;
  richnessScore: number;
  businessDetails?: string;
  contactEmail?: string;
  website?: string;
}

interface Planning {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  formDataJSON?: any;
  clientSnapshot?: any;
  Client: Client;
}

interface PlanningDetailsProps {
  planning: Planning;
  isLoading?: boolean;
}

const statusConfig = {
  DRAFT: {
    label: 'Rascunho',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: '📝'
  },
  ACTIVE: {
    label: 'Ativo',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: '🚀'
  },
  COMPLETED: {
    label: 'Concluído',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: '✅'
  },
  ARCHIVED: {
    label: 'Arquivado',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    icon: '📦'
  },
  PENDING_AI_BACKLOG_GENERATION: {
    label: 'Aguardando IA',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: '🤖'
  },
  AI_BACKLOG_VISIBLE: {
    label: 'Backlog IA Gerado',
    color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    icon: '🎯'
  }
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Hoje';
  if (diffInDays === 1) return 'Ontem';
  if (diffInDays < 7) return `${diffInDays} dias atrás`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} semanas atrás`;
  return `${Math.floor(diffInDays / 30)} meses atrás`;
}

export function PlanningDetails({ planning, isLoading = false }: PlanningDetailsProps) {
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-eerie-black rounded w-1/3"></div>
          <div className="h-4 bg-eerie-black rounded w-2/3"></div>
          <div className="h-32 bg-eerie-black rounded"></div>
        </div>
      </div>
    );
  }

  const status = statusConfig[planning.status as keyof typeof statusConfig] || statusConfig.DRAFT;

  return (
    <div className="p-6 space-y-6">
      {/* Header Simplificado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/planejamentos"
            className="p-2 text-seasalt/70 hover:text-seasalt transition-colors rounded-lg hover:bg-eerie-black"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-seasalt">{planning.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${status.color}`}>
                <span className="mr-1">{status.icon}</span>
                {status.label}
              </div>
              <span className="text-seasalt/70 text-sm">
                Cliente: {planning.Client.name}
              </span>
              <RichnessScoreBadge score={planning.Client.richnessScore} />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href={`/planejamentos/${planning.id}/editar`}
            className="bg-sgbus-green hover:bg-sgbus-green/90 text-night px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Editar
          </Link>
          <button className="p-2 text-seasalt/70 hover:text-seasalt transition-colors rounded-lg hover:bg-eerie-black">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Metadados Compactos */}
      <div className="bg-eerie-black rounded-lg border border-accent/20 p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span className="text-seasalt/70">Criado:</span>
              <span className="text-seasalt">{formatDate(planning.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-seasalt/70">Atualizado:</span>
              <span className="text-seasalt">{formatDate(planning.updatedAt)}</span>
            </div>
          </div>
          {planning.description && (
            <div className="text-seasalt/70 max-w-md truncate">
              {planning.description}
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo Principal: Dados do Formulário */}
      <div className="space-y-6">
        <FormDataDisplay formData={planning.formDataJSON} />
      </div>
    </div>
  );
} 