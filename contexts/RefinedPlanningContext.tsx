'use client';

import { createContext, useContext, useReducer, useMemo, ReactNode } from 'react';
import { usePollingWithRetry } from '@/hooks/usePollingWithRetry';
import { pollingLogger } from '../utils/pollingLogger';
import type { Planning, TarefaRefinada } from '@/types/planning';

// Tipos refinados conforme plano
type TabState = 'hidden' | 'generating' | 'ready' | 'new' | 'error';
type PollingState = 'idle' | 'active' | 'paused' | 'stopped' | 'error';

interface ScopeContent {
  tarefas_refinadas?: TarefaRefinada[];
  error?: string;
  timestamp?: string;
}

interface RefinedPlanningState {
  tabState: TabState;
  pollingState: PollingState;
  scopeContent: ScopeContent | null;
  error: Error | null;
  lastUpdated: Date | null;
  currentPlanningId: string | null;
  isViewed: boolean;
}

interface RefinedPlanningContextType {
  // Estado da aba
  tabState: TabState;
  setTabState: (state: TabState) => void;
  
  // Dados do scope
  scopeContent: ScopeContent | null;
  setScopeContent: (content: ScopeContent | null) => void;
  
  // Polling
  isPolling: boolean;
  startPolling: (planningId: string) => void;
  stopPolling: () => void;
  
  // Errors
  error: Error | null;
  clearError: () => void;
  
  // Actions
  handleApproval: (planningId: string, tasks: any[]) => Promise<void>;
  markAsViewed: () => void;
  
  // Estado geral
  pollingState: PollingState;
  lastUpdated: Date | null;
  isViewed: boolean;
}

// Actions do reducer
type RefinedPlanningAction =
  | { type: 'SET_TAB_STATE'; payload: TabState }
  | { type: 'SET_SCOPE_CONTENT'; payload: ScopeContent | null }
  | { type: 'SET_POLLING_STATE'; payload: PollingState }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_PLANNING_ID'; payload: string | null }
  | { type: 'MARK_AS_VIEWED' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_TIMESTAMP' }
  | { type: 'RESET_STATE' };

// Estado inicial
const initialState: RefinedPlanningState = {
  tabState: 'hidden',
  pollingState: 'idle',
  scopeContent: null,
  error: null,
  lastUpdated: null,
  currentPlanningId: null,
  isViewed: false
};

// Reducer
function refinedPlanningReducer(
  state: RefinedPlanningState,
  action: RefinedPlanningAction
): RefinedPlanningState {
  switch (action.type) {
    case 'SET_TAB_STATE':
      return {
        ...state,
        tabState: action.payload,
        lastUpdated: new Date()
      };
    
    case 'SET_SCOPE_CONTENT':
      return {
        ...state,
        scopeContent: action.payload,
        lastUpdated: new Date(),
        // Se há conteúdo novo e não foi visualizado, marcar como 'new'
        tabState: action.payload && !state.isViewed ? 'new' : state.tabState
      };
    
    case 'SET_POLLING_STATE':
      return {
        ...state,
        pollingState: action.payload,
        lastUpdated: new Date()
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        tabState: action.payload ? 'error' : state.tabState,
        lastUpdated: new Date()
      };
    
    case 'SET_PLANNING_ID':
      return {
        ...state,
        currentPlanningId: action.payload,
        // Reset state quando mudar de planejamento
        ...(action.payload !== state.currentPlanningId ? {
          tabState: 'hidden',
          scopeContent: null,
          error: null,
          isViewed: false
        } : {})
      };
    
    case 'MARK_AS_VIEWED':
      return {
        ...state,
        isViewed: true,
        tabState: state.tabState === 'new' ? 'ready' : state.tabState
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
        tabState: state.tabState === 'error' ? 'hidden' : state.tabState
      };
    
    case 'UPDATE_TIMESTAMP':
      return {
        ...state,
        lastUpdated: new Date()
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Context
const RefinedPlanningContext = createContext<RefinedPlanningContextType | null>(null);

// Configuração de polling otimizada
const pollingConfig = {
  interval: 3000, // 3s durante geração
  maxRetries: 3,
  timeout: 300000, // 5 minutos
  retryDelay: 1000 // 1s inicial
};

// Provider
export function RefinedPlanningProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(refinedPlanningReducer, initialState);
  
  // Função de polling
  const fetchPlanningData = async () => {
    if (!state.currentPlanningId) {
      throw new Error('Nenhum planejamento selecionado');
    }

    pollingLogger.logPollingEvent({
      planningId: state.currentPlanningId,
      action: 'start'
    });

    const response = await fetch(`/api/plannings/${state.currentPlanningId}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const planning: Planning = await response.json();
    
    // Verificar se há dados de scope válidos
    if (planning.scope) {
      try {
        const parsed = JSON.parse(planning.scope);
        if (parsed.tarefas_refinadas && Array.isArray(parsed.tarefas_refinadas)) {
          pollingLogger.logPollingEvent({
            planningId: state.currentPlanningId,
            action: 'success',
            data: { tasksFound: parsed.tarefas_refinadas.length }
          });
          
          // Atualizar scope content
          dispatch({ 
            type: 'SET_SCOPE_CONTENT', 
            payload: {
              tarefas_refinadas: parsed.tarefas_refinadas,
              timestamp: new Date().toISOString()
            }
          });
          
          // Parar polling - dados encontrados
          return { shouldStop: true, data: planning };
        }
      } catch (error) {
        console.error('Erro ao parsear scope:', error);
      }
    }

    return { shouldStop: false, data: planning };
  };

  // Hook de polling integrado
  const shouldPoll = state.pollingState === 'active' && state.tabState === 'generating';
  
  const { isPolling, start: startPollingHook, stop: stopPollingHook, error: pollingError } = usePollingWithRetry(
    fetchPlanningData,
    shouldPoll,
    pollingConfig
  );

  // Sync polling state
  const startPolling = (planningId: string) => {
    dispatch({ type: 'SET_PLANNING_ID', payload: planningId });
    dispatch({ type: 'SET_POLLING_STATE', payload: 'active' });
    dispatch({ type: 'SET_TAB_STATE', payload: 'generating' });
    
    pollingLogger.logPollingEvent({
      planningId,
      action: 'start',
      interval: pollingConfig.interval
    });
  };

  const stopPolling = () => {
    dispatch({ type: 'SET_POLLING_STATE', payload: 'stopped' });
    stopPollingHook();
    
    if (state.currentPlanningId) {
      pollingLogger.logPollingEvent({
        planningId: state.currentPlanningId,
        action: 'stop'
      });
    }
  };

  const setTabState = (tabState: TabState) => {
    dispatch({ type: 'SET_TAB_STATE', payload: tabState });
  };

  const setScopeContent = (content: ScopeContent | null) => {
    dispatch({ type: 'SET_SCOPE_CONTENT', payload: content });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const markAsViewed = () => {
    dispatch({ type: 'MARK_AS_VIEWED' });
  };

  const handleApproval = async (planningId: string, tasks: any[]) => {
    try {
      // Primeiro, verificar se já existe scope
      const response = await fetch(`/api/plannings/${planningId}`);
      if (response.ok) {
        const planning = await response.json();
        
        // Se já tem scope, limpar antes de enviar webhook
        if (planning.scope) {
          await fetch(`/api/planning/${planningId}/clear-scope`, {
            method: 'POST'
          });
        }
      }

      // Enviar aprovação
      const approvalResponse = await fetch(`/api/planning/${planningId}/approve-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedTasks: tasks }),
      });

      if (!approvalResponse.ok) {
        throw new Error('Erro ao aprovar tarefas');
      }

      // Iniciar processo de geração
      startPolling(planningId);
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido');
      dispatch({ type: 'SET_ERROR', payload: err });
      
      if (state.currentPlanningId) {
        pollingLogger.logPollingEvent({
          planningId: state.currentPlanningId,
          action: 'error',
          error: err
        });
      }
    }
  };

  // Sync polling error
  if (pollingError && !state.error) {
    dispatch({ type: 'SET_ERROR', payload: pollingError });
  }

  // Context value memoizado
  const contextValue = useMemo(() => ({
    tabState: state.tabState,
    setTabState,
    scopeContent: state.scopeContent,
    setScopeContent,
    isPolling,
    startPolling,
    stopPolling,
    error: state.error,
    clearError,
    handleApproval,
    markAsViewed,
    pollingState: state.pollingState,
    lastUpdated: state.lastUpdated,
    isViewed: state.isViewed
  }), [
    state.tabState,
    state.scopeContent,
    state.error,
    state.pollingState,
    state.lastUpdated,
    state.isViewed,
    isPolling
  ]);

  return (
    <RefinedPlanningContext.Provider value={contextValue}>
      {children}
    </RefinedPlanningContext.Provider>
  );
}

// Hook para usar o context
export function useRefinedPlanning(): RefinedPlanningContextType {
  const context = useContext(RefinedPlanningContext);
  if (!context) {
    throw new Error('useRefinedPlanning deve ser usado dentro de RefinedPlanningProvider');
  }
  return context;
} 