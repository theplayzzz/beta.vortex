'use client';

import { useState } from 'react';
import { MarketingTab } from './tabs/MarketingTab';
import { CommercialTab } from './tabs/CommercialTab';
import { MATURIDADE_MARKETING } from '@/lib/planning/marketingConfig';
import { MATURIDADE_COMERCIAL } from '@/lib/planning/commercialConfig';

export function MarketingCommercialDemo() {
  const [currentTab, setCurrentTab] = useState<'marketing' | 'comercial'>('marketing');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Remove error when field is filled
    if (errors[field] && value) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Marketing validation
    if (!formData.maturidade_marketing) {
      newErrors.maturidade_marketing = 'Selecione a maturidade de marketing';
    }
    if (formData.maturidade_marketing && !formData.meta_marketing) {
      newErrors.meta_marketing = 'Selecione uma meta de marketing';
    }
    if (formData.meta_marketing === 'Outro' && !formData.meta_marketing_personalizada) {
      newErrors.meta_marketing_personalizada = 'Especifique sua meta personalizada';
    }
    
    // Commercial validation
    if (!formData.maturidade_comercial) {
      newErrors.maturidade_comercial = 'Selecione a maturidade comercial';
    }
    if (formData.maturidade_comercial && !formData.meta_comercial) {
      newErrors.meta_comercial = 'Selecione uma meta comercial';
    }
    if (formData.meta_comercial === 'Outro' && !formData.meta_comercial_personalizada) {
      newErrors.meta_comercial_personalizada = 'Especifique sua meta personalizada';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      alert('Formulário válido! Dados: ' + JSON.stringify(formData, null, 2));
    }
  };

  const clearData = () => {
    setFormData({});
    setErrors({});
  };

  // Calculate progress
  const getProgress = () => {
    let completed = 0;
    let total = 4; // 2 marketing + 2 comercial
    
    if (formData.maturidade_marketing) completed++;
    if (formData.meta_marketing) completed++;
    if (formData.maturidade_comercial) completed++;
    if (formData.meta_comercial) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const progress = getProgress();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-seasalt mb-2">
          Demo: Abas de Marketing e Comercial (Phase 4)
        </h1>
        <p className="text-periwinkle">
          Demonstração das abas de maturidade e metas condicionais
        </p>
      </div>

      {/* Progress and Controls */}
      <div className="bg-eerie-black rounded-lg p-4 space-y-4">
        <h3 className="text-seasalt font-medium">Controles de Demonstração</h3>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-night rounded-lg p-3">
            <div className="text-sgbus-green font-bold text-lg">{progress}%</div>
            <div className="text-periwinkle text-sm">Progresso Global</div>
          </div>
          <div className="bg-night rounded-lg p-3">
            <div className="text-seasalt font-bold text-lg">{Object.keys(formData).length}</div>
            <div className="text-periwinkle text-sm">Campos Preenchidos</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-night rounded-full h-2">
          <div 
            className="bg-sgbus-green h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-night border border-seasalt/20 rounded-lg">
        <div className="flex border-b border-seasalt/20">
          <button
            onClick={() => setCurrentTab('marketing')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              currentTab === 'marketing'
                ? 'bg-sgbus-green/10 text-sgbus-green border-b-2 border-sgbus-green'
                : 'text-periwinkle hover:text-seasalt'
            }`}
          >
            📈 Marketing
            {formData.maturidade_marketing && formData.meta_marketing && (
              <span className="ml-2 text-xs bg-sgbus-green/20 text-sgbus-green px-2 py-1 rounded">✓</span>
            )}
          </button>
          <button
            onClick={() => setCurrentTab('comercial')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              currentTab === 'comercial'
                ? 'bg-sgbus-green/10 text-sgbus-green border-b-2 border-sgbus-green'
                : 'text-periwinkle hover:text-seasalt'
            }`}
          >
            💼 Comercial
            {formData.maturidade_comercial && formData.meta_comercial && (
              <span className="ml-2 text-xs bg-sgbus-green/20 text-sgbus-green px-2 py-1 rounded">✓</span>
            )}
          </button>
        </div>

        <div className="p-6">
          {currentTab === 'marketing' && (
            <MarketingTab
              formData={formData}
              onFieldChange={handleFieldChange}
              errors={errors}
            />
          )}
          
          {currentTab === 'comercial' && (
            <CommercialTab
              formData={formData}
              onFieldChange={handleFieldChange}
              errors={errors}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={clearData}
          className="px-4 py-2 bg-seasalt/10 text-seasalt rounded-lg hover:bg-seasalt/20 transition-colors"
        >
          Limpar Dados
        </button>
        
        <button
          onClick={validateForm}
          className="px-4 py-2 bg-periwinkle/20 text-periwinkle rounded-lg hover:bg-periwinkle/30 transition-colors"
        >
          Validar Formulário
        </button>
        
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-sgbus-green text-night rounded-lg hover:bg-sgbus-green/90 transition-colors font-medium"
        >
          Finalizar ({progress}%)
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Marketing Summary */}
        <div className="bg-eerie-black rounded-lg p-4">
          <h4 className="text-seasalt font-medium mb-3 flex items-center">
            📈 Resumo Marketing
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-periwinkle">Maturidade:</span>
              <span className="text-seasalt">
                {formData.maturidade_marketing || 'Não definida'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-periwinkle">Meta:</span>
              <span className="text-seasalt">
                {formData.meta_marketing || 'Não definida'}
              </span>
            </div>
            {formData.meta_marketing_personalizada && (
              <div className="pt-2 border-t border-seasalt/10">
                <span className="text-periwinkle">Meta personalizada:</span>
                <p className="text-seasalt text-xs mt-1">
                  {formData.meta_marketing_personalizada}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Commercial Summary */}
        <div className="bg-eerie-black rounded-lg p-4">
          <h4 className="text-seasalt font-medium mb-3 flex items-center">
            💼 Resumo Comercial
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-periwinkle">Maturidade:</span>
              <span className="text-seasalt">
                {formData.maturidade_comercial || 'Não definida'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-periwinkle">Meta:</span>
              <span className="text-seasalt">
                {formData.meta_comercial || 'Não definida'}
              </span>
            </div>
            {formData.meta_comercial_personalizada && (
              <div className="pt-2 border-t border-seasalt/10">
                <span className="text-periwinkle">Meta personalizada:</span>
                <p className="text-seasalt text-xs mt-1">
                  {formData.meta_comercial_personalizada}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debug Info */}
      {Object.keys(formData).length > 0 && (
        <div className="bg-eerie-black rounded-lg p-4">
          <h4 className="text-seasalt font-medium mb-2">Debug: Dados do Formulário</h4>
          <pre className="text-periwinkle text-xs overflow-auto max-h-32">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      )}

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <h4 className="text-red-400 font-medium mb-2">
            Erros de Validação ({Object.keys(errors).length})
          </h4>
          <ul className="text-red-400 text-sm space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>• {field}: {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Documentation */}
      <div className="bg-eerie-black rounded-lg p-4 space-y-4">
        <h3 className="text-seasalt font-medium">Componentes da Phase 4 Implementados</h3>
        
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="text-sgbus-green font-medium">✅ marketingConfig.ts</h4>
            <p className="text-periwinkle">
              {MATURIDADE_MARKETING.length} níveis de maturidade com metas condicionais específicas
            </p>
          </div>
          
          <div>
            <h4 className="text-sgbus-green font-medium">✅ commercialConfig.ts</h4>
            <p className="text-periwinkle">
              {MATURIDADE_COMERCIAL.length} níveis de maturidade comercial com estratégias adaptadas
            </p>
          </div>
          
          <div>
            <h4 className="text-sgbus-green font-medium">✅ MarketingTab.tsx</h4>
            <p className="text-periwinkle">
              Aba interativa com seleção de maturidade e metas condicionais
            </p>
          </div>
          
          <div>
            <h4 className="text-sgbus-green font-medium">✅ CommercialTab.tsx</h4>
            <p className="text-periwinkle">
              Aba comercial com processo similar e validação integrada
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 