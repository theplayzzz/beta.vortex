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
  Loader2,
  Star,
  Clock
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
  isViewed: boolean;
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
  appliedFilters: any;
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

  // Função para verificar se cliente é novo (não visualizado ainda)
  const isNewClient = (client: Client) => {
    return !client.isViewed;
  };

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

  // Contar clientes novos
  const newClientsCount = useMemo(() => {
    return clients.filter(client => isNewClient(client)).length;
  }, [clients]);

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

        {/* Indicador de clientes novos */}
        {newClientsCount > 0 && (
          <div className="mt-4 p-3 bg-sgbus-green/10 border border-sgbus-green/20 rounded-lg flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-sgbus-green animate-pulse" />
              <span className="text-sgbus-green font-medium text-sm">
                {newClientsCount} cliente{newClientsCount > 1 ? 's' : ''} novo{newClientsCount > 1 ? 's' : ''} aguardando visualização
              </span>
            </div>
          </div>
        )}

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
                        <label className="block text-xs text-periwinkle mb-2">
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
                        <label className="block text-xs text-periwinkle mb-2">
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
                      className="px-4 py-2 bg-seasalt/10 text-seasalt rounded-lg hover:bg-seasalt/20 transition-colors"
                    >
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
      <div className="bg-eerie-black rounded-xl border border-seasalt/10 p-6">
        {/* Header dos resultados */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-seasalt">
              {loading ? 'Carregando...' : `${pagination?.totalCount || 0} cliente${(pagination?.totalCount || 0) !== 1 ? 's' : ''} encontrado${(pagination?.totalCount || 0) !== 1 ? 's' : ''}`}
            </h3>
            {pagination && pagination.totalCount > 0 && (
              <p className="text-sm text-periwinkle">
                Página {pagination.page} de {pagination.totalPages}
              </p>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-sgbus-green animate-spin" />
            <span className="ml-3 text-periwinkle">Carregando clientes...</span>
          </div>
        ) : (
          <>
            {/* Lista de clientes */}
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
                        <div className={`bg-eerie-black rounded-xl border p-6 hover:border-sgbus-green/50 transition-colors cursor-pointer h-full relative ${
                          isNewClient(client) 
                            ? 'border-sgbus-green/30 shadow-lg shadow-sgbus-green/10' 
                            : 'border-seasalt/10'
                        }`}>
                          {/* Badge de novo cliente */}
                          <div className="absolute top-3 right-3 flex flex-col gap-1">
                            {isNewClient(client) && (
                              <div className="px-2 py-1 bg-sgbus-green/20 text-sgbus-green text-xs rounded-full flex items-center gap-1 animate-pulse">
                                <Star className="w-3 h-3" />
                                Novo
                              </div>
                            )}
                          </div>

                          {/* Header do card */}
                          <div className="flex items-start justify-between mb-4 pr-16">
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-lg font-semibold truncate ${
                                isNewClient(client) ? 'text-sgbus-green' : 'text-seasalt'
                              }`}>
                                {client.name}
                              </h3>
                              {client.industry && (
                                <p className="text-sm text-periwinkle flex items-center mt-1">
                                  <Building className="w-3 h-3 mr-1" />
                                  {client.industry}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Completude */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-periwinkle">Completude</span>
                              <span className={`text-xs font-medium ${getRichnessColor(client.richnessScore)}`}>
                                {client.richnessScore}%
                              </span>
                            </div>
                            <div className="w-full bg-night rounded-full h-2">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  client.richnessScore >= 80 ? 'bg-sgbus-green' :
                                  client.richnessScore >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                                }`}
                                style={{ width: `${client.richnessScore}%` }}
                              />
                            </div>
                          </div>

                          {/* Descrição */}
                          {client.serviceOrProduct && (
                            <p className="text-sm text-periwinkle mb-4 line-clamp-2">
                              {client.serviceOrProduct}
                            </p>
                          )}

                          {/* Estatísticas */}
                          <div className="grid grid-cols-2 gap-4 text-xs text-periwinkle">
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span>{client._count.notes} nota{client._count.notes !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              <span>{client._count.attachments} anexo{client._count.attachments !== 1 ? 's' : ''}</span>
                            </div>
                          </div>

                          {/* Data de criação */}
                          <div className="mt-4 pt-4 border-t border-seasalt/10">
                            <div className="flex items-center gap-1 text-xs text-periwinkle">
                              <Calendar className="w-3 h-3" />
                              <span>
                                Criado em {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
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
              <div className="flex items-center justify-between mt-8">
                <div className="text-sm text-periwinkle">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.totalCount)} de {pagination.totalCount} resultados
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changePage(pagination.page - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className="p-2 rounded-lg border border-seasalt/20 text-seasalt hover:border-sgbus-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => changePage(pageNum)}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            pageNum === pagination.page
                              ? 'bg-sgbus-green text-night'
                              : 'text-seasalt hover:bg-seasalt/10'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => changePage(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className="p-2 rounded-lg border border-seasalt/20 text-seasalt hover:border-sgbus-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}