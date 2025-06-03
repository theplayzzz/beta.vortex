'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ProposalsList } from '@/components/proposals/ProposalsList';
import { useProposals, useProposalStats } from '@/hooks/use-proposals';

export default function PropostasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-seasalt">Propostas Comerciais</h1>
          <p className="text-periwinkle mt-2">
            Gerencie suas propostas comerciais e acompanhe o pipeline de vendas
          </p>
        </div>
        <Link 
          href="/propostas/nova"
          className="flex items-center px-4 py-2 bg-sgbus-green hover:bg-sgbus-green/90 text-night font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Proposta
        </Link>
      </div>

      {/* Status Filters */}
      <div className="bg-eerie-black rounded-lg p-6 border border-accent/20 mb-8">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-seasalt mb-2">Filtrar por Status</h2>
            <p className="text-periwinkle text-sm">Visualize propostas por status específico</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {[
              { key: '', label: 'Todas' },
              { key: 'DRAFT', label: 'Rascunho' },
              { key: 'SENT', label: 'Enviada' },
              { key: 'VIEWED', label: 'Visualizada' },
              { key: 'NEGOTIATION', label: 'Negociação' },
              { key: 'ACCEPTED', label: 'Aceita' },
              { key: 'REJECTED', label: 'Rejeitada' },
            ].map((status) => (
              <button
                key={status.key}
                onClick={() => handleStatusFilter(status.key)}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                  statusFilter === status.key
                    ? 'bg-sgbus-green text-night border-sgbus-green'
                    : 'text-seasalt/70 border-accent/20 hover:border-accent/40 hover:text-seasalt'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-eerie-black rounded-lg p-6 border border-accent/20">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-seasalt/70 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-seasalt mt-2">
                  {statsLoading ? '...' : stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center ml-4`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Proposals List */}
      <div className="bg-eerie-black rounded-lg border border-accent/20">
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
            className="px-3 py-2 bg-eerie-black border border-accent/20 rounded-lg text-seasalt disabled:opacity-50 disabled:cursor-not-allowed hover:border-sgbus-green/50 transition-colors"
          >
            Anterior
          </button>
          <span className="text-seasalt/70 text-sm px-4">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-2 bg-eerie-black border border-accent/20 rounded-lg text-seasalt disabled:opacity-50 disabled:cursor-not-allowed hover:border-sgbus-green/50 transition-colors"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
} 