"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Archive, 
  RotateCcw, 
  Calendar, 
  Building, 
  Star,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useClients, useRestoreClient } from '@/lib/react-query';

export default function ArchivedClientsList() {
  const [searchTerm, setSearchTerm] = useState('');

  // TanStack Query hooks para clientes arquivados
  const { 
    data: clientsData, 
    isLoading, 
    error,
    refetch 
  } = useClients({ 
    includeArchived: true,
    search: searchTerm || undefined,
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });

  const { 
    mutate: restoreClient, 
    isPending: isRestoring 
  } = useRestoreClient();

  // Filtrar apenas clientes arquivados
  const archivedClients = clientsData?.clients?.filter(client => client.deletedAt) || [];

  const handleRestoreClient = async (clientId: string, clientName: string) => {
    if (!confirm(`Tem certeza que deseja restaurar "${clientName}"?`)) return;

    restoreClient(clientId, {
      onSuccess: () => {
        console.log('Cliente restaurado com sucesso!');
        refetch();
      },
      onError: (error) => {
        console.error('Erro ao restaurar cliente:', error);
        alert('Erro ao restaurar cliente');
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getRichnessColor = (score: number) => {
    if (score >= 80) return 'text-sgbus-green';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-4">Erro ao carregar clientes arquivados</p>
        <button 
          onClick={() => refetch()}
          className="px-4 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4 inline mr-2" />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Archive className="h-6 w-6 text-sgbus-green mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-seasalt">Clientes Arquivados</h2>
            <p className="text-seasalt/70 text-sm">
              {isLoading ? 'Carregando...' : `${archivedClients.length} cliente(s) arquivado(s)`}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-periwinkle" />
        <input
          type="text"
          placeholder="Buscar clientes arquivados..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-accent/20 border border-accent/30 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green/50 focus:ring-1 focus:ring-sgbus-green/20"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-sgbus-green animate-spin" />
          <span className="ml-3 text-seasalt">Carregando clientes arquivados...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && archivedClients.length === 0 && (
        <div className="text-center py-12">
          <Archive className="h-16 w-16 text-seasalt/30 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-seasalt mb-2">Nenhum cliente arquivado</h3>
          <p className="text-seasalt/70">
            {searchTerm ? 'Nenhum cliente arquivado encontrado com esse termo' : 'Clientes arquivados aparecerão aqui'}
          </p>
        </div>
      )}

      {/* Clients List */}
      {!isLoading && archivedClients.length > 0 && (
        <div className="space-y-4">
          <AnimatePresence>
            {archivedClients.map((client) => (
              <motion.div
                key={client.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-eerie-black p-6 rounded-lg border border-accent/20 hover:border-accent/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {/* Client Info */}
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium text-seasalt mr-3">
                        {client.name}
                      </h3>
                      {/* Richness Score */}
                      <div className="flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        <span className={`text-xs font-medium ${getRichnessColor(client.richnessScore)}`}>
                          {client.richnessScore}%
                        </span>
                      </div>
                    </div>

                    {/* Industry and Archive Date */}
                    <div className="flex items-center text-sm text-seasalt/70 space-x-4">
                      {client.industry && (
                        <div className="flex items-center">
                          <Building className="h-3 w-3 mr-1" />
                          <span>{client.industry}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Arquivado em {formatDate(client.deletedAt!)}</span>
                      </div>
                    </div>

                    {/* Service/Product */}
                    {client.serviceOrProduct && (
                      <p className="text-sm text-periwinkle mt-2">
                        {client.serviceOrProduct}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRestoreClient(client.id, client.name)}
                      disabled={isRestoring}
                      className="px-4 py-2 bg-sgbus-green/10 hover:bg-sgbus-green/20 border border-sgbus-green/20 text-sgbus-green rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isRestoring ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4 mr-2" />
                      )}
                      {isRestoring ? 'Restaurando...' : 'Restaurar'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
} 