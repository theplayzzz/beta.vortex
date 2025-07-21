'use client';

import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useRefinedPlanning } from '../../contexts/RefinedPlanningContext';
import { RefinedTaskList } from './RefinedTaskList';
import type { TarefaRefinada } from '@/types/planning';

interface RefinedPlanningContentProps {
  tasks?: TarefaRefinada[]; // ✅ OPCIONAL - fallback
  onTaskClick: (task: TarefaRefinada, index: number) => void;
}

export function RefinedPlanningContent({ tasks: propTasks, onTaskClick }: RefinedPlanningContentProps) {
  const { tabState, error, clearError, scopeContent } = useRefinedPlanning();
  
  // ✅ CORREÇÃO: Usar tasks do contexto (polling) como prioridade, fallback para props
  const tasks = scopeContent?.tarefas_refinadas || propTasks || [];

  // Estado de carregamento/geração
  if (tabState === 'generating') {
    return (
      <div className="text-center py-12">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-sgbus-green" />
        </div>
        <div className="bg-sgbus-green/10 border border-sgbus-green/20 rounded-lg p-4 mb-4 inline-block">
          <h3 className="text-lg font-semibold text-sgbus-green mb-2">
            IA está gerando...
          </h3>
          <p className="text-sgbus-green/80 text-sm">
            Aguarde enquanto nossa IA processa as tarefas aprovadas e cria o planejamento refinado.
          </p>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (tabState === 'error' && error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4 inline-block">
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Erro ao processar
          </h3>
          <p className="text-red-400/80 text-sm mb-4">
            {error.message}
          </p>
          <button
            onClick={clearError}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Estado com dados (ready/new)
  if ((tabState === 'ready' || tabState === 'new') && tasks.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-sgbus-green" />
          <h3 className="text-xl font-semibold text-seasalt">
            Planejamento Refinado
          </h3>
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
            Planejamento refinado pronto
          </span>
          {tabState === 'new' && (
            <span className="text-xs bg-sgbus-green/20 text-sgbus-green px-2 py-1 rounded border border-sgbus-green/30">
              Novo
            </span>
          )}
        </div>
        
        {/* Lista de tarefas refinadas */}
        <RefinedTaskList
          tasks={tasks}
          onTaskClick={onTaskClick}
        />
      </div>
    );
  }

  // Estado padrão - aguardando aprovação
  return (
    <div className="text-center py-12">
      <Sparkles className="h-8 w-8 mx-auto mb-4 text-seasalt/40" />
      <h3 className="text-lg font-semibold text-seasalt/70 mb-2">
        Aguardando Aprovação
      </h3>
      <p className="text-seasalt/50 mb-4">
        Para gerar o planejamento refinado, você precisa:
      </p>
             <div className="bg-sgbus-green/10 border border-sgbus-green/20 rounded-lg p-4 inline-block">
         <p className="text-sgbus-green text-sm">
           1. Vá para a aba &quot;Objetivos Específicos&quot;<br/>
           2. Selecione as tarefas desejadas<br/>
           3. Clique em &quot;Aprovar selecionadas&quot;
         </p>
       </div>
    </div>
  );
} 