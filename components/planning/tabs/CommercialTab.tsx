'use client';

import { useState, useEffect } from 'react';
import { 
  MATURIDADE_COMERCIAL, 
  METAS_COMERCIAL, 
  DESCRICOES_MATURIDADE_COMERCIAL,
  MaturidadeComercial,
  getMetasForMaturidadeComercial 
} from '@/lib/planning/commercialConfig';

interface CommercialTabProps {
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export function CommercialTab({ formData, onFieldChange, errors }: CommercialTabProps) {
  const [selectedMaturidade, setSelectedMaturidade] = useState<string>(
    formData.maturidade_comercial || ""
  );

  const metas = selectedMaturidade ? getMetasForMaturidadeComercial(selectedMaturidade as MaturidadeComercial) : [];
  const descricao = selectedMaturidade ? DESCRICOES_MATURIDADE_COMERCIAL[selectedMaturidade as MaturidadeComercial] : "";

  const handleMaturidadeChange = (value: string) => {
    setSelectedMaturidade(value);
    onFieldChange("maturidade_comercial", value);
    
    // Reset meta when maturity changes
    if (formData.meta_comercial) {
      onFieldChange("meta_comercial", "");
    }
    if (formData.meta_comercial_personalizada) {
      onFieldChange("meta_comercial_personalizada", "");
    }
  };

  const handleMetaChange = (value: string) => {
    onFieldChange("meta_comercial", value);
    
    // Clear custom meta if not "Outro"
    if (value !== "Outro" && formData.meta_comercial_personalizada) {
      onFieldChange("meta_comercial_personalizada", "");
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-seasalt mb-2">
          Maturidade Comercial
        </h3>
        <p className="text-periwinkle text-sm">
          Avalie o atual nível de estruturação do processo comercial da sua empresa.
        </p>
      </div>

      {/* Maturidade Comercial - Dropdown */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-seasalt">
          Qual é o nível atual de maturidade do seu processo comercial?
          <span className="text-red-400 ml-1">*</span>
        </label>
        
        <select
          value={selectedMaturidade}
          onChange={(e) => handleMaturidadeChange(e.target.value)}
          className="w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
        >
          <option value="">Selecione o nível de maturidade...</option>
          {MATURIDADE_COMERCIAL.map((maturidade) => (
            <option key={maturidade} value={maturidade}>
              {maturidade}
            </option>
          ))}
        </select>
      </div>

      {/* Descrição da Maturidade Selecionada */}
      {selectedMaturidade && descricao && (
        <div className="bg-eerie-black rounded-lg p-4">
          <h4 className="text-seasalt font-medium mb-2">💼 Sua situação atual</h4>
          <p className="text-periwinkle text-sm">{descricao}</p>
        </div>
      )}

      {/* Meta Comercial (Condicional) */}
      {metas.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-seasalt">
            Qual meta comercial é mais importante para você agora?
            <span className="text-red-400 ml-1">*</span>
          </label>
          
          <select
            value={formData.meta_comercial || ""}
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
        </div>
      )}

      {/* Campo Personalizado (quando "Outro" é selecionado) */}
      {formData.meta_comercial === "Outro" && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-seasalt">
            Especifique sua meta personalizada:
            <span className="text-red-400 ml-1">*</span>
          </label>
          
          <textarea
            value={formData.meta_comercial_personalizada || ""}
            onChange={(e) => onFieldChange("meta_comercial_personalizada", e.target.value)}
            placeholder="Descreva qual é sua meta específica comercial..."
            rows={3}
            className="w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20 resize-none"
          />
        </div>
      )}

      {/* Dica */}
      <div className="mt-8 p-4 bg-eerie-black rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-sgbus-green/20 rounded-full flex items-center justify-center">
              <span className="text-sgbus-green text-sm">🎯</span>
            </div>
          </div>
          <div>
            <h4 className="text-seasalt font-medium mb-1">Dica Estratégica</h4>
            <p className="text-periwinkle text-sm">
              O planejamento comercial será personalizado considerando sua maturidade atual 
              e objetivos específicos, criando um roadmap de evolução gradual e eficaz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 