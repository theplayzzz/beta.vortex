'use client';

import { useState, useEffect, memo } from 'react';
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
  onFieldBlur: () => void;
  errors: Record<string, string>;
}

export const MarketingTab = memo(function MarketingTab({ formData, onFieldChange, onFieldBlur, errors }: MarketingTabProps) {
  // Estado local para evitar re-renderizações durante a digitação
  const [localValues, setLocalValues] = useState({
    maturidade_marketing: formData.maturidade_marketing || "",
    meta_marketing: formData.meta_marketing || "",
    meta_marketing_personalizada: formData.meta_marketing_personalizada || ""
  });

  // Estado para controlar erros locais (limpar quando campo se torna válido)
  const [clearedErrors, setClearedErrors] = useState<Set<string>>(new Set());

  // Função para obter classes CSS do campo baseado no estado de erro
  const getFieldClasses = (field: string, baseClasses: string): string => {
    const hasError = !!errors[field] && !clearedErrors.has(field);
    
    if (hasError) {
      return `${baseClasses.replace('border-seasalt/20', 'border-red-500/60')} focus:border-red-500 focus:ring-red-500/20`;
    }
    
    return baseClasses;
  };

  // Função para limpar erro quando campo se torna válido
  const clearErrorIfValid = (field: string, value: any) => {
    if (errors[field] && value && value.toString().trim().length > 0) {
      setClearedErrors(prev => new Set(Array.from(prev).concat([field])));
    }
  };

  // Sincronizar estado local com formData quando formData mudar
  useEffect(() => {
    setLocalValues({
      maturidade_marketing: formData.maturidade_marketing || "",
      meta_marketing: formData.meta_marketing || "",
      meta_marketing_personalizada: formData.meta_marketing_personalizada || ""
    });
  }, [formData.maturidade_marketing, formData.meta_marketing, formData.meta_marketing_personalizada]);

  // Resetar erros limpos quando novos erros chegam (novo submit)
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setClearedErrors(new Set());
    }
  }, [errors]);

  const metas = localValues.maturidade_marketing ? getMetasForMaturidadeMarketing(localValues.maturidade_marketing as MaturidadeMarketing) : [];
  const descricao = localValues.maturidade_marketing ? DESCRICOES_MATURIDADE_MARKETING[localValues.maturidade_marketing as MaturidadeMarketing] : "";

  // Função para atualizar campo no formulário e salvar no localStorage
  const handleFieldBlur = (field: string, value: any) => {
    onFieldChange(field, value);
    onFieldBlur();
  };

  const handleMaturidadeChange = (value: string) => {
    setLocalValues(prev => ({ 
      ...prev, 
      maturidade_marketing: value,
      // Reset meta when maturity changes
      meta_marketing: "",
      meta_marketing_personalizada: ""
    }));
    clearErrorIfValid('maturidade_marketing', value);
  };

  const handleMaturidadeBlur = (value: string) => {
    onFieldChange("maturidade_marketing", value);
    // Reset meta when maturity changes
    onFieldChange("meta_marketing", "");
    onFieldChange("meta_marketing_personalizada", "");
    onFieldBlur();
  };

  const handleMetaChange = (value: string) => {
    setLocalValues(prev => ({ 
      ...prev, 
      meta_marketing: value,
      // Clear custom meta if not "Outro"
      meta_marketing_personalizada: value !== "Outro" ? "" : prev.meta_marketing_personalizada
    }));
    clearErrorIfValid('meta_marketing', value);
  };

  const handleMetaBlur = (value: string) => {
    onFieldChange("meta_marketing", value);
    // Clear custom meta if not "Outro"
    if (value !== "Outro") {
      onFieldChange("meta_marketing_personalizada", "");
    }
    onFieldBlur();
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
          value={localValues.maturidade_marketing}
          onChange={(e) => handleMaturidadeChange(e.target.value)}
          onBlur={(e) => handleMaturidadeBlur(e.target.value)}
          className={getFieldClasses('maturidade_marketing', "w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20")}
        >
          <option value="">Selecione o nível de maturidade...</option>
          {MATURIDADE_MARKETING.map((maturidade) => (
            <option key={maturidade} value={maturidade}>
              {maturidade}
            </option>
          ))}
        </select>
      </div>

      {/* Descrição da Maturidade Selecionada */}
      {localValues.maturidade_marketing && descricao && (
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
            value={localValues.meta_marketing}
            onChange={(e) => handleMetaChange(e.target.value)}
            onBlur={(e) => handleMetaBlur(e.target.value)}
            className={getFieldClasses('meta_marketing', "w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20")}
          >
            <option value="">Selecione uma meta...</option>
            {metas.map((meta) => (
              <option key={meta} value={meta}>
                {meta}
              </option>
            ))}
          </select>
          
          {/* Mensagem de erro */}
          {errors.meta_marketing && !clearedErrors.has('meta_marketing') && (
            <p className="text-red-400 text-sm flex items-center mt-1">
              <span className="mr-1">⚠️</span>
              {errors.meta_marketing}
            </p>
          )}
        </div>
      )}

      {/* Campo Personalizado (quando "Outro" é selecionado) */}
      {localValues.meta_marketing === "Outro" && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-seasalt">
            Especifique sua meta personalizada:
            <span className="text-red-400 ml-1">*</span>
          </label>
          
          <textarea
            value={localValues.meta_marketing_personalizada}
            onChange={(e) => {
              const value = e.target.value;
              setLocalValues(prev => ({ ...prev, meta_marketing_personalizada: value }));
              clearErrorIfValid('meta_marketing_personalizada', value);
            }}
            onBlur={(e) => handleFieldBlur("meta_marketing_personalizada", e.target.value)}
            placeholder="Descreva qual é sua meta específica de marketing..."
            rows={3}
            className={getFieldClasses('meta_marketing_personalizada', "w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20 resize-none")}
          />
          
          {/* Mensagem de erro */}
          {errors.meta_marketing_personalizada && !clearedErrors.has('meta_marketing_personalizada') && (
            <p className="text-red-400 text-sm flex items-center mt-1">
              <span className="mr-1">⚠️</span>
              {errors.meta_marketing_personalizada}
            </p>
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
}); 