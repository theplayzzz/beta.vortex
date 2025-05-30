'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle2, Circle, Clock, User, Flag } from 'lucide-react';
import type { TarefaRefinada } from '@/types/planning';

interface RefinedTaskListProps {
  tasks: TarefaRefinada[];
  onTaskClick: (task: TarefaRefinada, index: number) => void;
}

// Função para formatar texto com quebras de linha e listas
function formatText(text: string) {
  if (!text) return null;
  
  const lines = text.split('\n');
  
  return lines.map((line, index) => {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      return <br key={index} />;
    }
    
    // Se a linha começa com "-", renderizar como item de lista
    if (trimmedLine.startsWith('-')) {
      return (
        <div key={index} className="flex items-start gap-2 mt-1">
          <span className="text-sgbus-green mt-1 flex-shrink-0 text-xs">•</span>
          <span className="text-xs">{trimmedLine.substring(1).trim()}</span>
        </div>
      );
    }
    
    // Linha normal
    return (
      <div key={index} className={index > 0 ? "mt-1" : ""}>
        {trimmedLine}
      </div>
    );
  });
}

export function RefinedTaskList({ tasks, onTaskClick }: RefinedTaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  const toggleTaskExpansion = (index: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTasks(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'text-red-400 bg-red-500/20';
      case 'média':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'normal':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'alta':
        return '🔴';
      case 'média':
        return '🟡';
      case 'normal':
        return '🟢';
      default:
        return '⚪';
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <Circle className="h-12 w-12 mx-auto mb-4 text-seasalt/40" />
        <h3 className="text-lg font-semibold text-seasalt/70 mb-2">
          Nenhuma tarefa refinada encontrada
        </h3>
        <p className="text-seasalt/50">
          As tarefas refinadas aparecerão aqui após o processamento da IA.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => {
        const isExpanded = expandedTasks.has(index);
        
        return (
          <div
            key={index}
            className="bg-night rounded-lg border border-accent/20 hover:border-accent/40 transition-all duration-200"
          >
            {/* Task Header */}
            <div className="flex items-center gap-3 p-4">
              {/* Expand/Collapse Button */}
              <button
                onClick={() => toggleTaskExpansion(index)}
                className="p-1 text-seasalt/70 hover:text-seasalt transition-colors rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Task Status Icon */}
              <div className="flex-shrink-0">
                <Circle className="h-5 w-5 text-seasalt/50 hover:text-sgbus-green transition-colors cursor-pointer" />
              </div>

              {/* Task Name */}
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => onTaskClick(task, index)}
                  className="text-left w-full group"
                >
                  <h4 className="text-seasalt font-medium group-hover:text-sgbus-green transition-colors truncate">
                    {task.nome}
                  </h4>
                </button>
              </div>

              {/* Priority Badge */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.prioridade)}`}>
                <span>{getPriorityIcon(task.prioridade)}</span>
                <span className="capitalize">{task.prioridade}</span>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1 text-seasalt/50 hover:text-seasalt transition-colors rounded">
                  <User className="h-4 w-4" />
                </button>
                <button className="p-1 text-seasalt/50 hover:text-seasalt transition-colors rounded">
                  <Clock className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-accent/20">
                <div className="pt-4 space-y-3">
                  {/* Description */}
                  <div>
                    <h5 className="text-sm font-medium text-seasalt/80 mb-2">Descrição</h5>
                    <p className="text-seasalt/70 text-sm leading-relaxed">
                      {task.descricao}
                    </p>
                  </div>

                  {/* Output/Deliverable */}
                  {task.output && (
                    <div>
                      <h5 className="text-sm font-medium text-seasalt/80 mb-2">Entregável</h5>
                      <div className="bg-eerie-black rounded-lg p-3 border border-accent/20">
                        <div className="text-seasalt/70 text-sm leading-relaxed">
                          {formatText(task.output)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => onTaskClick(task, index)}
                      className="px-3 py-1.5 bg-sgbus-green/20 text-sgbus-green rounded-lg hover:bg-sgbus-green/30 transition-colors text-sm font-medium"
                    >
                      Ver Detalhes
                    </button>
                    <button className="px-3 py-1.5 bg-seasalt/10 text-seasalt rounded-lg hover:bg-seasalt/20 transition-colors text-sm">
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 