import { useState } from 'react';

// Tipos já definidos na lib/react-query
export type { Client } from "@/lib/react-query";

interface UseClientFlowProps {
  title?: string;
  description?: string;
  onClientSelected: (client: import("@/lib/react-query").Client) => void;
}

export function useClientFlow({
  title = "Selecionar Cliente",
  description = "Escolha um cliente existente ou crie um novo",
  onClientSelected,
}: UseClientFlowProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const handleClientSelected = (client: import("@/lib/react-query").Client) => {
    onClientSelected(client);
    closeModal();
  };

  return {
    isOpen,
    openModal,
    closeModal,
    modalProps: {
      isOpen,
      onClose: closeModal,
      onClientSelected: handleClientSelected,
      title,
      description,
    },
  };
} 