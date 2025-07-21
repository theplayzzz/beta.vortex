'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { usePlanning } from '@/lib/react-query/hooks/usePlannings';
import { queryKeys } from '@/lib/react-query/queryKeys';
import { PlanningDetails } from '@/components/planning';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';

export default function PlanejamentoPage() {
  const params = useParams();
  const planningId = params?.id as string;
  const queryClient = useQueryClient();

  const { 
    data: planning, 
    isLoading, 
    error,
    refetch 
  } = usePlanning(planningId);
  
  // ✅ CORREÇÃO: Invalidar cache e forçar refetch ao navegar entre páginas
  useEffect(() => {
    if (planningId) {
      console.log(`🔄 Invalidando cache e forçando refetch para planejamento ${planningId}`);
      
      // Invalidar cache específico deste planejamento
      queryClient.invalidateQueries({
        queryKey: queryKeys.plannings.detail(planningId)
      });
      
      // Forçar refetch para garantir dados atualizados
      refetch();
    }
  }, [planningId, queryClient, refetch]);

  // Loading state
  if (isLoading) {
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
              <div className="h-8 bg-eerie-black rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-eerie-black rounded w-48 animate-pulse mt-2"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-eerie-black rounded-lg border border-accent/20 p-12 text-center">
          <Loader2 className="h-12 w-12 text-sgbus-green mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-seasalt mb-2">
            Carregando Planejamento...
          </h3>
          <p className="text-seasalt/70">
            Buscando os dados do planejamento
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
              <p className="text-periwinkle mt-2">Falha ao buscar dados do planejamento</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Não foi possível carregar o planejamento
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
            O planejamento com ID &quot;{planningId}&quot; não existe ou você não tem permissão para visualizá-lo.
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

  // Success state - render planning details
  return (
    <div className="container mx-auto px-4 py-8">
      <PlanningDetails planning={planning} isLoading={isLoading} />
    </div>
  );
} 