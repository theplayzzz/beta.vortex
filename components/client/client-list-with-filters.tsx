"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Building,
  Calendar,
  TrendingUp,
  FileText,
  Paperclip,
  X,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";

interface Client {
  id: string;
  name: string;
  industry?: string;
  serviceOrProduct?: string;
  initialObjective?: string;
  contactEmail?: string;
  richnessScore: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    notes: number;
    attachments: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface Filters {
  industries: string[];
  appliedFilters: {
    search?: string;
    industry: string[];
    richnessScoreMin?: number;
    richnessScoreMax?: number;
    sortBy: string;
    sortOrder: string;
    page: number;
    limit: number;
  };
}

interface ClientListResponse {
  clients: Client[];
  pagination: Pagination;
  filters: Filters;
}

export default function ClientListWithFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [availableIndustries, setAvailableIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(
    searchParams.getAll('industry')
  );
  const [richnessScoreRange, setRichnessScoreRange] = useState({
    min: searchParams.get('richnessScoreMin') ? Number(searchParams.get('richnessScoreMin')) : 0,
    max: searchParams.get('richnessScoreMax') ? Number(searchParams.get('richnessScoreMax')) : 100,
  });
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  
  // Debounce da busca
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  // Construir URL com filtros
  const buildFilterUrl = useMemo(() => {
    const params = new URLSearchParams();
    
    if (debouncedSearch) params.set('search', debouncedSearch);
    selectedIndustries.forEach(industry => params.append('industry', industry));
    if (richnessScoreRange.min > 0) params.set('richnessScoreMin', richnessScoreRange.min.toString());
    if (richnessScoreRange.max < 100) params.set('richnessScoreMax', richnessScoreRange.max.toString());
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    params.set('page', currentPage.toString());
    params.set('limit', '12');
    
    return `/api/clients?${params.toString()}`;
  }, [debouncedSearch, selectedIndustries, richnessScoreRange, sortBy, sortOrder, currentPage]);

  // Carregar dados
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildFilterUrl);
        
        if (response.ok) {
          const data: ClientListResponse = await response.json();
          setClients(data.clients);
          setPagination(data.pagination);
          setAvailableIndustries(data.filters.industries);
        }
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [buildFilterUrl]);

  // Atualizar URL quando filtros mudarem
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (debouncedSearch) params.set('search', debouncedSearch);
    selectedIndustries.forEach(industry => params.append('industry', industry));
    if (richnessScoreRange.min > 0) params.set('richnessScoreMin', richnessScoreRange.min.toString());
    if (richnessScoreRange.max < 100) params.set('richnessScoreMax', richnessScoreRange.max.toString());
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/clientes${newUrl}`, { scroll: false });
  }, [debouncedSearch, selectedIndustries, richnessScoreRange, sortBy, sortOrder, currentPage, router]);

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedIndustries([]);
    setRichnessScoreRange({ min: 0, max: 100 });
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Alternar setor selecionado
  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev => 
      prev.includes(industry) 
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
    );
    setCurrentPage(1); // Reset para primeira página
  };

  // Mudar página
  const changePage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cor do richnessScore
  const getRichnessColor = (score: number) => {
    if (score >= 80) return 'text-sgbus-green';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRichnessBg = (score: number) => {
    if (score >= 80) return 'bg-sgbus-green/20';
    if (score >= 50) return 'bg-yellow-400/20';
    return 'bg-red-400/20';
  };

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (debouncedSearch) count++;
    if (selectedIndustries.length > 0) count++;
    if (richnessScoreRange.min > 0 || richnessScoreRange.max < 100) count++;
    return count;
  }, [debouncedSearch, selectedIndustries, richnessScoreRange]);

  return (
    <div className="space-y-6">
      {/* Header com busca e filtros */}
      <div className="bg-eerie-black rounded-xl border border-seasalt/10 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-periwinkle" />
            <input
              type="text"
              placeholder="Buscar clientes por nome..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
            />
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-sgbus-green text-night border-sgbus-green'
                  : 'bg-night border-seasalt/20 text-seasalt hover:border-sgbus-green'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="bg-night text-sgbus-green text-xs px-2 py-1 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Ordenação */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt focus:outline-none focus:border-sgbus-green"
            >
              <option value="createdAt-desc">Mais recentes</option>
              <option value="createdAt-asc">Mais antigos</option>
              <option value="name-asc">Nome A-Z</option>
              <option value="name-desc">Nome Z-A</option>
              <option value="richnessScore-desc">Maior completude</option>
              <option value="richnessScore-asc">Menor completude</option>
            </select>
          </div>
        </div>

        {/* Painel de filtros */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-6 border-t border-seasalt/10 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Filtro por setor */}
                  <div>
                    <label className="block text-sm font-medium text-seasalt mb-3">
                      Setores
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableIndustries.map((industry) => (
                        <label key={industry} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedIndustries.includes(industry)}
                            onChange={() => toggleIndustry(industry)}
                            className="w-4 h-4 text-sgbus-green bg-night border-seasalt/20 rounded focus:ring-sgbus-green focus:ring-2"
                          />
                          <span className="ml-2 text-sm text-seasalt">{industry}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Filtro por completude */}
                  <div>
                    <label className="block text-sm font-medium text-seasalt mb-3">
                      Completude do Perfil
                    </label>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-periwinkle mb-1">
                          Mínimo: {richnessScoreRange.min}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={richnessScoreRange.min}
                          onChange={(e) => setRichnessScoreRange(prev => ({
                            ...prev,
                            min: Number(e.target.value)
                          }))}
                          className="w-full h-2 bg-night rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-periwinkle mb-1">
                          Máximo: {richnessScoreRange.max}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={richnessScoreRange.max}
                          onChange={(e) => setRichnessScoreRange(prev => ({
                            ...prev,
                            max: Number(e.target.value)
                          }))}
                          className="w-full h-2 bg-night rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ações dos filtros */}
                  <div className="flex flex-col justify-end">
                    <button
                      onClick={clearFilters}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-periwinkle hover:text-seasalt transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Limpar Filtros
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Resultados */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-sgbus-green" />
        </div>
      ) : (
        <>
          {/* Informações dos resultados */}
          <div className="flex items-center justify-between text-sm text-periwinkle">
            <span>
              {pagination ? `${pagination.totalCount} cliente(s) encontrado(s)` : ''}
            </span>
            {pagination && pagination.totalPages > 1 && (
              <span>
                Página {pagination.page} de {pagination.totalPages}
              </span>
            )}
          </div>

          {/* Grid de clientes */}
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-periwinkle mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-seasalt mb-2">
                Nenhum cliente encontrado
              </h3>
              <p className="text-periwinkle mb-6">
                Tente ajustar os filtros ou criar um novo cliente.
              </p>
              <Link
                href="/clientes/novo"
                className="inline-flex items-center px-4 py-2 bg-sgbus-green text-night font-medium rounded-lg hover:bg-sgbus-green/90 transition-colors"
              >
                <Users className="w-4 h-4 mr-2" />
                Novo Cliente
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {clients.map((client) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link href={`/clientes/${client.id}`}>
                      <div className="bg-eerie-black rounded-xl border border-seasalt/10 p-6 hover:border-sgbus-green/50 transition-colors cursor-pointer h-full">
                        {/* Header do card */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-seasalt truncate">
                              {client.name}
                            </h3>
                            {client.industry && (
                              <p className="text-sm text-periwinkle flex items-center mt-1">
                                <Building className="w-3 h-3 mr-1" />
                                {client.industry}
                              </p>
                            )}
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRichnessBg(client.richnessScore)} ${getRichnessColor(client.richnessScore)}`}>
                            {client.richnessScore}%
                          </div>
                        </div>

                        {/* Descrição */}
                        {client.serviceOrProduct && (
                          <p className="text-sm text-periwinkle mb-4 line-clamp-2">
                            {client.serviceOrProduct}
                          </p>
                        )}

                        {/* Estatísticas */}
                        <div className="flex items-center justify-between text-xs text-periwinkle">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center">
                              <FileText className="w-3 h-3 mr-1" />
                              {client._count.notes}
                            </span>
                            <span className="flex items-center">
                              <Paperclip className="w-3 h-3 mr-1" />
                              {client._count.attachments}
                            </span>
                          </div>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Paginação */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => changePage(currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
                className="flex items-center px-3 py-2 text-sm bg-night border border-seasalt/20 rounded-lg text-seasalt hover:border-sgbus-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </button>

              {/* Números das páginas */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNumber = Math.max(1, currentPage - 2) + i;
                  if (pageNumber > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => changePage(pageNumber)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        pageNumber === currentPage
                          ? 'bg-sgbus-green text-night'
                          : 'bg-night border border-seasalt/20 text-seasalt hover:border-sgbus-green'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => changePage(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="flex items-center px-3 py-2 text-sm bg-night border border-seasalt/20 rounded-lg text-seasalt hover:border-sgbus-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Próxima
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 