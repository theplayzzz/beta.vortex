'use client';

import { useState } from 'react';
import { CheckSquare, Square, MoreVertical, Edit3, MessageSquare } from 'lucide-react';
import type { TarefaAI } from '@/types/planning';

interface TaskCardProps {
  task: TarefaAI;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onAddContext: () => void;
}

const getPriorityBadge = (priority: string) => {
  const configs = {
    'alta': { 
      label: 'Alta', 
      className: 'bg-red-500/20 text-red-400 border-red-500/30' 
    },
    'média': { 
      label: 'Média', 
      className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' 
    },
    'normal': { 
      label: 'Normal', 
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
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
  onAddContext
}: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  
  const priorityConfig = getPriorityBadge(task.prioridade);

  return (
    <div 
      className={`relative bg-night border rounded-lg p-4 transition-all hover:border-sgbus-green/40 ${
        isSelected 
          ? 'border-sgbus-green bg-sgbus-green/5' 
          : 'border-accent/20'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={onSelect}
          className="mt-1 text-seasalt/70 hover:text-sgbus-green transition-colors"
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-sgbus-green" />
          ) : (
            <Square className="h-5 w-5" />
          )}
        </button>

        {/* Conteúdo da tarefa */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h4 
              className="font-medium text-seasalt text-lg leading-tight cursor-pointer hover:text-sgbus-green transition-colors"
              onClick={() => setShowDescription(!showDescription)}
              title="Clique para ver/ocultar descrição"
            >
              {task.nome}
            </h4>
            
            <div className="flex items-center gap-3 ml-4">
              {/* Badge de prioridade */}
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityConfig.className}`}>
                {priorityConfig.label}
              </span>

              {/* Menu de ações */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-seasalt/70 hover:text-seasalt transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-8 bg-eerie-black border border-accent/20 rounded-lg shadow-lg z-10 min-w-[180px]">
                    <button
                      onClick={() => {
                        onEdit();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-seasalt/90 hover:bg-seasalt/10 transition-colors text-left"
                    >
                      <Edit3 className="h-4 w-4" />
                      ✏️ Editar tarefa
                    </button>
                    
                    <button
                      onClick={() => {
                        onAddContext();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-seasalt/90 hover:bg-seasalt/10 transition-colors text-left"
                    >
                      <MessageSquare className="h-4 w-4" />
                      📝 Adicionar contexto
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Descrição (quando expandida) */}
          {showDescription && (
            <div className="mt-3 p-3 bg-eerie-black/50 rounded-lg border border-accent/10">
              <p className="text-seasalt/80 text-sm leading-relaxed">
                {task.descricao}
              </p>
              {task.contexto_adicional && (
                <div className="mt-2 pt-2 border-t border-accent/10">
                  <span className="text-xs text-sgbus-green font-medium">Contexto adicional:</span>
                  <p className="text-seasalt/70 text-xs mt-1">
                    {task.contexto_adicional}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tooltip hint */}
          {!showDescription && (
            <p className="text-seasalt/50 text-xs mt-1">
              Clique no título para ver a descrição completa
            </p>
          )}
        </div>
      </div>

      {/* Click outside handler para fechar menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
} 