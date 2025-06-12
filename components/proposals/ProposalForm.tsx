'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react';

import { proposalFormSchema, type ProposalFormSchema } from '@/lib/proposals/formSchema';
import { 
  validateProposalFormWithNavigation, 
  executeProposalAutoNavigation,
  getProposalValidationErrorSummary,
  type ProposalFormValidationWithNavigationResult 
} from '@/lib/proposals/proposalFormValidation';
import { useGenerateProposal } from '@/hooks/use-proposals';
import { useToast, toast } from '@/components/ui/toast';
import { validateTab, calculateTabProgress } from '@/lib/proposals/tabValidation';

import { BasicInfoTab } from './tabs/BasicInfoTab';
import { ScopeTab } from './tabs/ScopeTab';
import { CommercialTab } from './tabs/CommercialTab';

interface ProposalFormProps {
  client: {
    id: string;
    name: string;
    industry: string;
    richnessScore: number;
  };
}

export function ProposalForm({ client }: ProposalFormProps) {
  const [currentTab, setCurrentTab] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ProposalFormValidationWithNavigationResult | null>(null);
  const router = useRouter();
  const { addToast } = useToast();
  
  // Hook para gerar proposta via IA
  const generateProposal = useGenerateProposal();

  const form = useForm<ProposalFormSchema>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      titulo_da_proposta: '',
      tipo_de_proposta: '',
      nome_da_contratada: '',
      membros_da_equipe: '',
      modalidade_entrega: '',
      servicos_incluidos: [],
      requisitos_especiais: '',
      orcamento_estimado: '',
      forma_prazo_pagamento: '',
      urgencia_do_projeto: '',
      tomador_de_decisao: '',
      resumo_dor_problema_cliente: '',
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

  const handleNextTab = async () => {
    if (currentTab < tabs.length - 1) {
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
      // VALIDAÇÃO INTELIGENTE - Validar formulário completo com navegação
      console.log('🔍 handleSubmit: Iniciando validação inteligente...');
      const validationResult = validateProposalFormWithNavigation(data);
      
      if (!validationResult.isValid) {
        console.log('❌ handleSubmit: Formulário inválido, navegando para erro...');
        
        // Armazenar erros para indicadores visuais
        setValidationErrors(validationResult);
        
        // Navegar automaticamente para a primeira aba com erro
        const navigationExecuted = executeProposalAutoNavigation(
          validationResult, 
          setCurrentTab
        );
        
        // Mostrar toast com resumo dos erros
        const errorSummary = getProposalValidationErrorSummary({
          isValid: validationResult.isValid,
          errors: validationResult.errors,
          firstErrorTab: validationResult.errorTab,
          totalErrors: validationResult.totalErrors,
        });
        
        addToast(toast.error(
          'Campos obrigatórios não preenchidos',
          errorSummary.summary || `${validationResult.totalErrors} erro(s) encontrado(s)`,
          { duration: 6000 }
        ));
        
        console.log(`🎯 handleSubmit: Navegação automática ${navigationExecuted ? 'executada' : 'falhou'}`);
        return; // Parar execução se houver erros
      }
      
      console.log('✅ handleSubmit: Formulário válido, prosseguindo...');
      
      // Limpar erros de validação
      setValidationErrors(null);
      
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

      // Mostrar toast de sucesso com redirecionamento
      addToast(toast.success(
        'Proposta gerada com sucesso!',
        'Redirecionando para visualização...',
        { duration: 3000 }
      ));

      // Redirecionar para a proposta criada (não para lista)
      router.push(`/propostas/${result.proposal.id}`);

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
      {/* Tabs Navigation */}
      <div className="flex space-x-1 bg-night/50 p-1 rounded-lg">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(index)}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              currentTab === index
                ? 'bg-sgbus-green text-night'
                : 'text-seasalt/70 hover:text-seasalt hover:bg-accent/20'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentTab === index ? 'bg-night text-sgbus-green' : 'bg-accent/20'
              }`}>
                {index + 1}
              </span>
              <span>{tab.title}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-accent/20 rounded-full h-2">
        <div
          className="bg-sgbus-green h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentTab + 1) / tabs.length) * 100}%` }}
        />
      </div>

      {/* Tab Content */}
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
                className="px-6 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90"
              >
                Próximo
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isFormComplete || generateProposal.isPending}
                className="px-6 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 min-w-[140px]"
              >
                {generateProposal.isPending && (
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-night" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>
                  {generateProposal.isPending ? 'Processando...' : 'Gerar Proposta'}
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
                <p><strong>Título:</strong> {currentTabData.titulo_da_proposta}</p>
                <p><strong>Tipo:</strong> {currentTabData.tipo_de_proposta}</p>
                <p><strong>Contratada:</strong> {currentTabData.nome_da_contratada}</p>
                {currentTabData.membros_da_equipe && (
                  <p><strong>Equipe:</strong> {currentTabData.membros_da_equipe}</p>
                )}
              </div>
              
              <div>
                <h4 className="font-medium text-sgbus-green">Escopo</h4>
                <p><strong>Modalidade:</strong> {currentTabData.modalidade_entrega}</p>
                <p><strong>Serviços:</strong> {currentTabData.servicos_incluidos?.length || 0} selecionados</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sgbus-green">Contexto Comercial</h4>
                <p><strong>Orçamento:</strong> {currentTabData.orcamento_estimado}</p>
                <p><strong>Urgência:</strong> {currentTabData.urgencia_do_projeto}</p>
                <p><strong>Tomador de Decisão:</strong> {currentTabData.tomador_de_decisao}</p>
                <p><strong>Problema Identificado:</strong> {currentTabData.resumo_dor_problema_cliente}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 