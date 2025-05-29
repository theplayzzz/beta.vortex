'use client';

import { useState } from 'react';
import { PlanningForm } from '@/components/planning/PlanningForm';
import { PlanningFormData } from '@/lib/planning/formSchema';

// Mock client data for demonstration
const mockClients = [
  {
    id: "client-001",
    name: "TechCorp Solutions",
    industry: "Tecnologia",
    richnessScore: 85,
    businessDetails: "",
    createdAt: new Date()
  },
  {
    id: "client-002", 
    name: "Restaurante Sabor & Arte",
    industry: "Alimentação",
    richnessScore: 65,
    businessDetails: "",
    createdAt: new Date()
  },
  {
    id: "client-003",
    name: "Consultoria Estratégica Plus",
    industry: "Outro",
    richnessScore: 92,
    businessDetails: "Consultoria especializada em transformação digital para PMEs",
    createdAt: new Date()
  }
];

export default function PlanningFormDemo() {
  const [selectedClient, setSelectedClient] = useState(mockClients[0]);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  const handleSubmit = (data: PlanningFormData) => {
    console.log('📋 Formulário finalizado:', data);
    setSubmissionResult({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
    
    // Simular envio para API
    setTimeout(() => {
      alert('✅ Planejamento criado com sucesso!');
    }, 500);
  };

  const handleSaveDraft = (data: PlanningFormData) => {
    console.log('💾 Rascunho salvo:', data);
    setDraftSaved(true);
    
    // Feedback visual
    setTimeout(() => {
      setDraftSaved(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-night">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-seasalt mb-4">
            📋 Formulário de Planejamento Estratégico
          </h1>
          <p className="text-periwinkle text-lg">
            Demonstração completa do formulário multi-etapas com validação e persistência.
          </p>
        </div>

        {/* Client Selector */}
        <div className="mb-8 p-6 bg-eerie-black rounded-lg">
          <h2 className="text-xl font-semibold text-seasalt mb-4">
            Selecionar Cliente para Demonstração
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockClients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedClient.id === client.id
                    ? 'border-sgbus-green bg-sgbus-green/10'
                    : 'border-seasalt/20 hover:border-seasalt/40'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium text-seasalt">{client.name}</div>
                  <div className="text-sm text-periwinkle">{client.industry}</div>
                  <div className="text-sm text-sgbus-green">{client.richnessScore}% dados</div>
                  {client.businessDetails && (
                    <div className="text-xs text-periwinkle mt-1">
                      {client.businessDetails}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mb-6 flex items-center space-x-4">
          {draftSaved && (
            <div className="px-4 py-2 bg-sgbus-green/20 border border-sgbus-green/40 rounded-lg">
              <span className="text-sgbus-green text-sm">💾 Rascunho salvo automaticamente</span>
            </div>
          )}
          
          {submissionResult && (
            <div className="px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-lg">
              <span className="text-green-400 text-sm">✅ Formulário enviado com sucesso</span>
            </div>
          )}
        </div>

        {/* Main Form */}
        <PlanningForm
          client={selectedClient}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
        />

        {/* Debug Information */}
        <div className="mt-12 p-6 bg-eerie-black rounded-lg">
          <h3 className="text-lg font-semibold text-seasalt mb-4">
            🔧 Informações de Debug
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-seasalt mb-2">Cliente Selecionado:</h4>
              <pre className="text-xs text-periwinkle bg-night p-3 rounded overflow-auto">
                {JSON.stringify(selectedClient, null, 2)}
              </pre>
            </div>
            
            {submissionResult && (
              <div>
                <h4 className="font-medium text-seasalt mb-2">Último Envio:</h4>
                <pre className="text-xs text-periwinkle bg-night p-3 rounded overflow-auto max-h-64">
                  {JSON.stringify(submissionResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Features Summary */}
        <div className="mt-8 p-6 bg-eerie-black rounded-lg">
          <h3 className="text-lg font-semibold text-seasalt mb-4">
            ✨ Funcionalidades Implementadas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-night rounded-lg">
              <div className="text-sgbus-green font-medium mb-2">📋 4 Abas Integradas</div>
              <div className="text-sm text-periwinkle">
                Informações Básicas, Detalhes do Setor, Marketing e Comercial
              </div>
            </div>
            
            <div className="p-4 bg-night rounded-lg">
              <div className="text-sgbus-green font-medium mb-2">🔄 Auto-save</div>
              <div className="text-sm text-periwinkle">
                Dados salvos automaticamente no localStorage
              </div>
            </div>
            
            <div className="p-4 bg-night rounded-lg">
              <div className="text-sgbus-green font-medium mb-2">✅ Validação</div>
              <div className="text-sm text-periwinkle">
                Validação em tempo real com Zod + React Hook Form
              </div>
            </div>
            
            <div className="p-4 bg-night rounded-lg">
              <div className="text-sgbus-green font-medium mb-2">📊 Progresso</div>
              <div className="text-sm text-periwinkle">
                Cálculo automático de progresso por seção
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 