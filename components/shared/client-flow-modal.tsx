"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { 
  Search, 
  Plus, 
  X, 
  User, 
  Building, 
  Target,
  Loader2,
  Check,
  AlertCircle
} from "lucide-react";
import { useDebounce } from "use-debounce";

interface Client {
  id: string;
  name: string;
  industry?: string;
  richnessScore: number;
  createdAt: Date | string;
}

interface ClientFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientSelected: (client: Client) => void;
  title?: string;
  description?: string;
}

interface NewClientForm {
  name: string;
  industry: string;
  serviceOrProduct: string;
  initialObjective: string;
}

export default function ClientFlowModal({
  isOpen,
  onClose,
  onClientSelected,
  title = "Selecionar Cliente",
  description = "Escolha um cliente existente ou crie um novo"
}: ClientFlowModalProps) {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newClientForm, setNewClientForm] = useState<NewClientForm>({
    name: '',
    industry: '',
    serviceOrProduct: '',
    initialObjective: ''
  });

  // Debounce da busca
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  // Auto-save no localStorage durante digitação
  useEffect(() => {
    if (mode === 'create' && isOpen) {
      const autoSaveKey = 'clientflow-draft';
      const saved = localStorage.getItem(autoSaveKey);
      if (saved) {
        try {
          const parsedForm = JSON.parse(saved);
          setNewClientForm(parsedForm);
        } catch (error) {
          console.error('Erro ao carregar draft:', error);
        }
      }
    }
  }, [mode, isOpen]);

  // Salvar draft automaticamente
  useEffect(() => {
    if (mode === 'create' && isOpen) {
      const autoSaveKey = 'clientflow-draft';
      const timeoutId = setTimeout(() => {
        localStorage.setItem(autoSaveKey, JSON.stringify(newClientForm));
      }, 500); // Debounce de 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [newClientForm, mode, isOpen]);

  // Limpar draft ao fechar modal
  const handleClose = () => {
    localStorage.removeItem('clientflow-draft');
    setNewClientForm({ name: '', industry: '', serviceOrProduct: '', initialObjective: '' });
    setSearchTerm('');
    setMode('select');
    setError(null);
    onClose();
  };

  // Buscar clientes via API
  useEffect(() => {
    if (mode === 'select' && isOpen) {
      const loadClients = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          // Construir URL com filtros
          const params = new URLSearchParams();
          if (debouncedSearch) {
            params.set('search', debouncedSearch);
          }
          params.set('limit', '20'); // Limitar para o modal
          params.set('sortBy', 'updatedAt');
          params.set('sortOrder', 'desc');

          const response = await fetch(`/api/clients?${params.toString()}`);
          
          if (response.ok) {
            const data = await response.json();
            setClients(data.clients || []);
          } else {
            const errorData = await response.json();
            setError(errorData.error || 'Erro ao carregar clientes');
          }
        } catch (error) {
          console.error('Erro ao buscar clientes:', error);
          setError('Erro de conexão ao carregar clientes');
        } finally {
          setIsLoading(false);
        }
      };

      loadClients();
    }
  }, [debouncedSearch, mode, isOpen]);

  // Criar novo cliente via API
  const handleCreateClient = async () => {
    if (!newClientForm.name.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newClientForm.name,
          industry: newClientForm.industry || undefined,
          serviceOrProduct: newClientForm.serviceOrProduct || undefined,
          initialObjective: newClientForm.initialObjective || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newClient: Client = {
          id: data.client.id,
          name: data.client.name,
          industry: data.client.industry,
          richnessScore: data.client.richnessScore,
          createdAt: data.client.createdAt
        };

        localStorage.removeItem('clientflow-draft');
        onClientSelected(newClient);
        handleClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao criar cliente');
      }
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      setError('Erro de conexão ao criar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular cor do richnessScore
  const getRichnessColor = (score: number) => {
    if (score >= 80) return 'text-sgbus-green';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRichnessBackground = (score: number) => {
    if (score >= 80) return 'bg-sgbus-green/20';
    if (score >= 50) return 'bg-yellow-400/20';
    return 'bg-red-400/20';
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-night/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-eerie-black border border-seasalt/20 rounded-lg shadow-2xl z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-seasalt/10">
              <div>
                <Dialog.Title className="text-xl font-semibold text-seasalt">
                  {title}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-periwinkle mt-1">
                  {description}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="p-2 hover:bg-seasalt/10 rounded-lg transition-colors">
                  <X className="h-5 w-5 text-seasalt" />
                </button>
              </Dialog.Close>
            </div>

            {/* Mode Toggle */}
            <div className="flex border-b border-seasalt/10">
              <button
                onClick={() => setMode('select')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  mode === 'select'
                    ? 'text-sgbus-green border-b-2 border-sgbus-green bg-sgbus-green/5'
                    : 'text-seasalt/70 hover:text-seasalt hover:bg-seasalt/5'
                }`}
              >
                <Search className="h-4 w-4 inline mr-2" />
                Selecionar Existente
              </button>
              <button
                onClick={() => setMode('create')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  mode === 'create'
                    ? 'text-sgbus-green border-b-2 border-sgbus-green bg-sgbus-green/5'
                    : 'text-seasalt/70 hover:text-seasalt hover:bg-seasalt/5'
                }`}
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Criar Novo
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center">
                <AlertCircle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
                <span className="text-red-400 text-sm">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto p-1 hover:bg-red-500/20 rounded"
                >
                  <X className="h-3 w-3 text-red-400" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {mode === 'select' ? (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-periwinkle" />
                      <input
                        type="text"
                        placeholder="Buscar por nome ou setor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
                      />
                    </div>

                    {/* Client List */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 text-sgbus-green animate-spin" />
                          <span className="ml-2 text-periwinkle">Carregando clientes...</span>
                        </div>
                      ) : clients.length === 0 ? (
                        <div className="text-center py-8">
                          <User className="h-12 w-12 text-periwinkle/50 mx-auto mb-3" />
                          <p className="text-periwinkle">
                            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                          </p>
                          <p className="text-seasalt/70 text-sm mt-1">
                            {!searchTerm && 'Crie seu primeiro cliente usando a aba "Criar Novo"'}
                          </p>
                        </div>
                      ) : (
                        clients.map((client) => (
                          <button
                            key={client.id}
                            onClick={() => onClientSelected(client)}
                            className="w-full p-4 bg-night border border-seasalt/10 rounded-lg hover:border-sgbus-green/50 hover:bg-sgbus-green/5 transition-all text-left group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-seasalt group-hover:text-sgbus-green transition-colors">
                                  {client.name}
                                </h3>
                                <p className="text-sm text-periwinkle mt-1">
                                  {client.industry || 'Setor não informado'}
                                </p>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRichnessBackground(client.richnessScore)}`}>
                                  <span className={getRichnessColor(client.richnessScore)}>
                                    {client.richnessScore}% completo
                                  </span>
                                </div>
                                <Check className="h-4 w-4 text-sgbus-green opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="create"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Form */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-seasalt mb-2">
                          Nome do Cliente *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-periwinkle" />
                          <input
                            type="text"
                            value={newClientForm.name}
                            onChange={(e) => setNewClientForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: Empresa ABC Ltda"
                            className="w-full pl-10 pr-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-seasalt mb-2">
                          Setor de Atuação
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-periwinkle" />
                          <input
                            type="text"
                            value={newClientForm.industry}
                            onChange={(e) => setNewClientForm(prev => ({ ...prev, industry: e.target.value }))}
                            placeholder="Ex: Tecnologia, Consultoria, E-commerce"
                            className="w-full pl-10 pr-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-seasalt mb-2">
                          Serviço/Produto Principal
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-periwinkle" />
                          <input
                            type="text"
                            value={newClientForm.serviceOrProduct}
                            onChange={(e) => setNewClientForm(prev => ({ ...prev, serviceOrProduct: e.target.value }))}
                            placeholder="Ex: Desenvolvimento de software, Consultoria empresarial"
                            className="w-full pl-10 pr-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-seasalt mb-2">
                          Objetivo Inicial
                        </label>
                        <div className="relative">
                          <Target className="absolute left-3 top-3 h-4 w-4 text-periwinkle" />
                          <textarea
                            value={newClientForm.initialObjective}
                            onChange={(e) => setNewClientForm(prev => ({ ...prev, initialObjective: e.target.value }))}
                            placeholder="Descreva brevemente o objetivo inicial do cliente..."
                            rows={3}
                            className="w-full pl-10 pr-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20 resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Auto-save indicator */}
                    <div className="flex items-center text-xs text-periwinkle">
                      <div className="w-2 h-2 bg-sgbus-green rounded-full mr-2 animate-pulse" />
                      Salvamento automático ativo
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {mode === 'create' && (
              <div className="flex items-center justify-between p-6 border-t border-seasalt/10">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-seasalt/70 hover:text-seasalt transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateClient}
                  disabled={!newClientForm.name.trim() || isLoading}
                  className="px-6 py-2 bg-sgbus-green text-night font-medium rounded-lg hover:bg-sgbus-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Cliente
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 