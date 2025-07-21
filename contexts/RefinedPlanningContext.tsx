'use client';

import { createContext, useContext, useReducer, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { usePollingWithRetry } from '@/hooks/usePollingWithRetry';
import { pollingLogger } from '../utils/pollingLogger';
// import { useGlobalRefinedPlanningListener } from './GlobalRefinedPlanningListener';
import type { Planning, TarefaRefinada } from '@/types/planning';

// Tipos refinados conforme plano
type TabState = 'generating' | 'ready' | 'new' | 'error' | 'waiting';
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
  
  // Polling (legacy)
  isPolling: boolean;
  startPolling: (planningId: string) => void;
  stopPolling: () => void;
  
  // Errors
  error: Error | null;
  clearError: () => void;
  
  // Actions
  handleApproval: (planningId: string, tasks: any[]) => Promise<void>;
  markAsViewed: () => void;
  resetLocalState: () => void;
  
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
  tabState: 'waiting',
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
        // Se há conteúdo com tarefas refinadas válidas, marcar como 'ready' (sempre Pronto)
        tabState: action.payload && action.payload.tarefas_refinadas && action.payload.tarefas_refinadas.length > 0 
          ? 'ready' 
          : state.tabState
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
          tabState: 'waiting',
          scopeContent: null,
          error: null,
          isViewed: false
        } : {})
      };
    
    case 'MARK_AS_VIEWED':
      return {
        ...state,
        isViewed: true
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
        tabState: state.tabState === 'error' ? 'waiting' : state.tabState
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
          tabState: 'waiting',
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

// Helper function para detectar dados prontos no planning
function detectInitialTabState(planningId?: string, initialPlanningData?: any): TabState {
  // Se não há planningId, estado inicial é waiting
  if (!planningId) return 'waiting';
  
  // ✅ VERIFICAÇÃO SÍNCRONA: Se há dados de planning passados, verificar scope
  if (initialPlanningData?.scope) {
    try {
      const parsed = JSON.parse(initialPlanningData.scope);
      const tarefas = parsed.tarefas_refinadas || parsed.tasks || [];
      if (Array.isArray(tarefas) && tarefas.length > 0) {
        console.log('🚀 ESTADO INICIAL INTELIGENTE: Dados encontrados - iniciando como READY');
        return 'ready';
      }
    } catch (error) {
      console.warn('⚠️ Erro ao parsear scope no estado inicial:', error);
    }
  }
  
  // ✅ VERIFICAÇÃO DE OBJETIVOS: Se há objetivos mas não há scope, aguardar aprovação
  if (initialPlanningData?.specificObjectives && !initialPlanningData?.scope) {
    try {
      const objectives = JSON.parse(initialPlanningData.specificObjectives);
      if (objectives.tarefas && Array.isArray(objectives.tarefas) && objectives.tarefas.length > 0) {
        console.log('🚀 ESTADO INICIAL INTELIGENTE: Objetivos prontos - aguardando aprovação');
        return 'waiting';
      }
    } catch (error) {
      console.warn('⚠️ Erro ao parsear objectives no estado inicial:', error);
    }
  }
  
  console.log('🚀 ESTADO INICIAL INTELIGENTE: Sem dados prontos - aguardando');
  return 'waiting';
}

// Provider
export function RefinedPlanningProvider({ 
  children, 
  planningId,
  initialPlanningData
}: { 
  children: ReactNode; 
  planningId?: string;
  initialPlanningData?: any;
}) {
  // const { startGlobalListener, stopGlobalListener } = useGlobalRefinedPlanningListener();
  // ✅ CORREÇÃO: Configurar estado inicial inteligente
  const initialStateWithId = useMemo(() => {
    const intelligentTabState = detectInitialTabState(planningId, initialPlanningData);
    
    // ✅ Se já há dados prontos, carregar scope content imediatamente
    let initialScopeContent = null;
    if (intelligentTabState === 'ready' && initialPlanningData?.scope) {
      try {
        const parsed = JSON.parse(initialPlanningData.scope);
        const tarefas = parsed.tarefas_refinadas || parsed.tasks || [];
        if (Array.isArray(tarefas) && tarefas.length > 0) {
          initialScopeContent = {
            tarefas_refinadas: tarefas,
            timestamp: new Date().toISOString()
          };
          console.log('🎯 SCOPE INICIAL CARREGADO:', tarefas.length, 'tarefas');
        }
      } catch (error) {
        console.warn('⚠️ Erro ao carregar scope inicial:', error);
      }
    }
    
    return {
      ...initialState,
      currentPlanningId: planningId || null,
      tabState: intelligentTabState,
      scopeContent: initialScopeContent
    };
  }, [planningId, initialPlanningData]);
  
  const [state, dispatch] = useReducer(refinedPlanningReducer, initialStateWithId);
  
  // Configurar planningId no estado quando recebido (sem dependência problemática)
  useEffect(() => {
    console.log('🔧 useEffect planningId:', { planningId, currentPlanningId: state.currentPlanningId });
    if (planningId && planningId !== state.currentPlanningId) {
      console.log('🔧 Atualizando planningId no estado:', planningId);
      dispatch({ type: 'SET_CURRENT_PLANNING_ID', payload: planningId });
    }
  }, [planningId]); // ✅ Removido state.currentPlanningId para evitar loops

  // 🚀 REQUEST INICIAL - Verificar estado da aba ao carregar página
  useEffect(() => {
    // ✅ CORREÇÃO DO LOOP: Flag para evitar múltiplas execuções por planningId
    const checkInitialRefinedPlanningState = async () => {
      if (!planningId) {
        console.log('🔍 Pulo verificação inicial: sem planningId');
        return;
      }

      // ✅ Evitar execução múltipla para o mesmo planejamento
      if (state.currentPlanningId === planningId && (state.tabState === 'ready' || state.scopeContent)) {
        console.log('🔍 Pulo verificação inicial: dados já carregados para', planningId);
        return;
      }

      console.log('🔍 VERIFICAÇÃO INICIAL - Executing for:', planningId);

      try {
        console.log('🔍 VERIFICAÇÃO INICIAL - Checking refined planning state for:', planningId);
        
        // Fazer request para verificar estado atual do planejamento
        const response = await fetch(`/api/plannings/${planningId}?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
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

        // ✅ PRIORIDADE MÁXIMA: VERIFICAR SE JÁ TEM DADOS PRONTOS NO SCOPE
        if (planning.scope) {
          try {
            const parsed = JSON.parse(planning.scope);
            console.log('🔍 Scope data parsed:', parsed);
            
            // ✅ Ler de ambos os campos por compatibilidade (prioridade: tarefas_refinadas)
            const tarefasRefinadas = parsed.tarefas_refinadas || parsed.tasks || [];
            
            if (Array.isArray(tarefasRefinadas) && tarefasRefinadas.length > 0) {
              console.log('✅ DADOS ENCONTRADOS - Planejamento refinado já existe no banco!');
              console.log(`📊 Total de tarefas: ${tarefasRefinadas.length}`);
              
              // ✅ Normalizar dados para formato esperado
              const normalizedData = {
                ...parsed,
                tarefas_refinadas: tarefasRefinadas,
                timestamp: new Date().toISOString()
              };
              
              // ✅ CARREGAR DADOS IMEDIATAMENTE - SEM POLLING
              dispatch({ type: 'SET_SCOPE_CONTENT', payload: normalizedData });
              dispatch({ type: 'SET_TAB_STATE', payload: 'ready' });
              
              console.log('🎯 Planejamento refinado carregado - PRONTO para uso');
              return; // ← SAIR AQUI - dados prontos, não fazer mais nada
            }
          } catch (parseError) {
            console.warn('⚠️ Erro ao parsear scope, mas continuando...', parseError);
          }
        }

        // ✅ STATUS 2a: IA GERANDO OBJETIVOS - Verificar se está processando objetivos específicos
        if (planning.status === 'PENDING_AI_BACKLOG_GENERATION') {
          // ✅ VERIFICAÇÃO: Se specificObjectives já foi preenchido, não iniciar polling
          const hasObjectives = planning.specificObjectives && planning.specificObjectives.trim().length > 0;
          
          if (hasObjectives) {
            console.log('✅ SKIP POLLING: specificObjectives já existe - atualizando status diretamente');
            // Atualizar status para AI_BACKLOG_VISIBLE sem polling
            fetch(`/api/plannings/${planning.id}/update-status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'AI_BACKLOG_VISIBLE' }),
            }).then(() => {
              dispatch({ type: 'SET_TAB_STATE', payload: 'ready' });
            }).catch(console.error);
            return;
          }
          
          console.log('🔄 STATUS: IA GERANDO OBJETIVOS - Iniciando polling (dados ainda não disponíveis)');
          dispatch({ type: 'SET_TAB_STATE', payload: 'waiting' });
          dispatch({ type: 'SET_POLLING_STATE', payload: 'active' });
          // Iniciar polling apenas se não há dados
          objectivesPolling.start();
          return;
        }

        // ✅ STATUS 2b: IA GERANDO REFINAMENTO - SÓ se não há dados prontos
        if (planning.status === 'PENDING_AI_REFINED_LIST') {
          console.log('🔄 STATUS: IA GERANDO REFINAMENTO - Processamento em andamento (sem dados no scope)');
          dispatch({ type: 'SET_TAB_STATE', payload: 'generating' });
          
          // ✅ SÓ INICIAR POLLING SE NÃO ESTIVER ATIVO
          if (state.pollingState !== 'active') {
            console.log('🚀 Iniciando polling para aguardar webhook...');
            startPolling(planningId);
          } else {
            console.log('⚠️ Polling já ativo - não reiniciando');
          }
          
          return;
        }

        // ✅ STATUS 1: AGUARDANDO APROVAÇÃO - Verificar se há tarefas para aprovar
        if (planning.specificObjectives) {
          try {
            const objectives = JSON.parse(planning.specificObjectives);
            if (objectives.tarefas && Array.isArray(objectives.tarefas) && objectives.tarefas.length > 0) {
              console.log('⏳ STATUS: AGUARDANDO APROVAÇÃO - Objetivos prontos, aguardando aprovação para refinamento');
              dispatch({ type: 'SET_TAB_STATE', payload: 'waiting' });
              return;
            }
          } catch (parseError) {
            console.warn('⚠️ Erro ao parsear specificObjectives:', parseError);
          }
        }

        // ✅ STATUS: WAITING - Ainda não há objetivos específicos
        console.log('⏳ STATUS: WAITING - Aguardando objetivos específicos serem gerados');
        dispatch({ type: 'SET_TAB_STATE', payload: 'waiting' });

      } catch (error) {
        console.error('❌ Erro na verificação inicial:', error);
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error : new Error('Erro na verificação inicial') });
      }
    };

    // Executar verificação inicial apenas se planningId está disponível
    if (planningId) {
      checkInitialRefinedPlanningState();
    }
  }, [planningId, state.currentPlanningId, state.tabState]); // ✅ INCLUIR dependências para evitar re-execuções desnecessárias

  // ✅ PARAR POLLING quando dados chegam via webhook
  useEffect(() => {
    if (state.tabState === 'ready' && state.pollingState === 'active') {
      console.log('✅ Dados encontrados - parando polling');
      dispatch({ type: 'SET_POLLING_STATE', payload: 'stopped' });
    }
  }, [state.tabState, state.pollingState]);

  // Função de polling
  const fetchPlanningData = useCallback(async () => {
    // ✅ CORREÇÃO: Verificar currentPlanningId atualizado no momento da execução
    const currentId = state.currentPlanningId;
    
    console.log('🔍 fetchPlanningData chamada:', {
      currentId,
      planningIdProp: planningId,
      stateCurrentPlanningId: state.currentPlanningId,
      pollingState: state.pollingState,
      tabState: state.tabState,
      timestamp: new Date().toISOString()
    });
    
    if (!currentId) {
      console.error('❌ fetchPlanningData: currentPlanningId não definido!', {
        state: state,
        planningIdProp: planningId,
        stateKeys: Object.keys(state),
        stateValues: state
      });
      throw new Error('Nenhum planejamento selecionado');
    }

    pollingLogger.logPollingEvent({
      planningId: currentId,
      action: 'start'
    });

    const response = await fetch(`/api/plannings/${currentId}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const planning: Planning = await response.json();
    
    console.log('🔄 POLLING - Verificando estado:', {
      planningId: currentId,
      status: planning.status,
      hasScope: !!planning.scope,
      currentTabState: state.tabState
    });
    
    // ✅ PRIORIDADE 1: Verificar se há dados refinados no scope (STATUS: PRONTO)
    if (planning.scope) {
      try {
        const parsed = JSON.parse(planning.scope);
        // ✅ Ler de ambos os campos por compatibilidade (prioridade: tarefas_refinadas)
        const tarefasRefinadas = parsed.tarefas_refinadas || parsed.tasks || [];
        
        if (Array.isArray(tarefasRefinadas) && tarefasRefinadas.length > 0) {
          console.log('🎉 POLLING - DADOS ENCONTRADOS! Mudando para STATUS: PRONTO');
          console.log(`   📊 Tarefas encontradas: ${tarefasRefinadas.length}`);
          
          pollingLogger.logPollingEvent({
            planningId: currentId,
            action: 'success',
            data: { tasksFound: tarefasRefinadas.length }
          });
          
          // ✅ Atualizar scope content - o reducer irá automaticamente definir como 'new' se não foi visualizado
          dispatch({ 
            type: 'SET_SCOPE_CONTENT', 
            payload: {
              tarefas_refinadas: tarefasRefinadas,
              timestamp: new Date().toISOString()
            }
          });
          
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
  }, [state.currentPlanningId, state.tabState, planningId]);

  // ✅ POLLING CONDICIONAL - Ativo quando pollingState é 'active'
  const shouldPoll = state.pollingState === 'active';
  
  const { isPolling, stop: stopPollingHook, error: pollingError } = usePollingWithRetry(
    fetchPlanningData,
    shouldPoll, // ✅ Polling ativo quando pollingState é 'active'
    pollingConfig
  );

  console.log('🔄 Hook polling state:', {
    pollingState: state.pollingState,
    tabState: state.tabState,
    isPolling,
    currentPlanningId: state.currentPlanningId
  });
  
  // ✅ FUNÇÃO PARA INICIAR POLLING REAL
  const startPolling = useCallback((planningId: string) => {
    console.log('🚀 startPolling chamado:', { 
      planningId, 
      currentState: state.pollingState
    });

    // Definir estados para iniciar polling
    dispatch({ type: 'SET_PLANNING_ID', payload: planningId });
    dispatch({ type: 'SET_TAB_STATE', payload: 'generating' });
    dispatch({ type: 'SET_POLLING_STATE', payload: 'active' });
    
    console.log('✅ Polling iniciado para aguardar webhook');
  }, []); // ✅ SEM DEPENDÊNCIAS

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

  // 🧹 Função para resetar estado local (limpeza visual)
  const resetLocalState = useCallback(() => {
    console.log('🧹 Resetando estado local do planejamento refinado');
    dispatch({ type: 'SET_SCOPE_CONTENT', payload: null });
    dispatch({ type: 'SET_TAB_STATE', payload: 'generating' });
    dispatch({ type: 'SET_POLLING_STATE', payload: 'active' });
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

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

      // 🧹 LIMPAR ESTADO LOCAL
      console.log('🧹 Limpando estado local...');
      dispatch({ type: 'SET_SCOPE_CONTENT', payload: null });
      dispatch({ type: 'SET_TAB_STATE', payload: 'generating' });
      dispatch({ type: 'CLEAR_ERROR' });
      
      // ✅ ATIVAR POLLING STATE para que verificação inicial inicie polling
      console.log('🚀 Ativando polling após aprovação...');
      dispatch({ type: 'SET_POLLING_STATE', payload: 'active' });
      
      console.log('⏳ Aguardando webhook processar dados...');
      
      console.log('✅ Processo de aprovação finalizado');
      
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

  // ✅ NOVO: Função para detectar se specificObjectives foi preenchido pela API externa
  const detectObjectivesCompletion = useCallback(async (planningId: string): Promise<boolean> => {
    console.log('🔍 Verificando se API externa salvou specificObjectives...', planningId);
    
    try {
      const response = await fetch(`/api/plannings/${planningId}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const planning = await response.json();
      
      // Verificar se specificObjectives foi preenchido e status ainda é PENDING_AI_BACKLOG_GENERATION
      if (planning.specificObjectives && 
          planning.specificObjectives.trim().length > 0 && 
          planning.status === 'PENDING_AI_BACKLOG_GENERATION') {
        
        console.log('✅ API externa salvou specificObjectives! Atualizando status...');
        
        // Atualizar status para AI_BACKLOG_VISIBLE
        const updateResponse = await fetch(`/api/plannings/${planningId}/update-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'AI_BACKLOG_VISIBLE' }),
        });

        if (updateResponse.ok) {
          console.log('✅ Status atualizado para AI_BACKLOG_VISIBLE');
          dispatch({ type: 'SET_TAB_STATE', payload: 'ready' });
          return true; // Objetivos completados
        }
      }
      
      return false; // Ainda aguardando
    } catch (error) {
      console.error('❌ Erro ao verificar objetivos específicos:', error);
      throw error;
    }
  }, []);

  // ✅ CORREÇÃO: Polling para objetivos específicos quando status = PENDING_AI_BACKLOG_GENERATION
  const objectivesPolling = usePollingWithRetry(
    () => detectObjectivesCompletion(state.currentPlanningId!),
    false, // Controlado manualmente
    {
      interval: pollingConfig.interval,
      maxRetries: pollingConfig.maxRetries,
      timeout: pollingConfig.timeout,
      retryDelay: pollingConfig.retryDelay || 1000
    }
  );

  // Detectar quando objetivos foram completados
  useEffect(() => {
    if (objectivesPolling.data === true) {
      console.log('🎯 Objetivos específicos detectados - parando polling');
      objectivesPolling.stop();
      dispatch({ type: 'SET_POLLING_STATE', payload: 'stopped' });
    }
  }, [objectivesPolling.data]);

  // Detectar erros no polling de objetivos
  useEffect(() => {
    if (objectivesPolling.error) {
      console.error('❌ Erro no polling de objetivos específicos:', objectivesPolling.error);
      dispatch({ type: 'SET_ERROR', payload: objectivesPolling.error });
      dispatch({ type: 'SET_POLLING_STATE', payload: 'error' });
    }
  }, [objectivesPolling.error]);

  // ✅ CLEANUP: Parar polling quando componente desmonta
  useEffect(() => {
    return () => {
      if (state.pollingState === 'active') {
        console.log(`🧹 Parando polling (cleanup)`);
        stopPollingHook();
      }
    };
  }, [state.pollingState, stopPollingHook]);

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
    resetLocalState,
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
    markAsViewed,
    resetLocalState
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
