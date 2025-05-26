"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RotateCcw, 
  Trash2, 
  Calendar, 
  Building, 
  Archive,
  Loader2,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import Link from "next/link";

interface ArchivedClient {
  id: string;
  name: string;
  industry?: string;
  serviceOrProduct?: string;
  contactEmail?: string;
  richnessScore: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
  _count: {
    notes: number;
    attachments: number;
    strategicPlannings: number;
    tasks: number;
  };
}

export default function ArchivedClientsList() {
  const [clients, setClients] = useState<ArchivedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Carregar clientes arquivados
  useEffect(() => {
    loadArchivedClients();
  }, []);

  const loadArchivedClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients?includeArchived=true');
      
      if (response.ok) {
        const data = await response.json();
        // Filtrar apenas os arquivados
        const archivedClients = data.clients.filter((client: any) => client.deletedAt);
        setClients(archivedClients);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes arquivados:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar clientes arquivados' });
    } finally {
      setLoading(false);
    }
  };

  // Restaurar cliente
  const handleRestore = async (clientId: string) => {
    if (!confirm('Tem certeza que deseja restaurar este cliente?')) return;

    try {
      setRestoring(clientId);
      const response = await fetch(`/api/clients/${clientId}/restore`, {
        method: 'POST',
      });

      if (response.ok) {
        setClients(clients.filter(client => client.id !== clientId));
        setMessage({ type: 'success', text: 'Cliente restaurado com sucesso!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Erro ao restaurar cliente' });
      }
    } catch (error) {
      console.error('Erro ao restaurar cliente:', error);
      setMessage({ type: 'error', text: 'Erro ao restaurar cliente' });
    } finally {
      setRestoring(null);
    }
  };

  // Limpar mensagem após 5 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-sgbus-green" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensagem de feedback */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg border flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-sgbus-green/20 border-sgbus-green text-sgbus-green'
                : 'bg-red-400/20 border-red-400 text-red-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de clientes */}
      {clients.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="w-12 h-12 text-periwinkle mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-seasalt mb-2">
            Nenhum cliente arquivado
          </h3>
          <p className="text-periwinkle mb-6">
            Quando você arquivar clientes, eles aparecerão aqui.
          </p>
          <Link
            href="/clientes"
            className="inline-flex items-center px-4 py-2 bg-sgbus-green text-night font-medium rounded-lg hover:bg-sgbus-green/90 transition-colors"
          >
            Voltar para Lista
          </Link>
        </div>
      ) : (
        <>
          {/* Informações */}
          <div className="bg-eerie-black rounded-xl border border-seasalt/10 p-4">
            <div className="flex items-center gap-3 text-sm text-periwinkle">
              <Archive className="w-4 h-4" />
              <span>{clients.length} cliente(s) arquivado(s)</span>
            </div>
          </div>

          {/* Grid de clientes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {clients.map((client) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-eerie-black rounded-xl border border-seasalt/10 p-6 relative"
                >
                  {/* Badge de arquivado */}
                  <div className="absolute top-4 right-4">
                    <div className="px-2 py-1 bg-periwinkle/20 text-periwinkle text-xs rounded-full flex items-center gap-1">
                      <Archive className="w-3 h-3" />
                      Arquivado
                    </div>
                  </div>

                  {/* Header do card */}
                  <div className="mb-4 pr-20">
                    <h3 className="text-lg font-semibold text-seasalt/70 mb-1">
                      {client.name}
                    </h3>
                    {client.industry && (
                      <p className="text-sm text-periwinkle flex items-center">
                        <Building className="w-3 h-3 mr-1" />
                        {client.industry}
                      </p>
                    )}
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
                          client.richnessScore >= 80 ? 'bg-sgbus-green/50' :
                          client.richnessScore >= 50 ? 'bg-yellow-400/50' : 'bg-red-400/50'
                        }`}
                        style={{ width: `${client.richnessScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-xs text-periwinkle">
                    <div>
                      <span className="block">Notas: {client._count.notes}</span>
                      <span className="block">Anexos: {client._count.attachments}</span>
                    </div>
                    <div>
                      <span className="block">Tarefas: {client._count.tasks}</span>
                      <span className="block">Planos: {client._count.strategicPlannings}</span>
                    </div>
                  </div>

                  {/* Datas */}
                  <div className="text-xs text-periwinkle mb-4 space-y-1">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Criado: {formatDate(client.createdAt)}
                    </div>
                    <div className="flex items-center">
                      <Archive className="w-3 h-3 mr-1" />
                      Arquivado: {formatDate(client.deletedAt)}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestore(client.id)}
                      disabled={restoring === client.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-sgbus-green text-night text-sm font-medium rounded-lg hover:bg-sgbus-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {restoring === client.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      {restoring === client.id ? 'Restaurando...' : 'Restaurar'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
} 