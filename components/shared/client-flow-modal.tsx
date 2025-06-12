"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
import { useClients, useCreateClient, type Client, type ClientFilters } from "@/lib/react-query";
import { SETORES_PERMITIDOS } from "@/lib/constants/sectors";

// Setores disponíveis - apenas os que têm formulários dinâmicos
const AVAILABLE_INDUSTRIES = SETORES_PERMITIDOS;

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
  businessDetails: string;
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
  const [newClientForm, setNewClientForm] = useState<NewClientForm>({
    name: '',
    industry: '',
    serviceOrProduct: '',
    initialObjective: '',
    businessDetails: ''
  });
  const [showCustomIndustry, setShowCustomIndustry] = useState(false);

  // Debounce da busca
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  // TanStack Query hooks
  const clientsFilters: ClientFilters = {
    search: debouncedSearch || undefined,
    limit: 20,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  };

  const { 
    data: clientsData, 
    isLoading: isLoadingClients, 
    error: clientsError 
  } = useClients(mode === 'select' && isOpen ? clientsFilters : {});

  const { 
    mutate: createClient, 
    isPending: isCreatingClient, 
    error: createError 
  } = useCreateClient();

  // Monitorar mudanças no setor selecionado
  useEffect(() => {
    setShowCustomIndustry(newClientForm.industry === "Outro");
  }, [newClientForm.industry]);

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
    setNewClientForm({ 
      name: '', 
      industry: '', 
      serviceOrProduct: '', 
      initialObjective: '',
      businessDetails: ''
    });
    setSearchTerm('');
    setMode('select');
    setShowCustomIndustry(false);
    onClose();
  };

  // Criar novo cliente via TanStack Query
  const handleCreateClient = async () => {
    if (!newClientForm.name.trim()) return;

    // Preparar dados para envio
    let industryToSave = newClientForm.industry;
    let businessDetailsToSave = newClientForm.businessDetails;

    // Se "Outro" foi selecionado e há texto personalizado, usar o texto como setor
    if (newClientForm.industry === "Outro" && newClientForm.businessDetails?.trim()) {
      industryToSave = newClientForm.businessDetails.trim();
      businessDetailsToSave = ''; // Limpar para evitar duplicação
    }

    const dataToSend = {
      name: newClientForm.name,
      industry: industryToSave || undefined,
      serviceOrProduct: newClientForm.serviceOrProduct || undefined,
      initialObjective: newClientForm.initialObjective || undefined,
      businessDetails: businessDetailsToSave || undefined,
    };

    createClient(dataToSend, {
      onSuccess: (response) => {
        const newClient: Client = response.client;
        localStorage.removeItem('clientflow-draft');
        onClientSelected(newClient);
        handleClose();
      },
    });
  };

  // Renderizar clientes
  const clients = clientsData?.clients || [];
  const isLoading = isLoadingClients || isCreatingClient;
  const error = clientsError || createError;

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
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] bg-eerie-black border border-seasalt/20 rounded-lg shadow-2xl z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full max-h-[90vh] sm:max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-seasalt/10 shrink-0">
              <div>
                <Dialog.Title className="text-xl font-semibold text-seasalt">
                  {title}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-periwinkle mt-1">
                  {description}
                </Dialog.Description>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 hover:bg-seasalt/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-seasalt" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex border-b border-seasalt/10 shrink-0">
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
              <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center shrink-0">
                <AlertCircle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
                <span className="text-red-400 text-sm">
                  {error instanceof Error ? error.message : 'Ocorreu um erro'}
                </span>
                <button
                  onClick={() => {}}
                  className="ml-auto p-1 hover:bg-red-500/20 rounded"
                >
                  <X className="h-3 w-3 text-red-400" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <AnimatePresence mode="wait">
                {mode === 'select' ? (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="p-6 space-y-4"
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
                      {isLoadingClients ? (
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
                    className="h-full flex flex-col"
                  >
                    {/* Scrollable Form Container */}
                    <div className="flex-1 overflow-y-auto p-6">
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
                            Setor de Atuação *
                          </label>
                          <select
                            value={newClientForm.industry}
                            onChange={(e) => setNewClientForm(prev => ({ ...prev, industry: e.target.value }))}
                            className="w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
                          >
                            <option value="" className="bg-night text-seasalt">Selecione o setor de atuação</option>
                            {AVAILABLE_INDUSTRIES.map(industry => (
                              <option key={industry} value={industry} className="bg-night text-seasalt">{industry}</option>
                            ))}
                          </select>
                        </div>

                        {showCustomIndustry && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-seasalt mb-2">
                              Especifique o setor *
                            </label>
                            <div className="relative">
                              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-periwinkle" />
                              <input
                                type="text"
                                value={newClientForm.businessDetails || ""}
                                onChange={(e) => setNewClientForm(prev => ({ 
                                  ...prev, 
                                  businessDetails: e.target.value 
                                }))}
                                placeholder="Descreva o setor específico..."
                                className="w-full pl-10 pr-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
                              />
                            </div>
                          </div>
                        )}

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

                        {/* Auto-save indicator */}
                        <div className="flex items-center text-xs text-periwinkle pt-2">
                          <div className="w-2 h-2 bg-sgbus-green rounded-full mr-2 animate-pulse" />
                          Salvamento automático ativo
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {mode === 'create' && (
              <div className="flex items-center justify-between p-6 border-t border-seasalt/10 shrink-0">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-seasalt/70 hover:text-seasalt transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateClient}
                  disabled={!newClientForm.name.trim() || isCreatingClient}
                  className="px-6 py-2 bg-sgbus-green text-night font-medium rounded-lg hover:bg-sgbus-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isCreatingClient ? (
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