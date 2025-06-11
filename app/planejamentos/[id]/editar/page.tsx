'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePlanning } from '@/lib/react-query/hooks/usePlannings';
import { useUpdatePlanning } from '@/lib/react-query/hooks/usePlanningMutations';
import { PlanningForm } from '@/components/planning';
import { PlanningFormData } from '@/lib/planning/formSchema';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Loader2, Save, X } from 'lucide-react';
import { useState } from 'react';
import React from 'react';

export default function EditarPlanejamentoPage() {
  const params = useParams();
  const router = useRouter();
  const planningId = params?.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    data: planning, 
    isLoading, 
    error 
  } = usePlanning(planningId);

  const updatePlanningMutation = useUpdatePlanning();

  const handleCancel = () => {
    router.push(`/planejamentos/${planningId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href={`/planejamentos/${planningId}`}
              className="p-2 text-seasalt/70 hover:text-seasalt transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="h-8 bg-eerie-black rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-eerie-black rounded w-48 animate-pulse mt-2"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-eerie-black rounded-lg border border-accent/20 p-12 text-center">
          <Loader2 className="h-12 w-12 text-sgbus-green mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-seasalt mb-2">
            Carregando Dados do Planejamento...
          </h3>
          <p className="text-seasalt/70">
            Preparando formulário para edição
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/planejamentos"
              className="p-2 text-seasalt/70 hover:text-seasalt transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-seasalt">Erro ao Carregar</h1>
              <p className="text-periwinkle mt-2">Falha ao buscar dados para edição</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Não foi possível carregar o planejamento para edição
          </h3>
          <p className="text-seasalt/70 mb-6">
            {error?.message || 'Erro desconhecido ao buscar os dados'}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/planejamentos"
              className="bg-eerie-black hover:bg-eerie-black/80 text-seasalt px-6 py-3 rounded-lg font-medium transition-colors border border-accent/20"
            >
              Voltar para Lista
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!planning) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/planejamentos"
              className="p-2 text-seasalt/70 hover:text-seasalt transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-seasalt">Planejamento Não Encontrado</h1>
              <p className="text-periwinkle mt-2">O planejamento solicitado não existe</p>
            </div>
          </div>
        </div>
        
        <div className="bg-eerie-black rounded-lg border border-accent/20 p-12 text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-seasalt mb-2">
            Planejamento não encontrado
          </h3>
          <p className="text-seasalt/70 mb-6">
            O planejamento com ID &quot;{planningId}&quot; não existe ou você não tem permissão para editá-lo.
          </p>
          <Link
            href="/planejamentos"
            className="bg-sgbus-green hover:bg-sgbus-green/90 text-night px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Voltar para Lista
          </Link>
        </div>
      </div>
    );
  }

  // Handle form submission
  const handleFormSubmit = async (formData: PlanningFormData) => {
    try {
      setIsSubmitting(true);
      
      console.log('📤 Atualizando planejamento:', { planningId, formData });

      // Atualizar planejamento no banco
      const updatedPlanning = await updatePlanningMutation.mutateAsync({
        id: planningId,
        data: {
          title: formData.informacoes_basicas?.titulo_planejamento || planning.title,
          description: formData.informacoes_basicas?.descricao_objetivo || planning.description,
          formDataJSON: formData,
        }
      });

      console.log('✅ Planejamento atualizado:', updatedPlanning);

      // Redirecionar para a visualização do planejamento
      router.push(`/planejamentos/${planningId}`);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar planejamento:', error);
      alert('Erro ao atualizar planejamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = (formData: PlanningFormData) => {
    try {
      // Salvar draft no localStorage com key específica do planejamento
      const draftKey = `planning-edit-draft-${planningId}`;
      localStorage.setItem(draftKey, JSON.stringify({
        planningId,
        formData,
        savedAt: new Date().toISOString(),
      }));

      console.log('💾 Draft de edição salvo automaticamente');
    } catch (error) {
      console.error('❌ Erro ao salvar draft de edição:', error);
    }
  };

  // Converter dados existentes para o formato do formulário
  const convertToFormData = (planning: any): PlanningFormData => {
    console.log('🔄 Convertendo dados do planejamento para formulário:', planning);

    // Se não tem formDataJSON, criar estrutura padrão
    if (!planning.formDataJSON) {
      console.log('⚠️ Planejamento sem formDataJSON, criando estrutura padrão');
      return {
        informacoes_basicas: {
          titulo_planejamento: planning.title || '',
          descricao_objetivo: planning.description || '',
          setor: (planning.Client.industry as any) || 'Outro',
        },
        detalhes_do_setor: {},
        marketing: {
          maturidade_marketing: 'Não fazemos marketing' as any,
          meta_marketing: '',
        },
        comercial: {
          maturidade_comercial: 'Não temos processo comercial estruturado' as any,
          meta_comercial: '',
        },
      };
    }

    const formDataJSON = planning.formDataJSON;
    
    // Verificar se tem estrutura aninhada (form_data)
    if (formDataJSON.form_data) {
      console.log('📦 Estrutura aninhada detectada, extraindo dados de form_data');
      const { form_data } = formDataJSON;
      
      return {
        informacoes_basicas: form_data.informacoes_basicas || {
          titulo_planejamento: planning.title || '',
          descricao_objetivo: planning.description || '',
          setor: (planning.Client.industry as any) || 'Outro',
        },
        detalhes_do_setor: form_data.detalhes_do_setor || {},
        marketing: form_data.marketing || {
          maturidade_marketing: 'Não fazemos marketing' as any,
          meta_marketing: '',
        },
        comercial: form_data.comercial || {
          maturidade_comercial: 'Não temos processo comercial estruturado' as any,
          meta_comercial: '',
        },
      };
    }
    
    // Estrutura direta (planejamentos mais antigos)
    console.log('📋 Estrutura direta detectada, usando dados como estão');
    return {
      informacoes_basicas: formDataJSON.informacoes_basicas || {
        titulo_planejamento: planning.title || '',
        descricao_objetivo: planning.description || '',
        setor: (planning.Client.industry as any) || 'Outro',
      },
      detalhes_do_setor: formDataJSON.detalhes_do_setor || {},
      marketing: formDataJSON.marketing || {
        maturidade_marketing: 'Não fazemos marketing' as any,
        meta_marketing: '',
      },
      comercial: formDataJSON.comercial || {
        maturidade_comercial: 'Não temos processo comercial estruturado' as any,
        meta_comercial: '',
      },
    };
  };

  // Usar useEffect para pré-preencher o formulário quando estivermos em modo de edição
  const initialFormData = convertToFormData(planning);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href={`/planejamentos/${planningId}`}
            className="p-2 text-seasalt/70 hover:text-seasalt transition-colors rounded-lg"
            title="Voltar para visualização"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-seasalt">Editar Planejamento</h1>
            <p className="text-periwinkle mt-2">
              {planning.title} • Cliente: {planning.Client.name}
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

      {/* Loading overlay durante submissão */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-night/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-eerie-black rounded-lg p-8 text-center border border-accent/20">
            <div className="w-12 h-12 border-4 border-sgbus-green/20 border-t-sgbus-green rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-seasalt mb-2">
              Salvando Alterações...
            </h3>
            <p className="text-seasalt/70 text-sm">
              Atualizando os dados do planejamento
            </p>
          </div>
        </div>
      )}

      {/* Info sobre edição */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-8">
        <div className="flex items-center gap-3">
          <Save className="h-5 w-5 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-blue-400 font-medium text-sm">Modo de Edição</p>
            <p className="text-seasalt/70 text-sm">
              Você está editando um planejamento existente. 
              {planning.formDataJSON 
                ? ' Os dados atuais já foram carregados no formulário.' 
                : ' Este planejamento não possui dados detalhados - preencha as informações.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Formulário principal */}
      <div className={isSubmitting ? 'pointer-events-none opacity-50' : ''}>
        <EditablePlanningForm 
          client={planning.Client}
          onSubmit={handleFormSubmit}
          onSaveDraft={handleSaveDraft}
          initialData={initialFormData}
        />
      </div>
    </div>
  );
}

// Componente wrapper para o formulário que permite dados iniciais
function EditablePlanningForm({ 
  client, 
  onSubmit, 
  onSaveDraft, 
  initialData 
}: {
  client: any;
  onSubmit: (data: PlanningFormData) => void;
  onSaveDraft: (data: PlanningFormData) => void;
  initialData: PlanningFormData;
}) {
  // Para modo de edição, forçar carregamento dos dados iniciais
  const draftKey = `planning-form-draft-${client.id}`;
  
  // Sempre salvar os dados iniciais no localStorage, sobrescrevendo qualquer draft
  React.useEffect(() => {
    console.log('💾 Forçando carregamento dos dados iniciais no localStorage:', initialData);
    
    // Criar a estrutura do draft com os dados iniciais
    const draftData = {
      client,
      formData: initialData,
      savedAt: new Date().toISOString(),
      sessionId: `edit_${Date.now()}`,
      isEditMode: true, // Flag para indicar modo de edição
    };
    
    // Sempre sobrescrever o localStorage com os dados atuais
    localStorage.setItem(draftKey, JSON.stringify(draftData));
    
    console.log('✅ Dados iniciais salvos no localStorage com chave:', draftKey);
  }, [client, initialData, draftKey]);

  return (
    <PlanningForm
      client={client}
      onSubmit={onSubmit}
      onSaveDraft={onSaveDraft}
    />
  );
} 