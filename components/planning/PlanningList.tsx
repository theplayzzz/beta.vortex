'use client';

import { PlanningCard } from './PlanningCard';
import { PlanningCardSkeleton } from './PlanningCardSkeleton';
import { Plus } from 'lucide-react';
import Link from 'next/link';

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

interface PlanningListProps {
  plannings?: Planning[];
  isLoading?: boolean;
  error?: string;
  emptyMessage?: string;
  newPlannings?: string[];
  highlightedPlanning?: string | null;
  onMarkAsViewed?: (planningIds: string[]) => void;
}

export function PlanningList({ 
  plannings, 
  isLoading = false, 
  error,
  emptyMessage = "Nenhum planejamento encontrado",
  newPlannings = [],
  highlightedPlanning = null,
  onMarkAsViewed
}: PlanningListProps) {
  
  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <PlanningCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-eerie-black rounded-lg border border-red-500/20 p-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-400 mb-2">
          Erro ao carregar planejamentos
        </h3>
        <p className="text-seasalt/70 mb-4">
          {error}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  // Empty state
  if (!plannings || plannings.length === 0) {
    return (
      <div className="bg-eerie-black rounded-lg border border-accent/20 p-12 text-center">
        <div className="w-16 h-16 bg-sgbus-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-sgbus-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-seasalt mb-2">
          {emptyMessage}
        </h3>
        <p className="text-seasalt/70 mb-6 max-w-md mx-auto">
          Crie seu primeiro planejamento estratégico selecionando um cliente e respondendo algumas perguntas essenciais
        </p>
        <Link 
          href="/planejamentos/novo"
          className="inline-flex items-center gap-2 bg-sgbus-green hover:bg-sgbus-green/90 text-night px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Criar Planejamento
        </Link>
      </div>
    );
  }

  // Content state
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plannings.map((planning) => (
        <PlanningCard 
          key={planning.id} 
          planning={planning}
          isNew={newPlannings.includes(planning.id)}
          isHighlighted={highlightedPlanning === planning.id}
          onMarkAsViewed={onMarkAsViewed ? () => onMarkAsViewed([planning.id]) : undefined}
        />
      ))}
    </div>
  );
} 