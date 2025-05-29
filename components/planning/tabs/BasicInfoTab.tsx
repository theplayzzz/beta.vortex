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
        
        {errors.titulo_planejamento && (
          <p className="text-red-400 text-sm">{errors.titulo_planejamento}</p>
        )}
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
        
        {errors.descricao_objetivo && (
          <p className="text-red-400 text-sm">{errors.descricao_objetivo}</p>
        )}
      </div>

      {/* Setor (Readonly) */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-seasalt">
          Setor do Cliente
        </label>
        
        <div className="w-full px-4 py-3 bg-eerie-black border border-seasalt/10 rounded-lg text-seasalt">
          {client.industry}
          {client.industry === "Outro" && client.businessDetails && (
            <div className="mt-2 text-periwinkle text-sm">
              <strong>Detalhes:</strong> {client.businessDetails}
            </div>
          )}
        </div>
        
        <p className="text-periwinkle text-xs">
          O setor é definido no cadastro do cliente e não pode ser alterado aqui.
        </p>
      </div>

      {/* Informações do Cliente (Contexto) */}
      <div className="bg-eerie-black rounded-lg p-4">
        <h4 className="text-seasalt font-medium mb-3 flex items-center">
          📋 Contexto do Cliente
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-periwinkle">Cliente:</span>
            <div className="text-seasalt font-medium">{client.name}</div>
          </div>
          <div>
            <span className="text-periwinkle">Setor:</span>
            <div className="text-seasalt">{client.industry}</div>
          </div>
          <div>
            <span className="text-periwinkle">Score de Dados:</span>
            <div className="text-seasalt">{client.richnessScore}%</div>
          </div>
          <div>
            <span className="text-periwinkle">ID do Cliente:</span>
            <div className="text-seasalt font-mono text-xs">{client.id}</div>
          </div>
        </div>
      </div>

      {/* Dica */}
      <div className="mt-8 p-4 bg-eerie-black rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-sgbus-green/20 rounded-full flex items-center justify-center">
              <span className="text-sgbus-green text-sm">💡</span>
            </div>
          </div>
          <div>
            <h4 className="text-seasalt font-medium mb-1">Dica de Preenchimento</h4>
            <p className="text-periwinkle text-sm">
              Seja específico no título e objetivo. Essas informações guiarão toda a criação 
              do planejamento estratégico pela IA. Evite termos muito genéricos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 