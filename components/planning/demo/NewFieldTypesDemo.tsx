'use client';

import { useState } from 'react';
import { SectorDetailsTab } from '../tabs/SectorDetailsTab';
import { SETORES_PERMITIDOS } from '@/lib/planning/sectorConfig';
import type { SetorPermitido } from '@/lib/planning/sectorConfig';

export function NewFieldTypesDemo() {
  const [selectedSector, setSelectedSector] = useState<SetorPermitido>('Tecnologia / SaaS');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSectorChange = (newSector: SetorPermitido) => {
    setSelectedSector(newSector);
    setFormData({}); // Reset form data when changing sector
    setErrors({});
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Remove error when field is filled
    if (errors[field] && value !== undefined && value !== '' && value !== null) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFieldBlur = () => {
    console.log('💾 Campo perdeu foco - dados atuais:', formData);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validação genérica para campos obrigatórios
    Object.entries(formData).forEach(([field, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        // Não implementar validação específica no demo, apenas mostrar dados
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    console.log('✅ Dados do setor:', selectedSector);
    console.log('📊 Dados do formulário:', JSON.stringify(formData, null, 2));
    alert(`Dados coletados para ${selectedSector}! Veja o console para detalhes.`);
  };

  const clearData = () => {
    setFormData({});
    setErrors({});
  };

  // Calculate progress
  const totalFieldsEstimate = 8; // Estimativa de campos por setor
  const filledFields = Object.values(formData).filter(value => 
    value !== undefined && value !== '' && value !== null && 
    (!Array.isArray(value) || value.length > 0)
  ).length;
  const progress = Math.round((filledFields / totalFieldsEstimate) * 100);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-seasalt">
          Demo: Formulários Dinâmicos por Setor
        </h1>
        <p className="text-periwinkle">
          Teste os formulários implementados com <strong>campos condicionais</strong>, 
          <strong> multiselect</strong>, <strong>toggle</strong> e <strong>formatação de moeda</strong>
        </p>
      </div>

      {/* Sector Selector */}
      <div className="bg-eerie-black p-6 rounded-lg">
        <h3 className="text-seasalt font-medium mb-4">Selecionar Setor para Teste:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SETORES_PERMITIDOS.map((sector) => (
            <button
              key={sector}
              onClick={() => handleSectorChange(sector)}
              className={`
                p-3 text-sm rounded-lg border transition-all duration-200
                ${selectedSector === sector 
                  ? 'bg-sgbus-green text-white border-sgbus-green' 
                  : 'bg-night text-seasalt border-seasalt/20 hover:border-sgbus-green/50'
                }
              `}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-eerie-black p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-seasalt font-medium">Progresso - {selectedSector}</span>
          <span className="text-sgbus-green font-bold">{progress}%</span>
        </div>
        <div className="w-full bg-seasalt/10 rounded-full h-3">
          <div 
            className="bg-sgbus-green h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-periwinkle">
          {filledFields} campos preenchidos
        </div>
      </div>

      {/* Form */}
      <div className="bg-night border border-seasalt/20 rounded-lg p-6">
        <SectorDetailsTab
          sector={selectedSector}
          formData={formData}
          onFieldChange={handleFieldChange}
          onFieldBlur={handleFieldBlur}
          errors={errors}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-sgbus-green text-white rounded-lg hover:bg-sgbus-green/90 transition-colors font-medium"
        >
          Ver Dados Coletados
        </button>
        
        <button
          onClick={clearData}
          className="px-6 py-3 bg-eerie-black text-seasalt border border-seasalt/20 rounded-lg hover:bg-seasalt/10 transition-colors"
        >
          Limpar Dados
        </button>
        
        <button
          onClick={() => console.log('📊 Estado atual:', { selectedSector, formData, errors })}
          className="px-6 py-3 bg-night text-periwinkle border border-seasalt/20 rounded-lg hover:bg-seasalt/5 transition-colors"
        >
          Debug (Console)
        </button>
      </div>

      {/* Real-time Data Display */}
      <div className="bg-eerie-black p-4 rounded-lg">
        <h3 className="text-seasalt font-medium mb-3">Dados em Tempo Real ({selectedSector}):</h3>
        <pre className="text-periwinkle text-sm overflow-x-auto bg-night p-3 rounded border border-seasalt/10 max-h-60">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>

      {/* Features Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-eerie-black p-4 rounded-lg">
          <h4 className="text-seasalt font-medium mb-3">✨ Recursos Implementados (Etapas 1-4)</h4>
          <ul className="text-periwinkle text-sm space-y-2">
            <li>• <strong>Novos Tipos de Campo:</strong> multiselect, toggle, number com moeda</li>
            <li>• <strong>Campos Condicionais:</strong> aparecem/desaparecem baseado em respostas</li>
            <li>• <strong>Renderização Dinâmica:</strong> animações e feedback visual</li>
            <li>• <strong>Setores Mapeados:</strong> {SETORES_PERMITIDOS.length} setores com perguntas específicas</li>
            <li>• <strong>Validação Integrada:</strong> validação automática por tipo</li>
          </ul>
        </div>
        
        <div className="bg-eerie-black p-4 rounded-lg">
          <h4 className="text-seasalt font-medium mb-3">🔧 Testando por Setor</h4>
          <ul className="text-periwinkle text-sm space-y-2">
            <li>• <strong>Tecnologia:</strong> Campos condicionais (trial → duração)</li>
            <li>• <strong>Saúde:</strong> Multiselect para especialidades</li>
            <li>• <strong>Educação:</strong> Toggle e valores monetários</li>
            <li>• <strong>Varejo:</strong> Programas de fidelidade condicionais</li>
            <li>• <strong>Alimentação:</strong> Plataformas de delivery condicionais</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 