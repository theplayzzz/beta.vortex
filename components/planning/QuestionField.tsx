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
}

export const QuestionField = memo(function QuestionField({ question, value, onChange, onBlur, error }: QuestionFieldProps) {
  const { label, type, options = [], required, placeholder, description, formatCurrency } = question;
  
  // Estado local para evitar re-renderizações durante a digitação
  const [localValue, setLocalValue] = useState(value);

  // Sincronizar estado local com value quando value mudar (ex: carregamento do localStorage)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Função para atualizar campo no formulário e salvar no localStorage
  const handleFieldBlur = (newValue: any) => {
    onChange(newValue);
    onBlur();
  };

  const renderField = () => {
    switch (type) {
      case 'text':
        return (
          <input
            type="text"
            value={localValue || ''}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={(e) => handleFieldBlur(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
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
            className="w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20 resize-none"
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
                  className="w-4 h-4 text-sgbus-green bg-night border-seasalt/20 focus:ring-sgbus-green focus:ring-2"
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
            className="w-full px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt focus:outline-none focus:border-sgbus-green focus:ring-2 focus:ring-sgbus-green/20"
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
      
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}); 