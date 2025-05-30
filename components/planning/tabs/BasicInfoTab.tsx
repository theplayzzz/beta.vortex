'use client';

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
  errors: Record<string, string>;
}

export function BasicInfoTab({ client, formData, onFieldChange, errors }: BasicInfoTabProps) {
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
          value={formData.titulo_planejamento || ''}
          onChange={(e) => onFieldChange('titulo_planejamento', e.target.value)}
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
          value={formData.descricao_objetivo || ''}
          onChange={(e) => onFieldChange('descricao_objetivo', e.target.value)}
          placeholder="Descreva qual é o principal objetivo que você deseja alcançar com este planejamento..."
          rows={4}
          className="w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20 resize-none"
        />
      </div>
    </div>
  );
} 