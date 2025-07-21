'use client';

import { useState, useEffect, memo } from 'react';
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
  onFieldBlur: () => void;
  errors: Record<string, string>;
}

export const CommercialTab = memo(function CommercialTab({ formData, onFieldChange, onFieldBlur, errors }: CommercialTabProps) {
  // Estado local para evitar re-renderizações durante a digitação
  const [localValues, setLocalValues] = useState({
    maturidade_comercial: formData.maturidade_comercial || "",
    meta_comercial: formData.meta_comercial || "",
    meta_comercial_personalizada: formData.meta_comercial_personalizada || ""
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
      maturidade_comercial: formData.maturidade_comercial || "",
      meta_comercial: formData.meta_comercial || "",
      meta_comercial_personalizada: formData.meta_comercial_personalizada || ""
    });
  }, [formData.maturidade_comercial, formData.meta_comercial, formData.meta_comercial_personalizada]);

  // Resetar erros limpos quando novos erros chegam (novo submit)
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setClearedErrors(new Set());
    }
  }, [errors]);

  const metas = localValues.maturidade_comercial ? getMetasForMaturidadeComercial(localValues.maturidade_comercial as MaturidadeComercial) : [];
  const descricao = localValues.maturidade_comercial ? DESCRICOES_MATURIDADE_COMERCIAL[localValues.maturidade_comercial as MaturidadeComercial] : "";

  // Função para atualizar campo no formulário e salvar no localStorage
  const handleFieldBlur = (field: string, value: any) => {
    onFieldChange(field, value);
    onFieldBlur();
  };

  const handleMaturidadeChange = (value: string) => {
    setLocalValues(prev => ({ 
      ...prev, 
      maturidade_comercial: value,
      // Reset meta when maturity changes
      meta_comercial: "",
      meta_comercial_personalizada: ""
    }));
    clearErrorIfValid('maturidade_comercial', value);
  };

  const handleMaturidadeBlur = (value: string) => {
    onFieldChange("maturidade_comercial", value);
    // Reset meta when maturity changes
    onFieldChange("meta_comercial", "");
    onFieldChange("meta_comercial_personalizada", "");
    onFieldBlur();
  };

  const handleMetaChange = (value: string) => {
    setLocalValues(prev => ({ 
      ...prev, 
      meta_comercial: value,
      // Clear custom meta if not "Outro"
      meta_comercial_personalizada: value !== "Outro" ? "" : prev.meta_comercial_personalizada
    }));
    clearErrorIfValid('meta_comercial', value);
  };

  const handleMetaBlur = (value: string) => {
    onFieldChange("meta_comercial", value);
    // Clear custom meta if not "Outro"
    if (value !== "Outro") {
      onFieldChange("meta_comercial_personalizada", "");
    }
    onFieldBlur();
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
          value={localValues.maturidade_comercial}
          onChange={(e) => handleMaturidadeChange(e.target.value)}
          onBlur={(e) => handleMaturidadeBlur(e.target.value)}
          className={getFieldClasses('maturidade_comercial', "w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20")}
        >
          <option value="">Selecione o nível de maturidade...</option>
          {MATURIDADE_COMERCIAL.map((maturidade) => (
            <option key={maturidade} value={maturidade}>
              {maturidade}
            </option>
          ))}
        </select>
        
        {/* Mensagem de erro */}
        {errors.maturidade_comercial && !clearedErrors.has('maturidade_comercial') && (
          <p className="text-red-400 text-sm flex items-center mt-1">
            <span className="mr-1">⚠️</span>
            {errors.maturidade_comercial}
          </p>
        )}
      </div>

      {/* Descrição da Maturidade Selecionada */}
      {localValues.maturidade_comercial && descricao && (
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
            value={localValues.meta_comercial}
            onChange={(e) => handleMetaChange(e.target.value)}
            onBlur={(e) => handleMetaBlur(e.target.value)}
            className={getFieldClasses('meta_comercial', "w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20")}
          >
            <option value="">Selecione uma meta...</option>
            {metas.map((meta) => (
              <option key={meta} value={meta}>
                {meta}
              </option>
            ))}
          </select>
          
          {/* Mensagem de erro */}
          {errors.meta_comercial && !clearedErrors.has('meta_comercial') && (
            <p className="text-red-400 text-sm flex items-center mt-1">
              <span className="mr-1">⚠️</span>
              {errors.meta_comercial}
            </p>
          )}
        </div>
      )}

      {/* Campo Personalizado (quando "Outro" é selecionado) */}
      {localValues.meta_comercial === "Outro" && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-seasalt">
            Especifique sua meta personalizada:
            <span className="text-red-400 ml-1">*</span>
          </label>
          
          <textarea
            value={localValues.meta_comercial_personalizada}
            onChange={(e) => {
              const value = e.target.value;
              setLocalValues(prev => ({ ...prev, meta_comercial_personalizada: value }));
              clearErrorIfValid('meta_comercial_personalizada', value);
            }}
            onBlur={(e) => handleFieldBlur("meta_comercial_personalizada", e.target.value)}
            placeholder="Descreva qual é sua meta específica comercial..."
            rows={3}
            className={getFieldClasses('meta_comercial_personalizada', "w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20 resize-none")}
          />
          
          {/* Mensagem de erro */}
          {errors.meta_comercial_personalizada && !clearedErrors.has('meta_comercial_personalizada') && (
            <p className="text-red-400 text-sm flex items-center mt-1">
              <span className="mr-1">⚠️</span>
              {errors.meta_comercial_personalizada}
            </p>
          )}
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
}); 