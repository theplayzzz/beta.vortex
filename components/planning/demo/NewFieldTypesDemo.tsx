'use client';

import { useState } from 'react';
import { SectorDetailsTab } from '../tabs/SectorDetailsTab';

export function NewFieldTypesDemo() {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    
    // Simulação de validação para alguns campos
    if (!formData.tech_tipo) {
      newErrors.tech_tipo = 'Tipo de produto é obrigatório';
    }
    if (formData.tech_tipo === 'Outro' && !formData.tech_tipo_outro) {
      newErrors.tech_tipo_outro = 'Especifique o tipo de produto';
    }
    if (!formData.tech_valor_cliente || formData.tech_valor_cliente === 0) {
      newErrors.tech_valor_cliente = 'Valor médio é obrigatório';
    }
    if (!formData.tech_aquisicao || formData.tech_aquisicao.length === 0) {
      newErrors.tech_aquisicao = 'Selecione pelo menos um canal';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      console.log('✅ Formulário válido!');
      console.log('📊 Dados:', JSON.stringify(formData, null, 2));
      alert('Formulário válido! Veja o console para os dados.');
    } else {
      console.log('❌ Formulário com erros:', errors);
    }
  };

  const clearData = () => {
    setFormData({});
    setErrors({});
  };

  // Calculate progress
  const totalFields = 11; // Número total de campos visíveis inicialmente
  const filledFields = Object.values(formData).filter(value => 
    value !== undefined && value !== '' && value !== null && 
    (!Array.isArray(value) || value.length > 0)
  ).length;
  const progress = Math.round((filledFields / totalFields) * 100);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-seasalt">
          Demo: Novos Tipos de Campo
        </h1>
        <p className="text-periwinkle">
          Demonstração dos novos tipos de campo: <strong>multiselect</strong>, <strong>toggle</strong>, 
          <strong>number com moeda</strong> e <strong>campos condicionais</strong>
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-eerie-black p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-seasalt font-medium">Progresso Geral</span>
          <span className="text-sgbus-green font-bold">{progress}%</span>
        </div>
        <div className="w-full bg-seasalt/10 rounded-full h-3">
          <div 
            className="bg-sgbus-green h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-periwinkle">
          {filledFields} de {totalFields} campos preenchidos
        </div>
      </div>

      {/* Form */}
      <div className="bg-night border border-seasalt/20 rounded-lg p-6">
        <SectorDetailsTab
          sector="Tecnologia / SaaS"
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
          Validar Formulário
        </button>
        
        <button
          onClick={clearData}
          className="px-6 py-3 bg-eerie-black text-seasalt border border-seasalt/20 rounded-lg hover:bg-seasalt/10 transition-colors"
        >
          Limpar Dados
        </button>
        
        <button
          onClick={() => console.log('📊 Estado atual:', { formData, errors })}
          className="px-6 py-3 bg-night text-periwinkle border border-seasalt/20 rounded-lg hover:bg-seasalt/5 transition-colors"
        >
          Ver Estado (Console)
        </button>
      </div>

      {/* Data Display */}
      <div className="bg-eerie-black p-4 rounded-lg">
        <h3 className="text-seasalt font-medium mb-3">Dados em Tempo Real:</h3>
        <pre className="text-periwinkle text-sm overflow-x-auto bg-night p-3 rounded border border-seasalt/10">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>

      {/* Features Showcase */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-eerie-black p-4 rounded-lg">
          <h4 className="text-seasalt font-medium mb-2">✨ Recursos Implementados</h4>
          <ul className="text-periwinkle text-sm space-y-1">
            <li>• <strong>MultiSelect:</strong> Canal de aquisição com tags</li>
            <li>• <strong>Toggle:</strong> Trial gratuito (Sim/Não)</li>
            <li>• <strong>Currency:</strong> Valor médio com formatação R$</li>
            <li>• <strong>Conditional:</strong> Duração trial aparece se trial = Sim</li>
            <li>• <strong>Validation:</strong> Validação dinâmica de campos</li>
          </ul>
        </div>
        
        <div className="bg-eerie-black p-4 rounded-lg">
          <h4 className="text-seasalt font-medium mb-2">🔧 Próximos Passos</h4>
          <ul className="text-periwinkle text-sm space-y-1">
            <li>• Implementar dados para outros setores</li>
            <li>• Integrar com sistema de validação</li>
            <li>• Testar salvamento automático</li>
            <li>• Adicionar mais tipos condicionais</li>
            <li>• Otimizar performance</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 