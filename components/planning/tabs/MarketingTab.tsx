'use client';

import { useState, useEffect } from 'react';
import { 
  MATURIDADE_MARKETING, 
  METAS_MARKETING, 
  DESCRICOES_MATURIDADE_MARKETING,
  MaturidadeMarketing,
  getMetasForMaturidadeMarketing 
} from '@/lib/planning/marketingConfig';

interface MarketingTabProps {
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export function MarketingTab({ formData, onFieldChange, errors }: MarketingTabProps) {
  const [selectedMaturidade, setSelectedMaturidade] = useState<string>(
    formData.maturidade_marketing || ""
  );

  const metas = selectedMaturidade ? getMetasForMaturidadeMarketing(selectedMaturidade as MaturidadeMarketing) : [];
  const descricao = selectedMaturidade ? DESCRICOES_MATURIDADE_MARKETING[selectedMaturidade as MaturidadeMarketing] : "";

  const handleMaturidadeChange = (value: string) => {
    setSelectedMaturidade(value);
    onFieldChange("maturidade_marketing", value);
    
    // Reset meta when maturity changes
    if (formData.meta_marketing) {
      onFieldChange("meta_marketing", "");
    }
    if (formData.meta_marketing_personalizada) {
      onFieldChange("meta_marketing_personalizada", "");
    }
  };

  const handleMetaChange = (value: string) => {
    onFieldChange("meta_marketing", value);
    
    // Clear custom meta if not "Outro"
    if (value !== "Outro" && formData.meta_marketing_personalizada) {
      onFieldChange("meta_marketing_personalizada", "");
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-seasalt mb-2">
          Maturidade de Marketing
        </h3>
        <p className="text-periwinkle text-sm">
          Avalie o atual nível de maturidade do marketing da sua empresa para personalizarmos as estratégias.
        </p>
      </div>

      {/* Maturidade de Marketing - Dropdown */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-seasalt">
          Qual é o nível atual de maturidade do seu marketing?
          <span className="text-red-400 ml-1">*</span>
        </label>
        
        <select
          value={selectedMaturidade}
          onChange={(e) => handleMaturidadeChange(e.target.value)}
          className="w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
        >
          <option value="">Selecione o nível de maturidade...</option>
          {MATURIDADE_MARKETING.map((maturidade) => (
            <option key={maturidade} value={maturidade}>
              {maturidade}
            </option>
          ))}
        </select>
        
        {errors.maturidade_marketing && (
          <p className="text-red-400 text-sm">{errors.maturidade_marketing}</p>
        )}
      </div>

      {/* Descrição da Maturidade Selecionada */}
      {selectedMaturidade && descricao && (
        <div className="bg-eerie-black rounded-lg p-4">
          <h4 className="text-seasalt font-medium mb-2">📊 Sua situação atual</h4>
          <p className="text-periwinkle text-sm">{descricao}</p>
        </div>
      )}

      {/* Meta de Marketing (Condicional) */}
      {metas.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-seasalt">
            Qual meta de marketing é mais importante para você agora?
            <span className="text-red-400 ml-1">*</span>
          </label>
          
          <select
            value={formData.meta_marketing || ""}
            onChange={(e) => handleMetaChange(e.target.value)}
            className="w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
          >
            <option value="">Selecione uma meta...</option>
            {metas.map((meta) => (
              <option key={meta} value={meta}>
                {meta}
              </option>
            ))}
          </select>
          
          {errors.meta_marketing && (
            <p className="text-red-400 text-sm">{errors.meta_marketing}</p>
          )}
        </div>
      )}

      {/* Campo Personalizado (quando "Outro" é selecionado) */}
      {formData.meta_marketing === "Outro" && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-seasalt">
            Especifique sua meta personalizada:
            <span className="text-red-400 ml-1">*</span>
          </label>
          
          <textarea
            value={formData.meta_marketing_personalizada || ""}
            onChange={(e) => onFieldChange("meta_marketing_personalizada", e.target.value)}
            placeholder="Descreva qual é sua meta específica de marketing..."
            rows={3}
            className="w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20 resize-none"
          />
          
          {errors.meta_marketing_personalizada && (
            <p className="text-red-400 text-sm">{errors.meta_marketing_personalizada}</p>
          )}
        </div>
      )}

      {/* Dica */}
      <div className="mt-8 p-4 bg-eerie-black rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-sgbus-green/20 rounded-full flex items-center justify-center">
              <span className="text-sgbus-green text-sm">📈</span>
            </div>
          </div>
          <div>
            <h4 className="text-seasalt font-medium mb-1">Dica Estratégica</h4>
            <p className="text-periwinkle text-sm">
              Com base na sua maturidade e meta selecionada, a IA criará estratégias específicas 
              para evoluir seu marketing de forma gradual e sustentável.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 