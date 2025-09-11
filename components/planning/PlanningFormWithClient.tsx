'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PlanningForm } from './PlanningForm';
import { Client, useClientFormContext } from './ClientFormContext';
import { PlanningFormData } from '@/lib/planning/formSchema';
import { 
  prepareFinalSubmissionPayload,
  initializeFormWithClient,
  validateClientForForm 
} from '@/lib/planning/clientContextMapping';
import { 
  validateFormWithNavigation, 
  executeAutoNavigation 
} from '@/lib/planning/formValidation';
import { useCreatePlanning } from '@/lib/react-query/hooks/usePlanningMutations';
import { generateUUID } from '@/lib/utils/uuid';
import { ArrowLeft, AlertTriangle, User, Building, BarChart3, Calendar } from 'lucide-react';
import { useToast, toast } from '@/components/ui/toast';

interface PlanningFormWithClientProps {
  client: Client;
  onBack?: () => void;
}

// Componente para informações do cliente
function ClientInfoSidebar({ client }: { client: Client }) {
  // Função para determinar cor da barra baseada no score (seguindo padrão do sistema)
  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-sgbus-green';
    if (score >= 50) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  // Função para determinar cor do texto baseada no score  
  const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-sgbus-green';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header da Sidebar */}
      <div className="bg-eerie-black rounded-lg p-6 border border-accent/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-sgbus-green/20 rounded-lg flex items-center justify-center">
            <User className="h-5 w-5 text-sgbus-green" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-seasalt">Informações Gerais</h2>
            <p className="text-seasalt/70 text-sm">Dados do cliente</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Nome do Cliente */}
          <div>
            <h3 className="font-medium text-seasalt text-sm mb-1">Nome</h3>
            <p className="text-seasalt/90 font-medium">{client.name}</p>
          </div>

          {/* Setor do Cliente */}
          <div>
            <h3 className="font-medium text-seasalt text-sm mb-1">Setor do Cliente</h3>
            <p className="text-seasalt/90">{client.industry}</p>
            {client.industry === "Outro" && client.businessDetails && (
              <p className="text-seasalt/70 text-xs mt-1 italic">
                {client.businessDetails}
              </p>
            )}
            <p className="text-periwinkle text-xs mt-1">
              O setor é definido no cadastro do cliente e não pode ser alterado aqui.
            </p>
          </div>

          {/* Score de Dados - ATUALIZADO com cores dinâmicas */}
          <div>
            <h3 className="font-medium text-seasalt text-sm mb-2">Score de Dados</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-night rounded-full h-2">
                <div 
                  className={`${getScoreBarColor(client.richnessScore)} rounded-full h-2 transition-all duration-300`}
                  style={{ width: `${client.richnessScore}%` }}
                />
              </div>
              <span className={`text-sm font-medium ${getScoreTextColor(client.richnessScore)}`}>
                {client.richnessScore}%
              </span>
            </div>
            <p className="text-seasalt/70 text-xs mt-1">
              Qualidade das informações do cliente
            </p>
          </div>

          {/* Data de Criação */}
          {client.createdAt && (
            <div>
              <h3 className="font-medium text-seasalt text-sm mb-1">Cliente desde</h3>
              <p className="text-seasalt/90 text-sm">
                {new Date(client.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlanningFormWithClient({ 
  client, 
  onBack 
}: PlanningFormWithClientProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const createPlanningMutation = useCreatePlanning();
  const [sessionId] = useState(() => generateUUID());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentTabRef = useRef<(tab: number) => void>(() => {});
  

  // Validar cliente antes de mostrar o formulário
  const clientValidation = validateClientForForm(client);

  // Se o cliente não é válido, mostrar erros
  if (!clientValidation.isValid) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-seasalt/70 hover:text-seasalt transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-seasalt">Erro na Validação do Cliente</h1>
            <p className="text-seasalt/70">
              O cliente selecionado possui problemas que impedem a criação do formulário
            </p>
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h3 className="text-lg font-semibold text-red-400">Problemas Encontrados</h3>
          </div>
          <ul className="space-y-2">
            {clientValidation.errors.map((error, index) => (
              <li key={index} className="text-red-300 text-sm">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const handleFormSubmit = async (formData: PlanningFormData) => {
    console.log('🚨 INÍCIO - PlanningFormWithClient.handleFormSubmit CHAMADO!');
    
    // ✅ ETAPA 1: VALIDAÇÃO PRÉVIA COM NAVEGAÇÃO AUTOMÁTICA
    console.log('🔍 Executando validação prévia...');
    const validationResult = validateFormWithNavigation(formData);
    
    if (!validationResult.isValid) {
      console.log('❌ Validação falhou, executando navegação automática...');
      
      // Executar navegação automática para erro
      const navigationSuccess = executeAutoNavigation(
        validationResult, 
        (tabIndex: number) => {
          if (currentTabRef.current) {
            currentTabRef.current(tabIndex);
          }
        }
      );
      
      // Mostrar toast explicativo
      addToast(toast.error(
        'Formulário incompleto',
        validationResult.errorTabName 
          ? `Há ${validationResult.totalErrors} erro(s) que precisam ser corrigidos. Navegando para "${validationResult.errorTabName}".`
          : `Há ${validationResult.totalErrors} erro(s) que precisam ser corrigidos.`,
        { duration: 6000 }
      ));
      
      console.log('🚫 Submissão cancelada devido a erros de validação');
      return; // Parar execução
    }
    
    console.log('✅ Validação prévia passou - formulário está válido');
    
    try {
      setIsSubmitting(true);
      
      console.log('📤 Formulário válido recebido, preparando submissão:', formData);

      // Preparar payload para submissão
      const submissionPayload = prepareFinalSubmissionPayload(
        client,
        formData,
        sessionId
      );

      console.log('📤 Enviando planejamento:', submissionPayload);

      // Mostrar toast de processo iniciado
      addToast(toast.info(
        'Salvando planejamento...',
        'Processando dados no sistema'
      ));

      // ✅ AÇÃO 1: SALVAR NO BANCO (PRIORITÁRIA - ÚNICA AÇÃO QUE BLOQUEIA O FLUXO)
      const createdPlanning = await createPlanningMutation.mutateAsync({
        title: submissionPayload.title,
        description: submissionPayload.description,
        clientId: submissionPayload.clientId,
        formDataJSON: submissionPayload.formDataJSON,
        clientSnapshot: submissionPayload.clientSnapshot,
      });

      console.log('✅ Planejamento criado:', createdPlanning);

      // ✅ AÇÃO 2: WEBHOOK FIRE-AND-FORGET (TOTALMENTE INDEPENDENTE)
      // O webhook é disparado automaticamente pela API de forma assíncrona
      // Não afeta o fluxo do usuário nem o redirecionamento
      console.log('📡 Webhook disparado automaticamente em background pela API');

      // Limpar localStorage após sucesso
      localStorage.removeItem(`planning-form-draft-${client.id}`);

      // ✅ SUCESSO IMEDIATO + REDIRECIONAMENTO
      addToast(toast.success(
        'Planejamento criado com sucesso!',
        `"${createdPlanning.title}" foi salvo. A IA está processando os objetivos específicos automaticamente.`,
        {
          duration: 4000
        }
      ));

      // Redirecionar IMEDIATAMENTE para a aba de objetivos específicos
      console.log(`🔄 Redirecionando para objetivos específicos: ${createdPlanning.id}`);
      router.push(`/planejamentos/${createdPlanning.id}?tab=objectives`);
      
    } catch (error) {
      console.error('❌ Erro ao criar planejamento:', error);
      
      // ✅ APENAS ERRO DE BANCO AFETA O USUÁRIO (webhook é independente)
      addToast(toast.error(
        'Erro ao salvar planejamento',
        error instanceof Error ? error.message : 'Ocorreu um erro inesperado ao salvar no banco de dados. Tente novamente.',
        {
          duration: 10000,
          action: {
            label: 'Tentar novamente',
            onClick: () => handleFormSubmit(formData)
          }
        }
      ));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = (formData: PlanningFormData) => {
    try {
      // Salvar draft no localStorage com key específica do cliente
      const draftKey = `planning-form-draft-${client.id}`;
      localStorage.setItem(draftKey, JSON.stringify({
        client,
        formData,
        savedAt: new Date().toISOString(),
        sessionId,
      }));

      console.log('💾 Draft salvo automaticamente');
      
      // Mostrar toast de confirmação de salvamento
      addToast(toast.info(
        'Rascunho salvo',
        'Suas alterações foram salvas automaticamente',
        { duration: 3000 }
      ));
    } catch (error) {
      console.error('❌ Erro ao salvar draft:', error);
      
      addToast(toast.warning(
        'Falha ao salvar rascunho',
        'Suas alterações podem não estar sendo salvas automaticamente',
        { duration: 5000 }
      ));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header da Página */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-seasalt/70 hover:text-seasalt transition-colors rounded-lg"
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-seasalt">Novo Planejamento Estratégico</h1>
            <p className="text-seasalt/70 mt-1">
              Criando planejamento para {client.name}
            </p>
          </div>
        </div>
      </div>


      {/* Layout Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Sidebar do Cliente (1/5 da largura em telas grandes) */}
        <div className="xl:col-span-1">
          <ClientInfoSidebar client={client} />
        </div>

        {/* Área do Formulário (4/5 da largura em telas grandes) */}
        <div className="xl:col-span-4">
          {/* Loading overlay durante submissão */}
          {isSubmitting && (
            <div className="fixed inset-0 bg-night/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-eerie-black rounded-lg p-8 text-center border border-accent/20">
                <div className="w-12 h-12 border-4 border-sgbus-green/20 border-t-sgbus-green rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-seasalt mb-2">
                  Salvando Planejamento...
                </h3>
                <p className="text-seasalt/70 text-sm">
                  Processando dados no sistema
                </p>
                <p className="text-seasalt/50 text-xs mt-2">
                  Você será redirecionado automaticamente
                </p>
              </div>
            </div>
          )}

          {/* Formulário principal */}
          <div className={isSubmitting ? 'pointer-events-none opacity-50' : ''}>
            <PlanningForm
              client={client}
              onSubmit={handleFormSubmit}
              onSaveDraft={handleSaveDraft}
              onTabChangeRef={currentTabRef}
              isSubmitDisabled={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 