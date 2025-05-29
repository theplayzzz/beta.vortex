'use client';

import { useState } from 'react';
import { X, MessageSquare } from 'lucide-react';
import type { TarefaAI } from '@/types/planning';

interface AddContextModalProps {
  task: TarefaAI;
  isOpen: boolean;
  onClose: () => void;
  onSave: (context: string) => void;
}

export function AddContextModal({ task, isOpen, onClose, onSave }: AddContextModalProps) {
  const [context, setContext] = useState(task.contexto_adicional || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      onSave(context.trim());
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const maxLength = 500;
  const remainingChars = maxLength - context.length;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-eerie-black border border-accent/20 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-seasalt">
            📝 Adicionar Contexto
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-seasalt/70 hover:text-seasalt transition-colors rounded-lg hover:bg-seasalt/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Informações da tarefa */}
          <div className="bg-night/50 rounded-lg p-4 border border-accent/10">
            <h4 className="font-medium text-seasalt mb-2">
              {task.nome}
            </h4>
            <p className="text-seasalt/70 text-sm leading-relaxed">
              {task.descricao}
            </p>
          </div>

          {/* Campo de contexto */}
          <div>
            <label className="block text-sm font-medium text-seasalt mb-2">
              Contexto Adicional
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={8}
              className="w-full bg-night border border-accent/20 rounded-lg px-4 py-3 text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none transition-colors resize-none"
              placeholder="Adicione informações específicas, requisitos especiais ou detalhes importantes para esta tarefa..."
              maxLength={maxLength}
            />
            <div className={`text-xs mt-1 ${remainingChars < 50 ? 'text-amber-400' : 'text-seasalt/50'}`}>
              {remainingChars >= 0 ? `${remainingChars} caracteres restantes` : `${Math.abs(remainingChars)} caracteres excedidos`}
            </div>
          </div>

          {/* Preview do contexto */}
          {context.trim() && (
            <div className="bg-sgbus-green/10 border border-sgbus-green/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-sgbus-green" />
                <span className="text-sm font-medium text-sgbus-green">Preview do Contexto:</span>
              </div>
              <p className="text-seasalt/80 text-sm leading-relaxed">
                {context.trim()}
              </p>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2 bg-seasalt/10 text-seasalt rounded-lg hover:bg-seasalt/20 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving || remainingChars < 0}
            className="flex items-center gap-2 px-6 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-night/30 border-t-night rounded-full animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            {context.trim() ? 'Atualizar contexto' : 'Adicionar contexto'}
          </button>
        </div>
      </div>
    </div>
  );
} 