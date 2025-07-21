import { memo, useState, useEffect } from 'react';
import { Question } from '@/lib/planning/sectorQuestions';
import { MultiSelectWithTagsField } from './fields/MultiSelectWithTagsField';
import { ToggleSwitchField } from './fields/ToggleSwitchField';
import { NumericInputField } from './fields/NumericInputField';

interface QuestionFieldProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
  error?: string;
  hasSubmitError?: boolean;
}

// Função para validar um campo específico baseado nas regras
const validateField = (question: Question, value: any): string | null => {
  // Se não é obrigatório, não validar
  if (!question.required) {
    return null;
  }

  // Validações por tipo de campo
  switch (question.type) {
    case 'text':
    case 'textarea':
      if (!value || (typeof value === 'string' && value.trim().length === 0)) {
        return `${question.label} é obrigatório`;
      }
      break;

    case 'radio':
    case 'select':
      if (!value || value === '') {
        return `${question.label} é obrigatório`;
      }
      break;

    case 'number':
      if (value === undefined || value === null || value === '' || (typeof value === 'number' && isNaN(value))) {
        return `${question.label} é obrigatório`;
      }
      if (typeof value === 'number' && value < 0) {
        return `${question.label} deve ser um número positivo ou zero`;
      }
      break;

    case 'multiselect':
      if (!Array.isArray(value) || value.length === 0) {
        return `Selecione pelo menos uma opção para ${question.label}`;
      }
      break;

    case 'toggle':
      // Para toggle, qualquer valor boolean (true/false) é válido
      // Não há validação de "obrigatório" para toggle pois sempre tem um valor
      break;

    default:
      if (!value || value === '') {
        return `${question.label} é obrigatório`;
      }
      break;
  }

  return null;
};

// Função para obter valor padrão baseado no tipo de campo
const getDefaultValue = (question: Question): any => {
  switch (question.type) {
    case 'text':
    case 'textarea':
      return '';
    case 'radio':
    case 'select':
      return '';
    case 'number':
      return 0;
    case 'multiselect':
      return [];
    case 'toggle':
      // Valor padrão para toggle é false (representa "Não")
      return false;
    default:
      return '';
  }
};

// Função para obter classes CSS do campo baseado no estado de erro
const getFieldClasses = (hasError: boolean, baseClasses: string): string => {
  if (hasError) {
    return `${baseClasses} border-red-500/60 focus:border-red-500 focus:ring-red-500/20 shadow-red-500/20`;
  }
  
  return `${baseClasses} border-seasalt/20 focus:border-sgbus-green focus:ring-sgbus-green/20`;
};

export const QuestionField = memo(function QuestionField({ question, value, onChange, onBlur, error, hasSubmitError = false }: QuestionFieldProps) {
  const { label, type, options = [], required, placeholder, description, formatCurrency } = question;
  
  // Estado local para evitar re-renderizações durante a digitação
  const [localValue, setLocalValue] = useState(value);
  
  // Estado para controlar erros de validação em tempo real
  const [fieldError, setFieldError] = useState<string | null>(null);

  // Inicializar com valor padrão se não há valor
  useEffect(() => {
    if (value === undefined || value === null) {
      const defaultValue = getDefaultValue(question);
      setLocalValue(defaultValue);
      onChange(defaultValue);
    } else {
      setLocalValue(value);
    }
  }, [value, question, onChange]);

  // Função para validar campo no onBlur
  const handleFieldBlur = (newValue: any) => {
    const validationError = validateField(question, newValue);
    setFieldError(validationError);

    onChange(newValue);
    onBlur();
  };

  const renderField = () => {
    // Determinar se há erro para mostrar visualmente (erro de validação em tempo real OU erro do submit)
  const hasError = fieldError !== null || hasSubmitError;

    switch (type) {
      case 'text':
        return (
          <input
            type="text"
            value={localValue || ''}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={(e) => handleFieldBlur(e.target.value)}
            placeholder={placeholder}
            className={getFieldClasses(hasError, 
              "w-full px-4 py-3 bg-night rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:ring-2 transition-all duration-200"
            )}
          />
        );

      case 'number':
        return (
          <NumericInputField
            value={localValue || 0}
            onChange={(newValue) => {
              setLocalValue(newValue);
              handleFieldBlur(newValue);
            }}
            onBlur={() => {}}
            placeholder={placeholder}
            formatCurrency={formatCurrency}
            hasError={hasError}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={localValue || ''}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={(e) => handleFieldBlur(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className={getFieldClasses(hasError,
              "w-full px-4 py-3 bg-night rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:ring-2 resize-none transition-all duration-200"
            )}
          />
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {options.map((option) => (
              <label
                key={option}
                className="flex items-center space-x-3 cursor-pointer group"
              >
                <input
                  type="radio"
                  name={question.field}
                  value={option}
                  checked={localValue === option}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setLocalValue(newValue);
                    handleFieldBlur(newValue);
                  }}
                  className={`w-4 h-4 text-sgbus-green bg-night focus:ring-2 ${
                    hasError ? 'border-red-500/60 focus:ring-red-500/20' : 'border-seasalt/20 focus:ring-sgbus-green'
                  }`}
                />
                <span className="text-seasalt group-hover:text-sgbus-green transition-colors">
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case 'multiselect':
        return (
          <MultiSelectWithTagsField
            value={Array.isArray(localValue) ? localValue : []}
            onChange={(newValue) => {
              setLocalValue(newValue);
              handleFieldBlur(newValue);
            }}
            onBlur={() => {}}
            options={options}
            placeholder={placeholder}
            allowCustomTags={true}
            hasError={hasError}
          />
        );

      case 'toggle':
        return (
          <ToggleSwitchField
            value={Boolean(localValue)}
            onChange={(newValue) => {
              setLocalValue(newValue);
              handleFieldBlur(newValue);
            }}
            onBlur={() => {}}
            labels={{ on: 'Sim', off: 'Não' }}
          />
        );

      case 'select':
        return (
          <select
            value={localValue || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              setLocalValue(newValue);
              handleFieldBlur(newValue);
            }}
            className={getFieldClasses(hasError,
              "w-full px-4 py-3 bg-night rounded-lg text-seasalt focus:outline-none focus:ring-2 transition-all duration-200"
            )}
          >
            <option value="">Selecione uma opção...</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-seasalt">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      {description && (
        <p className="text-xs text-periwinkle mb-2">{description}</p>
      )}
      
      {renderField()}
      
      {/* Mostrar erro de validação em tempo real ou do submit */}
      {(fieldError || error) && (
        <p className="text-red-400 text-sm flex items-center mt-1">
          <span className="mr-1">⚠️</span>
          {fieldError || error}
        </p>
      )}
    </div>
  );
}); 