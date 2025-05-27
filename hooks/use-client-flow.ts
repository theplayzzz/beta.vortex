import { useState } from 'react';

interface Client {
  id: string;
  name: string;
  industry?: string;
  richnessScore: number;
  createdAt: Date | string;
}

interface UseClientFlowOptions {
  onClientSelected?: (client: Client) => void;
  title?: string;
  description?: string;
  mode?: 'create-only' | 'select-or-create';
}

export function useClientFlow(options: UseClientFlowOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleClientSelected = (client: Client) => {
    setSelectedClient(client);
    setIsOpen(false);
    options.onClientSelected?.(client);
  };

  const clearSelection = () => setSelectedClient(null);

  return {
    // Estados
    isOpen,
    selectedClient,
    
    // Ações
    openModal,
    closeModal,
    handleClientSelected,
    clearSelection,
    
    // Props para o modal
    modalProps: {
      isOpen,
      onClose: closeModal,
      onClientSelected: handleClientSelected,
      title: options.title || 'Selecionar Cliente',
      description: options.description || 'Escolha um cliente existente ou crie um novo',
    }
  };
} 