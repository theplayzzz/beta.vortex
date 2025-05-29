'use client';

import { useState } from 'react';
import { CheckSquare, Square, Edit3, MessageSquare } from 'lucide-react';
import type { TarefaAI } from '@/types/planning';

interface TaskCardProps {
  task: TarefaAI;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onAddContext: () => void;
  onPriorityChange?: (priority: TarefaAI['prioridade']) => void;
}

const getPriorityBadge = (priority: string, isActive: boolean = false) => {
  const configs = {
    'normal': { 
      label: 'Normal', 
      className: isActive 
        ? 'bg-green-500 text-white border-green-500' 
        : 'bg-green-500/10 text-green-400/60 border-green-500/20 hover:bg-green-500/20 hover:text-green-400' 
    },
    'média': { 
      label: 'Média', 
      className: isActive 
        ? 'bg-yellow-500 text-black border-yellow-500' 
        : 'bg-yellow-500/10 text-yellow-400/60 border-yellow-500/20 hover:bg-yellow-500/20 hover:text-yellow-400' 
    },
    'alta': { 
      label: 'Alta', 
      className: isActive 
        ? 'bg-red-500 text-white border-red-500' 
        : 'bg-red-500/10 text-red-400/60 border-red-500/20 hover:bg-red-500/20 hover:text-red-400' 
    }
  };
  
  return configs[priority as keyof typeof configs] || configs.normal;
};

export function TaskCard({
  task,
  index,
  isSelected,
  onSelect,
  onEdit,
  onAddContext,
  onPriorityChange
}: TaskCardProps) {
  const handlePriorityChange = (newPriority: TarefaAI['prioridade']) => {
    if (onPriorityChange) {
      onPriorityChange(newPriority);
    }
  };

  return (
    <div 
      className={`relative bg-night border rounded-lg p-4 transition-all hover:border-sgbus-green/40 ${
        isSelected 
          ? 'border-sgbus-green bg-sgbus-green/5' 
          : 'border-accent/20'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Lado esquerdo: Checkbox + Conteúdo da tarefa */}
        <div className="flex items-start gap-3 flex-1">
          {/* Checkbox */}
          <button
            onClick={onSelect}
            className="mt-1 text-seasalt/70 hover:text-sgbus-green transition-colors flex-shrink-0"
          >
            {isSelected ? (
              <CheckSquare className="h-5 w-5 text-sgbus-green" />
            ) : (
              <Square className="h-5 w-5" />
            )}
          </button>

          {/* Conteúdo da tarefa */}
          <div className="flex-1">
            {/* Título da tarefa */}
            <h4 className="font-medium text-seasalt text-base leading-tight mb-2">
              {task.nome}
            </h4>

            {/* Descrição sempre visível */}
            <div className="mb-2">
              <p className="text-seasalt/70 text-sm leading-relaxed">
                {task.descricao}
              </p>
              {task.contexto_adicional && (
                <div className="mt-2 pt-2 border-t border-accent/10">
                  <span className="text-xs text-sgbus-green font-medium">Contexto adicional:</span>
                  <p className="text-seasalt/60 text-xs mt-1">
                    {task.contexto_adicional}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lado direito: Botões de ação + Seletor de prioridade */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {/* Botões de ação */}
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-2 py-0.5 bg-seasalt/10 text-seasalt rounded hover:bg-seasalt/20 transition-colors text-xs whitespace-nowrap"
            >
              <Edit3 className="h-2.5 w-2.5" />
              Editar tarefa
            </button>
            
            <button
              onClick={onAddContext}
              className="flex items-center gap-1 px-2 py-0.5 bg-seasalt/10 text-seasalt rounded hover:bg-seasalt/20 transition-colors text-xs whitespace-nowrap"
            >
              <MessageSquare className="h-2.5 w-2.5" />
              Adicionar contexto
            </button>
          </div>

          {/* Seletor de prioridade */}
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-seasalt/70 font-medium leading-none">Prioridade:</span>
            <div className="flex items-center gap-0.5">
              {(['normal', 'média', 'alta'] as const).map((priority) => {
                const priorityConfig = getPriorityBadge(priority, task.prioridade === priority);
                return (
                  <button
                    key={priority}
                    onClick={() => handlePriorityChange(priority)}
                    className={`px-1.5 py-0.5 rounded text-xs font-medium border transition-colors whitespace-nowrap ${priorityConfig.className}`}
                  >
                    {priorityConfig.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 