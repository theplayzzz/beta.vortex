'use client';

import { useState, useEffect } from 'react';
import { Target, CheckSquare, Square, MoreVertical, Edit3, MessageSquare, Loader2 } from 'lucide-react';
import { TaskRefinementList } from './TaskRefinementList';
import { EditTaskModal } from './EditTaskModal';
import { AddContextModal } from './AddContextModal';
import type { TarefaAI, Planning } from '@/types/planning';

interface TaskRefinementInterfaceProps {
  planning: Planning;
  onUpdate?: (updatedPlanning: Planning) => void;
}

export function TaskRefinementInterface({ planning, onUpdate }: TaskRefinementInterfaceProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [tasks, setTasks] = useState<TarefaAI[]>([]);
  const [isApproving, setIsApproving] = useState(false);
  const [editingTask, setEditingTask] = useState<{ index: number; task: TarefaAI } | null>(null);
  const [addingContextTask, setAddingContextTask] = useState<{ index: number; task: TarefaAI } | null>(null);

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

  const handleApprove = async () => {
    if (selectedTasks.size === 0) {
      alert('Selecione pelo menos uma tarefa para aprovar.');
      return;
    }

    setIsApproving(true);
    try {
      const selectedTasksArray = tasks
        .map((task, index) => selectedTasks.has(index) ? { ...task, selecionada: true } : null)
        .filter(Boolean);

      const response = await fetch(`/api/planning/${planning.id}/approve-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvedTasks: selectedTasksArray
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao aprovar tarefas');
      }

      // Mostrar notificação de sucesso
      // TODO: Implementar sistema de notificações
      console.log('Tarefas aprovadas com sucesso!');
      
    } catch (error) {
      console.error('Erro ao aprovar tarefas:', error);
      // TODO: Implementar notificação de erro
    } finally {
      setIsApproving(false);
    }
  };

  const selectedCount = selectedTasks.size;

  return (
    <div className="space-y-6">
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
            className="flex items-center gap-2 px-4 py-2 bg-periwinkle/20 text-periwinkle rounded-lg hover:bg-periwinkle/30 transition-colors"
          >
            {selectedTasks.size === tasks.length ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            ☑️ Selecionar todas as tarefas
          </button>
          
          <button
            onClick={handleApprove}
            disabled={selectedCount === 0 || isApproving}
            className="flex items-center gap-2 px-6 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              '✅'
            )}
            Aprovar selecionadas ({selectedCount})
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
            className="px-4 py-2 bg-seasalt/10 text-seasalt rounded-lg hover:bg-seasalt/20 transition-colors"
          >
            Voltar
          </button>
          
          <button
            onClick={handleApprove}
            disabled={selectedCount === 0 || isApproving}
            className="flex items-center gap-2 px-6 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              '✅'
            )}
            Aprovar selecionadas
          </button>
        </div>
      </div>

      {/* Modais */}
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