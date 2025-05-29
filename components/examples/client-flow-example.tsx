"use client";

import { useState } from "react";
import { User, Building, Calendar, Plus, Search } from "lucide-react";
import ClientFlowModal from "@/components/shared/client-flow-modal";
import { useClientFlow } from "../../hooks/use-client-flow";
import type { Client } from "@/lib/react-query";

interface ClientFlowExampleProps {
  mode?: 'create-only' | 'select-or-create';
  title?: string;
  description?: string;
}

export default function ClientFlowExample({ 
  mode = 'select-or-create',
  title,
  description 
}: ClientFlowExampleProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const clientFlow = useClientFlow({
    title: mode === 'create-only' 
      ? 'Criar Novo Cliente' 
      : 'Selecionar Cliente',
    description: mode === 'create-only' 
      ? 'Preencha os dados para criar um novo cliente'
      : 'Escolha um cliente existente ou crie um novo',
    onClientSelected: (client: Client) => {
      setSelectedClient(client);
      console.log('Cliente selecionado:', client);
    }
  });

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
    <div className="bg-eerie-black rounded-lg p-6 border border-seasalt/10">
      <h3 className="text-lg font-semibold text-seasalt mb-4">
        Exemplo de Uso - {mode === 'create-only' ? 'Apenas Criação' : 'Seleção ou Criação'}
      </h3>
      
      <div className="space-y-4">
        {/* Botão para abrir modal */}
        <button
          onClick={clientFlow.openModal}
          className="w-full bg-sgbus-green text-night font-medium py-3 px-4 rounded-lg hover:bg-sgbus-green/90 transition-colors flex items-center justify-center"
        >
          {mode === 'create-only' ? (
            <>
              <Plus className="h-5 w-5 mr-2" />
              Criar Novo Cliente
            </>
          ) : (
            <>
              <Search className="h-5 w-5 mr-2" />
              Selecionar ou Criar Cliente
            </>
          )}
        </button>

        {/* Cliente selecionado */}
        {selectedClient ? (
          <div className="p-4 bg-night border border-seasalt/10 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-seasalt text-lg">
                  {selectedClient.name}
                </h4>
                <p className="text-periwinkle text-sm mt-1">
                  ID: {selectedClient.id}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRichnessBackground(selectedClient.richnessScore)}`}>
                <span className={getRichnessColor(selectedClient.richnessScore)}>
                  {selectedClient.richnessScore}% completo
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center text-periwinkle">
                <Building className="h-4 w-4 mr-2" />
                {selectedClient.industry || 'Setor não informado'}
              </div>
              <div className="flex items-center text-periwinkle">
                <Calendar className="h-4 w-4 mr-2" />
                Criado em {new Date(selectedClient.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-seasalt/10">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedClient(null)}
                  className="flex-1 bg-seasalt/10 text-seasalt font-medium py-2 px-4 rounded-lg hover:bg-seasalt/20 transition-colors"
                >
                  Limpar Seleção
                </button>
                <button
                  onClick={clientFlow.openModal}
                  className="flex-1 bg-periwinkle/20 text-periwinkle font-medium py-2 px-4 rounded-lg hover:bg-periwinkle/30 transition-colors"
                >
                  Trocar Cliente
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 border border-seasalt/10 rounded-lg">
            <User className="h-12 w-12 text-periwinkle/50 mx-auto mb-3" />
            <p className="text-periwinkle">
              Nenhum cliente selecionado
            </p>
            <p className="text-seasalt/70 text-sm mt-1">
              Use o botão acima para {mode === 'create-only' ? 'criar um cliente' : 'selecionar ou criar um cliente'}
            </p>
          </div>
        )}

        {/* Informações sobre o modo */}
        <div className="text-xs text-seasalt/70 space-y-1">
          <p><strong>Modo:</strong> {mode === 'create-only' ? 'Apenas Criação' : 'Seleção ou Criação'}</p>
          <p><strong>Uso:</strong> {mode === 'create-only' 
            ? 'Ideal para páginas onde sempre precisamos de um novo cliente' 
            : 'Ideal para funcionalidades que podem usar clientes existentes'
          }</p>
        </div>
      </div>

      {/* Modal */}
      <ClientFlowModal {...clientFlow.modalProps} />
    </div>
  );
} 