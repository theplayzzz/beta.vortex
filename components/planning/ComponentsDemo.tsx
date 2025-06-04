'use client';

import { useState } from 'react';
import { ClientHeader } from './ClientHeader';

// Mock data para demonstração
const mockClient = {
  id: 'client_123',
  name: 'Empresa XYZ Ltda',
  industry: 'E-commerce',
  richnessScore: 75,
  businessDetails: null
};

const mockClientWithDetails = {
  id: 'client_456',
  name: 'Consultoria ABC',
  industry: 'Outro',
  richnessScore: 45,
  businessDetails: 'Consultoria em transformação digital'
};

const mockClients = [
  { ...mockClient, richnessScore: 90 }, // Rico
  { ...mockClient, name: 'Empresa DEF', richnessScore: 65 }, // Bom
  { ...mockClient, name: 'Empresa GHI', richnessScore: 35 }, // Básico
  mockClientWithDetails
];

export function ComponentsDemo() {
  const [selectedClient, setSelectedClient] = useState(0);

  const client = mockClients[selectedClient];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-seasalt mb-2">
          Demo: Componentes de Planejamento
        </h1>
        <p className="text-periwinkle">
          Demonstração dos componentes implementados
        </p>
      </div>

      {/* Controles */}
      <div className="bg-eerie-black rounded-lg p-4 space-y-4">
        <h3 className="text-seasalt font-medium">Controles</h3>
        
        <div className="space-y-2">
          <label className="text-periwinkle text-sm">Cliente Selecionado:</label>
          <div className="grid grid-cols-2 gap-2">
            {mockClients.map((client, index) => (
              <button
                key={index}
                onClick={() => setSelectedClient(index)}
                className={`p-2 text-sm rounded-lg border ${
                  selectedClient === index
                    ? 'bg-sgbus-green text-white border-sgbus-green'
                    : 'bg-night text-seasalt border-seasalt/20 hover:border-sgbus-green'
                }`}
              >
                {client.name} ({client.richnessScore}%)
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Demonstração dos componentes */}
      <div className="space-y-6">
        <div>
          <h3 className="text-seasalt font-medium mb-3">ClientHeader</h3>
          <ClientHeader client={client} />
        </div>
      </div>

      {/* Documentação dos componentes */}
      <div className="bg-eerie-black rounded-lg p-4 space-y-4">
        <h3 className="text-seasalt font-medium">Componentes Implementados</h3>
        
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="text-sgbus-green font-medium">✅ RichnessScoreBadge</h4>
            <p className="text-periwinkle">
              Badge que mostra o score de riqueza (0-100%) com cores e ícones dinâmicos
            </p>
          </div>
          
          <div>
            <h4 className="text-sgbus-green font-medium">✅ ClientHeader</h4>
            <p className="text-periwinkle">
              Header que exibe informações do cliente com badge de score integrado
            </p>
          </div>
          
          <div>
            <h4 className="text-sgbus-green font-medium">✅ FormProgress</h4>
            <p className="text-periwinkle">
              Barra de progresso com indicadores visuais das 4 etapas do formulário
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 