'use client';

import { createContext, useContext, useReducer, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { usePollingWithRetry } from '@/hooks/usePollingWithRetry';
import { pollingLogger } from '../utils/pollingLogger';
import type { Planning, TarefaRefinada } from '@/types/planning';

// Tipos refinados conforme plano
type TabState = 'hidden' | 'generating' | 'ready' | 'new' | 'error' | 'waiting';
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
  | { type: 'RESET_STATE' }
  | { type: 'SET_CURRENT_PLANNING_ID'; payload: string | null };

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
    
    case 'SET_CURRENT_PLANNING_ID':
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
export function RefinedPlanningProvider({ 
  children, 
  planningId 
}: { 
  children: ReactNode; 
  planningId?: string;
}) {
  const [state, dispatch] = useReducer(refinedPlanningReducer, initialState);
  
  // Configurar planningId no estado quando recebido
  useEffect(() => {
    if (planningId && planningId !== state.currentPlanningId) {
      console.log('🔧 Configurando planningId no estado:', planningId);
      dispatch({ type: 'SET_CURRENT_PLANNING_ID', payload: planningId });
    }
  }, [planningId, state.currentPlanningId]);

  // 🚀 REQUEST INICIAL - Verificar estado da aba ao carregar página
  useEffect(() => {
    // ✅ CORREÇÃO DO LOOP: Flag para evitar múltiplas execuções
    let isInitialCheckExecuted = false;
    
    const checkInitialRefinedPlanningState = async () => {
      if (!planningId || isInitialCheckExecuted) {
        console.log('🔍 Pulo verificação inicial:', { planningId, isInitialCheckExecuted });
        return;
      }

      isInitialCheckExecuted = true;
      console.log('🔍 VERIFICAÇÃO INICIAL - Executing for:', planningId);

      try {
        console.log('🔍 VERIFICAÇÃO INICIAL - Checking refined planning state for:', planningId);
        
        // Fazer request para verificar estado atual do planejamento
        const response = await fetch(`/api/plannings/${planningId}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          console.error('❌ Erro ao buscar planejamento inicial:', response.status);
          return;
        }

        const planning = await response.json();
        console.log('🔍 Planning data:', {
          id: planning.id,
          status: planning.status,
          hasScope: !!planning.scope,
          hasSpecificObjectives: !!planning.specificObjectives
        });

        // ✅ STATUS 3: PRONTO - Verificar se já tem dados no scope (planejamento processado)
        if (planning.scope) {
          try {
            const parsed = JSON.parse(planning.scope);
            console.log('🔍 Scope data parsed:', parsed);
            
            if (parsed.tarefas_refinadas && Array.isArray(parsed.tarefas_refinadas) && parsed.tarefas_refinadas.length > 0) {
              console.log('✅ STATUS: PRONTO - Dados refinados encontrados no scope');
              dispatch({ type: 'SET_TAB_STATE', payload: 'ready' });
              dispatch({ type: 'SET_SCOPE_CONTENT', payload: parsed });
              return;
            }
          } catch (parseError) {
            console.warn('⚠️ Erro ao parsear scope, mas continuando...', parseError);
          }
        }

        // ✅ STATUS 2: IA GERANDO - Verificar se está em processamento
        if (planning.status === 'PENDING_AI_REFINED_LIST') {
          console.log('🔄 STATUS: IA GERANDO - Processamento em andamento detectado');
          dispatch({ type: 'SET_TAB_STATE', payload: 'generating' });
          // NÃO iniciar polling automaticamente aqui - será iniciado pelo approve-tasks
          return;
        }

        // ✅ STATUS 1: AGUARDANDO PLANEJAMENTO - Verificar se há tarefas para aprovar
        if (planning.specificObjectives) {
          try {
            const objectives = JSON.parse(planning.specificObjectives);
            if (objectives.tarefas && Array.isArray(objectives.tarefas) && objectives.tarefas.length > 0) {
              console.log('⏳ STATUS: AGUARDANDO PLANEJAMENTO - Tarefas disponíveis para aprovação');
              dispatch({ type: 'SET_TAB_STATE', payload: 'waiting' });
              return;
            }
          } catch (parseError) {
            console.warn('⚠️ Erro ao parsear specificObjectives:', parseError);
          }
        }

        console.log('❌ STATUS: HIDDEN - Nenhuma condição atendida');
        dispatch({ type: 'SET_TAB_STATE', payload: 'hidden' });

      } catch (error) {
        console.error('❌ Erro na verificação inicial:', error);
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error : new Error('Erro na verificação inicial') });
      }
    };

    // Executar verificação inicial apenas se planningId está disponível
    if (planningId) {
      checkInitialRefinedPlanningState();
    }

    // ✅ CORREÇÃO DO LOOP: Cleanup function para resetar flag
    return () => {
      isInitialCheckExecuted = false;
    };
  }, [planningId]); // ✅ DEPENDÊNCIA LIMITADA: Só planningId

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
    
    console.log('🔄 POLLING - Verificando estado:', {
      planningId: state.currentPlanningId,
      status: planning.status,
      hasScope: !!planning.scope,
      currentTabState: state.tabState
    });
    
    // ✅ PRIORIDADE 1: Verificar se há dados refinados no scope (STATUS: PRONTO)
    if (planning.scope) {
      try {
        const parsed = JSON.parse(planning.scope);
        if (parsed.tarefas_refinadas && Array.isArray(parsed.tarefas_refinadas) && parsed.tarefas_refinadas.length > 0) {
          console.log('🎉 POLLING - DADOS ENCONTRADOS! Mudando para STATUS: PRONTO');
          console.log(`   📊 Tarefas encontradas: ${parsed.tarefas_refinadas.length}`);
          
          pollingLogger.logPollingEvent({
            planningId: state.currentPlanningId,
            action: 'success',
            data: { tasksFound: parsed.tarefas_refinadas.length }
          });
          
          // ✅ Atualizar scope content E estado da aba para PRONTO
          dispatch({ 
            type: 'SET_SCOPE_CONTENT', 
            payload: {
              tarefas_refinadas: parsed.tarefas_refinadas,
              timestamp: new Date().toISOString()
            }
          });

          dispatch({ type: 'SET_TAB_STATE', payload: 'ready' });
          
          console.log('✅ POLLING - Estado atualizado: scope content + tab state = ready');
          
          // Parar polling - dados encontrados
          return { shouldStop: true, data: planning };
        }
      } catch (error) {
        console.error('❌ POLLING - Erro ao parsear scope:', error);
      }
    }

    // ✅ PRIORIDADE 2: Verificar se está em processamento (STATUS: IA GERANDO)
    if (planning.status === 'PENDING_AI_REFINED_LIST') {
      console.log('🔄 POLLING - Processamento em andamento, mantendo STATUS: IA GERANDO');
      // Manter estado 'generating' se não estiver já
      if (state.tabState !== 'generating') {
        dispatch({ type: 'SET_TAB_STATE', payload: 'generating' });
      }
      return { shouldStop: false, data: planning };
    }

    // ✅ PRIORIDADE 3: Verificar outros estados
    console.log('⏸️ POLLING - Nenhuma condição de continuidade, parando...');
    return { shouldStop: false, data: planning };
  };

  // Hook de polling integrado
  const shouldPoll = state.pollingState === 'active' && state.tabState === 'generating';
  
  const { isPolling, start: startPollingHook, stop: stopPollingHook, error: pollingError } = usePollingWithRetry(
    fetchPlanningData,
    shouldPoll,
    pollingConfig
  );

  console.log('🔄 Hook polling state:', {
    pollingState: state.pollingState,
    tabState: state.tabState,
    shouldPoll,
    isPolling,
    currentPlanningId: state.currentPlanningId
  });
  
  // Sync polling state
  const startPolling = useCallback((planningId: string) => {
    console.log('🚀 startPolling chamado:', { planningId, currentState: state.pollingState });
    
    // ✅ CORREÇÃO DO LOOP: Evitar múltiplas chamadas
    if (state.pollingState === 'active') {
      console.log('⚠️ Polling já está ativo, ignorando...');
      return;
    }
    
    console.log('⚙️ Definindo estados para polling...');
    dispatch({ type: 'SET_PLANNING_ID', payload: planningId });
    dispatch({ type: 'SET_POLLING_STATE', payload: 'active' });
    dispatch({ type: 'SET_TAB_STATE', payload: 'generating' });
    console.log('✅ Estados definidos: pollingState=active, tabState=generating');
    
    pollingLogger.logPollingEvent({
      planningId,
      action: 'start',
      interval: pollingConfig.interval
    });
  }, [state.pollingState]); // ✅ DEPENDÊNCIA LIMITADA

  const stopPolling = useCallback(() => {
    console.log('🛑 stopPolling chamado:', { currentState: state.pollingState });
    
    dispatch({ type: 'SET_POLLING_STATE', payload: 'stopped' });
    stopPollingHook();
    
    if (state.currentPlanningId) {
      pollingLogger.logPollingEvent({
        planningId: state.currentPlanningId,
        action: 'stop'
      });
    }
  }, [state.pollingState, state.currentPlanningId]); // ✅ DEPENDÊNCIAS LIMITADAS

  const setTabState = useCallback((tabState: TabState) => {
    dispatch({ type: 'SET_TAB_STATE', payload: tabState });
  }, []); // ✅ SEM DEPENDÊNCIAS - função pura

  const setScopeContent = useCallback((content: ScopeContent | null) => {
    dispatch({ type: 'SET_SCOPE_CONTENT', payload: content });
  }, []); // ✅ SEM DEPENDÊNCIAS - função pura

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []); // ✅ SEM DEPENDÊNCIAS - função pura

  const markAsViewed = useCallback(() => {
    dispatch({ type: 'MARK_AS_VIEWED' });
  }, []); // ✅ SEM DEPENDÊNCIAS - função pura

  const handleApproval = useCallback(async (planningId: string, tasks: any[]) => {
    try {
      console.log('🚀 INÍCIO handleApproval - Context');
      console.log('📤 planningId:', planningId);
      console.log('📤 tasks recebidas:', tasks);
      console.log('📤 Tipo de tasks:', typeof tasks, 'Array?', Array.isArray(tasks));

      // VALIDAÇÃO: Garantir que tasks é array válido
      if (!Array.isArray(tasks) || tasks.length === 0) {
        throw new Error('Tarefas aprovadas são obrigatórias e devem ser um array não vazio');
      }

      console.log('✅ Validação de tasks passou');

      // CORREÇÃO: Preparar payload correto com approvedTasks
      const payload = {
        approvedTasks: tasks // CAMPO CORRETO - não "selectedTasks"
      };

      console.log('📤 Payload preparado:', payload);

      // Enviar aprovação
      console.log('📡 Enviando aprovação para API...');
      const approvalResponse = await fetch(`/api/planning/${planningId}/approve-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 Response status:', approvalResponse.status);

      if (!approvalResponse.ok) {
        const errorData = await approvalResponse.json();
        console.error('❌ Erro na resposta da API:', errorData);
        throw new Error(errorData.error || 'Erro ao aprovar tarefas');
      }

      const responseData = await approvalResponse.json();
      console.log('✅ Aprovação bem-sucedida:', responseData);

      // ✅ CORREÇÃO: Verificar se polling já está ativo antes de iniciar
      if (state.pollingState !== 'active') {
        console.log('🔄 Polling não estava ativo, iniciando agora...');
        startPolling(planningId);
      } else {
        console.log('✅ Polling já está ativo, confirmando configuração...');
        // Garantir que o planningId está correto
        if (state.currentPlanningId !== planningId) {
          console.log('🔄 Atualizando planningId do polling...');
          dispatch({ type: 'SET_PLANNING_ID', payload: planningId });
        }
      }
      
    } catch (error) {
      console.error('❌ ERRO em handleApproval:', error);
      const err = error instanceof Error ? error : new Error('Erro desconhecido na aprovação');
      dispatch({ type: 'SET_ERROR', payload: err });
      
      if (state.currentPlanningId) {
        pollingLogger.logPollingEvent({
          planningId: state.currentPlanningId,
          action: 'error',
          error: err
        });
      }
      
      // Re-throw para que o componente possa tratar
      throw err;
    }
  }, [startPolling, state.currentPlanningId, state.pollingState]); // ✅ DEPENDÊNCIAS LIMITADAS

  // Sync polling error
  useEffect(() => {
    if (pollingError && !state.error) {
      dispatch({ type: 'SET_ERROR', payload: pollingError });
    }
  }, [pollingError, state.error]); // ✅ DEPENDÊNCIAS LIMITADAS

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
    isPolling,
    setTabState,
    setScopeContent,
    startPolling,
    stopPolling,
    clearError,
    handleApproval,
    markAsViewed
  ]); // ✅ TODAS AS DEPENDÊNCIAS INCLUÍDAS

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
