"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { 
  Search, 
  Plus, 
  User, 
  Loader2, 
  Building, 
  Star,
  X,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { useDebounce } from "use-debounce";
import { useClients, useCreateClient, type Client, type ClientFilters } from "@/lib/react-query";

// Setores disponíveis
const AVAILABLE_INDUSTRIES = [
  "Tecnologia",
  "Saúde",
  "Educação", 
  "Varejo",
  "Alimentação",
  "Consultoria",
  "Finanças",
  "Marketing",
  "Manufatura",
  "Imobiliário",
  "Transporte",
  "Energia",
  "Turismo",
  "Outro"
];

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
  const isLoadingOrCreating = isLoadingClients || isCreatingClient;
  const error = clientsError || createError;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-night/80 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-eerie-black border border-accent/20 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-seasalt/10">
              <div>
                <h2 className="text-xl font-semibold text-seasalt">{title}</h2>
                <p className="text-periwinkle mt-1">{description}</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-seasalt/50 hover:text-seasalt transition-colors rounded-lg hover:bg-accent/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-seasalt/10">
              <button
                onClick={() => setMode('select')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  mode === 'select'
                    ? 'text-sgbus-green border-b-2 border-sgbus-green bg-sgbus-green/5'
                    : 'text-seasalt/70 hover:text-seasalt'
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                Cliente Existente
              </button>
              <button
                onClick={() => setMode('create')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  mode === 'create'
                    ? 'text-sgbus-green border-b-2 border-sgbus-green bg-sgbus-green/5'
                    : 'text-seasalt/70 hover:text-seasalt'
                }`}
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Criar Novo
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">
                    {error instanceof Error ? error.message : 'Ocorreu um erro'}
                  </p>
                </div>
              )}

              {mode === 'select' && (
                <div className="space-y-4">
                  {/* Busca */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-periwinkle" />
                    <input
                      type="text"
                      placeholder="Buscar clientes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-accent/20 border border-accent/30 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green/50 focus:ring-1 focus:ring-sgbus-green/20"
                    />
                  </div>

                  {/* Lista de clientes */}
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
                        <motion.button
                          key={client.id}
                          onClick={() => onClientSelected(client)}
                          className="w-full p-4 bg-accent/10 hover:bg-accent/20 border border-accent/20 hover:border-sgbus-green/30 rounded-lg transition-all group text-left"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h3 className="font-medium text-seasalt group-hover:text-sgbus-green transition-colors">
                                  {client.name}
                                </h3>
                                {!client.isViewed && (
                                  <span className="ml-2 px-2 py-1 bg-sgbus-green/20 text-sgbus-green text-xs rounded-full">
                                    Novo
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center mt-1 text-sm text-periwinkle">
                                {client.industry && (
                                  <>
                                    <Building className="h-3 w-3 mr-1" />
                                    <span>{client.industry}</span>
                                  </>
                                )}
                                <div className="flex items-center ml-auto">
                                  <Star className="h-3 w-3 mr-1" />
                                  <span>{client.richnessScore}%</span>
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-periwinkle group-hover:text-sgbus-green transition-colors ml-3" />
                          </div>
                        </motion.button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {mode === 'create' && (
                <div className="space-y-4">
                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-seasalt mb-2">
                      Nome do Cliente *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Empresa XYZ Ltda"
                      value={newClientForm.name}
                      onChange={(e) => setNewClientForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-accent/20 border border-accent/30 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green/50 focus:ring-1 focus:ring-sgbus-green/20"
                    />
                  </div>

                  {/* Setor */}
                  <div>
                    <label className="block text-sm font-medium text-seasalt mb-2">
                      Setor de Atuação
                    </label>
                    <select
                      value={newClientForm.industry}
                      onChange={(e) => setNewClientForm(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-4 py-3 bg-accent/20 border border-accent/30 rounded-lg text-seasalt focus:outline-none focus:border-sgbus-green/50 focus:ring-1 focus:ring-sgbus-green/20"
                    >
                      <option value="">Selecione um setor</option>
                      {AVAILABLE_INDUSTRIES.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>

                  {/* Campo customizado para "Outro" */}
                  {showCustomIndustry && (
                    <div>
                      <label className="block text-sm font-medium text-seasalt mb-2">
                        Especifique o setor
                      </label>
                      <input
                        type="text"
                        placeholder="Digite o setor específico"
                        value={newClientForm.businessDetails}
                        onChange={(e) => setNewClientForm(prev => ({ ...prev, businessDetails: e.target.value }))}
                        className="w-full px-4 py-3 bg-accent/20 border border-accent/30 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green/50 focus:ring-1 focus:ring-sgbus-green/20"
                      />
                    </div>
                  )}

                  {/* Produto/Serviço */}
                  <div>
                    <label className="block text-sm font-medium text-seasalt mb-2">
                      Produto ou Serviço Principal
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Software de gestão, Consultoria em RH..."
                      value={newClientForm.serviceOrProduct}
                      onChange={(e) => setNewClientForm(prev => ({ ...prev, serviceOrProduct: e.target.value }))}
                      className="w-full px-4 py-3 bg-accent/20 border border-accent/30 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green/50 focus:ring-1 focus:ring-sgbus-green/20"
                    />
                  </div>

                  {/* Objetivo Inicial */}
                  <div>
                    <label className="block text-sm font-medium text-seasalt mb-2">
                      Objetivo Inicial
                    </label>
                    <textarea
                      placeholder="Ex: Aumentar vendas online, Melhorar presença digital..."
                      value={newClientForm.initialObjective}
                      onChange={(e) => setNewClientForm(prev => ({ ...prev, initialObjective: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 bg-accent/20 border border-accent/30 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green/50 focus:ring-1 focus:ring-sgbus-green/20 resize-none"
                    />
                  </div>
                </div>
              )}
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
                      <CheckCircle className="h-4 w-4 mr-2" />
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