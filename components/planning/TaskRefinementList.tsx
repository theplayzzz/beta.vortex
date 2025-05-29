'use client';

import { TaskCard } from './TaskCard';
import type { TarefaAI } from '@/types/planning';

interface TaskRefinementListProps {
  tasks: TarefaAI[];
  selectedTasks: Set<number>;
  onTaskSelect: (index: number) => void;
  onEditTask: (index: number, task: TarefaAI) => void;
  onAddContext: (index: number, task: TarefaAI) => void;
}

export function TaskRefinementList({
  tasks,
  selectedTasks,
  onTaskSelect,
  onEditTask,
  onAddContext
}: TaskRefinementListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-seasalt/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <h3 className="text-lg font-semibold text-seasalt/70 mb-2">
          Nenhuma tarefa encontrada
        </h3>
        <p className="text-seasalt/50">
          Não foi possível carregar as tarefas geradas pela IA.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task, index) => (
        <TaskCard
          key={index}
          task={task}
          index={index}
          isSelected={selectedTasks.has(index)}
          onSelect={() => onTaskSelect(index)}
          onEdit={() => onEditTask(index, task)}
          onAddContext={() => onAddContext(index, task)}
        />
      ))}
    </div>
  );
} 