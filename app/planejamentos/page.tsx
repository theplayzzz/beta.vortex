"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Star } from "lucide-react";
import { usePlannings } from "@/lib/react-query/hooks/usePlannings";
import { useClients } from "@/lib/react-query/hooks/useClients";
import { PlanningList, PlanningFilters } from "@/components/planning";

interface FilterState {
  search: string;
  status: string;
  clientId: string;
}

export default function PlanejamentosPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    clientId: ''
  });
  const [page, setPage] = useState(1);
  const [newPlannings, setNewPlannings] = useState<string[]>([]);
  const [highlightedPlanning, setHighlightedPlanning] = useState<string | null>(null);

  // Verificar planejamentos "novos" e highlight no localStorage
  useEffect(() => {
    const storedNewPlannings = JSON.parse(localStorage.getItem('new-plannings') || '[]');
    setNewPlannings(storedNewPlannings);

    // Verificar se há um planejamento para destacar
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      setHighlightedPlanning(highlightId);
      
      // Remover highlight após alguns segundos
      setTimeout(() => {
        setHighlightedPlanning(null);
      }, 5000);
    }
  }, [searchParams]);

  // Marcar planejamentos como visualizados
  const markPlanningsAsViewed = (planningIds: string[]) => {
    const updatedNewPlannings = newPlannings.filter(id => !planningIds.includes(id));
    setNewPlannings(updatedNewPlannings);
    localStorage.setItem('new-plannings', JSON.stringify(updatedNewPlannings));
  };

  // Fetch plannings with filters
  const { 
    data: planningsData, 
    isLoading: isLoadingPlannings, 
    error: planningsError 
  } = usePlannings({
    search: filters.search || undefined,
    status: filters.status || undefined,
    clientId: filters.clientId || undefined,
    page,
    limit: 12
  });

  // Fetch clients for filter dropdown
  const { 
    data: clientsData,
    isLoading: isLoadingClients
  } = useClients({ limit: 100 }); // Get more clients for filter

  const plannings = planningsData?.plannings || [];
  const totalPlannings = planningsData?.pagination?.total || 0;
  const clients = clientsData?.clients || [];

  // Contar planejamentos novos na página atual
  const newPlanningsCount = plannings.filter(p => newPlannings.includes(p.id)).length;

  // Calculate active filters count
  const activeFiltersCount = [
    filters.search,
    filters.status,
    filters.clientId
  ].filter(Boolean).length;

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header da Página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-seasalt">Planejamentos</h1>
          <p className="text-seasalt/70 mt-1">
            Gerencie todos os seus planejamentos estratégicos
          </p>
        </div>
        <Link 
          href="/planejamentos/novo"
          className="bg-sgbus-green hover:bg-sgbus-green/90 text-night px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Planejamento
        </Link>
      </div>

      {/* Indicador de planejamentos novos */}
      {newPlanningsCount > 0 && (
        <div className="bg-sgbus-green/10 border border-sgbus-green/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-sgbus-green animate-pulse" />
            <div>
              <h3 className="font-medium text-sgbus-green">
                {newPlanningsCount} planejamento{newPlanningsCount > 1 ? 's' : ''} novo{newPlanningsCount > 1 ? 's' : ''}!
              </h3>
              <p className="text-sgbus-green/80 text-sm">
                Acabou{newPlanningsCount > 1 ? 'aram' : 'ou'} de ser criado{newPlanningsCount > 1 ? 's' : ''} e está{newPlanningsCount > 1 ? 'ão' : ''} aguardando sua visualização
              </p>
            </div>
          </div>
          <button
            onClick={() => markPlanningsAsViewed(plannings.map(p => p.id))}
            className="text-sgbus-green hover:text-sgbus-green/80 text-sm font-medium transition-colors"
          >
            Marcar como visto
          </button>
        </div>
      )}

      {/* Filtros e Busca */}
      <PlanningFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalPlannings={totalPlannings}
        activeFiltersCount={activeFiltersCount}
        clients={clients}
        isLoading={isLoadingPlannings || isLoadingClients}
      />

      {/* Lista de Planejamentos */}
      <PlanningList
        plannings={plannings}
        isLoading={isLoadingPlannings}
        error={planningsError?.message}
        emptyMessage={
          activeFiltersCount > 0 
            ? "Nenhum planejamento encontrado com os filtros aplicados"
            : "Nenhum planejamento criado ainda"
        }
        newPlannings={newPlannings}
        highlightedPlanning={highlightedPlanning}
        onMarkAsViewed={markPlanningsAsViewed}
      />

      {/* Paginação */}
      {planningsData?.pagination && planningsData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoadingPlannings}
            className="px-3 py-2 bg-eerie-black border border-accent/20 rounded-lg text-seasalt disabled:opacity-50 disabled:cursor-not-allowed hover:border-sgbus-green/50 transition-colors"
          >
            Anterior
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: planningsData.pagination.totalPages }, (_, i) => i + 1)
              .filter(pageNum => {
                // Show first, last, current, and adjacent pages
                return pageNum === 1 || 
                       pageNum === planningsData.pagination.totalPages || 
                       Math.abs(pageNum - page) <= 1;
              })
              .map((pageNum, index, filteredPages) => {
                // Add ellipsis if there's a gap
                const prevPageNum = filteredPages[index - 1];
                const showEllipsis = prevPageNum && pageNum - prevPageNum > 1;
                
                return (
                  <div key={pageNum} className="flex items-center gap-1">
                    {showEllipsis && (
                      <span className="px-2 py-2 text-seasalt/50">...</span>
                    )}
                    <button
                      onClick={() => setPage(pageNum)}
                      disabled={isLoadingPlannings}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        pageNum === page
                          ? 'bg-sgbus-green text-night'
                          : 'bg-eerie-black border border-accent/20 text-seasalt hover:border-sgbus-green/50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  </div>
                );
              })}
          </div>
          
          <button
            onClick={() => setPage(p => Math.min(planningsData.pagination.totalPages, p + 1))}
            disabled={page >= planningsData.pagination.totalPages || isLoadingPlannings}
            className="px-3 py-2 bg-eerie-black border border-accent/20 rounded-lg text-seasalt disabled:opacity-50 disabled:cursor-not-allowed hover:border-sgbus-green/50 transition-colors"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
} 