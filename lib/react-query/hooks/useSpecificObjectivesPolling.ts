import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import type { PlanningWithClient } from './usePlannings';

interface PollingResult {
  data: PlanningWithClient | undefined;
  isPolling: boolean;
  hasTimedOut: boolean;
  error: Error | null;
  timeLeft: number; // Segundos restantes
}

/**
 * Hook para polling condicional de objetivos específicos
 * Inicia polling apenas quando:
 * 1. Planejamento carregado
 * 2. specificObjectives está vazio/null
 * 
 * Para polling quando:
 * 1. Dados chegam (specificObjectives preenchido)
 * 2. Timeout de 90s é atingido
 */
export function useSpecificObjectivesPolling(
  planningId: string, 
  initialData?: PlanningWithClient
): PollingResult {
  const queryClient = useQueryClient();
  const [shouldPoll, setShouldPoll] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90); // 90 segundos
  const [startTime, setStartTime] = useState<number | null>(null);

  // ✅ DESABILITADO - Polling movido para PlanningDetails para evitar loops
  useEffect(() => {
    console.log(`🚫 [Polling ${planningId}] DESABILITADO - Polling agora é feito automaticamente no PlanningDetails`);
    
    // Garantir que não está fazendo polling
    if (shouldPoll) {
      setShouldPoll(false);
      setStartTime(null);
    }
  }, [planningId]);

  // Query de polling
  const pollingQuery = useQuery({
    queryKey: ['planning-objectives', planningId],
    queryFn: async (): Promise<PlanningWithClient> => {
      console.log(`📡 [Polling ${planningId}] Buscando atualização de objetivos específicos...`);
      
      const response = await fetch(`/api/plannings/${planningId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch planning objectives');
      }
      
      const data: PlanningWithClient = await response.json();
      console.log(`📥 [Polling ${planningId}] Resposta recebida:`, {
        hasObjectives: !!data.specificObjectives,
        objectivesLength: data.specificObjectives?.length || 0
      });
      
      return data;
    },
    enabled: shouldPoll,
    refetchInterval: shouldPoll ? 3000 : false, // 3 segundos
    refetchIntervalInBackground: false,
    retry: false, // Não retry automático para polling
    staleTime: 0, // Sempre considerar stale para forçar refetch
  });

  // Verificar se dados chegaram e parar polling
  useEffect(() => {
    if (pollingQuery.data?.specificObjectives && shouldPoll) {
      console.log(`✅ [Polling ${planningId}] Objetivos específicos recebidos - parando polling`);
      setShouldPoll(false);
      setStartTime(null);
      
      // ✅ ATUALIZAR STATUS PARA AI_BACKLOG_VISIBLE
      const updateStatus = async () => {
        try {
          console.log(`🔄 [Polling ${planningId}] Atualizando status para AI_BACKLOG_VISIBLE...`);
          const response = await fetch(`/api/plannings/${planningId}/update-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'AI_BACKLOG_VISIBLE' }),
          });
          
          if (response.ok) {
            console.log(`✅ [Polling ${planningId}] Status atualizado para AI_BACKLOG_VISIBLE`);
            
            // Atualizar cache com novo status
            const updatedData = { ...pollingQuery.data, status: 'AI_BACKLOG_VISIBLE' };
            queryClient.setQueryData(
              queryKeys.plannings.detail(planningId),
              updatedData
            );
          } else {
            console.warn(`⚠️ [Polling ${planningId}] Falha ao atualizar status:`, response.status);
          }
        } catch (error) {
          console.error(`❌ [Polling ${planningId}] Erro ao atualizar status:`, error);
        }
      };
      
      updateStatus();
    }
  }, [pollingQuery.data?.specificObjectives, shouldPoll, planningId, queryClient]);

  // Countdown timer e timeout
  useEffect(() => {
    if (!shouldPoll || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 90 - elapsed);
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        console.log(`⏰ [Polling ${planningId}] Timeout de 90s atingido - parando polling`);
        setShouldPoll(false);
        setHasTimedOut(true);
        setStartTime(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [shouldPoll, startTime, planningId]);

  // Reset timeout quando dados chegam
  useEffect(() => {
    if (pollingQuery.data?.specificObjectives && hasTimedOut) {
      setHasTimedOut(false);
    }
  }, [pollingQuery.data?.specificObjectives, hasTimedOut]);

  return {
    data: pollingQuery.data,
    isPolling: shouldPoll,
    hasTimedOut,
    error: pollingQuery.error,
    timeLeft,
  };
} 