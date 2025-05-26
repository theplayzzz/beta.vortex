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
  Check
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  industry?: string;
  richnessScore: number;
  createdAt: Date;
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
  const [newClientForm, setNewClientForm] = useState<NewClientForm>({
    name: '',
    industry: '',
    initialObjective: ''
  });

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
    setNewClientForm({ name: '', industry: '', initialObjective: '' });
    setSearchTerm('');
    setMode('select');
    onClose();
  };

  // Simular busca de clientes (será substituído por API real)
  useEffect(() => {
    if (mode === 'select' && isOpen) {
      setIsLoading(true);
      // Simular delay de API
      setTimeout(() => {
        const mockClients: Client[] = [
          {
            id: '1',
            name: 'Empresa ABC Ltda',
            industry: 'Tecnologia',
            richnessScore: 85,
            createdAt: new Date('2024-01-15')
          },
          {
            id: '2', 
            name: 'Consultoria XYZ',
            industry: 'Consultoria',
            richnessScore: 45,
            createdAt: new Date('2024-02-20')
          },
          {
            id: '3',
            name: 'Startup Inovadora',
            industry: 'Fintech',
            richnessScore: 92,
            createdAt: new Date('2024-03-10')
          }
        ];
        
        const filtered = mockClients.filter(client =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.industry?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        setClients(filtered);
        setIsLoading(false);
      }, 300);
    }
  }, [searchTerm, mode, isOpen]);

  // Criar novo cliente
  const handleCreateClient = async () => {
    if (!newClientForm.name.trim()) return;

    setIsLoading(true);
    
    try {
      // Simular criação de cliente (será substituído por API real)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newClient: Client = {
        id: Date.now().toString(),
        name: newClientForm.name,
        industry: newClientForm.industry,
        richnessScore: 15, // Score inicial baixo
        createdAt: new Date()
      };

      localStorage.removeItem('clientflow-draft');
      onClientSelected(newClient);
      handleClose();
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
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