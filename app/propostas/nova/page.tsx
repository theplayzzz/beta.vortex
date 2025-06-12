"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useClientFlow } from '@/hooks/use-client-flow';
import { ProposalForm } from '@/components/proposals/ProposalForm';
import ClientFlowModal from '@/components/shared/client-flow-modal';

// Definir o tipo Client localmente
interface Client {
  id: string;
  name: string;
  industry: string;
  richnessScore: number;
  businessDetails?: string;
  createdAt?: Date;
}

export default function NovaPropostaPage() {
  const router = useRouter();
  const [step, setStep] = useState<'client' | 'form'>('client');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Hook para gerenciar o modal de cliente
  const clientFlow = useClientFlow({
    title: "Selecionar Cliente para Proposta",
    description: "Escolha um cliente existente ou crie um novo para esta proposta comercial",
    onClientSelected: (client) => {
      // Converter o tipo Client do useClients para o tipo esperado
      const convertedClient: Client = {
        id: client.id,
        name: client.name,
        industry: client.industry || 'Outro', // Converter null para string
        richnessScore: client.richnessScore,
        businessDetails: client.businessDetails || undefined,
        createdAt: new Date(client.createdAt),
      };
      setSelectedClient(convertedClient);
      setStep('form');
    }
  });

  const handleBackToClient = () => {
    setStep('client');
    setSelectedClient(null);
  };

  const handleCancel = () => {
    router.push('/propostas');
  };

  if (step === 'form' && selectedClient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header com botão voltar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToClient}
                className="p-2 text-seasalt/70 hover:text-seasalt transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-seasalt">Nova Proposta Comercial</h1>
                <p className="text-periwinkle mt-2">
                  Complete as informações abaixo para gerar sua proposta
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleCancel}
                className="px-4 py-2 border border-seasalt/20 text-seasalt rounded-lg hover:bg-seasalt/10 transition-colors"
              >
                <X className="h-4 w-4 mr-2 inline" />
                Cancelar
              </button>
            </div>
          </div>
          
          {/* Formulário de proposta */}
          <ProposalForm client={selectedClient} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/propostas"
            className="p-2 text-seasalt/70 hover:text-seasalt transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-seasalt">Nova Proposta</h1>
            <p className="text-periwinkle mt-2">
              Selecione um cliente para começar a proposta comercial
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleCancel}
            className="px-4 py-2 border border-seasalt/20 text-seasalt rounded-lg hover:bg-seasalt/10 transition-colors"
          >
            <X className="h-4 w-4 mr-2 inline" />
            Cancelar
          </button>
        </div>
      </div>

      {/* Seleção de Cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cliente Existente */}
        <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-sgbus-green/20 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-sgbus-green" />
            </div>
            <h3 className="text-lg font-semibold text-seasalt">Cliente Existente</h3>
          </div>
          <p className="text-seasalt/70 mb-6">
            Selecione um cliente já cadastrado no sistema ou crie um novo
          </p>
          
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-3 text-sgbus-green/50" />
            <p className="text-seasalt/70 mb-4 text-sm">
              Use o botão abaixo para buscar clientes existentes ou criar um novo cliente
            </p>
          </div>
          
          <button 
            onClick={clientFlow.openModal}
            className="w-full bg-sgbus-green hover:bg-sgbus-green/90 text-night py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Users className="h-4 w-4" />
            Selecionar ou Criar Cliente
          </button>
        </div>
        
        {/* Informações sobre o Processo */}
        <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Plus className="h-4 w-4 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-seasalt">Processo de Criação</h3>
          </div>
          <p className="text-seasalt/70 mb-6">
            Após selecionar ou criar um cliente, você será direcionado para o formulário completo
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-sgbus-green rounded-full flex items-center justify-center text-night font-bold text-xs mt-0.5">
                1
              </div>
              <div>
                <h4 className="font-medium text-seasalt text-sm">Seleção de Cliente</h4>
                <p className="text-seasalt/70 text-xs">Escolha um cliente ou crie um novo</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-seasalt/20 rounded-full flex items-center justify-center text-seasalt/70 font-bold text-xs mt-0.5">
                2
              </div>
              <div>
                <h4 className="font-medium text-seasalt text-sm">Informações Básicas</h4>
                <p className="text-seasalt/70 text-xs">Título, tipo e descrição da proposta</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-seasalt/20 rounded-full flex items-center justify-center text-seasalt/70 font-bold text-xs mt-0.5">
                3
              </div>
              <div>
                <h4 className="font-medium text-seasalt text-sm">Escopo de Serviços</h4>
                <p className="text-seasalt/70 text-xs">Modalidade e serviços incluídos</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-seasalt/20 rounded-full flex items-center justify-center text-seasalt/70 font-bold text-xs mt-0.5">
                4
              </div>
              <div>
                <h4 className="font-medium text-seasalt text-sm">Contexto Comercial</h4>
                <p className="text-seasalt/70 text-xs">Orçamento, urgência e tomador de decisão</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cliente */}
      <ClientFlowModal {...clientFlow.modalProps} />
    </div>
  );
} 