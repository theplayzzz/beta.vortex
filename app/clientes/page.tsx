"use client";

import { Plus, Search, Filter } from "lucide-react";
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

      {/* Unified Search Header */}
      <div className="bg-eerie-black rounded-lg p-6 border border-accent/20 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Título e Descrição */}
          <div>
            <h2 className="text-xl font-semibold text-seasalt">Buscar e Filtrar Clientes</h2>
            <p className="text-periwinkle text-sm mt-1">Use os filtros para encontrar clientes específicos</p>
          </div>
          
          {/* Controles de Busca */}
          <div className="flex flex-col sm:flex-row gap-4 min-w-0 lg:flex-1 lg:max-w-2xl">
            {/* Filtros básicos - integrados com o componente existente */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-periwinkle">Filtros avançados disponíveis abaixo</span>
            </div>
            
            {/* Campo de Busca - controlado pelo componente */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-seasalt/50" />
              <div className="pl-10 pr-4 py-2.5 bg-night border border-accent/20 rounded-lg text-seasalt">
                Busca integrada abaixo
              </div>
            </div>
            
            {/* Botão de Ação */}
            <button 
              onClick={clientFlow.openModal}
              className="px-4 py-2.5 bg-sgbus-green text-night font-medium rounded-lg hover:bg-sgbus-green/90 transition-colors shrink-0"
            >
              <Plus className="h-4 w-4 mr-2 inline" />
              Criar Novo
            </button>
          </div>
        </div>
      </div>

      {/* Lista com filtros */}
      <ClientListWithFilters />

      {/* Modal de criação de cliente */}
      <ClientFlowModal {...clientFlow.modalProps} />
    </div>
  );
} 