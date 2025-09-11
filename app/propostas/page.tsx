'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Lock, Home } from 'lucide-react';
import { ProposalsList } from '@/components/proposals/ProposalsList';
import { useProposals, useProposalStats } from '@/hooks/use-proposals';
import { useUsageStats } from '@/hooks/use-usage-stats';
import { RouteGuard } from '@/components/auth/route-guard';

export default function PropostasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Hook para verificar se é usuário NoUser
  const { data: usageStats, isLoading: isUsageLoading } = useUsageStats();

  // Hooks para dados reais
  const { data: proposalsData, isLoading: proposalsLoading, error: proposalsError } = useProposals({
    search: searchTerm || undefined,
    status: statusFilter || undefined,
    limit: 20
  });

  const { data: stats, isLoading: statsLoading } = useProposalStats();

  const proposals = proposalsData?.proposals || [];
  const pagination = proposalsData?.pagination;

  // Estatísticas com fallback
  const statsCards = [
    {
      title: 'Total',
      value: stats?.total || 0,
      icon: '📊',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400',
    },
    {
      title: 'Enviadas',
      value: stats?.sent || 0,
      icon: '📤',
      bgColor: 'bg-sgbus-green/20',
      textColor: 'text-sgbus-green',
    },
    {
      title: 'Em Negociação',
      value: stats?.inNegotiation || 0,
      icon: '🤝',
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-400',
    },
    {
      title: 'Aprovadas',
      value: stats?.accepted || 0,
      icon: '✅',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
    },
    {
      title: 'Rascunhos',
      value: stats?.draft || 0,
      icon: '📝',
      bgColor: 'bg-gray-500/20',
      textColor: 'text-gray-400',
    },
  ];

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status === statusFilter ? '' : status);
  };

  // Se usuário tem plano NoUser, mostrar bloqueio
  if (!isUsageLoading && usageStats?.planInfo?.isNoUserPlan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-eerie-black border border-seasalt/10 rounded-lg p-8 text-center max-w-md">
            <div className="mb-6">
              <Lock size={64} className="mx-auto text-periwinkle mb-4" />
              <h2 className="text-2xl font-bold text-seasalt mb-2">
                Propostas Comerciais
              </h2>
              <p className="text-periwinkle">
                Upgrade necessário para acessar esta funcionalidade
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-seasalt/70 text-sm">
                As Propostas Comerciais estão disponíveis apenas para planos pagos. 
                Faça upgrade do seu plano para começar a criar propostas profissionais.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sgbus-green hover:bg-sgbus-green/90 text-night font-semibold rounded-lg transition-all duration-200 hover:scale-105"
              >
                <Home size={20} />
                Voltar ao Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RouteGuard requiredModalidade="propostas">
      <div className="container mx-auto px-4 py-8">
      {/* Header da Página - Layout Responsivo */}
      <div className="mb-8">
        {/* Mobile Layout (≤768px): Empilhado */}
        <div className="block lg:hidden transition-all duration-300 ease-in-out">
          <h1 className="text-3xl font-bold text-seasalt mb-2">Propostas Comerciais</h1>
          <p className="text-periwinkle mb-6">
            Gerencie suas propostas comerciais e acompanhe o pipeline de vendas
          </p>
          <div className="flex justify-center">
            <Link 
              href="/propostas/nova"
              className="flex items-center px-6 py-3 bg-sgbus-green hover:bg-sgbus-green/90 text-night font-medium rounded-lg transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Proposta
            </Link>
          </div>
        </div>

        {/* Desktop Layout (≥1024px): 2 Colunas Horizontais */}
        <div className="hidden lg:flex lg:items-start lg:justify-between transition-all duration-300 ease-in-out">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-seasalt">Propostas Comerciais</h1>
            <p className="text-periwinkle mt-2">
              Gerencie suas propostas comerciais e acompanhe o pipeline de vendas
            </p>
          </div>
          <div className="ml-8 flex-shrink-0">
            <Link 
              href="/propostas/nova"
              className="flex items-center px-4 py-2 bg-sgbus-green hover:bg-sgbus-green/90 text-night font-medium rounded-lg transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Proposta
            </Link>
          </div>
        </div>
      </div>

      {/* Filtros e Busca - Layout Responsivo */}
      <div className="mb-8">
        {/* Container com agrupamento visual */}
        <div className="bg-[#171818] rounded-lg p-4 border border-accent/20 transition-all duration-300 ease-in-out hover:border-accent/30">
          {/* Mobile Layout (≤768px): Empilhado */}
          <div className="block lg:hidden space-y-4 transition-all duration-300 ease-in-out">
            {/* Barra de Pesquisa */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-seasalt/50 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Pesquisar propostas..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg pl-10 pr-4 py-3 text-sm placeholder:text-seasalt/50 focus:outline-none focus:ring-2 focus:ring-sgbus-green/50 focus:border-sgbus-green/50 transition-all duration-200 ease-in-out"
              />
            </div>
            
            {/* Filtros em Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Status Filter */}
              <select 
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sgbus-green/50 focus:border-sgbus-green/50 transition-all duration-200 ease-in-out hover:border-accent/40"
              >
                <option value="">Todos os status</option>
                <option value="DRAFT">Rascunho</option>
                <option value="SENT">Enviada</option>
                <option value="VIEWED">Visualizada</option>
                <option value="NEGOTIATION">Negociação</option>
                <option value="ACCEPTED">Aceita</option>
                <option value="REJECTED">Rejeitada</option>
              </select>
              
              {/* Placeholder for future filter */}
              <select 
                className="bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sgbus-green/50 focus:border-sgbus-green/50 transition-all duration-200 ease-in-out hover:border-accent/40"
              >
                <option value="">Todos os clientes</option>
              </select>
            </div>

            {/* Reset Button - Mobile */}
            {(searchTerm || statusFilter) && (
              <div className="flex justify-center animate-fade-in">
                <button
                  onClick={() => {
                    handleSearch('');
                    handleStatusFilter('');
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-seasalt/70 hover:text-seasalt transition-all duration-200 ease-in-out text-sm hover:bg-accent/10 rounded-lg"
                  title="Limpar filtros"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Resetar filtros
                </button>
              </div>
            )}
          </div>

          {/* Desktop Layout (≥1024px): Horizontal */}
          <div className="hidden lg:flex lg:items-center lg:gap-4 transition-all duration-300 ease-in-out">
            {/* Barra de Pesquisa */}
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-seasalt/50 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Pesquisar propostas..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg pl-10 pr-4 py-2 text-sm placeholder:text-seasalt/50 focus:outline-none focus:ring-2 focus:ring-sgbus-green/50 focus:border-sgbus-green/50 transition-all duration-200 ease-in-out"
              />
            </div>
            
            {/* Filtros em linha */}
            <div className="flex items-center gap-3">
              {/* Status Filter */}
              <select 
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sgbus-green/50 focus:border-sgbus-green/50 min-w-[140px] transition-all duration-200 ease-in-out hover:border-accent/40"
              >
                <option value="">Todos os status</option>
                <option value="DRAFT">Rascunho</option>
                <option value="SENT">Enviada</option>
                <option value="VIEWED">Visualizada</option>
                <option value="NEGOTIATION">Negociação</option>
                <option value="ACCEPTED">Aceita</option>
                <option value="REJECTED">Rejeitada</option>
              </select>
              
              {/* Placeholder for future filter */}
              <select 
                className="bg-[#2A1B45] text-seasalt border border-accent/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sgbus-green/50 focus:border-sgbus-green/50 min-w-[160px] transition-all duration-200 ease-in-out hover:border-accent/40"
              >
                <option value="">Todos os clientes</option>
              </select>

              {/* Reset Button - Desktop */}
              {(searchTerm || statusFilter) && (
                <button
                  onClick={() => {
                    handleSearch('');
                    handleStatusFilter('');
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-seasalt/70 hover:text-seasalt transition-all duration-200 ease-in-out text-sm whitespace-nowrap hover:bg-accent/10 rounded-lg animate-fade-in"
                  title="Limpar filtros"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Resetar
                </button>
              )}
            </div>
          </div>
          
          {/* Footer com Estatísticas */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-accent/20">
            <div className="text-sm text-seasalt/70">
              {proposalsLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-sgbus-green/20 border-t-sgbus-green rounded-full animate-spin"></div>
                  Carregando...
                </div>
              ) : (
                `${pagination?.total || 0} proposta${(pagination?.total || 0) !== 1 ? 's' : ''} encontrada${(pagination?.total || 0) !== 1 ? 's' : ''}`
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-seasalt/70">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {(searchTerm || statusFilter) ? (
                <span>
                  {[searchTerm && 'busca', statusFilter && 'status'].filter(Boolean).length} filtro{[searchTerm && 'busca', statusFilter && 'status'].filter(Boolean).length !== 1 ? 's' : ''} ativo{[searchTerm && 'busca', statusFilter && 'status'].filter(Boolean).length !== 1 ? 's' : ''}
                </span>
              ) : (
                <span>Nenhum filtro ativo</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-[#171818] rounded-lg p-4 border border-accent/20 transition-all duration-300 ease-in-out hover:border-accent/30">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-seasalt/70 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-seasalt mt-2">
                  {statsLoading ? '...' : stat.value}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center ml-3`}>
                <span className="text-lg">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Proposals List */}
      <div className="bg-[#171818] rounded-lg border border-accent/20 transition-all duration-300 ease-in-out hover:border-accent/30">
        <div className="p-4 border-b border-accent/20">
          <h2 className="text-lg font-semibold text-seasalt">
            {statusFilter 
              ? `Propostas: ${statusFilter.toLowerCase()}`
              : searchTerm 
                ? `Resultados para: "${searchTerm}"`
                : 'Todas as Propostas'
            }
          </h2>
          {pagination && (
            <p className="text-seasalt/70 text-sm mt-1">
              {pagination.total} propostas encontradas
            </p>
          )}
        </div>

        {/* Loading State */}
        {proposalsLoading && (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-sgbus-green border-t-transparent rounded-full animate-spin"></div>
            <p className="text-seasalt/70 mt-2">Carregando propostas...</p>
          </div>
        )}

        {/* Error State */}
        {proposalsError && (
          <div className="p-8 text-center">
            <p className="text-red-400 mb-2">Erro ao carregar propostas</p>
            <p className="text-seasalt/70 text-sm">
              {proposalsError.message || 'Tente novamente em alguns instantes'}
            </p>
          </div>
        )}

        {/* Proposals List */}
        {!proposalsLoading && !proposalsError && (
          <ProposalsList 
            proposals={proposals}
            isLoading={proposalsLoading}
          />
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            disabled={pagination.page === 1}
            className="px-3 py-2 bg-[#171818] border border-accent/20 rounded-lg text-seasalt disabled:opacity-50 disabled:cursor-not-allowed hover:border-sgbus-green/50 transition-all duration-200 ease-in-out"
          >
            Anterior
          </button>
          <span className="text-seasalt/70 text-sm px-4">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-2 bg-[#171818] border border-accent/20 rounded-lg text-seasalt disabled:opacity-50 disabled:cursor-not-allowed hover:border-sgbus-green/50 transition-all duration-200 ease-in-out"
          >
            Próxima
          </button>
        </div>
      )}
      </div>
    </RouteGuard>
  );
} 