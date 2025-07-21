'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useRefinedPlanning } from '../../contexts/RefinedPlanningContext';
import { TabStatusIndicator } from './TabStatusIndicator';
import type { Planning } from '@/types/planning';

interface TabStateManagerProps {
  planning: Planning;
  onTabChange: (tab: string) => void;
  currentTab: string;
}

// Função para verificar se scope contém tarefas refinadas válidas
function hasValidRefinedTasks(scopeContent: any): boolean {
  return scopeContent?.tarefas_refinadas && 
         Array.isArray(scopeContent.tarefas_refinadas) && 
         scopeContent.tarefas_refinadas.length > 0;
}

// Função para verificar se specificObjectives contém tarefas estruturadas
function hasStructuredTasks(specificObjectives?: string): boolean {
  if (!specificObjectives) return false;
  
  try {
    const parsed = JSON.parse(specificObjectives);
    return parsed.tarefas && Array.isArray(parsed.tarefas) && parsed.tarefas.length > 0;
  } catch {
    return false;
  }
}

export function TabStateManager({ planning, onTabChange, currentTab }: TabStateManagerProps) {
  const { 
    tabState, 
    setTabState, 
    scopeContent, 
    isPolling, 
    error, 
    markAsViewed,
    startPolling
  } = useRefinedPlanning();
  
  // Ref para evitar múltiplas chamadas de polling
  const pollingStartedRef = useRef<string | null>(null);
  
  // Verificar se deve mostrar a aba (SEMPRE se tem tarefas estruturadas)
  const shouldShowTab = useMemo(() => {
    return hasStructuredTasks(planning.specificObjectives);
  }, [planning.specificObjectives]);
  
  // ✅ POLLING MANUAL APENAS - Removido auto-start
  useEffect(() => {
    // ✅ APENAS detectar se há dados para mostrar aba como "ready"
    const hasDataInDatabase = planning.scope && (() => {
      try {
        const parsed = JSON.parse(planning.scope);
        const tarefas = parsed.tarefas_refinadas || parsed.tasks || [];
        return Array.isArray(tarefas) && tarefas.length > 0;
      } catch {
        return false;
      }
    })();

    if (hasDataInDatabase && !hasValidRefinedTasks(scopeContent)) {
      console.log('🎯 Dados encontrados no banco - Carregando no contexto', planning.id);
      // Carregar dados no contexto sem iniciar polling
      try {
        const parsed = JSON.parse(planning.scope!);
        const tarefas = parsed.tarefas_refinadas || parsed.tasks || [];
        if (Array.isArray(tarefas) && tarefas.length > 0) {
          // Usar o contexto para carregar os dados
          // (isso será feito pelo próprio contexto na verificação inicial)
        }
      } catch (error) {
        console.warn('Erro ao carregar dados do banco:', error);
      }
    }
    
    // Reset ref se status mudou e não é mais PENDING
    if (planning.status !== 'PENDING_AI_REFINED_LIST') {
      pollingStartedRef.current = null;
    }
  }, [planning.status, planning.id, planning.scope, scopeContent]);

  // Marcar como visualizado quando aba é clicada
  const handleTabClick = () => {
    // ✅ SEMPRE PERMITIR CLIQUE - aba nunca deve ser não clicável
    markAsViewed();
    onTabChange('planejamento-refinado');
  };

  // Estados CSS para transições
  const getTabClasses = () => {
    const baseClasses = 'pb-3 border-b-2 font-medium text-sm transition-all duration-300 relative';
    
    // Estado waiting - semi-transparente e não clicável
    if (tabState === 'waiting') {
      return `${baseClasses} border-transparent text-seasalt/40 cursor-not-allowed opacity-60`;
    }
    
    // Aba ativa
    if (currentTab === 'planejamento-refinado') {
      return `${baseClasses} border-sgbus-green text-sgbus-green`;
    }
    
    // Estado ready - hover especial verde com gradiente
    if (tabState === 'ready') {
      return `${baseClasses} border-transparent text-periwinkle hover:text-sgbus-green hover:border-sgbus-green/40 hover:bg-gradient-to-r hover:from-transparent hover:via-green-500/5 hover:to-transparent`;
    }
    
    return `${baseClasses} border-transparent text-periwinkle hover:text-seasalt hover:border-seasalt/40`;
  };

  // SEMPRE renderizar se deve mostrar a aba (quando há tarefas estruturadas)
  if (!shouldShowTab) {
    return null;
  }

  return (
    <button
      onClick={handleTabClick}
      className={getTabClasses()}
      disabled={false}
    >
      <span className="flex items-center space-x-2">
        {/* Ícone baseado no estado */}
        {tabState === 'generating' && (
          <div className="h-4 w-4 border-2 border-sgbus-green border-t-transparent rounded-full animate-spin"></div>
        )}
        
        {tabState === 'ready' && (
          <svg className="h-4 w-4 text-sgbus-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        
        {tabState === 'waiting' && (
          <svg className="h-4 w-4 text-seasalt/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        
        {tabState === 'error' && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )}
        
        <span>Planejamento Refinado</span>
        
        {/* Indicador de status */}
        {tabState !== 'hidden' && (
          <TabStatusIndicator 
            state={tabState}
            message={
              tabState === 'generating' ? 'IA Gerando...' :
              tabState === 'ready' ? 'Pronto' :
              tabState === 'waiting' ? 'Aguardando Aprovação' :
              tabState === 'error' ? 'Erro' :
              undefined
            }
          />
        )}
      </span>
      
      {/* Destaque visual com gradiente quando pronto */}
      {tabState === 'ready' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      )}
    </button>
  );
} 