'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Send, Eye } from 'lucide-react';
import { proposalFormSchema, ProposalFormSchema, calculateTabProgress, validateTab } from '@/lib/proposals/formSchema';
import { Client } from '@/lib/proposals/types';
import { ProposalProgress } from './ProposalProgress';
import { BasicInfoTab } from './tabs/BasicInfoTab';
import { ScopeTab } from './tabs/ScopeTab';
import { CommercialTab } from './tabs/CommercialTab';
import { ClientHeader } from '@/components/planning/ClientHeader';

interface ProposalFormProps {
  client: Client;
  onBack: () => void;
}

export function ProposalForm({ client, onBack }: ProposalFormProps) {
  const [currentTab, setCurrentTab] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<ProposalFormSchema>({
    resolver: zodResolver(proposalFormSchema),
    mode: 'onChange',
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
      contexto_adicional: ''
    }
  });

  const { watch, trigger, formState: { isValid } } = form;
  const formData = watch();

  // Calcular progresso geral
  const [overallProgress, setOverallProgress] = useState(0);
  useEffect(() => {
    const tab0Progress = calculateTabProgress(0, formData);
    const tab1Progress = calculateTabProgress(1, formData);
    const tab2Progress = calculateTabProgress(2, formData);
    const total = Math.round((tab0Progress + tab1Progress + tab2Progress) / 3);
    setOverallProgress(total);
  }, [formData]);

  const tabs = [
    { 
      id: 'basic', 
      title: 'Informações Básicas', 
      component: <BasicInfoTab form={form} />,
      isValid: () => validateTab(0, formData).isValid
    },
    { 
      id: 'scope', 
      title: 'Escopo de Serviços', 
      component: <ScopeTab form={form} />,
      isValid: () => validateTab(1, formData).isValid
    },
    { 
      id: 'commercial', 
      title: 'Contexto Comercial', 
      component: <CommercialTab form={form} />,
      isValid: () => validateTab(2, formData).isValid
    }
  ];

  const handleNext = async () => {
    // Trigger validação da aba atual
    const fieldsToValidate = getFieldsForTab(currentTab);
    const currentTabValid = await trigger(fieldsToValidate);
    
    if (currentTabValid && currentTab < tabs.length - 1) {
      setCurrentTab(currentTab + 1);
    }
  };

  const handlePrevious = () => {
    if (currentTab > 0) {
      setCurrentTab(currentTab - 1);
    }
  };

  const handleTabClick = async (tabIndex: number) => {
    // Permite navegar para abas anteriores sempre
    if (tabIndex <= currentTab) {
      setCurrentTab(tabIndex);
    } else {
      // Para avançar, valida a aba atual
      const fieldsToValidate = getFieldsForTab(currentTab);
      const currentTabValid = await trigger(fieldsToValidate);
      if (currentTabValid) {
        setCurrentTab(tabIndex);
      }
    }
  };

  // Função para obter os campos de cada aba
  const getFieldsForTab = (tabIndex: number): (keyof ProposalFormSchema)[] => {
    switch (tabIndex) {
      case 0:
        return ['titulo_proposta', 'tipo_proposta', 'descricao_objetivo', 'prazo_estimado'];
      case 1:
        return ['modalidade_entrega', 'servicos_incluidos', 'requisitos_especiais'];
      case 2:
        return ['orcamento_estimado', 'concorrentes_considerados', 'urgencia_projeto', 'tomador_decisao', 'contexto_adicional'];
      default:
        return [];
    }
  };

  const onSubmit = async (data: ProposalFormSchema) => {
    setIsSubmitting(true);
    try {
      console.log('Proposta a ser enviada:', { client, formData: data });
      // TODO: Implementar envio para API na Fase 3
      alert('Proposta criada com sucesso! (Mock - será implementado na Fase 3)');
    } catch (error) {
      console.error('Erro ao criar proposta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const PreviewModal = () => {
    if (!showPreview) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-eerie-black rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-accent/20">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-seasalt">Preview da Proposta</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-seasalt/70 hover:text-seasalt"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-seasalt mb-2">Cliente</h4>
                <p className="text-seasalt/70">{client.name}</p>
                <p className="text-seasalt/70 text-sm">{client.industry}</p>
              </div>
              <div>
                <h4 className="font-semibold text-seasalt mb-2">Título</h4>
                <p className="text-seasalt/70">{formData.titulo_proposta || 'Não definido'}</p>
              </div>
              <div>
                <h4 className="font-semibold text-seasalt mb-2">Tipo</h4>
                <p className="text-seasalt/70">{formData.tipo_proposta || 'Não definido'}</p>
              </div>
              <div>
                <h4 className="font-semibold text-seasalt mb-2">Modalidade</h4>
                <p className="text-seasalt/70">{formData.modalidade_entrega || 'Não definido'}</p>
              </div>
              <div>
                <h4 className="font-semibold text-seasalt mb-2">Serviços</h4>
                <p className="text-seasalt/70">{formData.servicos_incluidos?.length || 0} selecionados</p>
              </div>
              <div>
                <h4 className="font-semibold text-seasalt mb-2">Urgência</h4>
                <p className="text-seasalt/70">{formData.urgencia_projeto || 'Não definido'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header com informações do cliente */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 text-seasalt/70 hover:text-seasalt transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-seasalt">Nova Proposta Comercial</h1>
            <p className="text-seasalt/70">
              Complete as informações abaixo para gerar sua proposta
            </p>
          </div>
        </div>
        
        <ClientHeader client={client} />
      </div>

      {/* Progress indicator */}
      <ProposalProgress currentProgress={overallProgress} currentTab={currentTab} />

      {/* Navegação por abas */}
      <div className="flex mb-6 bg-eerie-black rounded-lg p-1 border border-accent/20">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(index)}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              index === currentTab
                ? 'bg-sgbus-green text-night'
                : index < currentTab
                  ? 'text-seasalt hover:bg-white/5'
                  : 'text-seasalt/50'
            }`}
          >
            {tab.title}
            {index < currentTab && (
              <span className="ml-2 text-sgbus-green">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo da aba atual */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="bg-eerie-black rounded-lg p-6 border border-accent/20 mb-6">
          {tabs[currentTab].component}
        </div>

        {/* Navegação entre abas */}
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            {currentTab > 0 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="flex items-center gap-2 px-4 py-2 text-seasalt/70 hover:text-seasalt transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 bg-night hover:bg-night/80 text-seasalt border border-accent/20 rounded-lg transition-colors"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>

            {currentTab < tabs.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-sgbus-green hover:bg-sgbus-green/90 text-night rounded-lg font-medium transition-colors"
              >
                Próximo
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="flex items-center gap-2 px-6 py-2 bg-sgbus-green hover:bg-sgbus-green/90 disabled:bg-sgbus-green/50 text-night rounded-lg font-medium transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-night border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Criar Proposta
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      <PreviewModal />
    </div>
  );
} 