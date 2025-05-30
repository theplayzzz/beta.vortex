'use client';

import { useEffect } from 'react';
import { X, Flag, Clock, User, CheckCircle2 } from 'lucide-react';
import type { TarefaRefinada } from '@/types/planning';

interface TaskDetailModalProps {
  task: TarefaRefinada | null;
  isOpen: boolean;
  onClose: () => void;
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
          <span className="text-sgbus-green mt-1 flex-shrink-0">•</span>
          <span>{trimmedLine.substring(1).trim()}</span>
        </div>
      );
    }
    
    // Linha normal
    return (
      <div key={index} className={index > 0 ? "mt-2" : ""}>
        {trimmedLine}
      </div>
    );
  });
}

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll do body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'média':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'normal':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
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

  return (
    <div className="fixed inset-0 bg-night/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-eerie-black rounded-lg border border-accent/20 shadow-2xl max-w-2xl w-full mx-auto max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-seasalt/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-sgbus-green" />
            <h3 className="text-xl font-semibold text-seasalt">
              Detalhes da Tarefa
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-seasalt/70 hover:text-seasalt transition-colors rounded-lg hover:bg-seasalt/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Task Title */}
            <div>
              <h4 className="text-2xl font-bold text-seasalt mb-2">
                {task.nome}
              </h4>
              
              {/* Priority Badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${getPriorityColor(task.prioridade)}`}>
                <span>{getPriorityIcon(task.prioridade)}</span>
                <span className="capitalize">Prioridade {task.prioridade}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h5 className="text-lg font-semibold text-seasalt mb-3 flex items-center gap-2">
                <Flag className="h-5 w-5 text-sgbus-green" />
                Descrição
              </h5>
              <div className="bg-night rounded-lg p-4 border border-accent/20">
                <p className="text-seasalt/80 leading-relaxed">
                  {task.descricao}
                </p>
              </div>
            </div>

            {/* Output/Deliverable */}
            {task.output && (
              <div>
                <h5 className="text-lg font-semibold text-seasalt mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-sgbus-green" />
                  Entregável Esperado
                </h5>
                <div className="bg-sgbus-green/10 rounded-lg p-4 border border-sgbus-green/20">
                  <div className="text-seasalt/80 leading-relaxed">
                    {formatText(task.output)}
                  </div>
                </div>
              </div>
            )}

            {/* Task Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-night rounded-lg p-4 border border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-seasalt/70" />
                  <span className="text-sm font-medium text-seasalt/70">Responsável</span>
                </div>
                <p className="text-seasalt">Não atribuído</p>
              </div>

              <div className="bg-night rounded-lg p-4 border border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-seasalt/70" />
                  <span className="text-sm font-medium text-seasalt/70">Status</span>
                </div>
                <p className="text-seasalt">Pendente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-seasalt/20">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-seasalt/10 text-seasalt rounded-lg hover:bg-seasalt/20 transition-colors"
          >
            Fechar
          </button>
          
          <button className="px-6 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 transition-colors font-medium">
            Editar Tarefa
          </button>
        </div>
      </div>
    </div>
  );
} 