'use client';

import { useState } from 'react';
import { ClientHeader } from './ClientHeader';
import { FormProgress } from './FormProgress';

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
  const [currentProgress, setCurrentProgress] = useState(45);
  const [currentTab, setCurrentTab] = useState(1);

  const client = mockClients[selectedClient];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-seasalt mb-2">
          Demo: Componentes Core (Phase 2)
        </h1>
        <p className="text-periwinkle">
          Demonstração dos componentes ClientHeader, RichnessScoreBadge e FormProgress
        </p>
      </div>

      {/* Controles de demonstração */}
      <div className="bg-eerie-black rounded-lg p-4 space-y-4">
        <h3 className="text-seasalt font-medium">Controles de Demonstração</h3>
        
        <div className="space-y-2">
          <label className="text-periwinkle text-sm">Cliente:</label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(Number(e.target.value))}
            className="w-full bg-night border border-seasalt/20 rounded-lg px-3 py-2 text-seasalt"
          >
            {mockClients.map((client, index) => (
              <option key={index} value={index}>
                {client.name} - {client.richnessScore}% ({client.industry})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-periwinkle text-sm">
              Progresso: {currentProgress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={currentProgress}
              onChange={(e) => setCurrentProgress(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-periwinkle text-sm">Aba Atual:</label>
            <select
              value={currentTab}
              onChange={(e) => setCurrentTab(Number(e.target.value))}
              className="w-full bg-night border border-seasalt/20 rounded-lg px-3 py-2 text-seasalt"
            >
              <option value={0}>Informações Básicas</option>
              <option value={1}>Detalhes do Setor</option>
              <option value={2}>Marketing</option>
              <option value={3}>Comercial</option>
            </select>
          </div>
        </div>
      </div>

      {/* Demonstração dos componentes */}
      <div className="space-y-6">
        <div>
          <h3 className="text-seasalt font-medium mb-3">1. ClientHeader</h3>
          <ClientHeader client={client} />
        </div>

        <div>
          <h3 className="text-seasalt font-medium mb-3">2. FormProgress</h3>
          <FormProgress currentProgress={currentProgress} currentTab={currentTab} />
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