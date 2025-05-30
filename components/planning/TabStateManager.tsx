'use client';

import { useMemo, useEffect } from 'react';
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
  
  // Lógica de determinação de estado baseada em props + context
  const computedState = useMemo(() => {
    if (error) return 'error';
    
    // Se está fazendo polling ou status indica geração em andamento
    if (isPolling || planning.status === 'PENDING_AI_REFINED_LIST') {
      // Verificar se já não tem dados válidos
      if (!hasValidRefinedTasks(scopeContent)) {
        return 'generating';
      }
    }
    
    // Se tem dados válidos
    if (hasValidRefinedTasks(scopeContent)) {
      return 'ready';
    }
    
    return 'hidden';
  }, [error, isPolling, planning.status, scopeContent]);
  
  // Sync com context quando computed state muda
  useEffect(() => {
    if (computedState !== tabState) {
      setTabState(computedState);
    }
  }, [computedState, tabState, setTabState]);

  // Auto-iniciar polling se necessário
  useEffect(() => {
    if (planning.status === 'PENDING_AI_REFINED_LIST' && !hasValidRefinedTasks(scopeContent) && !isPolling) {
      console.log('🎯 Auto-iniciando polling para planejamento refinado...');
      startPolling(planning.id);
    }
  }, [planning.status, planning.id, scopeContent, isPolling, startPolling]);

  // Marcar como visualizado quando aba é clicada
  const handleTabClick = () => {
    if (tabState === 'new') {
      markAsViewed();
    }
    onTabChange('planejamento-refinado');
  };

  // Estados CSS para transições
  const getTabClasses = () => {
    const baseClasses = 'pb-3 border-b-2 font-medium text-sm transition-colors relative tab-refined-planning tab-state-transition';
    
    if (currentTab === 'planejamento-refinado') {
      return `${baseClasses} border-sgbus-green text-sgbus-green state-${tabState}`;
    }
    
    return `${baseClasses} border-transparent text-periwinkle hover:text-seasalt hover:border-seasalt/40 state-${tabState}`;
  };

  // Não renderizar se estado é hidden
  if (tabState === 'hidden') {
    return null;
  }

  return (
    <button
      onClick={handleTabClick}
      className={getTabClasses()}
    >
      <span className="flex items-center space-x-2">
        {/* Ícone baseado no estado */}
        {tabState === 'generating' && (
          <div className="indicator-generating">
            <div className="h-4 w-4 loading-indicator border-2 border-sgbus-green border-t-transparent rounded-full"></div>
          </div>
        )}
        
        {(tabState === 'ready' || tabState === 'new') && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 2.286A5.001 5.001 0 0 1 12 10h0a5.001 5.001 0 0 1-4.286-2.714L5.428 5M13 12v6a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-6m8-8v8m2-8v8" />
          </svg>
        )}
        
        {tabState === 'error' && (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )}
        
        <span>Planejamento Refinado</span>
        
        {/* Indicador de status */}
        <TabStatusIndicator 
          state={tabState}
          message={
            tabState === 'generating' ? 'IA Gerando...' :
            tabState === 'ready' ? 'Pronto' :
            tabState === 'new' ? 'Novo' :
            tabState === 'error' ? 'Erro' :
            undefined
          }
        />
      </span>
    </button>
  );
} 