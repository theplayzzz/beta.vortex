'use client';

import { memo, useState, useEffect } from 'react';
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
  onFieldBlur: (field: string) => void;
  errors: Record<string, string>;
}

// Regras de validação baseadas no schema
const VALIDATION_RULES = {
  titulo_planejamento: {
    minLength: 3,
    maxLength: 100,
    required: true
  },
  descricao_objetivo: {
    minLength: 10,
    maxLength: 1000,
    required: true
  }
};

// Função para validar um campo específico
const validateField = (field: keyof typeof VALIDATION_RULES, value: string): string | null => {
  const rules = VALIDATION_RULES[field];
  
  if (rules.required && (!value || value.trim().length === 0)) {
    return `${field === 'titulo_planejamento' ? 'Título' : 'Descrição'} é obrigatório`;
  }
  
  if (value && value.length < rules.minLength) {
    return `${field === 'titulo_planejamento' ? 'Título' : 'Descrição'} deve ter pelo menos ${rules.minLength} caracteres`;
  }
  
  if (value && value.length > rules.maxLength) {
    return `${field === 'titulo_planejamento' ? 'Título' : 'Descrição'} deve ter no máximo ${rules.maxLength} caracteres`;
  }
  
  return null;
};

export const BasicInfoTab = memo(function BasicInfoTab({ client, formData, onFieldChange, onFieldBlur, errors }: BasicInfoTabProps) {
  // Estado local para evitar re-renderizações durante a digitação
  const [localValues, setLocalValues] = useState({
    titulo_planejamento: formData.titulo_planejamento || '',
    descricao_objetivo: formData.descricao_objetivo || ''
  });

  // Estado para controlar erros de validação em tempo real
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({
    titulo_planejamento: null,
    descricao_objetivo: null
  });

  // Sincronizar estado local com formData quando formData mudar (ex: carregamento do localStorage)
  useEffect(() => {
    setLocalValues({
      titulo_planejamento: formData.titulo_planejamento || '',
      descricao_objetivo: formData.descricao_objetivo || ''
    });
  }, [formData.titulo_planejamento, formData.descricao_objetivo]);

  // Função para validar campo no onBlur
  const handleFieldBlur = (field: keyof typeof VALIDATION_RULES, value: string) => {
    const error = validateField(field, value);
    
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }));

    // Só chama onFieldChange se não houver erro ou se o campo estava vazio e agora tem conteúdo
    onFieldChange(field, value);
    onFieldBlur(field);
  };

  // Função para validar em tempo real durante onChange
  const handleFieldChange = (field: keyof typeof VALIDATION_RULES, value: string) => {
    setLocalValues(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Validar em tempo real para limpar erro se campo se tornar válido
    const error = validateField(field, value);
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }));
    
    onFieldChange(field, value);
  };

  // Função para obter classes CSS do campo baseado no estado de erro
  const getFieldClasses = (field: keyof typeof VALIDATION_RULES, baseClasses: string): string => {
    const hasError = fieldErrors[field] !== null;
    
    if (hasError) {
      return `${baseClasses} border-red-500/60 focus:border-red-500 focus:ring-red-500/20 shadow-red-500/20`;
    }
    
    return `${baseClasses} border-seasalt/20 focus:border-sgbus-green focus:ring-sgbus-green/20`;
  };

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
        
        <div className="relative">
          <input
            type="text"
            value={localValues.titulo_planejamento}
            onChange={(e) => handleFieldChange('titulo_planejamento', e.target.value)}
            onBlur={(e) => handleFieldBlur('titulo_planejamento', e.target.value)}
            placeholder="Ex: Expansão Digital 2024, Crescimento de Vendas Q1..."
            className={getFieldClasses('titulo_planejamento', 
              "w-full px-4 py-3 bg-night rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:ring-2 transition-all duration-200"
            )}
          />
          
          {/* Contador de caracteres */}
          <div className="absolute bottom-2 right-3 text-xs text-periwinkle/70">
            {localValues.titulo_planejamento.length}/{VALIDATION_RULES.titulo_planejamento.maxLength}
          </div>
        </div>

        {/* Mensagem de erro */}
        {fieldErrors.titulo_planejamento && (
          <p className="text-red-400 text-sm flex items-center">
            <span className="mr-1">⚠️</span>
            {fieldErrors.titulo_planejamento}
          </p>
        )}
      </div>

      {/* Descrição do Objetivo */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-seasalt">
          Descrição do Objetivo Principal
          <span className="text-red-400 ml-1">*</span>
        </label>
        
        <div className="relative">
          <textarea
            value={localValues.descricao_objetivo}
            onChange={(e) => handleFieldChange('descricao_objetivo', e.target.value)}
            onBlur={(e) => handleFieldBlur('descricao_objetivo', e.target.value)}
            placeholder="Descreva qual é o principal objetivo que você deseja alcançar com este planejamento..."
            rows={4}
            className={getFieldClasses('descricao_objetivo',
              "w-full px-4 py-3 bg-night rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:ring-2 resize-none transition-all duration-200"
            )}
          />
          
          {/* Contador de caracteres */}
          <div className="absolute bottom-2 right-3 text-xs text-periwinkle/70">
            {localValues.descricao_objetivo.length}/{VALIDATION_RULES.descricao_objetivo.maxLength}
          </div>
        </div>

        {/* Mensagem de erro */}
        {fieldErrors.descricao_objetivo && (
          <p className="text-red-400 text-sm flex items-center">
            <span className="mr-1">⚠️</span>
            {fieldErrors.descricao_objetivo}
          </p>
        )}
      </div>
    </div>
  );
}); 