'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface GlobalRefinedPlanningListenerContextType {
  startGlobalListener: (planningId: string) => void;
  stopGlobalListener: (planningId: string) => void;
}

const GlobalRefinedPlanningListenerContext = createContext<GlobalRefinedPlanningListenerContextType | null>(null);

export function GlobalRefinedPlanningListenerProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const activeListenersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const checkCountersRef = useRef<Map<string, number>>(new Map());

  // Função para verificar se um planejamento foi atualizado pelo webhook
  const checkPlanningStatus = async (planningId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/plannings/${planningId}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const planning = await response.json();
      
      // ✅ VERIFICAR SE WEBHOOK PROCESSOU: scope foi preenchido
      if (planning.scope) {
        try {
          const parsed = JSON.parse(planning.scope);
          const tarefas = parsed.tarefas_refinadas || parsed.tasks || [];
          
          if (Array.isArray(tarefas) && tarefas.length > 0) {
            console.log(`✅ [GLOBAL_LISTENER] Webhook processado para ${planningId}! ${tarefas.length} tarefas encontradas`);
            
            // ✅ INVALIDAR CACHE REACT QUERY para forçar re-fetch
            queryClient.invalidateQueries({ 
              queryKey: ['planning', planningId],
              exact: false 
            });
            
            // ✅ BROADCAST custom event para componentes escutarem
            window.dispatchEvent(new CustomEvent('refinedPlanningUpdated', {
              detail: { planningId, tasks: tarefas }
            }));
            
            return true; // Processamento concluído
          }
        } catch (parseError) {
          console.warn(`⚠️ [GLOBAL_LISTENER] Erro ao parsear scope para ${planningId}:`, parseError);
        }
      }
      
      // ✅ AINDA PROCESSANDO
      const currentCount = checkCountersRef.current.get(planningId) || 0;
      checkCountersRef.current.set(planningId, currentCount + 1);
      
      console.log(`🔄 [GLOBAL_LISTENER] ${planningId} ainda processando... (check #${currentCount + 1})`);
      return false;
      
    } catch (error) {
      console.error(`❌ [GLOBAL_LISTENER] Erro ao verificar ${planningId}:`, error);
      return false;
    }
  };

  const startGlobalListener = (planningId: string) => {
    // ✅ Se já existe listener para este planejamento, não criar outro
    if (activeListenersRef.current.has(planningId)) {
      console.log(`⚠️ [GLOBAL_LISTENER] Listener já ativo para ${planningId}`);
      return;
    }

    console.log(`🚀 [GLOBAL_LISTENER] Iniciando escuta global para ${planningId}`);
    checkCountersRef.current.set(planningId, 0);

    const intervalId = setInterval(async () => {
      const isCompleted = await checkPlanningStatus(planningId);
      
      if (isCompleted) {
        console.log(`✅ [GLOBAL_LISTENER] Parando escuta para ${planningId} - processamento concluído`);
        stopGlobalListener(planningId);
      }
      
      // ✅ TIMEOUT SEGURO: Parar após 10 minutos (120 checks)
      const checkCount = checkCountersRef.current.get(planningId) || 0;
      if (checkCount >= 120) {
        console.log(`⏰ [GLOBAL_LISTENER] Timeout atingido para ${planningId} após 10 minutos`);
        stopGlobalListener(planningId);
      }
    }, 5000); // ✅ Check a cada 5 segundos

    activeListenersRef.current.set(planningId, intervalId);
  };

  const stopGlobalListener = (planningId: string) => {
    const intervalId = activeListenersRef.current.get(planningId);
    
    if (intervalId) {
      clearInterval(intervalId);
      activeListenersRef.current.delete(planningId);
      checkCountersRef.current.delete(planningId);
      console.log(`🛑 [GLOBAL_LISTENER] Listener parado para ${planningId}`);
    }
  };

  // ✅ CLEANUP ao desmontar componente
  useEffect(() => {
    return () => {
      console.log(`🧹 [GLOBAL_LISTENER] Limpando todos os listeners ativos`);
      activeListenersRef.current.forEach((intervalId) => {
        clearInterval(intervalId);
      });
      activeListenersRef.current.clear();
      checkCountersRef.current.clear();
    };
  }, []);

  const contextValue = {
    startGlobalListener,
    stopGlobalListener,
  };

  return (
    <GlobalRefinedPlanningListenerContext.Provider value={contextValue}>
      {children}
    </GlobalRefinedPlanningListenerContext.Provider>
  );
}

// Hook para usar o context
export function useGlobalRefinedPlanningListener(): GlobalRefinedPlanningListenerContextType {
  const context = useContext(GlobalRefinedPlanningListenerContext);
  if (!context) {
    throw new Error('useGlobalRefinedPlanningListener deve ser usado dentro de GlobalRefinedPlanningListenerProvider');
  }
  return context;
}