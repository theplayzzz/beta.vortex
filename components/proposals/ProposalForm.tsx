'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { proposalFormSchema, validateTab, calculateTabProgress, type ProposalFormSchema } from '@/lib/proposals/formSchema';
import { BasicInfoTab } from './tabs/BasicInfoTab';
import { ScopeTab } from './tabs/ScopeTab';
import { CommercialTab } from './tabs/CommercialTab';
import { ProposalProgress } from './ProposalProgress';
import { useGenerateProposal } from '@/hooks/use-proposals';
import { useToast, toast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

interface Client {
  id: string;
  name: string;
  industry?: string;
  richnessScore: number;
}

interface ProposalFormProps {
  client: Client;
}

export function ProposalForm({ client }: ProposalFormProps) {
  const [currentTab, setCurrentTab] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();
  
  // Hook para gerar proposta via IA
  const generateProposal = useGenerateProposal();

  const form = useForm<ProposalFormSchema>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      titulo_proposta: '',
      tipo_proposta: '',
      descricao_objetivo: '',
      prazo_estimado: '',
      modalidade_entrega: '',
      servicos_incluidos: [],
      requisitos_especiais: '',
      orcamento_estimado: '',
      concorrentes_considerados: '',
      urgencia_projeto: '',
      tomador_decisao: '',
      contexto_adicional: '',
    },
    mode: 'onChange',
  });

  const tabs = [
    { id: 'basic', title: 'Informações Básicas', component: BasicInfoTab },
    { id: 'scope', title: 'Escopo de Serviços', component: ScopeTab },
    { id: 'commercial', title: 'Contexto Comercial', component: CommercialTab }
  ];

  const currentTabData = form.watch();
  const currentTabProgress = calculateTabProgress(currentTab, currentTabData);
  const isCurrentTabValid = validateTab(currentTab, currentTabData).isValid;

  const handleNextTab = async () => {
    const isValid = await form.trigger();
    if (isValid && currentTab < tabs.length - 1) {
      setCurrentTab(currentTab + 1);
    }
  };

  const handlePrevTab = () => {
    if (currentTab > 0) {
      setCurrentTab(currentTab - 1);
    }
  };

  const handleSubmit = async (data: ProposalFormSchema) => {
    try {
      // Mostrar toast de início do processo
      addToast(toast.info(
        'Gerando proposta',
        'Enviando dados para nossa IA especializada...',
        { duration: 3000 }
      ));

      const proposalData = {
        ...data,
        clientId: client.id,
      };

      const result = await generateProposal.mutateAsync(proposalData);

      // Mostrar toast de sucesso
      addToast(toast.success(
        'Proposta gerada com sucesso!',
        'A IA criou uma proposta personalizada para seu cliente.',
        { duration: 5000 }
      ));

      // Redirecionar para a lista de propostas
      router.push('/propostas');

    } catch (error: any) {
      console.error('Erro ao gerar proposta:', error);
      
      // Mostrar toast de erro
      addToast(toast.error(
        'Erro ao gerar proposta',
        error.message || 'Tente novamente em alguns instantes.',
        { duration: 5000 }
      ));
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const isFormComplete = tabs.every((_, index) => validateTab(index, currentTabData).isValid);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-accent/20 pb-4">
        <h1 className="text-2xl font-bold text-seasalt">Nova Proposta Comercial</h1>
        <p className="text-seasalt/70 mt-2">
          Preencha as informações para gerar uma proposta personalizada com IA
        </p>
      </div>

      {/* Progress */}
      <ProposalProgress currentTab={currentTab} currentProgress={currentTabProgress} />

      {/* Tabs Navigation */}
      <div className="flex space-x-1 bg-night p-1 rounded-lg border border-accent/20">
        {tabs.map((tab, index) => {
          const tabProgress = calculateTabProgress(index, currentTabData);
          const tabValid = validateTab(index, currentTabData).isValid;
          
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(index)}
              disabled={index > currentTab && !isCurrentTabValid}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentTab === index
                  ? 'bg-sgbus-green text-night'
                  : tabValid
                    ? 'text-seasalt hover:text-sgbus-green'
                    : 'text-seasalt/50'
              } ${
                index > currentTab && !isCurrentTabValid
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>{tab.title}</span>
                {tabValid && (
                  <svg className="w-4 h-4 text-sgbus-green" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Form */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="bg-night rounded-lg p-6 border border-accent/20">
          {currentTab === 0 && <BasicInfoTab form={form} />}
          {currentTab === 1 && <ScopeTab form={form} />}
          {currentTab === 2 && <CommercialTab form={form} />}
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePrevTab}
            disabled={currentTab === 0}
            className="px-6 py-2 border border-accent/20 text-seasalt/70 rounded-lg hover:border-accent/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Voltar
          </button>

          <div className="flex space-x-3">
            {isFormComplete && (
              <button
                type="button"
                onClick={handlePreview}
                className="px-6 py-2 border border-sgbus-green text-sgbus-green rounded-lg hover:bg-sgbus-green/10"
              >
                Visualizar
              </button>
            )}

            {currentTab < tabs.length - 1 ? (
              <button
                type="button"
                onClick={handleNextTab}
                disabled={!isCurrentTabValid}
                className="px-6 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isFormComplete || generateProposal.isPending}
                className="px-6 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {generateProposal.isPending && (
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-night" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>
                  {generateProposal.isPending ? 'Gerando...' : 'Gerar Proposta'}
                </span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-night rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-accent/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-seasalt">Prévia da Proposta</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-seasalt/50 hover:text-seasalt"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 text-seasalt">
              <div>
                <h4 className="font-medium text-sgbus-green">Informações Básicas</h4>
                <p><strong>Título:</strong> {currentTabData.titulo_proposta}</p>
                <p><strong>Tipo:</strong> {currentTabData.tipo_proposta}</p>
                <p><strong>Prazo:</strong> {currentTabData.prazo_estimado}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sgbus-green">Escopo</h4>
                <p><strong>Modalidade:</strong> {currentTabData.modalidade_entrega}</p>
                <p><strong>Serviços:</strong> {currentTabData.servicos_incluidos?.length || 0} selecionados</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sgbus-green">Contexto Comercial</h4>
                <p><strong>Urgência:</strong> {currentTabData.urgencia_projeto}</p>
                <p><strong>Tomador de Decisão:</strong> {currentTabData.tomador_decisao}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 