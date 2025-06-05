'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface FilterState {
  search: string;
  status: string;
  clientId: string;
}

interface PlanningFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalPlannings: number;
  activeFiltersCount: number;
  clients?: Array<{ id: string; name: string; }>;
  isLoading?: boolean;
}

export function PlanningFilters({
  filters,
  onFiltersChange,
  totalPlannings,
  activeFiltersCount,
  clients = [],
  isLoading = false
}: PlanningFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFiltersChange({ ...filters, search: localSearch });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, filters, onFiltersChange]);

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status });
  };

  const handleClientChange = (clientId: string) => {
    onFiltersChange({ ...filters, clientId });
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    onFiltersChange({ search: '', status: '', clientId: '' });
  };

  const statusOptions = [
    { value: '', label: 'Todos os status' },
    { value: 'DRAFT', label: 'Rascunho' },
    { value: 'ACTIVE', label: 'Ativo' },
    { value: 'COMPLETED', label: 'Concluído' },
    { value: 'ARCHIVED', label: 'Arquivado' },
  ];

  return (
    <div className="mb-8">
      {/* Container com agrupamento visual */}
      <div className="bg-[#171818] rounded-lg p-4 border border-accent/20 transition-all duration-300 ease-in-out hover:border-accent/30">
        {/* Mobile Layout (≤768px): Empilhado */}
        <div className="block lg:hidden space-y-4 transition-all duration-300 ease-in-out">
          {/* Barra de Pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-seasalt/50 transition-colors duration-200" />
            <input
              type="text"
              placeholder="Pesquisar planejamentos..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              disabled={isLoading}
              className="w-full bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg pl-10 pr-4 py-3 text-sm placeholder:text-seasalt/50 focus:outline-none focus:ring-2 focus:ring-sgbus-green/50 focus:border-sgbus-green/50 disabled:opacity-50 transition-all duration-200 ease-in-out"
            />
          </div>
          
          {/* Filtros em Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Status Filter */}
            <select 
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isLoading}
              className="bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sgbus-green/50 focus:border-sgbus-green/50 disabled:opacity-50 transition-all duration-200 ease-in-out hover:border-accent/40"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {/* Client Filter */}
            <select 
              value={filters.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              disabled={isLoading}
              className="bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sgbus-green/50 focus:border-sgbus-green/50 disabled:opacity-50 transition-all duration-200 ease-in-out hover:border-accent/40"
            >
              <option value="">Todos os clientes</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button - Mobile */}
          {activeFiltersCount > 0 && (
            <div className="flex justify-center animate-fade-in">
              <button
                onClick={clearAllFilters}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-seasalt/70 hover:text-seasalt transition-all duration-200 ease-in-out disabled:opacity-50 text-sm hover:bg-accent/10 rounded-lg"
                title="Limpar filtros"
              >
                <X className="h-4 w-4" />
                Resetar filtros
              </button>
            </div>
          )}
        </div>

        {/* Desktop Layout (≥1024px): Horizontal */}
        <div className="hidden lg:flex lg:items-center lg:gap-4 transition-all duration-300 ease-in-out">
          {/* Barra de Pesquisa */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-seasalt/50 transition-colors duration-200" />
            <input
              type="text"
              placeholder="Pesquisar planejamentos..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              disabled={isLoading}
              className="w-full bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg pl-10 pr-4 py-2 text-sm placeholder:text-seasalt/50 focus:outline-none focus:ring-2 focus:ring-sgbus-green/50 focus:border-sgbus-green/50 disabled:opacity-50 transition-all duration-200 ease-in-out"
            />
          </div>
          
          {/* Filtros em linha */}
          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <select 
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isLoading}
              className="bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sgbus-green/50 focus:border-sgbus-green/50 disabled:opacity-50 min-w-[140px] transition-all duration-200 ease-in-out hover:border-accent/40"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            {/* Client Filter */}
            <select 
              value={filters.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              disabled={isLoading}
              className="bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sgbus-green/50 focus:border-sgbus-green/50 disabled:opacity-50 min-w-[160px] transition-all duration-200 ease-in-out hover:border-accent/40"
            >
              <option value="">Todos os clientes</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>

            {/* Reset Button - Desktop */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                disabled={isLoading}
                className="flex items-center gap-1 px-3 py-2 text-seasalt/70 hover:text-seasalt transition-all duration-200 ease-in-out disabled:opacity-50 text-sm whitespace-nowrap hover:bg-accent/10 rounded-lg animate-fade-in"
                title="Limpar filtros"
              >
                <X className="h-4 w-4" />
                Resetar
              </button>
            )}
          </div>
        </div>
        
        {/* Footer com Estatísticas */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-accent/20">
          <div className="text-sm text-seasalt/70">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-sgbus-green/20 border-t-sgbus-green rounded-full animate-spin"></div>
                Carregando...
              </div>
            ) : (
              `${totalPlannings} planejamento${totalPlannings !== 1 ? 's' : ''} encontrado${totalPlannings !== 1 ? 's' : ''}`
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-seasalt/70">
            <Filter className="h-4 w-4" />
            {activeFiltersCount > 0 ? (
              <span>
                {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''}
              </span>
            ) : (
              <span>Nenhum filtro ativo</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 