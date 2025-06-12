'use client';

import { useState } from 'react';
import { useProposalFormWithPolling } from '@/hooks/useFormWithPolling';
import { ProposalStatusIndicator } from '@/components/proposals/ProposalStatusIndicator';
import { Button } from '@/components/ui/button';

export function ExampleProposalForm() {
  const [currentProposalId, setCurrentProposalId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titulo_da_proposta: '',
    tipo_de_proposta: 'comercial',
    clientId: '',
    nome_da_contratada: 'Vortex Systems',
    modalidade_entrega: 'digital',
    servicos_incluidos: ['consultoria'],
    orcamento_estimado: '10000',
    forma_prazo_pagamento: '30 dias',
    urgencia_do_projeto: 'media',
    tomador_de_decisao: 'CEO',
    resumo_dor_problema_cliente: 'Necessita de automação de processos',
  });

  const { submitProposal, isSubmitting, error } = useProposalFormWithPolling({
    onSuccess: (response) => {
      console.log('🎉 Proposta criada com sucesso:', response);
      setCurrentProposalId(response.proposal.id);
    },
    onError: (error) => {
      console.error('❌ Erro ao criar proposta:', error);
    },
    redirectAfterSubmit: false, // Não redirecionar para demonstrar o polling
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await submitProposal(formData);
    } catch (error) {
      console.error('Erro no envio:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">🚀 Sistema de Polling de Propostas</h1>
        <p className="text-muted-foreground">
          Demonstração do sistema de polling que verifica o status da proposta a cada 3 segundos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">📝 Criar Nova Proposta</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Título da Proposta
              </label>
              <input
                type="text"
                value={formData.titulo_da_proposta}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo_da_proposta: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Automação de Processos Empresariais"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                ID do Cliente (exemplo)
              </label>
              <input
                type="text"
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite um ID de cliente válido"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Resumo do Problema
              </label>
              <textarea
                value={formData.resumo_dor_problema_cliente}
                onChange={(e) => setFormData(prev => ({ ...prev, resumo_dor_problema_cliente: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Descreva o problema que o cliente precisa resolver..."
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Criando Proposta...
                </>
              ) : (
                '🚀 Criar Proposta e Iniciar Polling'
              )}
            </Button>
          </form>
        </div>

        {/* Status do Polling */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">📊 Status em Tempo Real</h2>
          
          {currentProposalId ? (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="mb-4">
                <h3 className="font-medium">Proposta ID: {currentProposalId}</h3>
                <p className="text-sm text-muted-foreground">
                  Polling a cada 3 segundos • Funciona em qualquer página
                </p>
              </div>
              
              <ProposalStatusIndicator
                proposalId={currentProposalId}
                showDetails={true}
                onComplete={(status) => {
                  console.log('🎉 Proposta completada:', status);
                }}
                onStatusChange={(status) => {
                  console.log('📊 Status atualizado:', status.statusInfo.status);
                }}
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-gray-400 text-4xl mb-2">⏳</div>
              <p className="text-gray-500">
                Crie uma proposta para ver o polling em ação
              </p>
            </div>
          )}

          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">💡 Como funciona:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• O polling inicia automaticamente após criar a proposta</li>
              <li>• Verifica o status a cada 3 segundos</li>
              <li>• Funciona mesmo se você mudar de página</li>
              <li>• Notificações aparecem quando a proposta fica pronta</li>
              <li>• Salva o progresso no localStorage para outras abas</li>
            </ul>
          </div>

          {/* Simulação de navegação */}
          <div className="space-y-2">
            <h4 className="font-medium">🔄 Teste a Persistência:</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(window.location.href, '_blank')}
              >
                Abrir Nova Aba
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Recarregar Página
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              O polling continuará funcionando em qualquer aba!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 