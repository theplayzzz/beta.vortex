'use client';

import { useState, useEffect } from 'react';
import { Target, CheckSquare, Square, MoreVertical, Edit3, MessageSquare, Loader2, AlertTriangle } from 'lucide-react';
import { TaskRefinementList } from './TaskRefinementList';
import { EditTaskModal } from './EditTaskModal';
import { AddContextModal } from './AddContextModal';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { useRefinedPlanning } from '../../contexts/RefinedPlanningContext';
import { usePlanningLimit } from '@/components/shared/PlanningLimitCheck';
import type { TarefaAI, Planning } from '@/types/planning';

interface TaskRefinementInterfaceProps {
  planning: Planning;
  onUpdate?: (updatedPlanning: Planning) => void;
  onCreateRefinedTab?: () => void;
}

export function TaskRefinementInterface({ planning, onUpdate, onCreateRefinedTab }: TaskRefinementInterfaceProps) {
  // Estados locais
  const [tasks, setTasks] = useState<TarefaAI[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [editingTask, setEditingTask] = useState<{ index: number; task: TarefaAI } | null>(null);
  const [addingContextTask, setAddingContextTask] = useState<{ index: number; task: TarefaAI } | null>(null);

  // Estados para modal de confirmação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);

  // Estados para validação de limite
  const [limitErrorMessage, setLimitErrorMessage] = useState<string | null>(null);

  // Hook do Context para gerenciar estado da aba refinada
  const { handleApproval, setTabState, error, clearError, startPolling, stopPolling, resetLocalState } = useRefinedPlanning();
  
  // Hook para verificar limites de uso usando o componente compartilhado
  const planningLimitInfo = usePlanningLimit();

  // Extrair tarefas do specificObjectives
  useEffect(() => {
    if (planning.specificObjectives) {
      try {
        const parsed = JSON.parse(planning.specificObjectives);
        if (parsed.tarefas && Array.isArray(parsed.tarefas)) {
          setTasks(parsed.tarefas);
          // NÃO pré-selecionar todas as tarefas - deixar vazio
          setSelectedTasks(new Set());
        }
      } catch (error) {
        console.error('Erro ao parsear tarefas:', error);
      }
    }
  }, [planning.specificObjectives]);

  // Limpar erros quando componente monta
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  const handleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map((_, index) => index)));
    }
  };

  const handleTaskSelect = (index: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTasks(newSelected);
  };

  const handleEditTask = (index: number, updatedTask: TarefaAI) => {
    const newTasks = [...tasks];
    newTasks[index] = updatedTask;
    setTasks(newTasks);
    updatePlanningData(newTasks);
    setEditingTask(null);
  };

  const handleAddContext = (index: number, context: string) => {
    const newTasks = [...tasks];
    newTasks[index] = {
      ...newTasks[index],
      contexto_adicional: context
    };
    setTasks(newTasks);
    updatePlanningData(newTasks);
    setAddingContextTask(null);
  };

  const handlePriorityChange = (index: number, priority: TarefaAI['prioridade']) => {
    const newTasks = [...tasks];
    newTasks[index] = {
      ...newTasks[index],
      prioridade: priority
    };
    setTasks(newTasks);
    updatePlanningData(newTasks);
  };

  const updatePlanningData = async (updatedTasks: TarefaAI[]) => {
    try {
      const updatedObjectives = JSON.stringify({
        nome_do_backlog: JSON.parse(planning.specificObjectives || '{}').nome_do_backlog || '',
        objetivo_do_backlog: JSON.parse(planning.specificObjectives || '{}').objetivo_do_backlog || '',
        tarefas: updatedTasks
      });

      const response = await fetch(`/api/planning/${planning.id}/update-tasks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_do_backlog: JSON.parse(planning.specificObjectives || '{}').nome_do_backlog || '',
          objetivo_do_backlog: JSON.parse(planning.specificObjectives || '{}').objetivo_do_backlog || '',
          tarefas: updatedTasks
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar tarefas');
      }

      const result = await response.json();
      onUpdate?.(result.planning);
    } catch (error) {
      console.error('Erro ao atualizar tarefas:', error);
    }
  };

  // Handler para clicar no botão de aprovação (validação ANTES do modal)
  const handleApprovalClick = () => {
    // Limpar mensagem de erro anterior
    setLimitErrorMessage(null);

    if (selectedTasks.size === 0) {
      alert('Selecione pelo menos uma tarefa para aprovar.');
      return;
    }

    // ✅ VALIDAÇÃO DE LIMITE DE PLANEJAMENTOS - ANTES DO MODAL
    if (planningLimitInfo.exceeded) {
      console.log('❌ Limite de planejamentos excedido:', planningLimitInfo);
      
      const errorMsg = `Limite de planejamentos excedido. Você já usou ${planningLimitInfo.used} de ${planningLimitInfo.limit} planejamentos disponíveis este mês (${planningLimitInfo.baseLimit} do plano + ${planningLimitInfo.bonusLimit} bônus). Para aprovar mais planejamentos, considere atualizar seu plano ou aguarde o próximo mês.`;
      
      setLimitErrorMessage(errorMsg);
      return; // Parar execução - NÃO abrir modal
    }

    // Se passou na validação, abrir modal normalmente
    setIsModalOpen(true);
    setButtonsDisabled(true);
  };

  // ✅ CORREÇÃO: Handler para confirmar no modal - FEEDBACK IMEDIATO
  const handleConfirm = async () => {
    setIsModalOpen(false);
    // ✅ NÃO REMOVER: setButtonsDisabled(true) para manter botões desabilitados

    try {
      console.log('🚀 Iniciando aprovação de tarefas...');
      
      // Preparar tarefas selecionadas
      const selectedTasksArray = tasks
        .map((task, index) => selectedTasks.has(index) ? { ...task, selecionada: true } : null)
        .filter(Boolean);

      console.log('📋 Tarefas selecionadas:', selectedTasksArray.length);

      // ✅ NOVO: FEEDBACK IMEDIATO - ANTES DA API
      console.log('🎯 PASSO 1: Feedback imediato ao usuário...');
      
      // 0. Resetar estado local primeiro (limpa interface antiga)
      console.log('🧹 Resetando estado local para limpeza visual...');
      resetLocalState();
      
      // 1. Iniciar polling imediatamente (mostra "IA Gerando...")
      console.log('🔄 Iniciando polling imediatamente...');
      startPolling(planning.id);
      
      // 2. Navegar para aba refinada imediatamente
      console.log('🎯 Navegando para aba "Planejamento Refinado" imediatamente...');
      onCreateRefinedTab?.();
      
      console.log('✅ Usuário movido para aba refinada com status "IA Gerando" e interface limpa');

      // ✅ PASSO 2: Processo será limpo no backend pela nossa implementação
      console.log('🧹 PASSO 2: Backend irá limpar scope automaticamente...');

      // ✅ PASSO 3: Processar aprovação em background
      console.log('📡 PASSO 3: Processando aprovação em background...');
      
      // USAR O CONTEXT PARA GERENCIAR APROVAÇÃO
      // Isso irá confirmar o polling e garantir que tudo está correto
      await handleApproval(planning.id, selectedTasksArray);
      
      console.log('✅ Aprovação processada com sucesso em background');
      
    } catch (error) {
      console.error('❌ Erro ao aprovar tarefas:', error);
      // ✅ CORREÇÃO: Reabilitar botões apenas em caso de erro
      setButtonsDisabled(false);
      
      // Em caso de erro, parar o polling que foi iniciado
      stopPolling();
    }
    // ✅ REMOVIDO: finally com setIsApproving(false) - não há mais loading
  };

  // Handler para cancelar no modal
  const handleCancel = () => {
    setIsModalOpen(false);
    setButtonsDisabled(false);
  };

  const selectedCount = selectedTasks.size;

  return (
    <div className="space-y-6">
      {/* Exibir erro de limite ANTES do modal */}
      {limitErrorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <h3 className="text-lg font-semibold text-red-400">
              Limite de planejamentos excedido
            </h3>
          </div>
          <p className="text-red-300 text-sm mb-4">
            {limitErrorMessage}
          </p>
          <button
            onClick={() => setLimitErrorMessage(null)}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Entendi
          </button>
        </div>
      )}

      {/* Exibir erro se houver */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold text-red-400 mb-2">
            Erro na Aprovação
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
      )}

      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-6 w-6 text-sgbus-green" />
            <h3 className="text-xl font-semibold text-seasalt">
              📋 Lista de Tarefas Geradas
            </h3>
          </div>
          <p className="text-seasalt/70">
            Selecione as tarefas que deseja incluir no projeto final.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            disabled={buttonsDisabled}
            className="flex items-center gap-2 px-4 py-2 bg-periwinkle/20 text-periwinkle rounded-lg hover:bg-periwinkle/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedTasks.size === tasks.length ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            ☑️ Selecionar todas as tarefas
          </button>
          
          <button
            onClick={handleApprovalClick}
            disabled={selectedCount === 0 || buttonsDisabled || planningLimitInfo.exceeded}
            className="flex items-center gap-2 px-6 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            title={planningLimitInfo.exceeded ? 'Limite de planejamentos excedido' : undefined}
          >
            ✅ Aprovar selecionadas
          </button>
        </div>
      </div>

      {/* Lista de Tarefas */}
      <TaskRefinementList
        tasks={tasks}
        selectedTasks={selectedTasks}
        onTaskSelect={handleTaskSelect}
        onEditTask={(index, task) => setEditingTask({ index, task })}
        onAddContext={(index, task) => setAddingContextTask({ index, task })}
        onPriorityChange={handlePriorityChange}
      />

      {/* Rodapé */}
      <div className="flex items-center justify-between pt-4 border-t border-seasalt/20">
        <span className="text-seasalt/70">
          {selectedCount} de {tasks.length} tarefas selecionadas
        </span>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            disabled={buttonsDisabled}
            className="px-4 py-2 bg-seasalt/10 text-seasalt rounded-lg hover:bg-seasalt/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Voltar
          </button>
          
          <button
            onClick={handleApprovalClick}
            disabled={selectedCount === 0 || buttonsDisabled || planningLimitInfo.exceeded}
            className="flex items-center gap-2 px-6 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            title={planningLimitInfo.exceeded ? 'Limite de planejamentos excedido' : undefined}
          >
            ✅ Aprovar selecionadas
          </button>
        </div>
      </div>

      {/* Modal de Confirmação */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        message="Tem certeza que deseja aprovar estes planejamentos? Os créditos serão descontados"
        title="Confirmar Aprovação"
        confirmText="Sim"
        cancelText="Cancelar"
      />

      {/* Modais de Edição */}
      {editingTask && (
        <EditTaskModal
          task={editingTask.task}
          isOpen={true}
          onClose={() => setEditingTask(null)}
          onSave={(updatedTask) => handleEditTask(editingTask.index, updatedTask)}
        />
      )}

      {addingContextTask && (
        <AddContextModal
          task={addingContextTask.task}
          isOpen={true}
          onClose={() => setAddingContextTask(null)}
          onSave={(context) => handleAddContext(addingContextTask.index, context)}
        />
      )}
    </div>
  );
} 