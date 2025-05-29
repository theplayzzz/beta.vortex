"use client";

import { Plus } from "lucide-react";
import ClientListWithFilters from "@/components/client/client-list-with-filters";
import ClientFlowModal from "@/components/shared/client-flow-modal";
import { useClientFlow } from "../../hooks/use-client-flow";
import type { Client } from "@/lib/react-query";

export default function ClientesPage() {
  const clientFlow = useClientFlow({
    title: "Novo Cliente",
    description: "Crie um novo cliente para sua carteira",
    onClientSelected: (client: Client) => {
      // Recarregar a lista de clientes após criação
      window.location.reload();
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-seasalt">Lista de Clientes</h1>
          <p className="text-periwinkle mt-2">
            Gerencie todos os seus clientes em um só lugar
          </p>
        </div>
        <button
          onClick={clientFlow.openModal}
          className="flex items-center px-4 py-2 bg-sgbus-green text-night font-medium rounded-lg hover:bg-sgbus-green/90 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </button>
      </div>

      {/* Lista com filtros */}
      <ClientListWithFilters />

      {/* Modal de criação de cliente */}
      <ClientFlowModal {...clientFlow.modalProps} />
    </div>
  );
} 