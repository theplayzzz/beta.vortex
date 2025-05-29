'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { TarefaAI } from '@/types/planning';

interface EditTaskModalProps {
  task: TarefaAI;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: TarefaAI) => void;
}

export function EditTaskModal({ task, isOpen, onClose, onSave }: EditTaskModalProps) {
  const [nome, setNome] = useState(task.nome);
  const [descricao, setDescricao] = useState(task.descricao);
  const [prioridade, setPrioridade] = useState(task.prioridade);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!nome.trim() || !descricao.trim()) {
      alert('Nome e descrição são obrigatórios.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedTask: TarefaAI = {
        ...task,
        nome: nome.trim(),
        descricao: descricao.trim(),
        prioridade
      };
      
      onSave(updatedTask);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-eerie-black border border-accent/20 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-seasalt">
            ✏️ Editar Tarefa
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-seasalt/70 hover:text-seasalt transition-colors rounded-lg hover:bg-seasalt/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Nome da tarefa */}
          <div>
            <label className="block text-sm font-medium text-seasalt mb-2">
              Nome da Tarefa
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-night border border-accent/20 rounded-lg px-4 py-3 text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none transition-colors"
              placeholder="Digite o nome da tarefa..."
              maxLength={200}
            />
            <div className="text-xs text-seasalt/50 mt-1">
              {nome.length}/200 caracteres
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-seasalt mb-2">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={6}
              className="w-full bg-night border border-accent/20 rounded-lg px-4 py-3 text-seasalt placeholder-seasalt/50 focus:border-sgbus-green focus:outline-none transition-colors resize-none"
              placeholder="Digite a descrição detalhada da tarefa..."
              maxLength={1000}
            />
            <div className="text-xs text-seasalt/50 mt-1">
              {descricao.length}/1000 caracteres
            </div>
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-sm font-medium text-seasalt mb-2">
              Prioridade
            </label>
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as TarefaAI['prioridade'])}
              className="w-full bg-night border border-accent/20 rounded-lg px-4 py-3 text-seasalt focus:border-sgbus-green focus:outline-none transition-colors"
            >
              <option value="normal">🔵 Normal</option>
              <option value="média">🟠 Média</option>
              <option value="alta">🔴 Alta</option>
            </select>
          </div>
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
            disabled={isSaving || !nome.trim() || !descricao.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-night/30 border-t-night rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
} 