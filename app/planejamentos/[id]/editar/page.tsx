'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePlanning } from '@/lib/react-query/hooks/usePlannings';
import { useUpdatePlanning } from '@/lib/react-query/hooks/usePlanningMutations';
import { PlanningForm } from '@/components/planning';
import { PlanningFormData } from '@/lib/planning/formSchema';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Loader2, Save } from 'lucide-react';
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

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/planejamentos/${planningId}`}
            className="p-2 text-seasalt/70 hover:text-seasalt transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="h-8 bg-eerie-black rounded w-64 animate-pulse"></div>
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
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/planejamentos"
            className="p-2 text-seasalt/70 hover:text-seasalt transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-seasalt">Erro ao Carregar</h1>
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
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/planejamentos"
            className="p-2 text-seasalt/70 hover:text-seasalt transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-seasalt">Planejamento Não Encontrado</h1>
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
            O planejamento com ID "{planningId}" não existe ou você não tem permissão para editá-lo.
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
    if (planning.formDataJSON) {
      return planning.formDataJSON;
    }

    // Fallback para planejamentos antigos sem formDataJSON
    // Criar uma estrutura válida com valores padrão
    return {
      informacoes_basicas: {
        titulo_planejamento: planning.title || '',
        descricao_objetivo: planning.description || '',
        setor: planning.Client.industry as any || 'Outro',
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
  };

  // Usar useEffect para pré-preencher o formulário quando estivermos em modo de edição
  const initialFormData = convertToFormData(planning);

  return (
    <div className="p-6 space-y-6">
      {/* Header da Página */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/planejamentos/${planningId}`}
            className="p-2 text-seasalt/70 hover:text-seasalt transition-colors rounded-lg"
            title="Voltar para visualização"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-seasalt">Editar Planejamento</h1>
            <p className="text-seasalt/70 mt-1">
              {planning.title} • Cliente: {planning.Client.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/planejamentos/${planningId}`}
            className="bg-eerie-black hover:bg-eerie-black/80 text-seasalt px-4 py-2 rounded-lg font-medium transition-colors border border-accent/20"
          >
            Cancelar
          </Link>
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
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
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
  // Para modo de edição, vamos simular localStorage com dados iniciais
  const draftKey = `planning-form-draft-${client.id}`;
  
  // Salvar dados iniciais no localStorage se não existirem
  React.useEffect(() => {
    const existingDraft = localStorage.getItem(draftKey);
    if (!existingDraft && initialData) {
      localStorage.setItem(draftKey, JSON.stringify({
        client,
        formData: initialData,
        savedAt: new Date().toISOString(),
        sessionId: `edit_${Date.now()}`,
      }));
    }
  }, [client, initialData, draftKey]);

  return (
    <PlanningForm
      client={client}
      onSubmit={onSubmit}
      onSaveDraft={onSaveDraft}
    />
  );
} 