import { useState, useEffect } from 'react';

interface NumericInputFieldProps {
  value: number | string;
  onChange: (value: number) => void;
  onBlur: () => void;
  placeholder?: string;
  formatCurrency?: boolean;
  min?: number;
  max?: number;
  step?: number;
  hasError?: boolean;
}

export function NumericInputField({ 
  value, 
  onChange, 
  onBlur, 
  placeholder,
  formatCurrency = false,
  min,
  max,
  step = 1,
  hasError = false
}: NumericInputFieldProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Formatador de moeda brasileira
  const formatCurrencyBR = (num: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(num);
  };

  // Parser de moeda (remove formatação)
  const parseCurrency = (str: string): number => {
    // Remove tudo exceto números, vírgula e ponto
    const cleanStr = str.replace(/[^\d.,]/g, '');
    
    // Se tem vírgula, assume formato brasileiro (1.234,56)
    if (cleanStr.includes(',')) {
      const parts = cleanStr.split(',');
      const integerPart = parts[0].replace(/\./g, ''); // Remove pontos dos milhares
      const decimalPart = parts[1] || '00';
      return parseFloat(`${integerPart}.${decimalPart.slice(0, 2)}`);
    }
    
    // Se só tem ponto, pode ser decimal em inglês ou separador de milhares
    if (cleanStr.includes('.')) {
      const parts = cleanStr.split('.');
      // Se a última parte tem 1-2 dígitos, assume que é decimal
      if (parts[parts.length - 1].length <= 2) {
        return parseFloat(cleanStr);
      } else {
        // Assume separador de milhares
        return parseFloat(cleanStr.replace(/\./g, ''));
      }
    }
    
    return parseFloat(cleanStr) || 0;
  };

  // Atualizar display value quando value mudar
  useEffect(() => {
    if (!isFocused) {
      if (formatCurrency && typeof value === 'number' && value > 0) {
        setDisplayValue(formatCurrencyBR(value));
      } else {
        setDisplayValue(value?.toString() || '');
      }
    }
  }, [value, formatCurrency, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // Quando foca, mostra valor numérico puro para edição
    if (formatCurrency && typeof value === 'number') {
      setDisplayValue(value.toString());
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Parse do valor e atualização
    let numericValue: number;
    if (formatCurrency) {
      numericValue = parseCurrency(displayValue);
    } else {
      numericValue = parseFloat(displayValue) || 0;
    }

    // Aplicar limites
    if (min !== undefined && numericValue < min) {
      numericValue = min;
    }
    if (max !== undefined && numericValue > max) {
      numericValue = max;
    }

    onChange(numericValue);
    onBlur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Permitir teclas de navegação e controle
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];

    if (allowedKeys.includes(e.key)) {
      return;
    }

    // Permitir números
    if (/\d/.test(e.key)) {
      return;
    }

    // Para campos de moeda, permitir vírgula e ponto
    if (formatCurrency && [',', '.'].includes(e.key)) {
      return;
    }

    // Para campos numéricos simples, permitir ponto para decimais
    if (!formatCurrency && e.key === '.') {
      return;
    }

    // Bloquear outras teclas
    e.preventDefault();
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={displayValue}
        onChange={(e) => setDisplayValue(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-night rounded-lg text-seasalt placeholder-periwinkle focus:outline-none focus:ring-2 transition-all duration-200 ${
          hasError 
            ? 'border border-red-500/60 focus:border-red-500 focus:ring-red-500/20 shadow-red-500/20' 
            : 'border border-seasalt/20 focus:border-sgbus-green focus:ring-sgbus-green/20'
        }`}
      />
      
      {/* Indicador de moeda */}
      {formatCurrency && !isFocused && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-periwinkle text-sm">
          R$
        </div>
      )}
      
      {/* Dicas de formatação */}
      {formatCurrency && isFocused && (
        <div className="absolute -bottom-6 left-0 text-xs text-periwinkle">
          Ex: 1500,50 ou 1.500,50
        </div>
      )}
    </div>
  );
} 