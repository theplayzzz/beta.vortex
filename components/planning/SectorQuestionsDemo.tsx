'use client';

import { useState } from 'react';
import { SETORES_PERMITIDOS, SetorPermitido } from '@/lib/planning/sectorConfig';
import { getQuestionsForSector, getTotalQuestionsForSector } from '@/lib/planning/sectorQuestions';
import { SectorDetailsTab } from './tabs/SectorDetailsTab';

export function SectorQuestionsDemo() {
  const [selectedSector, setSelectedSector] = useState<SetorPermitido>('E-commerce');
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

  // Função para simular salvamento automático (onBlur)
  const handleFieldBlur = () => {
    console.log('💾 Campo perdeu foco - salvamento automático ativado');
    // Aqui normalmente salvaria no localStorage ou faria debounce
  };

  const handleSectorChange = (sector: SetorPermitido) => {
    setSelectedSector(sector);
    setFormData({}); // Reset form data when sector changes
    setErrors({});
  };

  const validateForm = () => {
    const questions = getQuestionsForSector(selectedSector);
    const newErrors: Record<string, string> = {};
    
    questions.forEach(question => {
      if (question.required && !formData[question.field]) {
        newErrors[question.field] = 'Este campo é obrigatório';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      alert('Formulário válido! Dados: ' + JSON.stringify(formData, null, 2));
    }
  };

  const totalQuestions = getTotalQuestionsForSector(selectedSector);
  const answeredQuestions = Object.keys(formData).filter(key => formData[key]).length;
  const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-seasalt mb-2">
          Demo: Sistema de Perguntas Dinâmicas (Phase 3)
        </h1>
        <p className="text-periwinkle">
          Demonstração das perguntas específicas por setor com {SETORES_PERMITIDOS.length} setores suportados
        </p>
      </div>

      {/* Controles */}
      <div className="bg-eerie-black rounded-lg p-4 space-y-4">
        <h3 className="text-seasalt font-medium">Controles de Demonstração</h3>
        
        <div className="space-y-2">
          <label className="text-periwinkle text-sm">Setor do Cliente:</label>
          <select
            value={selectedSector}
            onChange={(e) => handleSectorChange(e.target.value as SetorPermitido)}
            className="w-full bg-night border border-seasalt/20 rounded-lg px-3 py-2 text-seasalt"
          >
            {SETORES_PERMITIDOS.map((sector) => (
              <option key={sector} value={sector}>
                {sector} ({getTotalQuestionsForSector(sector)} perguntas)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sector Questions */}
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
      <div className="flex justify-between items-center">
        <button
          onClick={() => setFormData({})}
          className="px-4 py-2 bg-seasalt/10 text-seasalt rounded-lg hover:bg-seasalt/20 transition-colors"
        >
          Limpar Respostas
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
          Submeter ({progress}%)
        </button>
      </div>

      {/* Debug Info */}
      {Object.keys(formData).length > 0 && (
        <div className="bg-eerie-black rounded-lg p-4">
          <h4 className="text-seasalt font-medium mb-2">Debug: Dados do Formulário</h4>
          <pre className="text-periwinkle text-xs overflow-auto">
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
        <h3 className="text-seasalt font-medium">Componentes da Phase 3 Implementados</h3>
        
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="text-sgbus-green font-medium">✅ sectorQuestions.ts</h4>
            <p className="text-periwinkle">
              Sistema completo com {SETORES_PERMITIDOS.length} setores e suas perguntas específicas
            </p>
          </div>
          
          <div>
            <h4 className="text-sgbus-green font-medium">✅ QuestionField.tsx</h4>
            <p className="text-periwinkle">
              Componente para renderizar diferentes tipos de campos (text, textarea, radio, multiselect, number, toggle, select)
            </p>
          </div>
          
          <div>
            <h4 className="text-sgbus-green font-medium">✅ SectorDetailsTab.tsx</h4>
            <p className="text-periwinkle">
              Aba que exibe as perguntas dinâmicas baseadas no setor selecionado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 