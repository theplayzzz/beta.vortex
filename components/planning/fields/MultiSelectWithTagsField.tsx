import { useState, useRef, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';

interface MultiSelectWithTagsFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  onBlur: () => void;
  options: string[];
  placeholder?: string;
  allowCustomTags?: boolean;
}

export function MultiSelectWithTagsField({ 
  value = [], 
  onChange, 
  onBlur, 
  options, 
  placeholder = "Digite para buscar ou adicionar...",
  allowCustomTags = true 
}: MultiSelectWithTagsFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customTag, setCustomTag] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setCustomTag('');
        onBlur();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onBlur]);

  // Filtrar opções baseado na busca
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !value.includes(option)
  );

  // Adicionar tag selecionada
  const addTag = (tag: string) => {
    if (!value.includes(tag)) {
      onChange([...value, tag]);
    }
    setSearchTerm('');
    setCustomTag('');
    inputRef.current?.focus();
  };

  // Remover tag
  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  // Adicionar tag personalizada
  const addCustomTag = () => {
    const tag = customTag.trim();
    if (tag && !value.includes(tag) && !options.includes(tag)) {
      addTag(tag);
    }
  };

  // Lidar com teclas
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (customTag.trim()) {
        addCustomTag();
      } else if (filteredOptions.length === 1) {
        addTag(filteredOptions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      setCustomTag('');
    } else if (e.key === 'Backspace' && !searchTerm && !customTag && value.length > 0) {
      // Remover última tag se input estiver vazio
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Campo principal com tags */}
      <div 
        className="w-full min-h-[48px] px-4 py-3 bg-night border border-seasalt/20 rounded-lg text-seasalt focus-within:border-sgbus-green focus-within:ring-2 focus-within:ring-sgbus-green/20 cursor-text"
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        {/* Tags selecionadas */}
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 bg-sgbus-green/20 text-sgbus-green text-sm rounded-full border border-sgbus-green/30"
            >
              {tag}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="ml-2 hover:bg-sgbus-green/10 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {/* Input de busca */}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm || customTag}
          onChange={(e) => {
            const value = e.target.value;
            setSearchTerm(value);
            setCustomTag(value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="w-full bg-transparent border-none outline-none text-seasalt placeholder-periwinkle"
        />
      </div>

      {/* Dropdown com opções */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-night border border-seasalt/20 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {/* Opções filtradas */}
          {filteredOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => addTag(option)}
              className="w-full px-4 py-2 text-left text-seasalt hover:bg-eerie-black transition-colors flex items-center justify-between"
            >
              {option}
              <Check className="w-4 h-4 text-sgbus-green opacity-0" />
            </button>
          ))}

          {/* Opção para adicionar tag personalizada */}
          {allowCustomTags && customTag.trim() && !options.includes(customTag.trim()) && !value.includes(customTag.trim()) && (
            <button
              type="button"
              onClick={addCustomTag}
              className="w-full px-4 py-2 text-left text-periwinkle hover:bg-eerie-black transition-colors flex items-center gap-2 border-t border-seasalt/10"
            >
              <Plus className="w-4 h-4" />
              Adicionar "{customTag.trim()}"
            </button>
          )}

          {/* Mensagem quando não há opções */}
          {filteredOptions.length === 0 && (!allowCustomTags || !customTag.trim()) && (
            <div className="px-4 py-2 text-periwinkle text-sm">
              Nenhuma opção encontrada
            </div>
          )}
        </div>
      )}
    </div>
  );
} 