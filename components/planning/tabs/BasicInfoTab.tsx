'use client';

import { memo, useState, useEffect } from 'react';
import { SetorPermitido } from '@/lib/planning/sectorConfig';

interface Client {
  id: string;
  name: string;
  industry: string;
  richnessScore: number;
  businessDetails?: string;
}

interface BasicInfoTabProps {
  client: Client;
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
  onFieldBlur: () => void;
  errors: Record<string, string>;
}

export const BasicInfoTab = memo(function BasicInfoTab({ client, formData, onFieldChange, onFieldBlur, errors }: BasicInfoTabProps) {
  // Estado local para evitar re-renderizações durante a digitação
  const [localValues, setLocalValues] = useState({
    titulo_planejamento: formData.titulo_planejamento || '',
    descricao_objetivo: formData.descricao_objetivo || ''
  });

  // Sincronizar estado local com formData quando formData mudar (ex: carregamento do localStorage)
  useEffect(() => {
    setLocalValues({
      titulo_planejamento: formData.titulo_planejamento || '',
      descricao_objetivo: formData.descricao_objetivo || ''
    });
  }, [formData.titulo_planejamento, formData.descricao_objetivo]);

  // Função para atualizar campo no formulário e salvar no localStorage
  const handleFieldBlur = (field: string, value: string) => {
    onFieldChange(field, value);
    onFieldBlur();
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-seasalt mb-2">
          Informações Básicas do Planejamento
        </h3>
        <p className="text-periwinkle text-sm">
          Defina as informações fundamentais do seu planejamento estratégico.
        </p>
      </div>

      {/* Título do Planejamento */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-seasalt">
          Título do Planejamento
          <span className="text-red-400 ml-1">*</span>
        </label>
        
        <input
          type="text"
          value={localValues.titulo_planejamento}
          onChange={(e) => setLocalValues(prev => ({ ...prev, titulo_planejamento: e.target.value }))}
          onBlur={(e) => handleFieldBlur('titulo_planejamento', e.target.value)}
          placeholder="Ex: Expansão Digital 2024, Crescimento de Vendas Q1..."
          className="w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
        />
      </div>

      {/* Descrição do Objetivo */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-seasalt">
          Descrição do Objetivo Principal
          <span className="text-red-400 ml-1">*</span>
        </label>
        
        <textarea
          value={localValues.descricao_objetivo}
          onChange={(e) => setLocalValues(prev => ({ ...prev, descricao_objetivo: e.target.value }))}
          onBlur={(e) => handleFieldBlur('descricao_objetivo', e.target.value)}
          placeholder="Descreva qual é o principal objetivo que você deseja alcançar com este planejamento..."
          rows={4}
          className="w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20 resize-none"
        />
      </div>
    </div>
  );
}); 