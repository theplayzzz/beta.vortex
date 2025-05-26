"use client";

import { useState } from "react";
import ClientFlowModal from "@/components/shared/client-flow-modal";
import { Plus, User, Building, Calendar } from "lucide-react";

interface Client {
  id: string;
  name: string;
  industry?: string;
  richnessScore: number;
  createdAt: Date;
}

export default function NovoClientePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleClientSelected = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(false);
  };

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-seasalt mb-2">
          Novo Cliente
        </h1>
        <p className="text-periwinkle">
          Demonstração do ClientFlow Modal - Selecione ou crie um cliente
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trigger do Modal */}
        <div className="bg-eerie-black rounded-lg p-6 border border-seasalt/10">
          <h2 className="text-xl font-semibold text-seasalt mb-4">
            ClientFlow Modal
          </h2>
          <p className="text-periwinkle mb-6">
            Clique no botão abaixo para abrir o modal de seleção/criação de cliente.
          </p>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-sgbus-green text-night font-medium py-3 px-4 rounded-lg hover:bg-sgbus-green/90 transition-colors flex items-center justify-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Abrir ClientFlow Modal
          </button>

          <div className="mt-6 space-y-2 text-sm text-seasalt/70">
            <p>✅ Modal reutilizável implementado</p>
            <p>✅ Auto-save durante digitação</p>
            <p>✅ Validação de campos obrigatórios</p>
            <p>✅ Integração com Radix UI Dialog</p>
            <p>✅ Estados de loading e erro</p>
            <p>✅ Indicador visual de richnessScore</p>
          </div>
        </div>

        {/* Resultado da Seleção */}
        <div className="bg-eerie-black rounded-lg p-6 border border-seasalt/10">
          <h2 className="text-xl font-semibold text-seasalt mb-4">
            Cliente Selecionado
          </h2>
          
          {selectedClient ? (
            <div className="space-y-4">
              <div className="p-4 bg-night border border-seasalt/10 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-seasalt text-lg">
                      {selectedClient.name}
                    </h3>
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
                    Criado em {selectedClient.createdAt.toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sgbus-green text-sm font-medium">
                  ✅ Cliente selecionado com sucesso!
                </p>
                <p className="text-periwinkle text-xs mt-1">
                  O cliente pode agora ser usado em outras funcionalidades
                </p>
              </div>

              <button
                onClick={() => setSelectedClient(null)}
                className="w-full bg-seasalt/10 text-seasalt font-medium py-2 px-4 rounded-lg hover:bg-seasalt/20 transition-colors"
              >
                Limpar Seleção
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-periwinkle/50 mx-auto mb-3" />
              <p className="text-periwinkle">
                Nenhum cliente selecionado ainda
              </p>
              <p className="text-seasalt/70 text-sm mt-1">
                Use o modal ao lado para selecionar ou criar um cliente
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ClientFlow Modal */}
      <ClientFlowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClientSelected={handleClientSelected}
        title="Demonstração ClientFlow"
        description="Selecione um cliente existente ou crie um novo para testar a funcionalidade"
      />
    </div>
  );
} 