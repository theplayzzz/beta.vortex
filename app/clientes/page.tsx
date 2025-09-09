"use client";

import { Plus } from "lucide-react";
import ClientListWithFilters from "@/components/client/client-list-with-filters";
import ClientFlowModal from "@/components/shared/client-flow-modal";
import { RouteGuard } from "@/components/auth/route-guard";
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
    <RouteGuard requiredModalidade="clientes">
      <div className="container mx-auto px-4 py-8">
      {/* Header da Página - Layout Responsivo */}
      <div className="mb-8">
        {/* Mobile Layout (≤768px): Empilhado */}
        <div className="block lg:hidden transition-all duration-300 ease-in-out">
          <h1 className="text-3xl font-bold text-seasalt mb-2">Lista de Clientes</h1>
          <p className="text-periwinkle mb-6">
            Gerencie todos os seus clientes em um só lugar
          </p>
          <div className="flex justify-center">
            <button
              onClick={clientFlow.openModal}
              className="flex items-center px-6 py-3 bg-sgbus-green text-night font-medium rounded-lg hover:bg-sgbus-green/90 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </button>
          </div>
        </div>

        {/* Desktop Layout (≥1024px): 2 Colunas Horizontais */}
        <div className="hidden lg:flex lg:items-start lg:justify-between transition-all duration-300 ease-in-out">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-seasalt">Lista de Clientes</h1>
            <p className="text-periwinkle mt-2">
              Gerencie todos os seus clientes em um só lugar
            </p>
          </div>
          <div className="ml-8 flex-shrink-0">
            <button
              onClick={clientFlow.openModal}
              className="flex items-center px-4 py-2 bg-sgbus-green text-night font-medium rounded-lg hover:bg-sgbus-green/90 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </button>
          </div>
        </div>
      </div>

      {/* Lista com filtros */}
      <ClientListWithFilters />

      {/* Modal de criação de cliente */}
      <ClientFlowModal {...clientFlow.modalProps} />
      </div>
    </RouteGuard>
  );
} 